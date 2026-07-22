// `moira report` — the morning digest (issue #25, roadmap skill #14
// moira-evm-digest, TE03). "Previous" is NEVER a stored snapshot (⊥A2): it is
// the same append-only log re-folded over the (ts,id) ≤ cut prefix — the as-of
// derivation TE03 defines, the pattern landing.ts proved. Pure functions: the
// command layer loads the repo, this module only computes and formats.
//
// Day-boundary discipline: tsDay is the UTC calendar day of the event's ts —
// the SAME rule as backend/src/derivations/landing.ts (tsDay/evOfPrefix). One
// date semantics in the codebase; the JST skew (00:00–09:00 events land on the
// previous UTC day) is accepted per TE03 「日境界はパラメータ」 and documented in
// the CLI README.
//
// Capacity is passed as-is to every point-in-time derive: all reported metrics
// (EV_abs/EV%/PV/AC/SPI/CPI/coverages/queues) are capacity-INDEPENDENT — c(i,d)
// only feeds the leveler→forecast rows, which the digest reads only at `asOf`.
//
// Canon guardrails: no per-developer EV scoreboard (TE03/A4 — value belongs to
// the tree, only AC may be read per actor; this module exposes neither), and
// SPI/EV% are never emitted without their coverage pair (R-S4/R-S6).

import type {
  ActivityRow,
  CapacityLookup,
  DerivedState,
  Event,
  IsoDate,
  MilestoneDefinition,
  MilestoneRollupRow,
  NodeId,
} from 'moira-backend';
import {
  computeFeatureRollup,
  computeLandingCurve,
  computeMilestoneRollup,
  derive,
  materializeEffectiveEvents,
  sortEvents,
} from 'moira-backend';
import type { Correction, CorrectionMeterCounts } from 'moira-backend';
import { fmt, pct } from './format.js';
import type { ReferenceDates } from './store.js';

// --- shapes -----------------------------------------------------------------

export interface ReportOptions {
  asOf: IsoDate;
  prev: IsoDate;
  /** Trend window, ascending (typically lastNBusinessDays(asOf, n)). */
  seriesDays: readonly IsoDate[];
  projectRoot: NodeId;
  capacityOf?: CapacityLookup;
  startDate?: IsoDate;
  /** Current latest-wins reference dates (deadline is asked of TODAY's dates). */
  dates: ReferenceDates;
  /**
   * Resolved milestones (issue #35; store.ts resolveMilestones). Omitted/empty
   * → the "## マイルストーン別" section is suppressed entirely (existing
   * optional-section discipline, same as an empty `features`/`series`).
   */
  milestones?: readonly MilestoneDefinition[];
  /**
   * v21 §2.10 correction layer (optional). When omitted, the report behaves
   * byte-identically to the pre-v21 form; `correctionMeter` on the output
   * stays all-zeros (honest "no corrections").
   */
  corrections?: readonly Correction[];
}

/** One as-of point of the pair-read metric set. */
export interface ReportMetrics {
  date: IsoDate;
  evAbs: number;
  evPercent: number;
  estimateCoverage: number;
  pv: number;
  ac: number;
  spi: number | null;
  scheduleCoverage: number;
  cpi: number | null;
  executionCoverage: number;
}

export interface ReportFeatureRow {
  feature: NodeId;
  evAbs: number;
  prevEvAbs: number;
  deltaEvAbs: number;
  evPercent: number;
  budget: number;
  leafCount: number;
  completedLeafCount: number;
}

