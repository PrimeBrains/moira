// buildReport / formatReportText — the morning digest (issue #25). Events carry
// REAL epoch-ms timestamps (the seqStamper/Log ts=1,2,3… all land on 1970-01-01,
// useless for as-of prefix cuts), so each event is pinned to a UTC day — the
// same deviation landing.test.ts documents.

import { describe, expect, it } from 'vitest';
import type { Actor, Correction, Event, IsoDate } from 'moira-backend';
import { buildReport, formatReportText, reportFilename } from './report.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Insert `e` at its chronologically-correct (by ts) position — keeps the raw
 *  array physically sorted so the physical-order retroactive signal (report.ts
 *  findRetroactiveEvents signal 2) never fires as a side effect of the splice,
 *  isolating the id-decode signal (signal 1) under test. */
function insertChronologically(events: readonly Event[], e: Event): Event[] {
  const arr = [...events];
  const idx = arr.findIndex((x) => x.ts > e.ts);
  if (idx === -1) arr.push(e);
  else arr.splice(idx, 0, e);
  return arr;
}

const h1: Actor = { kind: 'human', id: 'h1' };
const ai: Actor = { kind: 'agent', id: 'ai' };

function builder() {
  let seq = 0;
  const stamp = (iso: IsoDate): { id: string; ts: number } => {
    seq += 1;
    return { id: `e${String(seq).padStart(3, '0')}`, ts: Date.parse(`${iso}T12:00:00.000Z`) };
  };
  const events: Event[] = [];
  return {
    events,
    decompose(iso: IsoDate, parent: string, children: Array<{ node: string; estimate?: number }>) {
      events.push({ kind: 'decompose', ...stamp(iso), actor: ai, parent, reason: 'r', children });
    },
    agree(iso: IsoDate, node: string, frozenBudget: number) {
      events.push({
        kind: 'transition', ...stamp(iso), actor: h1, node,
        machine: 'estimate-agreement', to: 'agreed', frozenBudget,
      });
    },
    schedule(iso: IsoDate, node: string, frozenSlot: IsoDate) {
      events.push({
        kind: 'transition', ...stamp(iso), actor: h1, node,
        machine: 'lifecycle', to: 'ready', assignee: h1, frozenSlot,
      });
    },
    life(iso: IsoDate, node: string, to: 'implementing' | 'implemented' | 'accepted') {
      events.push({
        kind: 'transition', ...stamp(iso), actor: h1, node, machine: 'lifecycle', to,
      });
    },
    cost(iso: IsoDate, node: string, amount: number) {
      events.push({ kind: 'cost', ...stamp(iso), actor: h1, node, amount });
    },
  };
}

/**
 * A one-week mini project (all dates are July 2026 weekdays):
 *   07-01(Wed) root→{f1→a(2),b(3); f2→c(5)}, all agreed, a/b/c scheduled
 *   07-02(Thu) a implemented, cost(a)=2
 *   07-03(Fri) a accepted
 *   07-06(Mon) c implemented, cost(c)=4
 * asOf=07-06, prev=07-03 (the preceding business day).
 */
function weekLog(): Event[] {
  const b = builder();
  b.decompose('2026-07-01', 'root', [{ node: 'f1' }, { node: 'f2' }]);
  b.decompose('2026-07-01', 'f1', [
    { node: 'a', estimate: 2 },
    { node: 'b', estimate: 3 },
  ]);
  b.decompose('2026-07-01', 'f2', [{ node: 'c', estimate: 5 }]);
  b.agree('2026-07-01', 'a', 2);
  b.agree('2026-07-01', 'b', 3);
  b.agree('2026-07-01', 'c', 5);
  b.schedule('2026-07-01', 'a', '2026-07-02');
  b.schedule('2026-07-01', 'b', '2026-07-08');
  b.schedule('2026-07-01', 'c', '2026-07-06');
  b.life('2026-07-02', 'a', 'implemented');
  b.cost('2026-07-02', 'a', 2);
  b.life('2026-07-03', 'a', 'accepted');
  b.life('2026-07-06', 'c', 'implemented');
  b.cost('2026-07-06', 'c', 4);
  return b.events;
}

const OPTS = {
  asOf: '2026-07-06' as IsoDate,
  prev: '2026-07-03' as IsoDate,
  seriesDays: ['2026-07-02', '2026-07-03', '2026-07-06'] as IsoDate[],
  projectRoot: 'root',
  startDate: '2026-07-01' as IsoDate,
  dates: { deadline: '2026-07-10', targetDate: '2026-07-08' },
};

/** Same weekLog, but each root-child feature is ALSO defined as a milestone
 *  (issue #35) — 'a' is completed (07-03) so M1 exercises the phantom-
 *  prediction exclusion (its forecastEnd must come from 'b', not 'a'). */
