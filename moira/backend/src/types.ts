// Moira S4 minimal backend — core types.
//
// Everything here is a direct encoding of moira/MODEL.md (v21). Citations use
// stable clause IDs (§/A/I/P/R) — line numbers are avoided per trace-notation.
//
// Two data tiers (MODEL §5 / A2), plus v21's correction tier (§2.10):
//   1. The append-only log of the FOUR node-work events (transition / decompose
//      / relate / cost). This is the single source of truth for node work data.
//      The 4-event axiom (A2) is unchanged — corrections are NOT a fifth kind.
//   2. The capacity input c(i,d) — a SEPARATE tier with its own append-only,
//      reason-stamped history (A4, R-U14). NOT one of the four events.
//   3. (v21) The correction tier (§2.10) — an append-only, reason-required layer
//      whose records TARGET events in tier 1 by id. A2's read scope is revised
//      (§1 "A2 の射程改訂"): node work data is derived from the composed read of
//      "event log (immutable) + correction layer (append-only)". Corrections
//      do not overwrite events; they carry a "read override" that the fold
//      applies before running the ordinary 4-event semantics — the one-line
//      principle of §2.10: the corrected-log is one log that the existing
//      semantics can re-read as-is.

export type NodeId = string;
export type EventId = string; // globally sortable; tie-breaks ts (I3, R-D5)
export type IsoDate = string; // 'YYYY-MM-DD' — c is per-date (A4)

export type ActorKind = 'human' | 'agent'; // A5
export interface Actor {
  kind: ActorKind;
  id: string;
}

// task + phase layers share ONE lifecycle machine (§2.5, §2.6).
// `cancelled` is terminal and reachable from any non-terminal state.
export type LifecycleState =
  | 'pending'
  | 'ready'
  | 'implementing'
  | 'implemented'
  | 'accepted'
  | 'cancelled';

export type EstimateState = 'proposed' | 'agreed'; // §2.2

export type StateMachine = 'lifecycle' | 'estimate-agreement'; // I5, R-D6
export type EdgeKind = 'dependency' | 'supersede'; // §2.7, §2.8
export type EdgePolicy = 'accepted' | 'implemented'; // per-edge; defaults R-D2

// ----------------------------------------------------------------------------
// The four events (§2.8, §4 requirements) — 4-kind axiom unchanged in v21
// ----------------------------------------------------------------------------

interface EventBase {
  id: EventId;
  ts: number; // epoch ms — total order with id (I3)
  actor: Actor;
}

export interface TransitionEvent extends EventBase {
  kind: 'transition';
  node: NodeId;
  machine: StateMachine; // I5/R-D6 — every transition names its machine
  to: LifecycleState | EstimateState;
  // Assignee: single worker (§2.4, R-T5).
  //   undefined = attribute not carried on this transition (no change on fold)
  //   Actor     = set/replace latest-wins (§2.4)
  //   null      = v21 §2.8 release sentinel — explicit un-assignment
  //               (return to unassigned backlog). Distinct from "not mentioned".
  assignee?: Actor | null;
  // Reviewer: single designated reviewer, human-only, attendant attr; distinct
  // from assignee, not consumed by leveling/EV/PV/coverage (§2.4/R-T5, v19).
  //   undefined/Actor as above; null = v21 §2.8 release sentinel.
  reviewer?: Actor | null;
  frozenBudget?: number; // value frozen on the agreement transition (§3①)
  frozenSlot?: IsoDate; // slot frozen on the first-scheduling transition (§3②)
  reason?: string; // required on a reason-stamped re-baseline (R-U7)
}

export interface DecomposeEvent extends EventBase {
  kind: 'decompose';
  parent: NodeId;
  reason: string; // reason required on decompose (§2.8)
  children: Array<{ node: NodeId; estimate?: number }>; // latest proposed value, MD
}

export interface RelateEvent extends EventBase {
  kind: 'relate';
  op: 'add' | 'remove';
  from: NodeId; // dependency: predecessor; supersede: NEW node (R-D7)
  to: NodeId; //   dependency: successor;   supersede: OLD node
  edgeKind: EdgeKind;
  policy?: EdgePolicy; // dependency only; default by edge type if absent (R-D2)
  reason?: string; // v21 §2.8: optional reason on relate (mirrors cost)
}

export interface CostEvent extends EventBase {
  kind: 'cost';
  node: NodeId;
  amount: number; // MD attention-time (A6); deduped by id (§2.8)
  reason?: string; // v21 §2.8: optional reason on cost (mirrors relate)
}

export type Event = TransitionEvent | DecomposeEvent | RelateEvent | CostEvent;

// ----------------------------------------------------------------------------
// c(i,d) — second data tier (A4, R-U14)
// ----------------------------------------------------------------------------

