// v21 §2.10 普遍訂正原則 — correction layer unit tests.
//
// Oracle: MODEL.md §2.10 (universal correction principle) — the read is a
// composed read of "event log (immutable) + correction layer (append-only)".
// The one-line principle: the corrected-log is one log that the existing
// semantics can re-read as-is.
//
// This suite anchors the following bits:
//   (a) nullify form drops the target event from the effective stream (§2.10)
//   (b) patch form merges fields into the target (§2.10)
//   (c) latest-wins per targetEventId by (ts, id) — I3 isomorphic (§2.10)
//   (d) foreign-field patches are inapplicable — visible structural error (§2.10)
//   (e) non-existent targets are inapplicable (§2.10)
//   (f) ts patches shift latest-wins winners in base semantics (§2.10)
//   (g) meter: total / locked (I4 target) / retroactive / inapplicable
//       — no discretional knob (PR-CORRECTION-METER)
//   (h) A2 射程改訂: fold accepts (events, corrections) and no-corrections
//       call is byte-identical to the pre-v21 fold (backward compat)
//   (i) 誤 cancel の回復: nullifying a cancel restores the effective stream
//       (state-machine terminality is unchanged; no un-cancel event added)
//   (j) actor is patchable (§2.10 (i) names "amount・node・ts・actor・凍結値等"
//       verbatim) — issue #11 gate-2 R2 #2. A patch moving a non-human actor
//       onto an agreed estimate-transition is inapplicable (R-U4/I6 — §2.10's
//       own named "検証の迂回は不能" example); the prior valid reading stays in
//       force, exactly like the R1 #1 foreign-field inapplicable path.
//
// The 4-event axiom (A2) is unchanged — corrections are NOT a 5th event kind.
// This is separately anchored by decisions/events.test-d.ts.

import { describe, expect, it } from 'vitest';
import { derive } from './derive.js';
import { __test_applyCorrections, fold } from './fold.js';
import { agent, human, Log } from './test-utils.js';
import type { Correction, Event } from './types.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// A small helper to build a base log that ends with a completed agreed node.
function baseLog(): Event[] {
  return new Log()
    .decompose('F', [{ node: 'A', estimate: 8 }])
    .agree('A', 8)
    .life('A', 'implemented')
    .all();
}

describe('§2.10 (h) backward compatibility: no corrections ⇒ byte-identical to pre-v21 fold', () => {
  it('fold(events) and fold(events, []) produce identical projected state', () => {
    const events = baseLog();
    const noArg = fold(events);
    const emptyArg = fold(events, []);
    // Structural equality on the parts that matter for a byte-compat check.
    expect(emptyArg.nodes.size).toBe(noArg.nodes.size);
    expect(emptyArg.structuralErrors).toEqual(noArg.structuralErrors);
    expect(emptyArg.appliedAt).toBe(noArg.appliedAt);
    expect(emptyArg.correctionMeter).toEqual({
      total: 0,
      locked: 0,
      retroactive: 0,
      inapplicable: 0,
    });
    expect(noArg.correctionMeter).toEqual(emptyArg.correctionMeter);
  });

  it('derive() with no corrections leaves EV/AC/PV/coverage unchanged', () => {
    const events = baseLog();
    const d = derive(events, { asOf: '2026-07-01' });
    expect(d.evAbs).toBe(8);
    expect(d.correctionMeter).toEqual({
      total: 0,
      locked: 0,
      retroactive: 0,
      inapplicable: 0,
    });
  });
});

describe('§2.10 (a) nullify form drops the target event', () => {
  it('nullifying a decompose drops the child from the tree', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'decompose was entered against the wrong parent',
        correctionKind: 'nullify',
      },
    ];
    const state = fold(events, corrections);
    // A never came into being (the decompose was nullified).
    expect(state.nodes.has('A')).toBe(false);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(0);
  });

  it('§2.10 (i) 誤 cancel recovery: nullifying the cancel restores active status', () => {
    // A cancel entered by mistake is repaired by nullifying it — un-cancel is
    // NOT introduced as an event kind; state-machine terminality is unchanged.
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 5 }])
      .agree('A', 5)
      // t003 is the mistaken cancel:
      .life('A', 'cancelled')
      .all();
    const stateBefore = fold(events);
    expect(stateBefore.nodes.get('A')?.lifecycle).toBe('cancelled');

    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't003',
        reason: 'cancel was recorded against the wrong node — mistake',
        correctionKind: 'nullify',
      },
    ];
    const stateAfter = fold(events, corrections);
    // The cancel is gone — A is not terminal anymore under the corrected log.
    expect(stateAfter.nodes.get('A')?.lifecycle).not.toBe('cancelled');
    // Terminality of `cancelled` in the state machine is unchanged; no new
    // event kind was needed — the correction layer did the repair.
    expect(stateAfter.correctionMeter.total).toBe(1);
  });
});