const OPTS_WITH_MILESTONES = {
  ...OPTS,
  milestones: [
    { name: 'M1', nodes: ['f1'] },
    { name: 'M2', nodes: ['f2'] },
  ],
};

describe('buildReport', () => {
  const r = buildReport(weekLog(), OPTS);

  it('now/prev are as-of prefix derivations of the SAME log (TE03, no snapshot)', () => {
    // now: a(2) accepted + c(5) implemented = 7; prev cut (≤07-03): only a = 2
    expect(r.now.evAbs).toBe(7);
    expect(r.prevMetrics.evAbs).toBe(2);
    expect(r.delta.evAbs).toBe(5);
    expect(r.now.ac).toBe(6);
    expect(r.prevMetrics.ac).toBe(2);
    expect(r.delta.ac).toBe(4);
    expect(r.now.evPercent).toBeCloseTo(7 / 10, 6);
    expect(r.prevMetrics.evPercent).toBeCloseTo(2 / 10, 6);
  });

  it('activity window is (prev, asOf] — exactly the Monday events', () => {
    expect(r.activity).toHaveLength(2); // c implemented + cost(c)
    expect(r.activity.map((a) => a.node)).toEqual(['c', 'c']);
    expect(r.activity[0]!.label).toBe('作成完了（レビュー待ち）');
  });

  it('features carry the engine EV per root-child slice with deltas', () => {
    expect(r.features).toEqual([
      {
        feature: 'f1', evAbs: 2, prevEvAbs: 2, deltaEvAbs: 0,
        evPercent: 2 / 5, budget: 5, leafCount: 2, completedLeafCount: 1,
      },
      {
        feature: 'f2', evAbs: 5, prevEvAbs: 0, deltaEvAbs: 5,
        evPercent: 1, budget: 5, leafCount: 1, completedLeafCount: 1,
      },
    ]);
  });

  it('queues read the asOf state (c waits for human review, b for work)', () => {
    expect(r.queues.humanReview).toEqual(['c']);
  });

  it('landing is the canonical D_pred (computeLandingCurve) vs the reference dates', () => {
    // b (3 MD) is the only incomplete leaf; the leveler fills h1 with c(07-01..05)
    // first, then b lands 07-06..08 → D_pred 2026-07-08.
    expect(r.landing.landed).toBe(false);
    expect(r.landing.landingDate).toBe('2026-07-08');
    expect(r.landing.forecastCoverage).toBe(1);
    expect(r.landing.unforecastedCount).toBe(0);
    expect(r.landing.deadline).toBe('2026-07-10');
    expect(r.landing.daysLate).toBe(-2); // two days of slack — observation, not judgement
  });

  it('series walks the as-of points in ascending order', () => {
    expect(r.series.map((m) => m.date)).toEqual(['2026-07-02', '2026-07-03', '2026-07-06']);
    expect(r.series.map((m) => m.evAbs)).toEqual([2, 2, 7]);
  });

  it('empty log → honest zeros, never fabricated', () => {
    const empty = buildReport([], { ...OPTS, dates: {} });
    expect(empty.now.evAbs).toBe(0);
    expect(empty.features).toEqual([]);
    expect(empty.activity).toEqual([]);
    expect(empty.landing.landed).toBe(true);
    expect(empty.landing.landingDate).toBeNull();
    expect(empty.landing.deadline).toBeNull();
    expect(empty.landing.daysLate).toBeNull();
    expect(empty.structuralErrors).toEqual([]);
    expect(empty.retroactive).toBeNull();
    expect(empty.orderAnomaly).toBeNull();
  });

  it('milestones default to [] when opts.milestones is omitted (existing calls stay unaffected)', () => {
    expect(r.milestones).toEqual([]);
  });

  it('a clean append-only log with no reversal → retroactive is null (honest silence)', () => {
    expect(r.retroactive).toBeNull();
    expect(r.orderAnomaly).toBeNull();
  });
});