export interface ReportJson {
  schemaVersion: 1;
  asOf: IsoDate;
  prev: IsoDate;
  now: ReportMetrics;
  prevMetrics: ReportMetrics;
  delta: { evAbs: number; evPercent: number; pv: number; ac: number };
  activity: ActivityRow[];
  queues: { humanReview: NodeId[]; agentWork: NodeId[]; unassigned: NodeId[] };
  features: ReportFeatureRow[];
  /** Per-milestone EVM + landing read (issue #35). Empty when no milestone is
   *  defined — the text renderer suppresses the section entirely in that case. */
  milestones: MilestoneRollupRow[];
  landing: {
    landed: boolean; // no incomplete effective leaves remain
    landingDate: IsoDate | null; // D_pred (MODEL:234) — null = visible gap, not a guess
    forecastCoverage: number; // pair-read for landingDate (R-S6-isomorphic)
    unforecastedCount: number; // incomplete leaves the forecast cannot place — honest gap
    deadline: IsoDate | null;
    targetDate: IsoDate | null;
    daysLate: number | null; // landingDate − deadline (observation only; R-T4 keeps the judgement human)
  };
  series: ReportMetrics[];
  structuralErrors: string[];
  /**
   * ③c retroactive-WRITE detection (v22 §2.10 (d); issue #36 origin) — null
   * in normal operation (honest silence); see findRetroactiveEvents. Kept
   * as its own field (JSON consumers) even though formatReportText renders it
   * together with `correctionMeter` under one alert surface (issue #11 R8).
   * STANDING count (issue #11 #5): once a record is detected, it stays
   * counted forever — it does NOT age out as `prev` advances past it (③ is a
   * 常設区分, MODEL v22 §2.10 (d)).
   */
  retroactive: RetroactiveWarning | null;
  /**
   * Arrival-order anomaly (issue #11 #6) — records flagged ONLY by the
   * physical (ts,id) order-disruption signal, with NO confirmed >24h elapsed
   * time (an undecodable id, or a decoded id whose delay is ≤24h). Physical
   * disorder is evidence an append happened later, but NOT proof it happened
   * more than 24h later — the fixed boundary ③c's label requires (v22 §2.10
   * (d): "経過 24 時間超"). Disclosed honestly as its own line (MODEL's
   * "検知の被覆限界も正直に開示する"), never folded into `retroactive`'s count
   * (no label overclaim). null in normal operation.
   */
  orderAnomaly: RetroactiveWarning | null;
  /**
   * v22 §2.10 (d) correction meter — 4 permanent categories (常設・no
   * discretional knob; PR-CORRECTION-METER). All-zero when the log carries
   * no corrections (honest "no corrections have been applied"). Its
   * ③retroactive count is the CORRECTION system's ③a∨③b (backend fold.ts,
   * accounting-layer) — a DIFFERENT population from `retroactive` above (the
   * WRITE system's ③c, observation-layer). v22 unifies the two under one
   * rendered alert surface without summing them (issue #11 — see
   * formatReportText; the former "will be unified in a follow-up" note is
   * resolved by this task).
   */
  correctionMeter: CorrectionMeterCounts;
}

// --- as-of prefix (TE03) ------------------------------------------------------

/** UTC calendar day of an event ts — verbatim landing.ts discipline. */
function tsDay(ts: number): IsoDate {
  return new Date(ts).toISOString().slice(0, 10);
}

function prefixByDay(sorted: readonly Event[], day: IsoDate): Event[] {
  return sorted.filter((e) => tsDay(e.ts) <= day);
}

/**
 * As-of prefix for the correction layer (issue #11 #3): canon as-of is
 * "(ts,id) ≤ T のイベント＋(ts,id) ≤ T の訂正記録" — a correction is itself a
 * timestamped record and must be cut at the SAME day-granularity boundary as
 * events (tsDay/prefixByDay), never passed whole to every cut. Without this,
 * a correction issued on 7/10 would rewrite a `prev`/series point dated 7/3
 * (non-causal — the reader on 7/3 could not have known about a correction
 * that did not exist yet).
 */
function correctionsByDay(corrections: readonly Correction[], day: IsoDate): Correction[] {
  return corrections.filter((c) => tsDay(c.ts) <= day);
}