export interface CapacityEntry {
  humanId: string;
  date: IsoDate;
  capacity: number; // c(i,d) ∈ [0, 1.0] MD/day; default 1.0 if absent
  reason: string; // contract | holiday | leave | temporary-reduction
  ts: number; // append-only, timestamped (R-U14); latest ts wins per (human, date)
}

export type CapacityLookup = (humanId: string, date: IsoDate) => number;

// ----------------------------------------------------------------------------
// Correction — third tier (v21 §2.10). Append-only, reason-required, targets
// an event in the 4-kind log by id, timestamped. NOT a 5th event kind: this
// type is deliberately DISTINCT from Event so that Event['kind'] stays exactly
// {transition, decompose, relate, cost} (see decisions/events.test-d.ts).
//
// Two forms (§2.10):
//   - nullify: the entire target event is erroneous (誤記表明). The event is
//     skipped entirely during read; a `cancel` entered by mistake is repaired
//     by nullifying it (state-machine terminality is unchanged — no un-cancel
//     event is introduced).
//   - patch:  field(s) of the target event are corrected (値訂正). The read
//     merges the patch onto the event; a ts patch can shift latest-wins
//     winners (§2.10). A patch that yields an invalid event under the base
//     semantics is INAPPLICABLE — visible as a structural error, not silently
//     absorbed.
//
// Chain rule: latest-wins per targetEventId by (ts, id) — isomorphic to I3.
// Corrections themselves are NOT correctable; a stray correction is neutralised
// by another correction targeting the SAME event (not a correction of the
// correction). §2.10.
// ----------------------------------------------------------------------------

interface CorrectionBase {
  id: EventId; // globally sortable — orders corrections targeting the same event
  ts: number; // "when we learned this" — knowledge time (§2.10)
  actor: Actor;
  targetEventId: EventId; // the event being corrected (§2.10 (c))
  reason: string; // MANDATORY (§2.10 (b))
}

// (i) 誤記表明 — the entire target event is erroneous (§2.10)
export interface CorrectionNullify extends CorrectionBase {
  correctionKind: 'nullify';
}

// (ii) 値訂正 — field(s) of the target event are corrected (§2.10). The patch
// shape is per-kind partial; fold-time validation catches mismatches (e.g. a
// `patch` naming `amount` on a transition-target is an inapplicable patch and
// surfaces as a structural error). Actor and id are NEVER patched — those are
// identity; ts and kind-specific fields are patchable.
export interface CorrectionPatch extends CorrectionBase {
  correctionKind: 'patch';
  patch: EventPatch;
}

export type Correction = CorrectionNullify | CorrectionPatch;

/**
 * Structural partial over the 4-event union — fold-time semantics apply the
 * patch onto the matching target event's fields. Keys not present on the
 * target kind are ignored at merge and yield an inapplicable-patch structural
 * error. `id` and `kind` are never patched; `ts` is patchable (a ts patch can
 * change latest-wins winners — §2.10).
 */
export type EventPatch =
  | Partial<Omit<TransitionEvent, 'id' | 'kind'>>
  | Partial<Omit<DecomposeEvent, 'id' | 'kind'>>
  | Partial<Omit<RelateEvent, 'id' | 'kind'>>
  | Partial<Omit<CostEvent, 'id' | 'kind'>>;

// ----------------------------------------------------------------------------
// Correction meter (v21 §2.10 (d)) — the four permanent categories:
//   ①total   — every applied correction
//   ②locked  — corrections targeting events on completed nodes (I4 target)
//   ③retro   — corrections whose target event predates the correction by more
//               than one day (retroactive correction; subsumes the pre-v21
//               issue #36 retroactive-write warning per HA B5 unification)
//   ④inapplicable — corrections that fail base-semantics re-validation
//                    (current-state predicate — NOT a monotonic counter)
// ①②③ are monotonic counters, stamped at the time of application; ④ is a
// current-state predicate. No discretional knob may remove entries from any
// bucket (PR-CORRECTION-METER); presentation may fold/mute but the counts
// themselves are inviolate.
// ----------------------------------------------------------------------------

export interface CorrectionMeterCounts {
  total: number;
  locked: number;
  retroactive: number;
  inapplicable: number;
}

// ----------------------------------------------------------------------------
// Projected state (the fold output)
// ----------------------------------------------------------------------------

export interface DependencyEdge {
  from: NodeId;
  to: NodeId;
  policy: EdgePolicy;
}

export interface SupersedeEdge {
  from: NodeId; // NEW node (source of the supersede) — R-D7
  to: NodeId; //   OLD node (superseded)
}