describe('buildReport correction as-of cut (issue #11 #3 — corrections are cut at (ts,id) ≤ T just like events)', () => {
  it('a correction issued AFTER asOf has no effect at all (asOf precedes the correction ts)', () => {
    const events = weekLog();
    const costA = events.find((e) => e.kind === 'cost' && e.node === 'a')!;
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: Date.parse('2026-07-10T12:00:00.000Z'), // issued AFTER OPTS.asOf (07-06)
        actor: h1,
        targetEventId: costA.id,
        reason: '実績の入力ミス — 2MDではなく0.5MDが正しい',
        correctionKind: 'patch',
        patch: { amount: 0.5 },
      },
    ];
    const corrected = buildReport(events, { ...OPTS, corrections });
    const baseline = buildReport(events, OPTS);
    expect(corrected.now.ac).toBe(baseline.now.ac); // asOf (07-06) < correction ts's day (07-10)
    expect(corrected.prevMetrics.ac).toBe(baseline.prevMetrics.ac);
    expect(corrected.series.map((m) => m.ac)).toEqual(baseline.series.map((m) => m.ac));
    expect(corrected.correctionMeter.total).toBe(0); // not yet in effect at the asOf cut either
  });

  it('a correction issued 7/10 does not rewrite the 7/3 prev/series points, but DOES apply once the cut reaches/passes 7/10', () => {
    const events = weekLog();
    const costA = events.find((e) => e.kind === 'cost' && e.node === 'a')!; // cost(a)=2 on 07-02
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: Date.parse('2026-07-10T12:00:00.000Z'),
        actor: h1,
        targetEventId: costA.id,
        reason: '実績の入力ミス — 2MDではなく0.5MDが正しい',
        correctionKind: 'patch',
        patch: { amount: 0.5 },
      },
    ];
    const r = buildReport(events, {
      ...OPTS,
      asOf: '2026-07-11' as IsoDate, // on/after the correction's day (07-10)
      prev: '2026-07-03' as IsoDate, // strictly before the correction's day
      seriesDays: ['2026-07-03', '2026-07-11'] as IsoDate[],
      corrections,
    });
    // now (asOf=07-11 ≥ 07-10): corrected — 0.5 (a) + 4 (c) = 4.5
    expect(r.now.ac).toBe(4.5);
    expect(r.correctionMeter.total).toBe(1);
    // prev (07-03 < 07-10): the correction did not exist yet at that cut —
    // uncorrected cost(a)=2 still applies (non-causal read would be a bug).
    expect(r.prevMetrics.ac).toBe(2);
    // series: the 07-03 point stays uncorrected; the 07-11 point is corrected.
    expect(r.series.map((m) => m.date)).toEqual(['2026-07-03', '2026-07-11']);
    expect(r.series[0]!.ac).toBe(2);
    expect(r.series[1]!.ac).toBe(4.5);
  });
});

describe('buildReport corrections reach feature/milestone/landing (issue #11 gate-2 R2 #1 — the former #4 known-limitation)', () => {
  it('a frozenBudget correction on a completed leaf\'s agree event is reflected in the feature breakdown\'s evAbs', () => {
    const events = weekLog();
    // c (f2's only leaf) is implemented at asOf=07-06 — completed & agreed,
    // so its frozenBudget feeds evAbs (ev.ts computeEvAbs). The original
    // record recorded 5MD; correcting it to 9MD must move f2's evAbs, since
    // MODEL §2.10's one-line principle says the feature breakdown reads the
    // SAME corrected log the headline pair-read already does.
    const agreeC = events.find((e) => e.kind === 'transition' && e.node === 'c' && e.to === 'agreed')!;
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: Date.parse('2026-07-05T12:00:00.000Z'),
        actor: h1,
        targetEventId: agreeC.id,
        reason: '合意額の記録誤り — 5MDではなく9MDが正しい',
        correctionKind: 'patch',
        patch: { frozenBudget: 9 },
      },
    ];
    const baseline = buildReport(events, OPTS);
    const corrected = buildReport(events, { ...OPTS, corrections });
    const baseF2 = baseline.features.find((f) => f.feature === 'f2')!;
    const corrF2 = corrected.features.find((f) => f.feature === 'f2')!;
    expect(baseF2.evAbs).toBe(5); // uncorrected baseline, sanity check
    expect(corrF2.evAbs).toBe(9); // corrected — was silently 5 before this fix
    expect(corrected.correctionMeter.total).toBe(1);
  });

  it('a cost amount correction is reflected in the milestone rollup\'s AC/CPI (AC is not exposed on the feature breakdown at all)', () => {
    const events = weekLog();
    const costC = events.find((e) => e.kind === 'cost' && e.node === 'c')!; // cost(c)=4 on 07-06
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: Date.parse('2026-07-06T14:00:00.000Z'),
        actor: h1,
        targetEventId: costC.id,
        reason: '実績の入力ミス — 4MDではなく10MDが正しい',
        correctionKind: 'patch',
        patch: { amount: 10 },
      },
    ];
    const baseline = buildReport(events, OPTS_WITH_MILESTONES);
    const corrected = buildReport(events, { ...OPTS_WITH_MILESTONES, corrections });
    const baseM2 = baseline.milestones.find((m) => m.milestone === 'M2')!;
    const corrM2 = corrected.milestones.find((m) => m.milestone === 'M2')!;
    expect(baseM2.ac).toBe(4); // uncorrected baseline, sanity check
    expect(baseM2.cpi).toBeCloseTo(5 / 4, 6);
    expect(corrM2.ac).toBe(10); // corrected — was silently 4 before this fix
    expect(corrM2.cpi).toBeCloseTo(5 / 10, 6);
  });

  it('an estimate correction on the only incomplete leaf pushes the landing forecast later', () => {
    const events = weekLog();
    // b (3MD, incomplete) is the sole driver of D_pred in weekLog (see the
    // top-level 'landing is the canonical D_pred' test). Correcting its
    // estimate to 20MD lengthens the leveler's nominal duration for b
    // (leveler.ts nominalDurationDays reads latestEstimate), which must push
    // the forecast later — proving computeLandingCurve now also sees the
    // corrected log, not the raw one. (A smaller bump, e.g. 8MD, is NOT
    // reliably later: the leveler's critical-path priority reorders the fill
    // by longest-downstream-duration, so a bigger b can jump the queue ahead
    // of a/c and land on the same calendar date by coincidence — 20MD is
    // large enough to dominate regardless of fill order.)
    const decomposeF1 = events.find((e) => e.kind === 'decompose' && e.parent === 'f1')!;
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: Date.parse('2026-07-04T12:00:00.000Z'),
        actor: h1,
        targetEventId: decomposeF1.id,
        reason: '見積の記録誤り — bは3MDではなく20MDが正しい',
        correctionKind: 'patch',
        patch: { children: [{ node: 'a', estimate: 2 }, { node: 'b', estimate: 20 }] },
      },
    ];
    const baseline = buildReport(events, OPTS);
    const corrected = buildReport(events, { ...OPTS, corrections });
    expect(baseline.landing.landingDate).toBe('2026-07-08'); // sanity check (top-level test)
    expect(corrected.landing.landingDate).not.toBeNull();
    // ISO 'YYYY-MM-DD' strings sort lexically with date order.
    expect(corrected.landing.landingDate! > baseline.landing.landingDate!).toBe(true);
    expect(corrected.correctionMeter.total).toBe(1);
  });
});

