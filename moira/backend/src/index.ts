// Public package entry (barrel). The backend stays `private` (not published), but
// this barrel makes it a clean, type-safe dependency for sibling packages such as
// `moira/cli` (which imports `moira-backend` via a `file:` dependency). The pure
// derivation core (types/fold/derive/derivations) is browser-safe; the stores and
// read/* modules are Node-only (top-level `node:fs`).

export { derive, type DeriveOptions } from './derive.js';
export {
  computeLandingCurve,
  type LandingCurve,
  type LandingOptions,
  type LandingPoint,
} from './derivations/landing.js';
export {
  computeFeatureRollup,
  type FeatureRollupRow,
} from './derivations/feature-rollup.js';
export {
  computeMilestoneRollup,
  type MilestoneDefinition,
  type MilestoneRollupOptions,
  type MilestoneRollupRow,
} from './derivations/milestone-rollup.js';
export { fold, materializeEffectiveEvents } from './fold.js';
export { atomicWriteFileSync } from './atomic-write.js';
export { EventStore, sortEvents } from './event-store.js';
export {
  CapacityStore,
  DEFAULT_CAPACITY,
  defaultCapacityLookup,
} from './capacity-store.js';
export {
  isWeekend,
  isBusinessDay,
  orgCalendarFallback,
  JP_HOLIDAYS,
  JP_HOLIDAYS_FROM,
  JP_HOLIDAYS_TO,
  type BusinessDayOptions,
} from './org-calendar.js';
export { nominalDurationDays } from './leveler.js';
export {
  computePlannedCost,
  type PlannedCostResult,
  type PlannedCostRow,
} from './derivations/planned-cost.js';

export type {
  // identifiers
  NodeId,
  EventId,
  IsoDate,
  // actors
  Actor,
  ActorKind,
  // state machines
  LifecycleState,
  EstimateState,
  StateMachine,
  EdgeKind,
  EdgePolicy,
  // the four events
  Event,
  TransitionEvent,
  DecomposeEvent,
  RelateEvent,
  CostEvent,
  // correction tier (v21/v22 §2.10) — pre-existing gap: report.ts (issue #6)
  // already imports these; this barrel never re-exported them (TS2305, CI red
  // on moira-cli build since issue #6). Purely additive wiring — no semantic
  // change to fold.ts/types.ts.
  Correction,
  CorrectionNullify,
  CorrectionPatch,
  EventPatch,
  CorrectionMeterCounts,
  // capacity tier
  CapacityEntry,
  CapacityLookup,
  // projected & derived state
  ProjectedNode,
  ProjectedState,
  DerivedState,
  NodeStateRow,
  AcRow,
  ForecastRow,
  ActivityRow,
} from './types.js';
