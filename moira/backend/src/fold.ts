// The fold (replay) engine: an append-only event log → ProjectedState.
//
// MVP strategy: recompute-from-scratch on every call (non-optimal *scheduling*
// is what P8 excuses, not incremental fold; at S4 scale a full replay is
// correct-by-construction). The reduction is deterministic by (ts, id) (I3)
// and never mutates its input.
//
// v21 (§2.10) — correction layer. The read is now a composed read of "event
// log + correction layer" (A2 の射程改訂). Corrections do NOT rewrite events;
// they carry a per-target latest-wins override that is applied at fold-time
// before the ordinary 4-event semantics runs. The one-line principle of
// §2.10: the corrected-log is one log that the existing semantics can re-read
// as-is. Corrections whose merged event fails validation are INAPPLICABLE —
// visible as a structural error, not silently absorbed. The correction meter
// counts corrections applied to the log (4 permanent categories,
// PR-CORRECTION-METER).

import { sortEvents } from './event-store.js';
import type {
  Actor,
  Correction,
  CorrectionMeterCounts,
  CostEvent,
  DecomposeEvent,
  Event,
  EventPatch,
  LifecycleState,
  NodeId,
  ProjectedNode,
  ProjectedState,
  RelateEvent,
  TransitionEvent,
} from './types.js';

const RETROACTIVE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // §2.10 (d) ③ retro
                                                       // implementation-defined
                                                       // (>1 day = 遡及)

function emptyNode(id: NodeId): ProjectedNode {
  return {
    id,
    lifecycle: 'pending',
    reachedImplemented: false,
    estimateState: 'proposed',
    latestEstimate: null,
    frozenBudget: null,
    frozenSlot: null,
    assignee: null,
    reviewer: null,
    ownCost: 0,
    parent: null,
    agreedActorValues: new Map(),
  };
}

function emptyMeter(): CorrectionMeterCounts {
  return { total: 0, locked: 0, retroactive: 0, inapplicable: 0 };
}

/**
 * Would adding edge `from → to` create a cycle in the combined graph?
 * I2/R-D3 reject cycles across ALL edge kinds, so we walk both dependency and
 * supersede edges. A cycle appears iff `from` is already reachable from `to`.
 */
function wouldCycle(state: ProjectedState, from: NodeId, to: NodeId): boolean {
  if (from === to) return true;
  const adj = new Map<NodeId, NodeId[]>();
  const add = (a: NodeId, b: NodeId): void => {
    const list = adj.get(a);
    if (list) list.push(b);
    else adj.set(a, [b]);
  };
  for (const e of state.dependencyEdges) add(e.from, e.to);
  for (const e of state.supersedeEdges) add(e.from, e.to);

  const stack: NodeId[] = [to];
  const seen = new Set<NodeId>();
  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === undefined) break;
    if (cur === from) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of adj.get(cur) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Would setting `child`'s effective parent to `parent` create a containment
 * cycle? True iff `parent` is `child` itself or currently sits in `child`'s
 * subtree — i.e. walking parent pointers up from `parent` reaches `child`.
 * (§2.8 v20 tree-ness guard; the containment counterpart of I2.)
 */