describe('buildReport retroactive-append detection (③c — v22 §2.10 (d); issue #36 origin, boundary unified in issue #11)', () => {
  // events.json's on-disk order is always fully re-sorted by (ts,id) on save
  // (backend EventStore.saveJson), so the ONLY way a real `moira` write path
  // can still show up as "physically out of order" by the time report reads
  // it is via a hand-edited events.json — hence this test constructs the RAW
  // array directly, out of (ts,id) order, exactly as such a hand edit would.
  it('a physical-order-only anomaly (no realStamper-shaped id, so no confirmed >24h) → orderAnomaly warning, NOT ③c (issue #11 #6)', () => {
    const events = weekLog();
    events.push({
      kind: 'cost',
      id: 'e999', // physically last, but...
      ts: Date.parse('2026-07-01T12:00:00.000Z'), // ...ts predates every event already in the array
      actor: h1,
      node: 'a',
      amount: 1,
    });
    const r = buildReport(events, OPTS); // OPTS.prev = '2026-07-03'
    // No realStamper-shaped id here — the id-decode signal never fires, so
    // this can only ever be a physical-order anomaly, never a confirmed ③c
    // (issue #11 #6: physical disorder alone cannot prove >24h elapsed).
    expect(r.retroactive).toBeNull();
    expect(r.orderAnomaly).not.toBeNull();
    expect(r.orderAnomaly!.count).toBe(1);
    expect(r.orderAnomaly!.nodes).toEqual(['a']);
    expect(r.orderAnomaly!.oldestTs).toBe(Date.parse('2026-07-01T12:00:00.000Z'));
    expect(r.orderAnomaly!.moreNodesCount).toBe(0);
  });

  it('an out-of-order append (no realStamper-shaped id) never confirms ③c — but the arrival-order anomaly is still flagged as a STANDING signal (issue #11 #5/#6)', () => {
    const events = weekLog();
    events.push({
      kind: 'cost',
      id: 'e000', // sorts before everything already appended — still a physical reversal...
      ts: Date.parse('2026-07-06T08:00:00.000Z'), // ...ts (07-06) happens to be after prev (07-03)
      actor: h1,
      node: 'c',
      amount: 1,
    });
    const r = buildReport(events, OPTS);
    expect(r.retroactive).toBeNull(); // no id-decode signal — ③c is never confirmed
    // ③ is a 常設区分 (MODEL v22 §2.10 (d)) — the detected order anomaly is
    // disclosed regardless of whether its ts happens to fall before/after
    // `prev` (issue #11 #5's standing-count principle applies uniformly).
    expect(r.orderAnomaly).not.toBeNull();
    expect(r.orderAnomaly!.count).toBe(1);
    expect(r.orderAnomaly!.nodes).toEqual(['c']);
  });

  it('an id-decoded retroactive record remains counted even once its append itself is long past — ③c is a STANDING count (issue #11 #5; supersedes the old aging-out behavior of issue #37-review item 1)', () => {
    // realStamper-shaped id: appended 06-30, but its ts is backdated onto
    // 06-28 — a delta of 48h, comfortably past the v22 strict->24h boundary
    // (issue #11), so this is a genuine retroactive record by the id-decode
    // signal REGARDLESS of the threshold change (keeping this test meaningful
    // post-v22 — a delta of exactly ~24h here would make idRetroactive false
    // and vacuously pass this test for the wrong reason). The APPEND itself
    // (06-30) is on or before `prev` (07-03) — under the pre-#5 design this
    // record would have "aged out" of the warning once `prev` caught up to
    // it (a permanent false-alarm concern from issue #37-review item 1). v22
    // §2.10 (d) settles it the other way: ③ is a 常設区分 (standing category)
    // — a detected record never ages out, it just keeps being counted.
    const appendTs = Date.parse('2026-06-30T12:00:00.000Z');
    const claimedTs = Date.parse('2026-06-28T12:00:00.000Z');
    const anchored: Event = {
      kind: 'cost',
      id: `${appendTs.toString(36)}-000001-abcd`,
      ts: claimedTs,
      actor: h1,
      node: 'a',
      amount: 1,
    };
    const events = [anchored, ...weekLog()];
    const r = buildReport(events, OPTS); // OPTS.prev = '2026-07-03', long after the 06-30 append
    expect(r.retroactive).not.toBeNull();
    expect(r.retroactive!.count).toBe(1);
    expect(r.retroactive!.nodes).toEqual(['a']);
    expect(r.retroactive!.oldestTs).toBe(claimedTs);
  });

  it('a realStamper-shaped id moved PHYSICALLY out of order (no backdating) is STILL caught, via the independent physical-order signal — but as orderAnomaly, since id-decode alone confirms nothing (issue #37-review item 2; recategorized under issue #11 #6)', () => {
    // The id's embedded instant matches its own ts exactly (no backdating —
    // the id-decode signal alone would find nothing retroactive here), but
    // the event is spliced in physically BEHIND already-newer events, i.e.
    // exactly what a hand edit that moved an existing (legitimately-id'd) row
    // further down the file would produce. The two signals are evaluated
    // independently; here only the physical-order signal fires, so this is
    // an orderAnomaly (NOT ③c — issue #11 #6 keeps this bucket separate since
    // the >24h boundary is never confirmed by order alone).
    const ts = Date.parse('2026-07-01T09:00:00.000Z');
    const moved: Event = {
      kind: 'cost',
      id: `${ts.toString(36)}-000001-abcd`, // decodes to the SAME ts — not backdated
      ts,
      actor: h1,
      node: 'a',
      amount: 1,
    };
    const events = [...weekLog(), moved]; // physically LAST, chronologically EARLIEST
    const r = buildReport(events, OPTS); // OPTS.prev = '2026-07-03'
    expect(r.retroactive).toBeNull();
    expect(r.orderAnomaly).not.toBeNull();
    expect(r.orderAnomaly!.count).toBe(1);
    expect(r.orderAnomaly!.nodes).toEqual(['a']);
  });

  it('a ts-anchored event (WBS import style, issue #24) is caught by id-decode alone, even in chronologically-correct physical position', () => {
    // realStamper-shaped id (cli/src/stamp.ts): `${ts.toString(36)}-${seq6}-${rand4}`.
    // The id's embedded instant is when the event was actually appended; here
    // it is FAR after asOf, while the event's own `ts` is backdated onto
    // 07-01 (like WBS import's `at()` helper backdates actuals) — the exact
    // shape a real `moira import wbs` run with 実績開始日=07-01 produces.
    const realAppendTs = Date.parse('2026-07-10T09:00:00.000Z');
    const claimedTs = Date.parse('2026-07-01T12:00:00.000Z');
    const anchored: Event = {
      kind: 'cost',
      id: `${realAppendTs.toString(36)}-000001-abcd`,
      ts: claimedTs,
      actor: h1,
      node: 'b',
      amount: 1,
    };
    // Placed at the FRONT — the chronologically-correct physical position for
    // its (backdated) ts, so the physical-order fallback would NOT flag it;
    // only decoding the id catches this one.
    const events = [anchored, ...weekLog()];
    const r = buildReport(events, OPTS);
    expect(r.retroactive).not.toBeNull();
    expect(r.retroactive!.nodes).toContain('b');
    expect(r.retroactive!.oldestTs).toBe(claimedTs);
  });

  // v22 §2.10 (d) ③c fixed boundary (issue #11): "経過 24 時間超" — strictly
  // more than 24 elapsed hours, exactly 24h does NOT count. Pre-v22 the
  // id-decode signal fired on ANY positive delay; both cases below are placed
  // chronologically (insertChronologically) so the physical-order signal never
  // fires as a side effect, isolating the id-decode signal under test.
  it('id-decode delay of EXACTLY 24h is NOT retroactive (strict boundary; ちょうど24hは含まない)', () => {
    const claimedTs = Date.parse('2026-07-03T13:00:00.000Z'); // day 07-03, on/before prev
    const appendTs = claimedTs + DAY_MS; // exactly 24h later — day 07-04, > prev
    const anchored: Event = {
      kind: 'cost',
      id: `${appendTs.toString(36)}-000001-abcd`,
      ts: claimedTs,
      actor: h1,
      node: 'b',
      amount: 1,
    };
    const r = buildReport(insertChronologically(weekLog(), anchored), OPTS);
    expect(r.retroactive).toBeNull();
  });

  it('id-decode delay of 24h + 1ms IS retroactive (just past the strict boundary)', () => {
    const claimedTs = Date.parse('2026-07-03T13:00:00.000Z'); // day 07-03, on/before prev
    const appendTs = claimedTs + DAY_MS + 1; // 24h + 1ms later — day 07-04, > prev
    const anchored: Event = {
      kind: 'cost',
      id: `${appendTs.toString(36)}-000001-abcd`,
      ts: claimedTs,
      actor: h1,
      node: 'b',
      amount: 1,
    };
    const r = buildReport(insertChronologically(weekLog(), anchored), OPTS);
    expect(r.retroactive).not.toBeNull();
    expect(r.retroactive!.count).toBe(1);
    expect(r.retroactive!.nodes).toEqual(['b']);
  });
});

