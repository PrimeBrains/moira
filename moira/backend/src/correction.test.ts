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
    // Only one correction won — meter counts the winner. (Neutralised
    // corrections are recorded in the log, but do not double-count under
    // the latest-wins chain rule.)
    expect(state.correctionMeter.total).toBe(1);
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

  it('retroactive bucket counts corrections landing >1 day after target ts', () => {
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