function wouldContainmentCycle(state: ProjectedState, parent: NodeId, child: NodeId): boolean {
  let cur: NodeId | null = parent;
  const seen = new Set<NodeId>(); // safety bound against pre-existing corruption
  while (cur !== null && !seen.has(cur)) {
    if (cur === child) return true;
    seen.add(cur);
    cur = state.nodes.get(cur)?.parent ?? null;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Correction application (v21 §2.10)
// ---------------------------------------------------------------------------

/**
 * Merge a patch onto an event, preserving the target's discriminant (kind).
 * The patch is a per-kind partial — keys foreign to the target's kind are
 * detected here and reported as an inapplicable-patch via the returned
 * `foreignKeys` list (caller stamps a structuralError with these).
 *
 * `id` and `kind` are NEVER patched (identity fields). All other fields may be
 * patched, including `ts` — a ts patch can shift latest-wins winners (§2.10).
 */
function mergePatch(
  target: Event,
  patch: EventPatch,
): { event: Event; foreignKeys: string[] } {
  // Fields allowed per kind (exclude id/kind/actor — actor is identity per §2.10).
  const allowedByKind: Record<Event['kind'], ReadonlyArray<string>> = {
    transition: [
      'ts', 'node', 'machine', 'to', 'assignee', 'reviewer',
      'frozenBudget', 'frozenSlot', 'reason',
    ],
    decompose: ['ts', 'parent', 'reason', 'children'],
    relate: ['ts', 'op', 'from', 'to', 'edgeKind', 'policy', 'reason'],
    cost: ['ts', 'node', 'amount', 'reason'],
  };
  const allowed = new Set(allowedByKind[target.kind]);
  const foreignKeys: string[] = [];
  const merged: Record<string, unknown> = { ...(target as unknown as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id' || k === 'kind' || k === 'actor') continue; // identity — never patched
    if (!allowed.has(k)) {
      foreignKeys.push(k);
      continue;
    }
    if (v === undefined) continue; // absent means "no change"
    merged[k] = v;
  }
  return { event: merged as unknown as Event, foreignKeys };
}

/**
 * Apply the correction layer to the event stream. Returns:
 *   - effective events: input events with per-target latest-wins corrections
 *     merged; nullified events are DROPPED from the stream entirely.
 *   - meter: monotonic counters stamped at application time (total/locked/retro).
 *   - inapplicable errors: structural errors from patches whose fields are
 *     foreign to the target's kind, or that name a non-existent target event.
 *
 * Latest-wins per target by (ts, id) — isomorphic to I3. Corrections are not
 * themselves correctable; a stray correction is neutralised by ANOTHER
 * correction targeting the SAME event (§2.10).
 *
 * NOTE: the "locked target" bit and "adjusted (event still valid under 4-event
 * semantics)" bit are stamped conservatively:
 *   - locked: computed by pre-folding the base events WITHOUT corrections and
 *     checking the target's node lifecycle at that time. This is a "did the
 *     original log put this node into completed" read — the intent of I4 v21
 *     ("completed 済みは、黙っては変わらない") is that any correction landing on
 *     an event whose node was in the completed region gets counted, regardless
 *     of whether the correction later re-opens it.
 *   - inapplicable: patches whose keys don't belong to the target's kind, and
 *     patches naming a targetEventId that doesn't exist, are flagged here.
 *     Deeper invalidation (e.g. patched-event fails downstream fold checks)
 *     surfaces naturally as fold-time structuralErrors (§2.10: 検証を迂回する
 *     訂正は適用不能の可視エラー).
 */
function applyCorrections(
  events: readonly Event[],
  corrections: readonly Correction[],
): {
  effective: Event[];
  meter: CorrectionMeterCounts;
  inapplicableErrors: string[];
} {
  const meter = emptyMeter();
  const inapplicableErrors: string[] = [];
  if (corrections.length === 0) {
    return { effective: [...events], meter, inapplicableErrors };
  }

  // Pre-pass: pick the latest-wins correction per target id (§2.10 chain rule).
  const winnerByTarget = new Map<string, Correction>();
  const sortedCorr = [...corrections].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  for (const c of sortedCorr) {
    winnerByTarget.set(c.targetEventId, c); // ascending sort — last write wins
  }

  // Pre-fold WITHOUT corrections to read each target event's node lifecycle
  // "immediately before the correction is applied" (§2.10 (d) ①②③ are
  // monotonic counters stamped at the pre-application reading). We do a full
  // replay of just the events (no corrections) and consult the final projected
  // state — that IS the read a caller would see the moment before a correction
  // is applied on top. This is the correct interpretation of "適用直前の読み":
  // the current-state-of-record before the fix lands. A correction on any
  // event whose subject node is currently in the completed lifecycle region
  // (implemented|accepted) trips the ②locked bucket (I4 v21 intent: no
  // recording-error repair on a completed-region node happens silently).
  const lockedTargetIds = new Set<string>();
  {
    const preState: ProjectedState = {
      nodes: new Map(),
      childrenOf: new Map(),
      dependencyEdges: [],
      supersedeEdges: [],
      seenCostIds: new Set(),
      structuralErrors: [],
      appliedAt: 0,
      correctionMeter: emptyMeter(),
    };
    const ensurePre = (id: NodeId): ProjectedNode => {
      let n = preState.nodes.get(id);
      if (n === undefined) {
        n = emptyNode(id);
        preState.nodes.set(id, n);
      }
      return n;
    };
    // Minimal replay: only lifecycle transitions matter for the completed-
    // region predicate; decompose is needed so ev.parent / ev.children nodes
    // exist for later target-node lookup.
    for (const ev of sortEvents(events)) {
      if (ev.kind === 'decompose') {
        ensurePre(ev.parent);
        for (const c of ev.children) ensurePre(c.node);
      } else if (ev.kind === 'transition') {
        const n = ensurePre(ev.node);
        if (ev.machine === 'lifecycle') n.lifecycle = ev.to as LifecycleState;
      } else if (ev.kind === 'cost') {
        ensurePre(ev.node);
      }
      // relate doesn't introduce nodes into preState by itself (nodes come
      // from decompose/transition/cost); a relate targeting missing nodes
      // still folds fine in the base semantics.
    }
    // Now, for each correction winner, check its target's node in the final
    // pre-fold state.
    for (const targetId of winnerByTarget.keys()) {
      // Find the target event to determine which node it addresses.
      // Note: an unfound target is separately handled as "target does not
      // exist" (inapplicable) later.
      const target = events.find((e) => e.id === targetId);
      if (target === undefined) continue;
      const targetNodeId =
        target.kind === 'transition' || target.kind === 'cost'
          ? target.node
          : target.kind === 'decompose'
            ? target.parent
            : target.to;
      const n = preState.nodes.get(targetNodeId);
      if (
        n !== undefined &&
        (n.lifecycle === 'implemented' || n.lifecycle === 'accepted')
      ) {
        lockedTargetIds.add(targetId);
      }
    }
  }

  // Build the effective event stream.
  const eventById = new Map<string, Event>();
  for (const e of events) eventById.set(e.id, e);
  const usedTargets = new Set<string>();
  const effective: Event[] = [];
  for (const ev of events) {
    const winner = winnerByTarget.get(ev.id);
    if (winner === undefined) {
      effective.push(ev);
      continue;
    }
    usedTargets.add(ev.id);
    meter.total += 1;
    if (lockedTargetIds.has(ev.id)) meter.locked += 1;
    // retro: correction.ts is more than 1 day after the target's ts (§2.10 (d) ③)
    if (winner.ts - ev.ts > RETROACTIVE_THRESHOLD_MS) meter.retroactive += 1;
    if (winner.correctionKind === 'nullify') {
      // Drop the event from the effective stream (§2.10 誤記表明).
      continue;
    }
    // Patch form: merge fields; foreign keys → inapplicable.
    const { event: merged, foreignKeys } = mergePatch(ev, winner.patch);
    if (foreignKeys.length > 0) {
      meter.inapplicable += 1;
      inapplicableErrors.push(
        `§2.10 inapplicable correction '${winner.id}' → target '${ev.id}': ` +
          `patch names field(s) foreign to ${ev.kind} — ${foreignKeys.join(', ')}`,
      );
      // Drop from effective stream: the patch cannot be sensibly applied.
      continue;
    }
    effective.push(merged);
  }

  // Corrections naming a non-existent target — inapplicable, and counted in
  // the total meter as well (they are recorded corrections regardless).
  for (const c of sortedCorr) {
    if (!eventById.has(c.targetEventId) && !usedTargets.has(c.targetEventId)) {
      meter.total += 1;
      meter.inapplicable += 1;
      inapplicableErrors.push(
        `§2.10 inapplicable correction '${c.id}' → target '${c.targetEventId}': target event does not exist`,
      );
    }
  }

  // Re-sort effective stream: ts patches may have re-ordered events (§2.10).
  effective.sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return { effective, meter, inapplicableErrors };
}

// ---------------------------------------------------------------------------
// fold — public entry
// ---------------------------------------------------------------------------

/**
 * v21: fold accepts an OPTIONAL corrections array (second argument). Callers
 * that pass no corrections see byte-identical behaviour to the pre-v21 fold
 * (empty meter, no correction-applied events). The corrected-log semantics
 * (§2.10) apply corrections BEFORE the ordinary 4-event switch runs.
 */
export function fold(
  events: readonly Event[],
  corrections: readonly Correction[] = [],
): ProjectedState {
  const state: ProjectedState = {
    nodes: new Map(),
    childrenOf: new Map(),
    dependencyEdges: [],
    supersedeEdges: [],
    seenCostIds: new Set(),
    structuralErrors: [],
    appliedAt: 0,
    correctionMeter: emptyMeter(),
  };

  const {
    effective,
    meter,
    inapplicableErrors,
  } = applyCorrections(events, corrections);
  state.correctionMeter = meter;
  state.structuralErrors.push(...inapplicableErrors);

  const ensure = (id: NodeId): ProjectedNode => {
    let node = state.nodes.get(id);
    if (node === undefined) {
      node = emptyNode(id);
      state.nodes.set(id, node);
    }
    return node;
  };

  for (const ev of sortEvents(effective)) {
    state.appliedAt = ev.ts;
    switch (ev.kind) {
      case 'decompose': {
        applyDecompose(state, ev, ensure);
        break;
      }
      case 'transition': {
        applyTransition(state, ev, ensure);
        break;
      }
      case 'relate': {
        applyRelate(state, ev);
        break;
      }
      case 'cost': {
        applyCost(state, ev, ensure);
        break;
      }
    }
  }

  return state;
}

// ---------------------------------------------------------------------------
// Per-kind event application (extracted for readability; semantics unchanged
// from the pre-v21 fold except where §2.8 sentinels/§2.10 corrections require)
// ---------------------------------------------------------------------------

function applyDecompose(
  state: ProjectedState,
  ev: DecomposeEvent,
  ensure: (id: NodeId) => ProjectedNode,
): void {
  ensure(ev.parent);
  for (const child of ev.children) {
    // Tree-ness guard (§2.8 v20 / A3): naming a child's own descendant (or
    // itself) as the new parent would create a containment cycle — single-
    // effective-parent alone guarantees single parents, not a tree. Rejected
    // visibly, same shape as the I2 relate rejection.
    if (wouldContainmentCycle(state, ev.parent, child.node)) {
      state.structuralErrors.push(
        `A3/§2.8: containment cycle — decompose '${ev.parent}' → '${child.node}' would make the child its own ancestor — rejected`,
      );
      continue;
    }
    const cn = ensure(child.node);
    // Containment is latest-wins (§2.8, v20): a re-decompose REPLACES the
    // effective parent — never adds a coexisting edge. childrenOf is kept as
    // the exact inverse image of the parent pointers (the tree, A3), so the
    // child leaves its previous parent's list here. This also heals multi-
    // parent states in pre-v20 logs retroactively.
    if (cn.parent !== null && cn.parent !== ev.parent) {
      const prev = state.childrenOf.get(cn.parent);
      if (prev !== undefined) {
        const idx = prev.indexOf(child.node);
        if (idx >= 0) prev.splice(idx, 1);
        if (prev.length === 0) state.childrenOf.delete(cn.parent);
      }
    }
    cn.parent = ev.parent;
    const kids = state.childrenOf.get(ev.parent) ?? [];
    // A child born without an estimate stays null until est(impl) agrees —
    // surfaced as a coverage drop (§2.3).
    if (child.estimate !== undefined) cn.latestEstimate = child.estimate;
    if (!kids.includes(child.node)) kids.push(child.node);
    state.childrenOf.set(ev.parent, kids);
  }
}

function applyTransition(
  state: ProjectedState,
  ev: TransitionEvent,
  ensure: (id: NodeId) => ProjectedNode,
): void {
  const n = ensure(ev.node);
  if (ev.machine === 'lifecycle') {
    n.lifecycle = ev.to as LifecycleState;
    if (ev.to === 'implemented') n.reachedImplemented = true;
    // Assignee: latest-wins (§2.4). v21 §2.8 sentinel:
    //   undefined = attribute not on this event; leave as-is
    //   null      = explicit release (return to unassigned backlog)
    //   Actor     = set/replace
    if (ev.assignee !== undefined) {
      n.assignee = ev.assignee; // null clears; Actor sets
    }
    // Reviewer: same tri-state rules as assignee.
    if (ev.reviewer !== undefined) {
      n.reviewer = ev.reviewer;
    }
    // First-scheduling slot freeze: only the FIRST scheduling freezes the
    // baseline slot (§3②); later changes are a reason-stamped re-baseline,
    // which the engine treats as the immutable first value.
    if (ev.frozenSlot !== undefined && n.frozenSlot === null) {
      n.frozenSlot = ev.frozenSlot;
    }
  } else {
    // estimate-agreement machine
    if (ev.to === 'agreed') {
      // Only a human may agree (R-U4 / I6).
      if (ev.actor.kind !== 'human') {
        state.structuralErrors.push(
          `R-U4: non-human actor '${ev.actor.id}' attempted to agree node '${ev.node}' — rejected`,
        );
        return;
      }
      n.estimateState = 'agreed';
      // Budget frozen at agreement: event attribute, else current latest
      // (§3①). I4 retroactive lock is automatic because EV_abs reads
      // frozenBudget after the full ordered fold.
      const budget = ev.frozenBudget ?? n.latestEstimate;
      if (budget !== null) {
        n.frozenBudget = budget;
        n.agreedActorValues.set(ev.actor.id, budget);
      }
    } else {
      // I4/R-E3 (D-1 done-lock): a completed node's agreed estimate is
      // locked — re-estimation applies to incomplete nodes only; a post-
      // completion change of understanding is a supersede (§2.7). The event
      // stays in the log (append-only); the fold refuses to apply it —
      // same shape as the R-U4/I2 rejections.
      //
      // v21 (§2.10) carve-out: an agreed→proposed reversion that ARRIVES via
      // a §2.10 correction is a recording-error repair, not a "change of
      // understanding". Because corrections are applied BEFORE this switch
      // runs — mergePatch has already merged the corrected fields into the
      // effective transition — the fold sees the corrected fact. This branch
      // still rejects a NAKED (uncorrected) reversion on a completed node;
      // corrections that repair the record land upstream in mergePatch (a
      // nullify drops the transition; a patch that shifts ts to before
      // completion moves it out of the completed region entirely). The
      // "correction meter" (state.correctionMeter) surfaces every applied
      // correction — including any landing on a locked target — so no
      // silent path through the lock exists (I4 v21 "黙っては変わらない").
      const completed = n.lifecycle === 'implemented' || n.lifecycle === 'accepted';
      if (completed && n.estimateState === 'agreed') {
        state.structuralErrors.push(
          `I4/R-E3: re-estimation (agreed→proposed) on completed node '${ev.node}' — rejected (D-1 done-lock)`,
        );
        return;
      }
      // Re-estimation returns to proposed until re-agreed (R-E3).
      n.estimateState = 'proposed';
      // frozenBudget carries meaning ONLY while estimateState === 'agreed' —
      // every current consumer (ev.ts/pv.ts/landing.ts/milestone-rollup.ts)
      // reads it behind an `estimateState === 'agreed'` guard. Clear it here
      // so a stale pre-revert value can never shadow a fresher latestEstimate
      // for a consumer that reads frozenBudget at leaf granularity WITHOUT
      // that guard (computePlannedCost — issue #37: a proposed leaf is
      // documented to fall back to latestEstimate, which silently broke the
      // moment frozenBudget stayed non-null after a revert). The next
      // agreement always recomputes frozenBudget from scratch regardless of
      // this clear, so this is pure defense against the proposed-but-stale
      // window — never a second source of truth.
      n.frozenBudget = null;
    }
  }
}

function applyRelate(state: ProjectedState, ev: RelateEvent): void {
  if (ev.op === 'add') {
    if (wouldCycle(state, ev.from, ev.to)) {
      state.structuralErrors.push(
        `I2/R-D3: cyclic ${ev.edgeKind} edge '${ev.from}'→'${ev.to}' — rejected`,
      );
      return;
    }
    if (ev.edgeKind === 'supersede') {
      state.supersedeEdges.push({ from: ev.from, to: ev.to });
    } else {
      // Default policy by edge type when unspecified (R-D2). The minimal
      // slice cannot infer spec-vs-impl from ids, so it defaults to
      // `implemented`; fixtures set `accepted` explicitly on spec-phase edges.
      state.dependencyEdges.push({
        from: ev.from,
        to: ev.to,
        policy: ev.policy ?? 'implemented',
      });
    }
  } else {
    if (ev.edgeKind === 'supersede') {
      state.supersedeEdges = state.supersedeEdges.filter(
        (e) => !(e.from === ev.from && e.to === ev.to),
      );
    } else {
      // Policy-scoped remove (issue #37): when the remove event NAMES a
      // policy, only the edge carrying that exact policy is removed —
      // leaving any other-policy edge between the same pair intact. This
      // is an ADDITIVE extension: no past remove event ever set `policy`
      // (the CLI didn't wire it through before), so `ev.policy ===
      // undefined` always short-circuits to true and preserves the
      // original "remove ALL (from,to) edges" behavior byte-for-byte —
      // replayed golden logs are unaffected.
      state.dependencyEdges = state.dependencyEdges.filter(
        (e) =>
          !(
            e.from === ev.from &&
            e.to === ev.to &&
            (ev.policy === undefined || e.policy === ev.policy)
          ),
      );
    }
  }
}

function applyCost(
  state: ProjectedState,
  ev: CostEvent,
  ensure: (id: NodeId) => ProjectedNode,
): void {
  // Accumulative, deduped by id (§2.8).
  if (state.seenCostIds.has(ev.id)) return;
  // Non-finite amounts (NaN/±Infinity) are a write-layer input-mistake
  // signature — e.g. `Number("5o") === NaN` slips past a plain `<0` guard
  // and would otherwise NaN-poison every downstream AC/CPI aggregate
  // (issue #37). Rejected the same visible way as the negative-amount guard
  // immediately below.
  if (!Number.isFinite(ev.amount)) {
    state.structuralErrors.push(
      `A6/§2.8: non-finite cost ${ev.amount} on '${ev.node}' — rejected (amount must be a finite number)`,
    );
    return;
  }
  // Amounts are non-negative (§2.8 v20 / A6: negative spent attention-time
  // does not exist). A6 の射程明確化 (v21 §1): the non-negative rule guards
  // the ontology of facts — 負値による相殺イベントは導入しない. Recording
  // errors are repaired via §2.10 corrections (which are visible through the
  // correction meter), NOT via a negative cost.
  if (ev.amount < 0) {
    state.structuralErrors.push(
      `A6/§2.8: negative cost ${ev.amount} on '${ev.node}' — rejected (amounts are non-negative; use §2.10 correction to repair a recording error)`,
    );
    return;
  }
  state.seenCostIds.add(ev.id);
  ensure(ev.node).ownCost += ev.amount;
}

// Re-export applyCorrections for tests that want to observe the effective-log
// composition in isolation from the switch (§2.10 semantics one-line principle
// is easier to assert if you can see the composed input the switch sees).
export const __test_applyCorrections = applyCorrections;

// Suppress unused-symbol warnings if a re-export was tree-shaken by consumers.
void ({} as Actor);