describe('§2.10 (b) patch form merges fields into the target', () => {
  it('patch on cost amount changes ownCost', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 5)
      .all();
    // Correction: the cost was really 2, not 5 (typo).
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'transcription error — actual attention time was 2 MD',
        correctionKind: 'patch',
        patch: { amount: 2 },
      },
    ];
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(2);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(0);
  });

  it('patch on cost reason (v21 §2.8 optional) does not change amount', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 2)
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'attach missing reason to a bare cost entry (v21 §2.8)',
        correctionKind: 'patch',
        patch: { reason: 'design-review preparation' },
      },
    ];
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(2);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(0);
  });
});

describe('§2.10 (c) latest-wins per target by (ts, id)', () => {
  it('the last correction on a target wins; earlier ones are neutralised', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 5)
      .all();
    // Two corrections on the same target — the later one wins.
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'first correction — amount was 2',
        correctionKind: 'patch',
        patch: { amount: 2 },
      },
      {
        id: 'c2',
        ts: 200,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'second correction — actually amount was 3 (first was wrong too)',
        correctionKind: 'patch',
        patch: { amount: 3 },
      },
    ];
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(3);
    // v22 §2.10 (d) ①: 訂正総数 = 追記された訂正記録の数;適用可否によらない — BOTH
    // corrections count, even though only c2 (the latest-wins winner) reaches
    // the effective log (ownCost=3, not 2). ① is per-record, independent of
    // the latest-wins outcome (MODEL v22 §2.10 (d)).
    expect(state.correctionMeter.total).toBe(2);
  });

  it('id is the tie-breaker when ts collides (I3 isomorphic)', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 5)
      .all();
    const corrections: Correction[] = [
      {
        id: 'c-b',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'tie-broken loser',
        correctionKind: 'patch',
        patch: { amount: 2 },
      },
      {
        id: 'c-a',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'tie-broken loser too',
        correctionKind: 'patch',
        patch: { amount: 4 },
      },
    ];
    // With ts identical, id ordering picks 'c-b' as the winner (higher id).
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(2);
  });
});

describe('§2.10 (d) foreign-field patches are inapplicable (visible error)', () => {
  it('patching `amount` on a transition-target is inapplicable and surfaces', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .agree('A', 3)
      .all();
    // t002 is the agreement transition; `amount` is a cost field.
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'malformed correction — amount is a cost field',
        correctionKind: 'patch',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch: { amount: 999 } as any,
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.inapplicable).toBe(1);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.structuralErrors.some((e) => e.includes('inapplicable'))).toBe(true);
  });
});

describe('§2.10 issue #11 gate-2 R1 #1 (Critical): an inapplicable latest correction must not drop the target', () => {
  it('valid c1 (amount 2→3) then invalid c2 (foreign field): effective amount stays 3, target survives', () => {
    // codex failing scenario (gate-round-records.md ゲート2 R1 #1): c1 is a
    // valid patch that wins latest-wins first; c2 is a LATER record on the
    // SAME target but carries a field foreign to `cost` (children belongs to
    // decompose). Canon: an inapplicable correction enters no register and
    // leaves the preceding valid correction in force — the cost event must
    // NOT be dropped from the effective stream, and A's ownCost must reflect
    // c1 (3), not 0 (event dropped) and not 2 (original, uncorrected).
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 2) // t002
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'transcription error — actual attention time was 3 MD',
        correctionKind: 'patch',
        patch: { amount: 3 },
      },
      {
        id: 'c2',
        ts: 200,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'malformed later correction — children is a decompose field',
        correctionKind: 'patch',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch: { children: [{ node: 'X', estimate: 1 }] } as any,
      },
    ];
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(3); // c1 stays in force, not dropped/0
    expect(state.correctionMeter.total).toBe(2);
    expect(state.correctionMeter.inapplicable).toBe(1); // only c2
    const { effective } = __test_applyCorrections(events, corrections);
    expect(effective.some((e) => e.id === 't002')).toBe(true); // target survives
  });

  it('all corrections on a target are invalid: the original event stays intact', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 5) // t002
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'malformed — node is not a legal cost field to change this way',
        correctionKind: 'patch',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch: { children: [{ node: 'X', estimate: 1 }] } as any,
      },
      {
        id: 'c2',
        ts: 200,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'also malformed',
        correctionKind: 'patch',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch: { parent: 'F' } as any,
      },
    ];
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(5); // original value — untouched
    expect(state.correctionMeter.total).toBe(2);
    expect(state.correctionMeter.inapplicable).toBe(2); // both invalid
  });

  it('an invalid chain member does not become the reading basis for a later ③ evaluation', () => {
    // c1 (valid) shifts the target's reading ts to 500 — ③a trips (500<1000).
    // c2 (invalid: foreign `amount` field, but its OWN ③ is still stamped
    // per-record like any other appended record — its patch.ts=100 < c1's
    // reading 500 ⇒ ③a trips for c2 too) must NOT itself become the reading
    // for what comes after, since it never enters the winner map (§2.10:
    // 適用不能は訂正レジスタに入らない). c3 (valid) then patches ts to 300 —
    // ③a trips iff compared against c1's still-current reading of 500
    // (300<500 ⇒ true). Were c2 wrongly allowed to advance the reading to
    // its attempted 100, c3's check would be 300<100 (false) and total
    // retroactive would be 2, not 3 — this is the discriminating assertion.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 1000,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1100,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'ts was actually earlier — 500',
        correctionKind: 'patch',
        patch: { ts: 500 },
      },
      {
        id: 'c2',
        ts: 1150,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'malformed attempt — amount is foreign to decompose; also tries ts',
        correctionKind: 'patch',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch: { amount: 1, ts: 100 } as any,
      },
      {
        id: 'c3',
        ts: 1200,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'ts was actually 300, before the c1 reading of 500',
        correctionKind: 'patch',
        patch: { ts: 300 },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBe(3);
    expect(state.correctionMeter.inapplicable).toBe(1); // only c2
    expect(state.correctionMeter.retroactive).toBe(3); // c1, c2, and c3 each trip ③a — see comment above
  });
});