// --- retroactive-write detection (③c — v22 §2.10 (d); issue #36 origin) -----
//
// This is the WRITE system's half of the v22 unified ③ category — an
// observation-layer detector over the record medium's issue-time signals
// (MODEL v22 §2.10 (d): 検知の被覆限界も正直に開示する), distinct from the
// CORRECTION system's ③a/③b (backend fold.ts, accounting-layer). The two are
// rendered under ONE alert surface by formatReportText below (issue #11 R8 —
// 訂正跨ぎと遡及書き込みは同じ警告面で鳴り、二重表示を廃す), never summed into a
// single number (母集団の監査可能性を保つ).
//
// events.json's PHYSICAL order is NOT append order: every commit path
// (cli/src/store.ts appendEvents → backend EventStore.saveJson) fully
// re-sorts by (ts,id) on save (backend/src/event-store.ts saveJson calls
// all() == sortEvents()), so by the time `report` re-reads the file, any
// append-order signal has already collapsed into (ts,id) order for events
// that passed through a normal `moira ...` write. Two complementary signals
// remain, and they are evaluated INDEPENDENTLY (both checks always run — a
// genuine realStamper id does not immunize an event against ALSO having been
// physically spliced out of order by a hand edit) but feed TWO DIFFERENT
// buckets (issue #11 #6 — only signal 1 can CONFIRM ③c's fixed 24h boundary;
// signal 2 alone cannot, so it is never counted into ③c):
//
//  1. The event id itself. realStamper (cli/src/stamp.ts) derives id as
//     `${ts.toString(36)}-${seq}-${rand}` from the SAME wall-clock instant it
//     hands out as `ts` — EXCEPT when a caller backdates `ts` afterward while
//     leaving the id untouched (WBS import's `at()` helper, issue #24's
//     ts-anchoring: `{ id: s.id, ts: epoch(actualDate) }`). Decoding the id's
//     prefix recovers the moment the event was actually appended,
//     independent of the (possibly backdated) `ts` field — a mismatch of
//     STRICTLY MORE THAN 24 ELAPSED HOURS (v22 §2.10 (d) ③c fixed boundary,
//     issue #11 — was "any positive delay" pre-v22) between the claimed ts
//     and the decoded append instant CONFIRMS a retroactive-WRITE (③c)
//     record — feeds `retroactive`. This is the mechanism that actually
//     fires for real `moira import wbs` runs, since the resort above erases
//     the physical-position signal before `report` ever sees the file.
//  2. Regardless of whether signal 1 fired, we ALSO scan the RAW on-disk
//     order buildReport is handed (the `events` param, BEFORE sortEvents()
//     below normalizes it): a running-(ts,id)-max scan over that order
//     catches an entry sitting behind an already-newer one — i.e. physically
//     spliced in out of chronological order. This is the only signal
//     available for ids that don't match the realStamper shape (hand-edited
//     events.json rows, a caller's own stamper — including this file's own
//     tests), and it also catches a realStamper-shaped id whose ROW was
//     physically moved without touching its ts/id (signal 1 alone would miss
//     that, since appendTs == ts for such a row) — BUT it carries no elapsed-
//     time information, so on its own it cannot confirm >24h. A record
//     flagged ONLY by this signal feeds `orderAnomaly` instead of
//     `retroactive` (no label overclaim — issue #11 #6); a record signal 1
//     already confirmed stays in `retroactive` even if ALSO physically out
//     of order (no double counting — each event contributes to at most one
//     bucket).
//
// Both buckets are STANDING counts (issue #11 #5 — MODEL v22 §2.10 (d): ③ is
// a 常設区分／standing category; a detected record never ages out just
// because `prev` advances past it) — judged against the SAME (ts,id)
// semantics fold already uses (I3/R-D5), no new event kind or stored field
// (D-66).

const REAL_STAMP_ID_RE = /^([0-9a-z]+)-\d{6}-[0-9a-z]{4}$/;

// v22 §2.10 (d) ③c boundary — "起きたとされる ts より経過 24 時間超後に追記された
// イベント" (strict; exactly 24h does NOT count). Twin constant of backend
// fold.ts's RETROACTIVE_THRESHOLD_MS (③b) — same fixed 24h bound, no knob —
// but ③c is an OBSERVATION-layer detector over the append-time signal
// (decoded realStamper id / physical-order disruption), not a fold/backend
// accounting derivation (out of fold's scope; see MODEL v22 §2.10 (d)).
const RETROACTIVE_WRITE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** Wall-clock append instant encoded in a realStamper-shaped id, or null if
 *  the id doesn't match that shape — no signal, so no verdict (avoids false
 *  positives on ids we can't interpret). */
function decodeAppendTs(id: string): number | null {
  const m = REAL_STAMP_ID_RE.exec(id);
  const ts36 = m?.[1];
  if (ts36 === undefined) return null;
  const decoded = Number.parseInt(ts36, 36);
  return Number.isFinite(decoded) ? decoded : null;
}

