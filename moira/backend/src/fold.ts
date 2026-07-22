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

const RETROACTIVE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // §2.10 (d) ③b strict >24h
                                                       // (経過 24 時間超;ちょうど
                                                       // 24h は含まない). ③c
                                                       // (遡及書き込み) is an
                                                       // observation-layer CLI
                                                       // concern — out of scope
                                                       // for this fold-owned
                                                       // constant.

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
    claimedParentByActor: new Map(),
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
 * `id` and `kind` are NEVER patched (identity fields — the union discriminant
 * must never move under a target). Every other field — INCLUDING `actor` — is
 * patchable per MODEL §2.10 (i): "対象イベントのフィールド(amount・node・ts・
 * actor・凍結値等)について…真値はこれ、を表明する" names `actor` explicitly
 * alongside `amount`/`node`/`ts`. issue #11 gate-2 R2 #2: a prior version of
 * this function skipped `actor` as if it were identity — that was a
 * backend↔MODEL sync gap (the CLI already accepts and persists `--patch
 * actor=...`, commands.ts PATCH_REJECTED_KEYS — only `id`/`kind` are
 * rejected there too). A patch moving `actor` can still be rejected as
 * inapplicable by the CALLER's re-validation against base semantics (§2.10
 * "検証の迂回は不能" — e.g. moving a non-human actor onto an agreed
 * estimate-transition, R-U4/I6) — that check is NOT this function's job; this
 * function only merges fields and reports foreign ones.
 */