describe('§2.10 (e) non-existent targets are inapplicable', () => {
  it('correction naming a target id that does not exist is inapplicable', () => {
    const events: Event[] = new Log().decompose('F', [{ node: 'A', estimate: 3 }]).all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 'never-existed',
        reason: 'phantom correction',
        correctionKind: 'nullify',
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.inapplicable).toBe(1);
    expect(state.correctionMeter.total).toBe(1);
    expect(
      state.structuralErrors.some((e) => e.includes('target event does not exist')),
    ).toBe(true);
  });
});

describe('§2.10 (f) ts patches shift latest-wins winners', () => {
  it('shifting a decompose ts changes the child estimate the fold sees last', () => {
    // Two decompose events on the same child pair (A) — latest-wins by (ts,id).
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }]) // t001, ts=1
      .decompose('F', [{ node: 'A', estimate: 8 }]) // t002, ts=2 — winner
      .all();
    const stateBefore = fold(events);
    expect(stateBefore.nodes.get('A')?.latestEstimate).toBe(8);

    // Correction: t001 was actually ts=10 (recorded much later). Now t001
    // wins the (ts,id) order, so A's latestEstimate should become 3.
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'we mis-recorded when the first decompose actually happened',
        correctionKind: 'patch',
        patch: { ts: 10 },
      },
    ];
    const stateAfter = fold(events, corrections);
    expect(stateAfter.nodes.get('A')?.latestEstimate).toBe(3);
  });
});