describe('buildReport with milestones (issue #35)', () => {
  const r = buildReport(weekLog(), OPTS_WITH_MILESTONES);

  it('rolls up each milestone’s subset EVM at asOf, reusing the SAME single derive() forecast (no re-leveling)', () => {
    expect(r.milestones).toEqual([
      {
        milestone: 'M1',
        evAbs: 2,
        evPercent: 0.4,
        pv: 2,
        ac: 2,
        bac: 5,
        spi: 1,
        cpi: 1,
        leafCount: 2,
        plannedEnd: '2026-07-08',
        forecastEnd: '2026-07-08', // driven by 'b' — NOT 'a' (a is completed 07-03; see next test)
        bottleneckLeaf: 'b',
        bottleneckOnCriticalPath: false, // no dependency edge touches b in weekLog
      },
      {
        milestone: 'M2',
        evAbs: 5,
        evPercent: 1,
        pv: 5,
        ac: 4,
        bac: 5,
        spi: 1,
        cpi: 1.25,
        leafCount: 1,
        plannedEnd: '2026-07-06',
        forecastEnd: null, // c is completed — its leveler prediction is a phantom, excluded
        bottleneckLeaf: null,
        bottleneckOnCriticalPath: false,
      },
    ]);
  });

  it('a completed leaf never paces forecastEnd even though the leveler still assigns it a date (landing.ts-isomorphic honesty)', () => {
    const m1 = r.milestones.find((m) => m.milestone === 'M1')!;
    // 'a' (completed 07-03, cost=2) is excluded from forecastEnd/bottleneck —
    // only 'b' (still incomplete) can pace M1's live forecast.
    expect(m1.bottleneckLeaf).not.toBe('a');
  });

  it('milestones is [] (section suppressed) when opts.milestones is omitted or empty', () => {
    expect(buildReport(weekLog(), OPTS).milestones).toEqual([]);
    expect(buildReport(weekLog(), { ...OPTS, milestones: [] }).milestones).toEqual([]);
  });
});