function mergePatch(
  target: Event,
  patch: EventPatch,
): { event: Event; foreignKeys: string[] } {
  // Fields allowed per kind (exclude id/kind only — identity fields).
  const allowedByKind: Record<Event['kind'], ReadonlyArray<string>> = {
    transition: [
      'ts', 'actor', 'node', 'machine', 'to', 'assignee', 'reviewer',
      'frozenBudget', 'frozenSlot', 'reason',
    ],
    decompose: ['ts', 'actor', 'parent', 'reason', 'children'],
    relate: ['ts', 'actor', 'op', 'from', 'to', 'edgeKind', 'policy', 'reason'],
    cost: ['ts', 'actor', 'node', 'amount', 'reason'],
  };
  const allowed = new Set(allowedByKind[target.kind]);
  const foreignKeys: string[] = [];
  const merged: Record<string, unknown> = { ...(target as unknown as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id' || k === 'kind') continue; // identity — never patched
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
 * §2.10 "検証の迂回は不能" — the validation-bypass example the canon names
 * explicitly (moira/MODEL.md §2.10 (i)): "非人間 actor への agreed 訂正" — a
 * patch that would move a non-human (agent) actor onto a transition record
 * whose (possibly-also-patched) reading is an estimate-agreement 'agreed'
 * transition. Only a human may agree (R-U4/I6) — the BASE switch
 * (applyTransition) already enforces this for an ordinary event, but a
 * correction must be caught HERE, before it ever enters `winnerByTarget`:
 * letting it through and relying on applyTransition's own rejection at
 * fold-time would silently replace the target's effective slot with a
 * record that then fails to apply — losing the ORIGINAL valid (human-agreed)
 * reading entirely, rather than leaving it in force. §2.10's own inapplicable
 * contract ("先行する有効な訂正が現行のまま残る") requires the latter.
 *
 * SCOPE NOTE: §2.10 (i) lists FOUR "検証の迂回は不能" worked examples — a
 * containment-cycle decompose patch, a negative-amount cost patch, a
 * cycle-creating relate-endpoint patch, and THIS ONE (non-human agreed actor).
 * Only this fourth example gets an explicit pre-admission check here, because
 * it is the one this task's actor-unlock newly makes reachable (mergePatch
 * used to always skip `actor`, so it was unreachable before). The other
 * three still flow into `winnerByTarget` and rely on the base switch's own
 * rejection at fold-time — which, per the reasoning above, does NOT give the
 * same "prior valid reading stays in force" guarantee for those cases either.
 * That is a PRE-EXISTING gap, not introduced or fixed by this task, and
 * deliberately left alone here (extending this check to the other three
 * would go beyond issue #11 gate-2 R2 #2's actor-scoped mandate and touch
 * unrelated, already-frozen decompose/cost/relate correction paths).
 */
function violatesNonHumanAgreement(merged: Event): boolean {
  return (
    merged.kind === 'transition' &&
    merged.machine === 'estimate-agreement' &&
    merged.to === 'agreed' &&
    merged.actor.kind !== 'human'
  );
}

/**
 * Which node a first-tier event addresses — used both to build the
 * effective stream and to find the "subject" a correction targets.
 */
function targetNodeIdOf(ev: Event): NodeId {
  return ev.kind === 'transition' || ev.kind === 'cost'
    ? ev.node
    : ev.kind === 'decompose'
      ? ev.parent
      : ev.to;
}

/**
 * Build the effective event stream from `events` plus a per-target winner
 * map. Callers MUST only ever put LOCALLY VALID corrections into
 * `winnerByTarget` (nullify is always locally valid; a patch is locally
 * valid iff none of its fields are foreign to the target's kind) — an
 * inapplicable record must never enter this map, so that the effective
 * reading falls back to the preceding valid correction (or the original
 * event) rather than dropping the target (§2.10: "適用不能であり、訂正レジス
 * タに入らず、先行する有効な訂正が現行のまま残る" — issue #11 gate-2 R1 #1).
 * Each patch is merged against the target's ORIGINAL event, never against a
 * prior winner's already-merged result (§2.10 latest-wins is a full-stance
 * replacement per record, not a field-level accumulation across records).
 * Not sorted by ts — callers sort (or don't) as needed.
 */
function buildEffectiveEvents(
  events: readonly Event[],
  winnerByTarget: ReadonlyMap<string, Correction>,
): Event[] {
  const effective: Event[] = [];
  for (const ev of events) {
    const winner = winnerByTarget.get(ev.id);
    if (winner === undefined) {
      effective.push(ev);
      continue;
    }
    if (winner.correctionKind === 'nullify') continue; // §2.10 誤記表明
    // foreignKeys is guaranteed empty here by the "locally valid only" caller
    // contract above — no need to re-check or drop.
    const { event: merged } = mergePatch(ev, winner.patch);
    effective.push(merged);
  }
  return effective;
}

/**
 * The base 4-event switch, with NO correction layer involved — this is
 * `fold()`'s tail half, factored out so it can ALSO be used internally by
 * `applyCorrections`'s per-record ② evaluation (folding a PREFIX of valid
 * corrections applied so far) without recursing back into
 * `applyCorrections`/`fold` (which would recurse without a base case). No
 * meter is computed here; `correctionMeter` on the returned state is always
 * the empty placeholder — callers that care about the correction meter set
 * it themselves from `applyCorrections`'s own return value.
 */
function foldEventsOnly(events: readonly Event[]): ProjectedState {
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
  const ensure = (id: NodeId): ProjectedNode => {
    let node = state.nodes.get(id);
    if (node === undefined) {
      node = emptyNode(id);
      state.nodes.set(id, node);
    }
    return node;
  };
  for (const ev of sortEvents(events)) {
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

/**
 * Apply the correction layer to the event stream. Returns:
 *   - effective events: input events with per-target latest-wins VALID
 *     corrections merged; nullified events are DROPPED from the stream;
 *     INVALID records (foreign-field patches, ghost targets) never reach a
 *     winner slot at all — the preceding valid correction (or the original
 *     event, if none) stays in force (§2.10: 適用不能な訂正は訂正レジスタに
 *     入らない — issue #11 gate-2 R1 #1).
 *   - meter: ①②③ are PER-RECORD evaluation counters (every appended
 *     correction record targeting a real event is stamped, regardless of
 *     whether it is itself locally valid or whether it ultimately wins the
 *     latest-wins battle for the effective log) — ④ alone is a current-state
 *     predicate over the winner only (§2.10 (d) v22: "①②③は追記された記録の
 *     評価計数（④のみ現在状態の述語）").
 *   - inapplicable errors: structural errors from patches whose fields are
 *     foreign to the target's kind, or that name a non-existent target event.
 *
 * Latest-wins per target by (ts, id) — isomorphic to I3 — governs the
 * EFFECTIVE STREAM only (which single correction's fields actually reach the
 * base 4-event semantics), and ONLY among LOCALLY VALID records for that
 * target. Corrections are not themselves correctable; a stray correction is
 * neutralised by ANOTHER correction targeting the SAME event (§2.10).
 *
 * Implementation: all corrections are walked ONCE in global (ts,id) order,
 * incrementally growing a single `winnerByTarget` map that holds, at every
 * step, exactly the valid corrections that preceded the record currently
 * being evaluated. This one running map is the shared "適用直前の読み" basis
 * for THREE things evaluated per record, in this order, before the record
 * itself is (maybe) admitted as a winner:
 *   - ②locked: `buildEffectiveEvents(events, winnerByTarget)` — the log as
 *     corrected by only the valid corrections so far — is folded (via
 *     `foldEventsOnly`, no recursion) and the correction's SUBJECT NODE's
 *     lifecycle is read off that fold. This must be a full per-record
 *     replay, not a single base-log pre-fold: an EARLIER correction on a
 *     DIFFERENT event addressing the SAME node (e.g. nullifying the
 *     completing transition) changes what "locked" means for a LATER
 *     correction on that node (issue #11 gate-2 R1 #2 — a nullify of the
 *     completing transition is itself still counted, since immediately
 *     before ITS OWN application the node was completed — I4 v21
 *     "自己言及で消えない" — but a correction landing AFTER that nullify has
 *     already taken effect sees the re-opened node and is NOT locked).
 *   - ③=③a∨③b: the reading is the SAME target's own running winner (its
 *     patched ts if the winner is a patch that touched ts, else the
 *     original event's ts) — an INVALID record never entered the map, so it
 *     never advances this reading either (issue #11 gate-2 R1 #1 follow-on:
 *     無効記録は読みを動かさない).
 *   - admission: nullify is always locally valid. A patch is locally valid
 *     iff none of its fields are foreign to the target's kind; only then
 *     does it overwrite the target's running winner.
 * A record naming a non-existent target has no reading to evaluate ②③
 * against and is handled separately, at the end, as ④ only.
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
  // v22 §2.10 (d) ①: 訂正総数 = 追記された訂正記録の数;適用可否によらない — every
  // appended correction record counts unconditionally, independent of whether
  // it wins latest-wins, targets a real event, or turns out inapplicable.
  meter.total = corrections.length;

  const eventById = new Map<string, Event>();
  for (const e of events) eventById.set(e.id, e);

  const sortedCorr = [...corrections].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // The single running "valid corrections so far" state — see the doc
  // comment above for why ②③ evaluation and winner-selection all share it.
  const winnerByTarget = new Map<string, Correction>();

  for (const c of sortedCorr) {
    const target = eventById.get(c.targetEventId);
    if (target === undefined) continue; // ghost target — ④ only, handled below

    // ---- ②locked: fold the log as corrected by only the valid corrections
    // that precede `c` (nothing from `c` onward is folded in yet).
    const preEffective = buildEffectiveEvents(events, winnerByTarget);
    const preState = foldEventsOnly(preEffective);
    // The correction's subject: the target's CURRENT reading (a preceding
    // valid same-target correction may itself have changed which node this
    // record addresses — `node`/`parent`/`to` are patchable fields). A
    // nullified target has no current reading; fall back to the original
    // target's own node identity (the correction still names THAT target).
    const priorWinnerForTarget = winnerByTarget.get(c.targetEventId);
    const currentTargetReading: Event | undefined =
      priorWinnerForTarget === undefined
        ? target
        : priorWinnerForTarget.correctionKind === 'nullify'
          ? undefined
          : mergePatch(target, priorWinnerForTarget.patch).event;
    const subjectNodeId = targetNodeIdOf(currentTargetReading ?? target);
    const subjectNode = preState.nodes.get(subjectNodeId);
    if (
      subjectNode !== undefined &&
      (subjectNode.lifecycle === 'implemented' || subjectNode.lifecycle === 'accepted')
    ) {
      meter.locked += 1;
    }

    // ---- ③=③a∨③b: reading is this target's own running valid winner (its
    // patched ts if it touched ts, else the original ts) — invalid records
    // never became a winner, so they never move this reading either.
    const readingTs =
      priorWinnerForTarget !== undefined &&
      priorWinnerForTarget.correctionKind === 'patch' &&
      priorWinnerForTarget.patch.ts !== undefined
        ? priorWinnerForTarget.patch.ts
        : target.ts;
    const isRetroA =
      c.correctionKind === 'patch' && c.patch.ts !== undefined && c.patch.ts < readingTs;
    const isRetroB = c.ts - readingTs > RETROACTIVE_THRESHOLD_MS;
    // 1 記録 1 カウント — ③a∨③b, never double-counted for one record.
    if (isRetroA || isRetroB) meter.retroactive += 1;

    // ---- admission (§2.10 latest-wins governs ONLY the effective-stream
    // winner; ②③ above were evaluated regardless of what happens next).
    if (c.correctionKind === 'nullify') {
      winnerByTarget.set(c.targetEventId, c); // always locally valid
      continue;
    }
    const { event: merged, foreignKeys } = mergePatch(target, c.patch);
    // issue #11 gate-2 R2 #2 / §2.10 "検証の迂回は不能": a patch that would
    // move a non-human actor onto an agreed estimate-transition is named
    // verbatim in canon as an inapplicable-by-construction example (only a
    // human may agree — R-U4/I6) — checked HERE, pre-admission, so it never
    // reaches winnerByTarget (see violatesNonHumanAgreement's doc comment for
    // why letting it flow through to the base switch instead would be wrong).
    const nonHumanAgreement = violatesNonHumanAgreement(merged);
    if (foreignKeys.length > 0 || nonHumanAgreement) {
      meter.inapplicable += 1;
      inapplicableErrors.push(
        foreignKeys.length > 0
          ? `§2.10 inapplicable correction '${c.id}' → target '${c.targetEventId}': ` +
            `patch names field(s) foreign to ${target.kind} — ${foreignKeys.join(', ')}`
          : `§2.10/R-U4 inapplicable correction '${c.id}' → target '${c.targetEventId}': ` +
            `patch would move a non-human actor onto an agreed estimate-transition — ` +
            `rejected (only a human may agree, I6)`,
      );
      // Does NOT enter winnerByTarget: the prior valid reading (or the
      // original event) stays in force (§2.10 — issue #11 gate-2 R1 #1).
      continue;
    }
    winnerByTarget.set(c.targetEventId, c);
  }

  // Ghost targets — ④ only (no target event to evaluate ②③ against). ①
  // already counted every record unconditionally above.
  for (const c of sortedCorr) {
    if (!eventById.has(c.targetEventId)) {
      meter.inapplicable += 1;
      inapplicableErrors.push(
        `§2.10 inapplicable correction '${c.id}' → target '${c.targetEventId}': target event does not exist`,
      );
    }
  }

  // Final effective stream: only ever-valid winners are in winnerByTarget.
  const effective = buildEffectiveEvents(events, winnerByTarget);
  // Re-sort: ts patches may have re-ordered events (§2.10).
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
  const { effective, meter, inapplicableErrors } = applyCorrections(events, corrections);
  const state = foldEventsOnly(effective);
  state.correctionMeter = meter;
  // Inapplicable-correction errors are surfaced ahead of any per-event
  // structural errors produced by the switch (unchanged ordering from the
  // pre-refactor implementation).
  state.structuralErrors = [...inapplicableErrors, ...state.structuralErrors];
  return state;
}

/**
 * Public, meter-less exposure of `applyCorrections`'s effective-stream half
 * (issue #11 gate-2 R2 #1 — MODEL §2.10's one-line principle: "訂正適用後の
 * ログは…全導出でそのまま読み直される一つのログ"). `fold()` already builds this
 * internally but only surfaces it baked into a `ProjectedState`; independent
 * derivations that fold their OWN raw `Event[]` argument (feature-rollup.ts /
 * milestone-rollup.ts / landing.ts — see their file-header "same INDEPENDENT-
 * derivation discipline" note) need the CORRECTED events themselves as input,
 * not a ProjectedState, so they can keep calling `fold(sortEvents(events))`
 * unchanged (their signatures are frozen — CLI report.ts is the caller that
 * threads corrections through, moira/cli/src/report.ts). A thin wrapper: no
 * new merge logic, no meter (callers here don't want or need the accounting
 * side-channel — `fold()` remains the one place that surfaces
 * `correctionMeter`). Same "no corrections ⇒ pass-through" backward-compat
 * shape as `fold`'s own optional second argument.
 */
export function materializeEffectiveEvents(
  events: readonly Event[],
  corrections: readonly Correction[] = [],
): Event[] {
  return applyCorrections(events, corrections).effective;
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
    // v21 §2.8 contested-containment warning support: record this HUMAN
    // actor's parent claim for this child. R-U12-isomorphic — only humans
    // are compared (agent decomposes still update the effective parent above
    // via latest-wins, but don't contribute a distinct claim to the warning
    // register; the warning is about people disagreeing, not agents).
    if (ev.actor.kind === 'human') {
      cn.claimedParentByActor.set(ev.actor.id, ev.parent);
    }
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