describe('§2.10 (g) correction meter — 4 permanent categories', () => {
  it('locked bucket counts corrections whose target node is completed at target-time', () => {
    // A is completed by t003; the cost is recorded on A while it is
    // implemented (t004). A correction to that cost lands on an event whose
    // node is in the completed region ⇒ locked bucket increments.
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .agree('A', 3)
      .life('A', 'implemented')
      .cost('A', 2) // t004 — landed after A was completed (a bit odd but valid)
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 5000,
        actor: human('h1'),
        targetEventId: 't004',
        reason: 'the cost figure was off — actually 3',
        correctionKind: 'patch',
        patch: { amount: 3 },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.locked).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(0);
  });

  it('retroactive bucket counts corrections landing >1 day after target ts (③b alone)', () => {
    // v22 §2.10 (d): ③b witness in isolation — the patch never touches `ts`
    // (children only), so ③a is false; the correction record itself arrives
    // >24h after the reading ⇒ ③b alone drives the ③ count.
    // decompose at ts=100; correction at ts=100 + 2*DAY_MS ⇒ retroactive.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 100,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100 + 2 * DAY_MS,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'recorded child estimate was wrong; corrected 2 days later',
        correctionKind: 'patch',
        patch: { children: [{ node: 'A', estimate: 5 }] },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.retroactive).toBe(1);
  });

  it('same-day correction is NOT retroactive', () => {
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 100,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100 + DAY_MS / 2, // half a day later
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'same-day fix',
        correctionKind: 'patch',
        patch: { children: [{ node: 'A', estimate: 5 }] },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.retroactive).toBe(0);
  });

  it('③a alone: a same-day patch that moves ts into the past is retroactive', () => {
    // v22 §2.10 (d): ③a witness in isolation — the correction record itself
    // arrives well within 24h of the reading (so ③b is false), but its patch
    // shifts the target's ts EARLIER than the current reading ⇒ ③a alone
    // drives the ③ count.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 1000,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000 + 60_000, // 1 minute later — same-day, well under 24h
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'we mis-recorded when this decompose actually happened — it was earlier',
        correctionKind: 'patch',
        patch: { ts: 900 }, // moves ts to before the current reading (1000)
      },
    ];
    const before = fold(events);
    const after = fold(events, corrections);
    expect(before.correctionMeter.retroactive).toBe(0); // non-vacuity
    expect(after.correctionMeter.total).toBe(1);
    expect(after.correctionMeter.retroactive).toBe(1);
    expect(after.correctionMeter.locked).toBe(0);
  });

  it('③a∧③b in one record: 1 記録 1 カウント (not double-counted)', () => {
    // v22 §2.10 (d): a single correction that BOTH moves ts into the past AND
    // arrives >24h after the reading satisfies both ③a and ③b, but its
    // contribution to the ③ count is exactly 1, never 2.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 100,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100 + 2 * DAY_MS, // >24h after the reading ⇒ ③b
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'both the ts and the timing of the fix qualify as retroactive',
        correctionKind: 'patch',
        patch: { ts: 50 }, // moves ts earlier than the reading (100) ⇒ ③a
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.retroactive).toBe(1); // NOT 2 — 1 記録 1 カウント
  });

  it('excluded from ③: a same-day patch moving ts into the FUTURE is not retroactive', () => {
    // v22 §2.10 (d): ③a only fires when the patch moves ts INTO THE PAST
    // relative to the reading; a future-direction ts shift, issued same-day
    // (so ③b is also false), contributes 0 to ③ — it is still counted in ①.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 100,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100 + 1000, // same-day, well under 24h
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'the recorded ts was actually a bit later',
        correctionKind: 'patch',
        patch: { ts: 200 }, // moves ts LATER than the reading (100)
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBe(1); // still counted in ①
    expect(state.correctionMeter.retroactive).toBe(0); // neither ③a nor ③b
  });

  it('chain: ①total counts every record; ②③ are evaluated per record, not per winner', () => {
    // v22 §2.10 (d): two corrections target the SAME event. c1 (the earlier
    // in (ts,id) order) moves ts into the past, same-day ⇒ ③a alone trips.
    // c2 (the latest-wins WINNER) only patches `reason` — no ts touch, and
    // its own ts is read against c1's reading (500, per the same-target
    // chain rule "先行する現行勝者まで適用した読み"), still well under 24h ⇒ c2
    // contributes 0 to ③. Non-vacuity: total counts BOTH (2), even though
    // only c2's fields reach the effective log (reason changes; ts does NOT
    // — c2's patch never touched ts, and mergePatch merges against the
    // ORIGINAL event, not against c1's now-superseded patch).
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 1000,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1100, // same-day vs. original reading (1000)
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'ts was actually earlier',
        correctionKind: 'patch',
        patch: { ts: 500 },
      },
      {
        id: 'c2',
        ts: 2000, // same-day vs. c1's reading (500): 1500ms, well under 24h
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'clarify the reason text (does not touch ts)',
        correctionKind: 'patch',
        patch: { reason: 'clarified' },
      },
    ];
    const before = fold(events);
    const state = fold(events, corrections);
    expect(before.correctionMeter.total).toBe(0); // non-vacuity baseline
    // ① — both records counted, regardless of who wins latest-wins.
    expect(state.correctionMeter.total).toBe(2);
    // ③ — only c1 (the earlier record) trips ③a; c2 contributes 0.
    expect(state.correctionMeter.retroactive).toBe(1);
    expect(state.correctionMeter.locked).toBe(0);
    // c2 is the latest-wins winner: reason changes, ts stays the ORIGINAL
    // 1000 (c2's patch never mentioned ts — c1's ts shift lost the battle;
    // mergePatch always merges the winner's patch against the ORIGINAL event).
    const { effective } = __test_applyCorrections(events, corrections);
    expect(effective).toHaveLength(1);
    const [onlyEvent] = effective;
    expect(onlyEvent).toBeDefined();
    expect(onlyEvent?.ts).toBe(1000);
    expect(onlyEvent?.kind).toBe('decompose');
    if (onlyEvent?.kind === 'decompose') {
      expect(onlyEvent.reason).toBe('clarified');
    }
  });

  it('the four categories cover any correction — no "not counted" bucket', () => {
    // PR-CORRECTION-METER: every applied correction lands in ①total; ②③④ are
    // orthogonal predicates over the same population. There is no path by
    // which a correction is applied and NOT counted in ①.
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 5)
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'trivial patch',
        correctionKind: 'patch',
        patch: { amount: 2 },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.total).toBeGreaterThanOrEqual(
      state.correctionMeter.locked +
        state.correctionMeter.retroactive +
        state.correctionMeter.inapplicable -
        state.correctionMeter.total * 2, // trivial lower bound; category overlap is allowed
    );
    expect(state.correctionMeter.total).toBe(1);
  });
});