describe('reportFilename', () => {
  it('is deterministic, dated, and mirrors the output format', () => {
    expect(reportFilename('pl-sato', '2026-07-06')).toBe('moira-report-pl-sato-2026-07-06.md');
    expect(reportFilename('pl-sato', '2026-07-06', true)).toBe(
      'moira-report-pl-sato-2026-07-06.json',
    );
  });

  it('slugs a path-hostile projectRoot so it cannot escape the target dir', () => {
    expect(reportFilename('a/../b', '2026-07-06')).toBe('moira-report-a_.._b-2026-07-06.md');
    expect(reportFilename('///', '2026-07-06')).toBe('moira-report-project-2026-07-06.md');
  });
});

describe('formatReportText', () => {
  const r = buildReport(weekLog(), OPTS);
  const text = formatReportText(r, (id) => id, 'demo');

  it('keeps SPI/EV% welded to their coverage on the same line (R-S4/R-S6)', () => {
    const evLine = text.split('\n').find((l) => l.includes('EV% '));
    expect(evLine).toContain('estimate coverage');
    const spiLine = text.split('\n').find((l) => l.includes('SPI '));
    expect(spiLine).toContain('schedule coverage');
  });

  it('renders the delta, queue, feature table and trend table sections', () => {
    expect(text).toContain('## 前回比 Δ（2026-07-03 → 2026-07-06）');
    expect(text).toContain('ΔEV_abs +5');
    expect(text).toContain('レビュー待ち（人間ゲート）: [c]');
    expect(text).toContain('| feature | ΔEV_abs | EV_abs | EV% | 完了葉/葉 |');
    expect(text).toContain('| 日付 | EV_abs | EV% | 見積cov | SPI | sched cov | CPI |');
    expect(text).toContain('着地予測（P7 生きた予測・D_pred）: 2026-07-08 | forecast coverage 100%');
    expect(text).toContain('期日まで余裕: 2 日');
  });

  it('omits the "## マイルストーン別" section entirely when no milestone is defined', () => {
    expect(text).not.toContain('## マイルストーン別');
  });

  it('a normal report (no retroactive appends) never mentions 遡及 (honest silence)', () => {
    expect(text).not.toContain('遡及');
  });
});