/** Deterministic (ts,id) comparator — the SAME total order sortEvents uses. */
function cmpTsId(a: Event, b: Event): number {
  if (a.ts !== b.ts) return a.ts - b.ts;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** The event's subject node — same per-kind rule as the backend's activity
 *  log projection (decompose→parent, relate→to, transition/cost→node). */
function eventNode(e: Event): NodeId | null {
  switch (e.kind) {
    case 'decompose':
      return e.parent;
    case 'relate':
      return e.to;
    case 'transition':
    case 'cost':
      return e.node;
    default:
      return null;
  }
}

interface FlaggedEvent {
  ts: number;
  node: NodeId | null;
}

/**
 * Two INDEPENDENT signals over the RAW (as-loaded) event order (issue
 * #37-review item 2 — both always run, either flags a record):
 *
 *   1. id-decode: appendTs − ts > 24h (strict) — the ONLY signal that can
 *      actually CONFIRM the ③c predicate (v22 §2.10 (d): "経過 24 時間超").
 *      Feeds `retroactive`.
 *   2. physical-order disruption (running (ts,id)-max scan): evidence an
 *      append happened LATER than its neighbour, but carries no elapsed-time
 *      information of its own — it cannot confirm >24h (issue #11 #6: MODEL
 *      names "到着順の乱れ" as one of ③c's detection signals, but the fixed
 *      24h boundary is ③c's own label, and order alone cannot prove it was
 *      crossed). A record flagged ONLY by this signal (id undecodable, or
 *      decoded but ≤24h) is disclosed honestly as a SEPARATE arrival-order
 *      anomaly, never counted into ③c (no label overclaim). A record the
 *      id-decode signal already confirmed stays in `retroactive` even if it
 *      is ALSO physically out of order (no double counting).
 */
function findRetroactiveEvents(rawEvents: readonly Event[]): {
  retroactive: FlaggedEvent[];
  orderAnomalies: FlaggedEvent[];
} {
  const retroactive: FlaggedEvent[] = [];
  const orderAnomalies: FlaggedEvent[] = [];
  let runningMax: Event | undefined;
  for (const e of rawEvents) {
    const appendTs = decodeAppendTs(e.id);
    // v22 §2.10 (d) ③c: strict >24h elapsed between the claimed ts and the
    // decoded append instant (issue #11; was "any positive delay" pre-v22).
    const idRetroactive =
      appendTs !== null && appendTs - e.ts > RETROACTIVE_WRITE_THRESHOLD_MS;
    const physicallyOutOfOrder =
      runningMax !== undefined && cmpTsId(e, runningMax) < 0;
    if (idRetroactive) {
      retroactive.push({ ts: e.ts, node: eventNode(e) });
    } else if (physicallyOutOfOrder) {
      orderAnomalies.push({ ts: e.ts, node: eventNode(e) });
    }
    if (runningMax === undefined || cmpTsId(e, runningMax) > 0) runningMax = e;
  }
  return { retroactive, orderAnomalies };
}

const RETROACTIVE_NODE_DISPLAY_LIMIT = 5;

export interface RetroactiveWarning {
  count: number;
  /** Oldest offending ts (epoch ms) among those records. */
  oldestTs: number;
  /** Up to RETROACTIVE_NODE_DISPLAY_LIMIT distinct subject nodes touched, in
   *  first-seen order. */
  nodes: NodeId[];
  /** Remaining distinct nodes beyond `nodes`, 0 if none. */
  moreNodesCount: number;
}

/** Aggregate a flagged-event list into the display shape, or null when empty
 *  (honest silence — no warning fabricated where there is nothing to warn
 *  about). Shared by both the ③c bucket and the order-anomaly bucket. */
function aggregateWarning(records: readonly FlaggedEvent[]): RetroactiveWarning | null {
  if (records.length === 0) return null;
  const nodesSeen = new Set<NodeId>();
  const nodes: NodeId[] = [];
  for (const r of records) {
    if (r.node === null || nodesSeen.has(r.node)) continue;
    nodesSeen.add(r.node);
    if (nodes.length < RETROACTIVE_NODE_DISPLAY_LIMIT) nodes.push(r.node);
  }
  return {
    count: records.length,
    oldestTs: Math.min(...records.map((r) => r.ts)),
    nodes,
    moreNodesCount: Math.max(0, nodesSeen.size - nodes.length),
  };
}

// --- build --------------------------------------------------------------------

export function buildReport(events: readonly Event[], opts: ReportOptions): ReportJson {
  const sorted = sortEvents(events);
  // v21 §2.10: pass corrections through to derive() at each point-in-time cut.
  // The correction meter surfaces on `now.correctionMeter`; consumers get an
  // all-zero meter when opts.corrections is omitted or empty (backward compat).
  const corrections = opts.corrections ?? [];
  const deriveAt = (day: IsoDate): DerivedState =>
    derive(prefixByDay(sorted, day), {
      asOf: day,
      ...(opts.capacityOf !== undefined ? { capacityOf: opts.capacityOf } : {}),
      ...(opts.startDate !== undefined ? { startDate: opts.startDate } : {}),
      // issue #11 #3: corrections are cut at the SAME (ts,id)/day boundary as
      // events (correctionsByDay), not passed whole — a correction issued
      // AFTER `day` must not rewrite that day's reading (non-causal read
      // otherwise). latest-wins per targetEventId still collapses within the
      // cut cohort, and corrections targeting events not-yet-in-the-prefix
      // simply have no effect at that cut (their target isn't in the
      // effective stream).
      corrections: correctionsByDay(corrections, day),
    });

  const now = deriveAt(opts.asOf);
  const prev = deriveAt(opts.prev);

  // ③c retroactive-WRITE detection (issue #11 #5/#6) — scanned once over the
  // RAW as-loaded `events` (not `sorted`/prefix-cut: this is an
  // observation-layer detector over the record medium's issue-time signals,
  // independent of as-of/re-derivation — see the file-header comment).
  const retroactiveScan = findRetroactiveEvents(events);

  const metricsOf = (d: DerivedState): ReportMetrics => ({
    date: d.asOf,
    evAbs: d.evAbs,
    evPercent: d.evPercent,
    estimateCoverage: d.estimateCoverage,
    pv: d.pv,
    ac: d.ac,
    spi: d.spi,
    scheduleCoverage: d.scheduleCoverage,
    cpi: d.cpi,
    executionCoverage: d.executionCoverage,
  });
  const nowM = metricsOf(now);
  const prevM = metricsOf(prev);

  // Window: events strictly after prev's day, up to and including asOf's day.
  const activity = now.activityLog.filter(
    (r) => tsDay(r.ts) > opts.prev && tsDay(r.ts) <= opts.asOf,
  );

  // Feature rollup: engine EV over each root-child slice, at both cuts.
  //
  // issue #11 gate-2 R2 #1 (resolves the former #4 known-limitation note):
  // `computeFeatureRollup`/`computeMilestoneRollup`/`computeLandingCurve` all
  // fold their raw `Event[]` argument internally with NO corrections
  // parameter of their own (their signatures stay frozen — see their
  // file-header "same INDEPENDENT-derivation discipline" notes in
  // moira-backend/src/derivations/*.ts). MODEL §2.10's one-line principle —
  // "訂正適用後のログは…全導出でそのまま読み直される一つのログ" — means these
  // three report sections must see the SAME corrected reading `deriveAt`
  // above already gives the headline pair. Rather than threading a
  // `corrections` option onto three call sites, the CLI now pre-materializes
  // the corrected event stream ONCE per cut via the barrel's
  // `materializeEffectiveEvents` (backend/src/fold.ts — a thin, meter-less
  // exposure of the SAME `applyCorrections` effective-stream construction
  // `derive`/`fold` use internally, so there is no second implementation of
  // §2.10's patch/nullify/latest-wins merge to drift) and hands that
  // corrected `Event[]` to each `compute*` function AS-IS — their signatures
  // are unchanged. Cut at the SAME (ts,id)/day boundary as `deriveAt`
  // (prefixByDay + correctionsByDay — issue #11 #3's cut convention).
  //
  // This also fixes a SECOND desync the #4 note didn't name: the milestone
  // rollup below is handed `now.forecast` (already corrected, from `now =
  // deriveAt(opts.asOf)`) alongside its `events` argument — pre-fix, that
  // `events` argument was the RAW log while `now.forecast` was corrected, so
  // a nullify/patch could desync a milestone's attributed leaves from their
  // (differently-corrected) predictions — the internal-contradiction failure
  // mode this task's description warns about. Both arguments now come from
  // the SAME corrected cut.
  const effectiveAt = (day: IsoDate): Event[] =>
    materializeEffectiveEvents(prefixByDay(sorted, day), correctionsByDay(corrections, day));
  // Computed once — `applyCorrections` re-runs a per-record fold internally,
  // so the three `asOf`-cut call sites below (features/milestones/landing)
  // share this single result rather than each re-deriving it (deterministic
  // either way; this just avoids pure redundant work).
  const effAsOf = effectiveAt(opts.asOf);

  const nowRows = computeFeatureRollup(effAsOf, opts.projectRoot);
  const prevRows = computeFeatureRollup(effectiveAt(opts.prev), opts.projectRoot);
  const prevEvOf = new Map(prevRows.map((r) => [r.feature, r.evAbs]));
  const features: ReportFeatureRow[] = nowRows.map((r) => {
    const prevEvAbs = prevEvOf.get(r.feature) ?? 0;
    return {
      feature: r.feature,
      evAbs: r.evAbs,
      prevEvAbs,
      deltaEvAbs: r.evAbs - prevEvAbs,
      evPercent: r.evPercent,
      budget: r.budget,
      leafCount: r.leafCount,
      completedLeafCount: r.completedLeafCount,
    };
  });

  // Milestone rollup (issue #35): subset EVM + landing read over each
  // milestone's node-id bundle, at `asOf`. Reuses `now.forecast` — the SAME
  // single derive() leveler run above — rather than re-leveling a subset (see
  // milestone-rollup.ts's file-header rationale). No section when no
  // milestone is defined (existing optional-section discipline). Corrections
  // applied via effectiveAt — issue #11 gate-2 R2 #1 (see comment above).
  const milestones: MilestoneRollupRow[] =
    opts.milestones !== undefined && opts.milestones.length > 0
      ? computeMilestoneRollup(effAsOf, opts.milestones, now.forecast, {
          asOf: opts.asOf,
        })
      : [];

  // Landing vs reference dates — the canonical D_pred from computeLandingCurve
  // (NOT a hand-rolled max over forecast rows: the leveler also levels completed
  // leaves, so their phantom predictions would dishonestly push the max out).
  // Observation only; the judgement stays human (R-T4). Corrections applied
  // via effectiveAt — issue #11 gate-2 R2 #1 (see comment above).
  const curve = computeLandingCurve(effAsOf, {
    asOf: opts.asOf,
    ...(opts.capacityOf !== undefined ? { capacityOf: opts.capacityOf } : {}),
    ...(opts.startDate !== undefined ? { startDate: opts.startDate } : {}),
  });
  const deadline = opts.dates.deadline ?? null;
  const daysLate =
    curve.landingDate !== null && deadline !== null
      ? diffDays(curve.landingDate, deadline)
      : null;

  const series = opts.seriesDays.map((d) => metricsOf(deriveAt(d)));

  return {
    schemaVersion: 1,
    asOf: opts.asOf,
    prev: opts.prev,
    now: nowM,
    prevMetrics: prevM,
    delta: {
      evAbs: nowM.evAbs - prevM.evAbs,
      evPercent: nowM.evPercent - prevM.evPercent,
      pv: nowM.pv - prevM.pv,
      ac: nowM.ac - prevM.ac,
    },
    activity,
    queues: {
      humanReview: now.humanReviewQueue,
      agentWork: now.agentWorkQueue,
      unassigned: now.unassignedBacklog,
    },
    features,
    milestones,
    landing: {
      landed: curve.landed,
      landingDate: curve.landingDate,
      forecastCoverage: curve.forecastCoverage,
      unforecastedCount: curve.unforecastedLeaves.length,
      deadline,
      targetDate: opts.dates.targetDate ?? null,
      daysLate,
    },
    series,
    structuralErrors: now.structuralErrors,
    retroactive: aggregateWarning(retroactiveScan.retroactive),
    orderAnomaly: aggregateWarning(retroactiveScan.orderAnomalies),
    correctionMeter: now.correctionMeter,
  };
}

/** a − b in whole days (UTC calendar arithmetic). */
function diffDays(a: IsoDate, b: IsoDate): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}