describe('§2.10 issue #11 gate-2 R1 #2 (Important): ② is evaluated per record against the reading immediately before it', () => {
  it('c1 nullifies the completing transition (still counts in ②, self-reference does not escape); the later c2 on an earlier cost does not', () => {
    // codex failing scenario (gate-round-records.md ゲート2 R1 #2): a first
    // correction nullifies the transition that completed node A. Immediately
    // BEFORE that nullify is applied, A WAS completed — I4 v21 "自己言及で
    // 消えない" — so c1 must still count in ②. A LATER correction on A's
    // earlier cost event is evaluated against the reading AFTER c1 has
    // already taken effect (A re-opened, no longer completed) — it must NOT
    // count in ②, even though the uncorrected base log ends completed.
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }]) // t001
      .agree('A', 3) // t002
      .cost('A', 2) // t003 — recorded before completion
      .life('A', 'implemented') // t004 — the completing transition
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 5000,
        actor: human('h1'),
        targetEventId: 't004',
        reason: 'the completion transition was entered against the wrong node — mistake',
        correctionKind: 'nullify',
      },
      {
        id: 'c2',
        ts: 6000,
        actor: human('h1'),
        targetEventId: 't003',
        reason: 'the cost figure was off — actually 5',
        correctionKind: 'patch',
        patch: { amount: 5 },
      },
    ];
    const state = fold(events, corrections);
    // A is no longer completed once c1's nullify is in force.
    expect(state.nodes.get('A')?.lifecycle).not.toBe('implemented');
    expect(state.nodes.get('A')?.ownCost).toBe(5); // c2 still applies to the cost
    expect(state.correctionMeter.total).toBe(2);
    // Only c1 counts in ②: it targets an event that WAS locking (completing
    // transition) at the moment immediately before c1 itself is applied. c2
    // targets an event whose node, by the time c2 is evaluated, has already
    // been re-opened by c1 — so c2 must NOT add to ②.
    expect(state.correctionMeter.locked).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(0);
  });
});

describe('§2.10 semantic one-line principle: corrected-log = one log the base fold reads', () => {
  it('effective stream is a valid Event[] that the switch consumes unchanged', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }])
      .cost('A', 5)
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'amount was 2',
        correctionKind: 'patch',
        patch: { amount: 2 },
      },
    ];
    const { effective } = __test_applyCorrections(events, corrections);
    // The composed read must be a normal Event[] — the switch can re-read it
    // as-is (§2.10 one-line principle). Type-checked; here we assert length
    // and shape.
    expect(effective).toHaveLength(2);
    expect(effective.every((e) => ['transition', 'decompose', 'relate', 'cost'].includes(e.kind))).toBe(true);
    const cost = effective.find((e) => e.kind === 'cost');
    expect(cost?.kind).toBe('cost');
    if (cost?.kind === 'cost') expect(cost.amount).toBe(2);
  });
});

describe('§2.10 (i)/(j) actor is patchable — issue #11 gate-2 R2 #2', () => {
  it('a cost event actor correction (human:alice→human:bob) reaches the effective log', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 5 }])
      .cost('A', 3, human('alice'))
      .all();
    const costEvent = events.find((e) => e.kind === 'cost')!;
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('alice'),
        targetEventId: costEvent.id,
        reason: '実績記録の担当者を誤記 — 正しくは bob',
        correctionKind: 'patch',
        patch: { actor: human('bob') },
      },
    ];
    const { effective, meter } = __test_applyCorrections(events, corrections);
    expect(meter.inapplicable).toBe(0);
    const correctedCost = effective.find((e) => e.kind === 'cost');
    expect(correctedCost?.actor).toEqual(human('bob'));
  });

  it('a patch moving an agreed transition\'s actor to a NON-HUMAN (agent) is inapplicable — original human-agreed reading stays in force (R-U4/I6)', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 5 }])
      .agree('A', 5, human('h1'))
      .all();
    const agreeEvent = events.find((e) => e.kind === 'transition' && e.to === 'agreed')!;
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: agreeEvent.id,
        reason: '担当を agent に付け替えようとした誤り訂正（却下されるべき）',
        correctionKind: 'patch',
        patch: { actor: agent('bot') },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.inapplicable).toBe(1);
    expect(state.structuralErrors.some((e) => e.includes('R-U4'))).toBe(true);
    // The original valid (human-agreed) reading remains in force — the node
    // is still agreed with its original frozen budget, not reverted to
    // 'proposed' and not silently dropped (§2.10 R1 #1-isomorphic contract).
    expect(state.nodes.get('A')?.estimateState).toBe('agreed');
    expect(state.nodes.get('A')?.frozenBudget).toBe(5);
    const { effective } = __test_applyCorrections(events, corrections);
    const agreeEff = effective.find((e) => e.kind === 'transition' && e.to === 'agreed');
    expect(agreeEff?.actor).toEqual(human('h1'));
  });

  it('a patch moving an agreed transition\'s actor to a DIFFERENT human is applied', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 5 }])
      .agree('A', 5, human('h1'))
      .all();
    const agreeEvent = events.find((e) => e.kind === 'transition' && e.to === 'agreed')!;
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: agreeEvent.id,
        reason: '実際に合意したのは h2 — 記録の担当者誤記',
        correctionKind: 'patch',
        patch: { actor: human('h2') },
      },
    ];
    const state = fold(events, corrections);
    expect(state.correctionMeter.inapplicable).toBe(0);
    expect(state.nodes.get('A')?.estimateState).toBe('agreed');
    expect(state.nodes.get('A')?.frozenBudget).toBe(5);
    const { effective } = __test_applyCorrections(events, corrections);
    const agreeEff = effective.find((e) => e.kind === 'transition' && e.to === 'agreed');
    expect(agreeEff?.actor).toEqual(human('h2'));
  });
});