describe('formatReportText unified ③ alert surface (v22 §2.10 (d); issue #11 R8 — supersedes the pre-v22 two-block issue #36 display)', () => {
  it('renders the ⚠ 訂正・遡及 block right after the 前回比 Δ section, with the 遡及書き込み line carrying count/node label/oldest date', () => {
    const events = weekLog();
    // realStamper-shaped id, appended 9 days after its claimed ts — a
    // CONFIRMED ③c record (id-decode signal; issue #11 #6 keeps this
    // distinct from a bare physical-order anomaly, which renders as a
    // separate 到着順の乱れ line — see the next test).
    const claimedTs = Date.parse('2026-07-01T12:00:00.000Z');
    const appendTs = Date.parse('2026-07-10T09:00:00.000Z');
    events.push({
      kind: 'cost',
      id: `${appendTs.toString(36)}-000001-abcd`,
      ts: claimedTs,
      actor: h1,
      node: 'a',
      amount: 1,
    });
    const r = buildReport(events, OPTS);
    const text = formatReportText(r, (id) => (id === 'a' ? 'タスクA' : id), 'demo');
    const lines = text.split('\n');
    const deltaHeaderIdx = lines.findIndex((l) => l.startsWith('## 前回比 Δ'));
    const warnIdx = lines.findIndex((l) => l.includes('⚠ 訂正・遡及'));
    expect(warnIdx).toBeGreaterThan(deltaHeaderIdx);
    // Only the WRITE system (③c) fired here — no corrections supplied — so the
    // 訂正記録 line (correction system) must be absent (系ごとの計数を共表示・
    // どちらか一方だけ非ゼロでもブロックは出る、が非該当の系まで捏造しない).
    expect(text).not.toContain('訂正記録 総数');
    expect(lines[warnIdx + 1]).toContain('遡及書き込み 1 件');
    expect(lines[warnIdx + 2]).toContain('タスクA (a)');
    expect(lines[warnIdx + 2]).toContain('最古の遡及日付: 2026-07-01');
    expect(text).not.toContain('到着順の乱れ');
  });

  it('renders the 到着順の乱れ line (NOT 遡及書き込み) when only the physical-order signal fires — no confirmed >24h boundary (issue #11 #6)', () => {
    const events = weekLog();
    events.push({
      kind: 'cost',
      id: 'e999', // not realStamper-shaped — id-decode signal never fires
      ts: Date.parse('2026-07-01T12:00:00.000Z'),
      actor: h1,
      node: 'a',
      amount: 1,
    });
    const r = buildReport(events, OPTS);
    const text = formatReportText(r, (id) => (id === 'a' ? 'タスクA' : id), 'demo');
    const lines = text.split('\n');
    expect(text).toContain('⚠ 訂正・遡及');
    // The header sentence itself mentions "遡及書き込み" (it names both
    // systems), so assert on the actual BULLET LINE, not a bare substring.
    expect(lines.some((l) => l.trim().startsWith('遡及書き込み'))).toBe(false);
    expect(lines.some((l) => l.trim().startsWith('到着順の乱れ 1 件'))).toBe(true);
    expect(text).toContain('タスクA (a)');
    expect(text).toContain('24時間超は未確証');
  });

  it('renders the 訂正記録 line with real counts when corrections are supplied — no 遡及書き込み line when no write-side retroactive record exists', () => {
    const events = weekLog();
    const target = events.find((e) => e.kind === 'cost')!;
    const corrections: Correction[] = [
      {
        id: 'corr-001',
        ts: Date.parse('2026-07-06T15:00:00.000Z'),
        actor: h1,
        targetEventId: target.id,
        reason: '実績の入力ミス — 2MD ではなく 3MD が正しい',
        correctionKind: 'patch',
        patch: { amount: 3 },
      },
    ];
    const r = buildReport(events, { ...OPTS, corrections });
    expect(r.correctionMeter.total).toBe(1);
    const text = formatReportText(r, (id) => id, 'demo');
    expect(text).toContain('⚠ 訂正・遡及');
    expect(text).toContain(
      `訂正記録 総数 1 件（施錠対象 ${r.correctionMeter.locked} / 遡及 ${r.correctionMeter.retroactive} / 適用不能 ${r.correctionMeter.inapplicable}）`,
    );
    // The header's explanatory clause mentions "遡及書き込み" by name (it names
    // both systems), so assert on the actual BULLET LINE — the write-side
    // system's dedicated row — rather than a bare substring match.
    const lines = text.split('\n');
    expect(lines.some((l) => l.trim().startsWith('遡及書き込み'))).toBe(false);
  });

  it('both systems firing simultaneously render under ONE ⚠ 訂正・遡及 header — no duplicate header, both breakdown lines present (the defining scenario of the v22 unification — 二重表示を廃す)', () => {
    const events = weekLog();
    const correctionTarget = events.find((e) => e.kind === 'cost')!; // a cost event on 'a'
    const corrections: Correction[] = [
      {
        id: 'corr-both',
        ts: Date.parse('2026-07-06T15:00:00.000Z'),
        actor: h1,
        targetEventId: correctionTarget.id,
        reason: '実績の入力ミス — 2MD ではなく 3MD が正しい',
        correctionKind: 'patch',
        patch: { amount: 3 },
      },
    ];
    // An independent ③c retroactive-WRITE record on a DIFFERENT node ('b'),
    // just past the strict 24h boundary — a separate population from the
    // correction above (different target/mechanism entirely).
    const claimedTs = Date.parse('2026-07-03T13:00:00.000Z');
    const appendTs = claimedTs + DAY_MS + 1;
    const anchored: Event = {
      kind: 'cost',
      id: `${appendTs.toString(36)}-000001-abcd`,
      ts: claimedTs,
      actor: h1,
      node: 'b',
      amount: 1,
    };
    const withRetroWrite = insertChronologically(events, anchored);
    const r = buildReport(withRetroWrite, { ...OPTS, corrections });
    expect(r.correctionMeter.total).toBe(1);
    expect(r.retroactive).not.toBeNull();

    const text = formatReportText(r, (id) => id, 'demo');
    const lines = text.split('\n');
    const headerLines = lines.filter((l) => /⚠ 訂正・遡及/.test(l));
    expect(headerLines).toHaveLength(1); // exactly ONE alert surface — not two ⚠ blocks
    expect(text).toContain('訂正記録 総数 1 件');
    expect(lines.some((l) => l.trim().startsWith('遡及書き込み 1 件'))).toBe(true);
  });

  it('omits the entire block when neither system has anything to report (honest silence; both zero → no block)', () => {
    const r = buildReport(weekLog(), OPTS); // no corrections, no retroactive writes
    expect(r.correctionMeter.total).toBe(0);
    expect(r.retroactive).toBeNull();
    const text = formatReportText(r, (id) => id, 'demo');
    expect(text).not.toContain('⚠ 訂正・遡及');
    expect(text).not.toContain('訂正記録 総数');
    expect(text).not.toContain('遡及書き込み');
  });
});

describe('formatReportText with milestones (issue #35)', () => {
  const r = buildReport(weekLog(), OPTS_WITH_MILESTONES);
  const text = formatReportText(r, (id) => id, 'demo');

  it('renders the "## マイルストーン別" table with EV%/EV_abs/SPI/CPI/BAC/plannedEnd/forecastEnd/bottleneck', () => {
    expect(text).toContain('## マイルストーン別（名前 + 構成ノード束 — 期日/バッファは持たない）');
    expect(text).toContain(
      '| milestone | EV% | EV_abs | SPI | CPI | BAC | 予定終了(基準) | 予測終了 | ボトルネック葉 |',
    );
    expect(text).toContain('| M1 | 40% | 2 | 1.00 | 1.00 | 5 | 2026-07-08 | 2026-07-08 | b |');
    expect(text).toContain('| M2 | 100% | 5 | 1.00 | 1.25 | 5 | 2026-07-06 | (予測不能) | - |');
  });
});