/**
 * Deterministic filename for `moira report --save-dir` — sortable by date,
 * unique per (project, asOf). projectRoot is slugged so a path-hostile id can
 * never escape the target directory.
 */
export function reportFilename(projectRoot: NodeId, asOf: IsoDate, json = false): string {
  const slug = projectRoot.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'project';
  return `moira-report-${slug}-${asOf}.${json ? 'json' : 'md'}`;
}

// --- text (Markdown for the morning meeting) -----------------------------------

const sign = (n: number): string => (n >= 0 ? `+${trim(n)}` : trim(n));
const trim = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return String(r);
};
const pctSigned = (n: number): string => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}pt`;

export function formatReportText(
  r: ReportJson,
  labelOf: (id: string) => string,
  projectLabel?: string,
): string {
  const head = projectLabel === undefined ? '' : `   (${projectLabel})`;
  const name = (id: string): string => {
    const l = labelOf(id);
    return l === id ? id : `${l} (${id})`;
  };
  const lines: string[] = [
    `Moira — 朝会ダイジェスト @ ${r.asOf}   (前回 ${r.prev})${head}`,
    '',
    '## 現況（ペア読み）',
    `  EV%  ${pct(r.now.evPercent)} | estimate coverage ${pct(r.now.estimateCoverage)}   (pair-read R-S4)`,
    `  SPI  ${fmt(r.now.spi)} | schedule coverage ${pct(r.now.scheduleCoverage)}   (pair-read R-S6)`,
    `  EV_abs ${trim(r.now.evAbs)} | PV ${trim(r.now.pv)} | AC ${trim(r.now.ac)} | CPI ${fmt(r.now.cpi)} | exec coverage ${pct(r.now.executionCoverage)}`,
    '',
    `## 前回比 Δ（${r.prev} → ${r.asOf}）`,
    `  ΔEV_abs ${sign(r.delta.evAbs)} | ΔEV% ${pctSigned(r.delta.evPercent)} | ΔPV ${sign(r.delta.pv)} | ΔAC ${sign(r.delta.ac)}`,
    `  SPI ${fmt(r.prevMetrics.spi)} → ${fmt(r.now.spi)} | CPI ${fmt(r.prevMetrics.cpi)} → ${fmt(r.now.cpi)}`,
  ];

  // v22 §2.10 (d) unified ③ alert surface (issue #11 R8) — the CORRECTION
  // system (③a∨③b, backend fold's correctionMeter.retroactive) and the WRITE
  // system (③c, r.retroactive — this file's id-decode/physical-order
  // detection) ring under ONE ⚠ block, never a summed number (母集団の
  // 監査可能性を保つ；系ごとの計数を共表示). Either system alone is enough to
  // show the block; both absent → honest silence (no block at all). This
  // replaces the pre-v22 two separate ⚠ blocks (⚠ 遡及記録 / ⚠ 訂正記録) that
  // rang on the same page for two different reasons — 二重表示を廃す.
  const cm = r.correctionMeter;
  if (cm.total > 0 || r.retroactive !== null || r.orderAnomaly !== null) {
    lines.push(
      `  ⚠ 訂正・遡及（§2.10 ③——訂正跨ぎと遡及書き込みは同じ警告面で鳴ります。Δ は書き換わった過去との比較）`,
    );
    // 訂正系（③a∨③b・会計層・fold 計数） — corrections applied against the log.
    if (cm.total > 0) {
      lines.push(
        `    訂正記録 総数 ${cm.total} 件（施錠対象 ${cm.locked} / 遡及 ${cm.retroactive} / 適用不能 ${cm.inapplicable}）`,
      );
    }
    // 追記系（③c・観測層検知） — events whose append CONFIRMED lagged their
    // claimed ts by strictly more than 24h (id-decode signal only — §2.10
    // (d); issue #11 #5/#6: standing count, never ages out).
    if (r.retroactive !== null) {
      const shown = r.retroactive.nodes.map(name).join(', ');
      const more = r.retroactive.moreNodesCount > 0 ? ` (+他${r.retroactive.moreNodesCount}件)` : '';
      lines.push(
        `    遡及書き込み ${r.retroactive.count} 件（起きたとされる日付から24時間超後に追記）`,
        `      対象: ${shown === '' ? '(不明)' : shown}${more} | 最古の遡及日付: ${tsDay(r.retroactive.oldestTs)}`,
      );
    }
    // 到着順の乱れ（観測異常・別行） — physical (ts,id) order disruption with NO
    // confirmed >24h elapsed time (issue #11 #6): evidence of a later append,
    // but not proof it crossed ③c's fixed boundary — disclosed honestly,
    // never folded into the 遡及書き込み count above (no label overclaim).
    if (r.orderAnomaly !== null) {
      const shown = r.orderAnomaly.nodes.map(name).join(', ');
      const more = r.orderAnomaly.moreNodesCount > 0 ? ` (+他${r.orderAnomaly.moreNodesCount}件)` : '';
      lines.push(
        `    到着順の乱れ ${r.orderAnomaly.count} 件（物理順序が逆転 — 24時間超は未確証・観測異常）`,
        `      対象: ${shown === '' ? '(不明)' : shown}${more} | 最古の日付: ${tsDay(r.orderAnomaly.oldestTs)}`,
      );
    }
  }

  lines.push('', `## 期間の出来事（${r.activity.length}件）`);
  if (r.activity.length === 0) {
    lines.push('  （この期間のイベントはありません）');
  } else {
    for (const a of r.activity) {
      const subject = a.node === null ? '' : ` ${name(a.node)}`;
      lines.push(`  - ${tsDay(a.ts)} ${a.actor.kind}:${a.actor.id} ${a.label}${subject}`);
    }
  }

  lines.push('', '## 今日のアクション（キュー）');
  lines.push(`  レビュー待ち（人間ゲート）: ${fmtIds(r.queues.humanReview, name)}`);
  lines.push(`  エージェント作業可: ${fmtIds(r.queues.agentWork, name)}`);
  lines.push(`  未割当（合意済み）: ${fmtIds(r.queues.unassigned, name)}`);

  if (r.features.length > 0) {
    lines.push('', '## feature 別（root 直下・価値は木に帰属）');
    lines.push('  | feature | ΔEV_abs | EV_abs | EV% | 完了葉/葉 |');
    lines.push('  |---|---|---|---|---|');
    for (const f of r.features) {
      lines.push(
        `  | ${name(f.feature)} | ${sign(f.deltaEvAbs)} | ${trim(f.evAbs)} | ${pct(f.evPercent)} | ${f.completedLeafCount}/${f.leafCount} |`,
      );
    }
  }

  if (r.milestones.length > 0) {
    lines.push('', '## マイルストーン別（名前 + 構成ノード束 — 期日/バッファは持たない）');
    lines.push('  | milestone | EV% | EV_abs | SPI | CPI | BAC | 予定終了(基準) | 予測終了 | ボトルネック葉 |');
    lines.push('  |---|---|---|---|---|---|---|---|---|');
    for (const m of r.milestones) {
      const bottleneck =
        m.bottleneckLeaf === null
          ? '-'
          : `${name(m.bottleneckLeaf)}${m.bottleneckOnCriticalPath ? ' ★critical path' : ''}`;
      lines.push(
        `  | ${m.milestone} | ${pct(m.evPercent)} | ${trim(m.evAbs)} | ${fmt(m.spi)} | ${fmt(m.cpi)} | ${trim(m.bac)} | ${m.plannedEnd ?? '(未定)'} | ${m.forecastEnd ?? '(予測不能)'} | ${bottleneck} |`,
      );
    }
  }

  lines.push('', '## 着地予測 vs 期日（判断は人間 — R-T4）');
  if (r.landing.landed) {
    lines.push('  着地済み（未完了の有効葉なし）');
  } else {
    const d = r.landing.landingDate ?? '(予測不能 — 見えるギャップ)';
    lines.push(
      `  着地予測（P7 生きた予測・D_pred）: ${d} | forecast coverage ${pct(r.landing.forecastCoverage)}`,
    );
  }
  if (r.landing.unforecastedCount > 0) {
    lines.push(`  ⚠ 予測に乗らない未完了葉 ${r.landing.unforecastedCount} 件（未合意/未割当 — 見えるギャップ）`);
  }
  lines.push(`  期日: ${r.landing.deadline ?? '(未設定)'} | 目標日: ${r.landing.targetDate ?? '(未設定)'}`);
  if (r.landing.daysLate !== null) {
    lines.push(
      r.landing.daysLate > 0
        ? `  期日超過見込み: +${r.landing.daysLate} 日`
        : `  期日まで余裕: ${-r.landing.daysLate} 日`,
    );
  }

  if (r.series.length > 0) {
    lines.push('', `## 推移（直近 ${r.series.length} 営業日・ペア読み）`);
    lines.push('  | 日付 | EV_abs | EV% | 見積cov | SPI | sched cov | CPI |');
    lines.push('  |---|---|---|---|---|---|---|');
    for (const m of r.series) {
      lines.push(
        `  | ${m.date} | ${trim(m.evAbs)} | ${pct(m.evPercent)} | ${pct(m.estimateCoverage)} | ${fmt(m.spi)} | ${pct(m.scheduleCoverage)} | ${fmt(m.cpi)} |`,
      );
    }
  }

  if (r.structuralErrors.length > 0) {
    lines.push('', `## 構造エラー（${r.structuralErrors.length}件）`);
    for (const e of r.structuralErrors) lines.push(`  ! ${e}`);
  }

  return lines.join('\n');
}

function fmtIds(ids: readonly string[], name: (id: string) => string): string {
  return ids.length === 0 ? '[]' : `[${ids.map(name).join(', ')}]`;
}