describe('§2.8 (v21) release sentinel — assignee/reviewer explicit un-assignment', () => {
  it('assignee null sentinel releases the assignment (returns node to unassigned)', () => {
    const events: Event[] = [
      // decompose so A exists
      {
        kind: 'decompose',
        id: 't001',
        ts: 1,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
      // assign A to h1
      {
        kind: 'transition',
        id: 't002',
        ts: 2,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'ready',
        assignee: human('h1'),
      },
      // release the assignee explicitly (null sentinel)
      {
        kind: 'transition',
        id: 't003',
        ts: 3,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'ready',
        assignee: null,
      },
    ];
    const state = fold(events);
    expect(state.nodes.get('A')?.assignee).toBeNull();
  });

  it('assignee undefined leaves the previous assignment intact (backward compat)', () => {
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 1,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
      {
        kind: 'transition',
        id: 't002',
        ts: 2,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'ready',
        assignee: human('h1'),
      },
      // lifecycle transition WITHOUT touching assignee — h1 must remain
      {
        kind: 'transition',
        id: 't003',
        ts: 3,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'implementing',
      },
    ];
    const state = fold(events);
    expect(state.nodes.get('A')?.assignee).toEqual(human('h1'));
  });

  it('reviewer null sentinel releases the reviewer designation', () => {
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 't001',
        ts: 1,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 3 }],
      },
      {
        kind: 'transition',
        id: 't002',
        ts: 2,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'ready',
        reviewer: human('r1'),
      },
      {
        kind: 'transition',
        id: 't003',
        ts: 3,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'ready',
        reviewer: null,
      },
    ];
    const state = fold(events);
    expect(state.nodes.get('A')?.reviewer).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// issue #15: pre-admission (trial-fold) for the three remaining §2.10 (i)
// "検証の迂回は不能" worked examples — a containment-cycle decompose patch, a
// negative-amount cost patch, and a cycle-creating relate-endpoint patch. The
// fourth example (non-human actor onto an agreed estimate-transition) was
// already pre-admission-checked by issue #11 gate-2 R2 #2 (see the (j) block
// above); these three used to flow into `winnerByTarget` and rely on the base
// switch's OWN rejection at fold-time, which — unlike this pre-admission gate
// — does NOT keep the prior valid reading in force (it just drops the target
// into a rejected-by-base-switch state, same shape as an ordinary bad EVENT,
// with `inapplicable` left at 0). issue #15 closes that gap: each candidate
// is now run through a TRIAL fold (would-be-apply against the real base
// switch) before it is ever set as a target's winner, and rejected —
// pre-admission, `inapplicable` incremented, prior valid reading preserved —
// if doing so introduces a NEW structural error anywhere in the log.
// ---------------------------------------------------------------------------