export interface ProjectedNode {
  id: NodeId;
  lifecycle: LifecycleState;
  reachedImplemented: boolean; // P5 context; warning deferred
  estimateState: EstimateState;
  latestEstimate: number | null; // latest decompose value — drives EVM/forecast (R-U7)
  frozenBudget: number | null; // frozen at agreement (§3①)
  frozenSlot: IsoDate | null; // frozen at first scheduling (§3②)
  assignee: Actor | null; // worker, latest-wins (§2.4); null when released (v21 §2.8)
  reviewer: Actor | null; // designated reviewer, latest-wins; not consumed by leveling/EV/PV/coverage (§2.4/R-T5, v19); null when released (v21 §2.8)
  ownCost: number; // Σ deduped cost (P3)
  parent: NodeId | null;
  agreedActorValues: Map<string, number>; // per distinct human's latest agreed value (R-U12 context)
}

export interface ProjectedState {
  nodes: Map<NodeId, ProjectedNode>;
  childrenOf: Map<NodeId, NodeId[]>;
  dependencyEdges: DependencyEdge[];
  supersedeEdges: SupersedeEdge[];
  seenCostIds: Set<EventId>;
  structuralErrors: string[]; // rejected cyclic relate / agent-issued agreement / inapplicable correction, etc.
  appliedAt: number; // ts of the last applied event
  // v21 §2.10 (d): correction meter — 4 permanent categories, no discretional
  // knob (PR-CORRECTION-METER). Populated by fold from the correction layer.
  correctionMeter: CorrectionMeterCounts;
}

// ----------------------------------------------------------------------------
// DerivedState — the 11 S4 derivations (R-S2, UI-ARCHITECTURE §4.1)
// ----------------------------------------------------------------------------

export interface NodeStateRow {
  node: NodeId;
  lifecycle: LifecycleState;
  estimate: EstimateState;
}

export interface AcRow {
  node: NodeId;
  ac: number;
}

export interface ForecastRow {
  node: NodeId;
  predictedCompletion: IsoDate | null; // live forecast (P7) — latest estimate + current c
  /**
   * Live forecast start (issue #34c): the first day the leveler actually
   * consumed capacity for this node — NOT the dependency-derived earliest-
   * start, which can land on a c=0 / already-saturated day the greedy fill
   * loop then skips (leveler.ts). null under the same conditions as
   * predictedCompletion (unschedulable / not leveled to a date).
   */
  predictedStart: IsoDate | null;
  frozenSlot: IsoDate | null; // frozen baseline slot — so consumers can read R-S7 divergence
}

// One human-readable history line per event (read-side projection of the log).
// node is the event's subject (decompose → parent; relate → `to`); null only if a
// future event kind has no single subject.
export interface ActivityRow {
  id: EventId;
  ts: number;
  actor: Actor;
  node: NodeId | null;
  kind: Event['kind'];
  label: string;
}

export interface DerivedState {
  asOf: IsoDate;
  // (1) node states
  nodeStates: NodeStateRow[];
  // (2) EV% achievement, (3) EV_abs absolute earned
  evPercent: number; // ∈ [0,1]
  evAbs: number; // MD, agreed-completed only (R-U8)
  cumulativeEvAbs: number; // R-S5 distinct read — includes superseded
  // (4) estimate coverage, (5) schedule coverage
  estimateCoverage: number; // P2
  scheduleCoverage: number; // R-S6
  // execution coverage — in-progress share (R-S8); count ratio over a state
  // predicate, isomorphic to scheduleCoverage; does NOT touch EV_abs/EV%/SPI/CPI/PV
  executionCoverage: number; // R-S8: |agreed leaves in `implementing`| / |agreed leaves|
  // (6) PV, (7) AC
  pv: number; // §3
  ac: number; // P3
  acByNode: AcRow[];
  // (8) SPI, (9) CPI — raw; presenter de-rates SPI by scheduleCoverage (R-S6)
  spi: number | null;
  spiScheduleCoverage: number; // == scheduleCoverage, returned for pair-reading
  cpi: number | null;
  // (10) queues — P4 same query, actor filter
  agentWorkQueue: NodeId[];
  humanReviewQueue: NodeId[];
  // (11) live forecast schedule + unassigned backlog
  forecast: ForecastRow[];
  unassignedBacklog: NodeId[]; // agreed nodes with no assignee (P0)
  // (12) activity log — human-readable history of the event log (read-side
  // projection; same single-derivation seam as the metrics, R-S2)
  activityLog: ActivityRow[];
  // supporting / honest gaps
  effectiveLeaves: NodeId[]; // currently-effective leaf set (R-S5)
  structuralErrors: string[];
  // v21 §2.10 (d): correction meter — always surfaced, no discretional knob
  correctionMeter: CorrectionMeterCounts;
}