describe('§2.10 issue #15 ① decompose value-correction that would move a parent onto its own descendant (containment cycle)', () => {
  it('a patch that moves the effective parent into the child’s own subtree is inapplicable; the original decompose stays in force', () => {
    // Chain established by the RAW log: A → B → C (t001, t002).
    const events: Event[] = new Log()
      .decompose('A', [{ node: 'B', estimate: 3 }]) // t001
      .decompose('B', [{ node: 'C', estimate: 2 }]) // t002
      .all();
    // c1 claims t001 should really have read "decompose('C', [B])" — i.e. B's
    // effective parent should be C. But C is B's OWN CHILD (via t002) — this
    // is exactly the containment-cycle shape §2.10 (i) names by worked
    // example. The cycle only becomes visible once the REAL base switch
    // re-applies t002 against the corrected t001 (t002 tries to set C's
    // parent to B, and B's parent is now C — A3/§2.8 tree-ness guard trips)
    // — a naive "does the target event itself cycle" check would MISS this;
    // only a full trial fold catches it.
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'value correction — the parent was actually C, not A',
        correctionKind: 'patch',
        patch: { parent: 'C' },
      },
    ];
    const state = fold(events, corrections);
    // (i) prior valid reading (here: no preceding correction, so the
    // ORIGINAL event) stays in force — B's parent is still A, untouched.
    expect(state.nodes.get('B')?.parent).toBe('A');
    expect(state.nodes.get('C')?.parent).toBe('B');
    // (ii) meter
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(1);
    // (iii) the surfaced error is the §2.10-wrapped inapplicable text, citing
    // the underlying containment-cycle reason — NOT a bare base-switch error.
    expect(
      state.structuralErrors.some((e) => e.includes('§2.10') && e.includes('containment cycle')),
    ).toBe(true);
    expect(state.structuralErrors.some((e) => e.startsWith('A3/§2.8'))).toBe(false);
  });

  it('a preceding VALID correction on the same target stays the effective winner when a later one is a cycle-inducing patch', () => {
    // (iv) same-target chain: c1 (valid) wins latest-wins first; c2 (later,
    // cycle-inducing) must be rejected WITHOUT dropping c1's effect.
    const events: Event[] = new Log()
      .decompose('A', [{ node: 'B', estimate: 3 }]) // t001
      .decompose('B', [{ node: 'C', estimate: 2 }]) // t002
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'valid re-label — the parent was actually Z, an unrelated node',
        correctionKind: 'patch',
        patch: { parent: 'Z' },
      },
      {
        id: 'c2',
        ts: 200,
        actor: human('h1'),
        targetEventId: 't001',
        reason: 'later, wrong correction attempting to move the parent to C',
        correctionKind: 'patch',
        patch: { parent: 'C' },
      },
    ];
    const state = fold(events, corrections);
    // c1's effect (parent=Z) stays in force — NOT the original 'A', and NOT
    // c2's cycle-inducing 'C'.
    expect(state.nodes.get('B')?.parent).toBe('Z');
    expect(state.correctionMeter.total).toBe(2);
    expect(state.correctionMeter.inapplicable).toBe(1); // only c2
  });

  it('(v) all-or-nothing per record: one bad child among several inapplicates the WHOLE decompose correction', () => {
    // A has an ancestor 'Root' (t001). t002 decomposes A into [B]. c1 patches
    // t002's children to [Z (harmless new node), Root (A's own ancestor —
    // making Root a child of A closes a cycle)]. Even though Z alone would
    // have applied cleanly, the record must be rejected WHOLESALE — Z must
    // never be created either.
    const events: Event[] = new Log()
      .decompose('Root', [{ node: 'A', estimate: 10 }]) // t001
      .decompose('A', [{ node: 'B', estimate: 3 }]) // t002
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'value correction — A actually decomposed into Z and (mistakenly) Root',
        correctionKind: 'patch',
        patch: {
          children: [
            { node: 'Z', estimate: 5 },
            { node: 'Root', estimate: 1 },
          ],
        },
      },
    ];
    const state = fold(events, corrections);
    // The original t002 (A → [B]) stays in force — record rejected wholesale.
    expect(state.nodes.get('B')?.parent).toBe('A');
    // Z — the individually-harmless child in the SAME rejected record — was
    // never created either (all-or-nothing, not per-child).
    expect(state.nodes.has('Z')).toBe(false);
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(1);
  });
});

describe('§2.10 issue #15 ② cost value-correction that would set a negative amount', () => {
  it('a patch driving `amount` negative is inapplicable; the original cost stays in force', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A', estimate: 3 }]) // t001
      .cost('A', 5) // t002
      .all();
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'value correction — actually the amount was -5 (mistaken sign)',
        correctionKind: 'patch',
        patch: { amount: -5 },
      },
    ];
    const state = fold(events, corrections);
    // (i) original cost (5) stays in force — not dropped, not -5.
    expect(state.nodes.get('A')?.ownCost).toBe(5);
    // (ii) meter
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(1);
    // (iii) wrapped §2.10 text, not the bare base-switch error.
    expect(
      state.structuralErrors.some((e) => e.includes('§2.10') && e.includes('negative cost')),
    ).toBe(true);
    expect(state.structuralErrors.some((e) => e.startsWith('A6/§2.8'))).toBe(false);
  });

  it('a patch fixing a raw negative amount back to a legal one is still admitted (boundary check)', () => {
    // Positive witness — the trial-fold gate must not over-tighten: FIXING a
    // pre-existing structural error (here, a raw negative-amount cost event
    // already in the log) is exactly what §2.10 corrections are FOR, and
    // must still be admitted.
    const events: Event[] = [
      ...new Log().decompose('F', [{ node: 'A', estimate: 3 }]).all(), // t001
      { kind: 'cost', id: 't002', ts: 2, actor: human('h1'), node: 'A', amount: -5 },
    ];
    // Sanity: the raw log (no corrections) does trip the negative-cost guard.
    const uncorrected = fold(events);
    expect(uncorrected.nodes.get('A')?.ownCost).toBe(0);
    expect(uncorrected.structuralErrors.some((e) => e.startsWith('A6/§2.8'))).toBe(true);

    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'transcription error — the amount was actually 5, positive',
        correctionKind: 'patch',
        patch: { amount: 5 },
      },
    ];
    const state = fold(events, corrections);
    expect(state.nodes.get('A')?.ownCost).toBe(5); // the fix is admitted
    expect(state.correctionMeter.inapplicable).toBe(0);
    expect(state.structuralErrors.some((e) => e.startsWith('A6/§2.8'))).toBe(false);
  });

  // issue #15 kiro-review I-2 (Important): non-vacuity witness for the
  // MULTISET diff, not just "diff exists". A weakened implementation that
  // compared ERROR COUNTS instead of error CONTENT (`trial.length >
  // base.length`) would pass every OTHER test in this file — none of them
  // separately exercises "same count, different content". This fixture
  // does: the RAW log already contains ONE negative-cost structural error
  // (amount -5, from the uncorrected event itself — no correction involved
  // yet). The correction re-patches the SAME target to a DIFFERENT negative
  // amount (-3). The trial fold therefore ALSO produces exactly one
  // negative-cost error — same COUNT (1) — but its text differs ("-5" vs
  // "-3"), because the offending amount is embedded in the message. A
  // count-only comparison would see 1→1 and wrongly ADMIT this correction
  // (masking that -3 is still just as invalid as -5); only a CONTENT
  // (multiset) diff sees "-3" as an error that was never present in the
  // base and correctly rejects it.
  it('a patch that trades one negative amount for a different negative amount is inapplicable (multiset, not count, diff — issue #15 review I-2)', () => {
    const events: Event[] = [
      ...new Log().decompose('F', [{ node: 'A', estimate: 3 }]).all(), // t001
      { kind: 'cost', id: 't002', ts: 2, actor: human('h1'), node: 'A', amount: -5 }, // raw negative — already 1 base-switch error
    ];
    // Sanity: the raw (uncorrected) log already carries exactly one
    // negative-cost structural error — this is preState's baseline.
    const uncorrected = fold(events);
    expect(uncorrected.structuralErrors.filter((e) => e.startsWith('A6/§2.8'))).toHaveLength(1);
    expect(uncorrected.structuralErrors.some((e) => e.includes('-5'))).toBe(true);

    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't002',
        reason: 'value correction — actually the amount was -3, not -5 (still a mistaken sign)',
        correctionKind: 'patch',
        patch: { amount: -3 },
      },
    ];
    const state = fold(events, corrections);
    // Rejected: count-only (1→1) would have missed this; content-diff catches it.
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(1);
    // Cost never applied under EITHER reading (both are negative) — ownCost stays 0.
    expect(state.nodes.get('A')?.ownCost).toBe(0);
    // The ORIGINAL reading (-5) is what actually re-fires in the real
    // (non-trial) fold of the untouched event — visible, not "-3".
    expect(state.structuralErrors.some((e) => e.includes('-5') && e.startsWith('A6/§2.8'))).toBe(
      true,
    );
    // The rejection itself is reported via the §2.10 wrapper citing the
    // trial's divergent (-3) reading — the reason THIS record was refused.
    expect(state.structuralErrors.some((e) => e.includes('§2.10') && e.includes('-3'))).toBe(
      true,
    );
  });
});

describe('§2.10 issue #15 ③ relate endpoint-correction that would create a cycle', () => {
  it('a patch redirecting an endpoint to close a cycle is inapplicable; the original edge stays in force', () => {
    const events: Event[] = new Log()
      .decompose('F', [{ node: 'A' }, { node: 'B' }, { node: 'C' }]) // t001
      .dep('A', 'B') // t002: A→B
      .dep('B', 'C') // t003: B→C
      .all();
    // c1 claims t003 should really read dep('B','A') — combined with the
    // (unmodified) A→B edge from t002, that closes a 2-cycle A→B→A.
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 1000,
        actor: human('h1'),
        targetEventId: 't003',
        reason: 'value correction — the successor was actually A, not C',
        correctionKind: 'patch',
        patch: { to: 'A' },
      },
    ];
    const state = fold(events, corrections);
    // (i) original edge (B→C) stays in force.
    expect(state.dependencyEdges).toContainEqual(
      expect.objectContaining({ from: 'B', to: 'C' }),
    );
    expect(state.dependencyEdges).not.toContainEqual(
      expect.objectContaining({ from: 'B', to: 'A' }),
    );
    // (ii) meter
    expect(state.correctionMeter.total).toBe(1);
    expect(state.correctionMeter.inapplicable).toBe(1);
    // (iii) wrapped §2.10 text, not the bare base-switch error.
    expect(state.structuralErrors.some((e) => e.includes('§2.10') && e.includes('cyclic'))).toBe(
      true,
    );
    expect(state.structuralErrors.some((e) => e.startsWith('I2/R-D3'))).toBe(false);
  });
});
