// ============================================================================
// PR-DONE-LOCK★ (I4·R-E3·§2.10) — GREEN regression pin (D-1 done-lock, fixed
// 2026-07-02; v21 correction carve-out added 2026-07-21 for issue #6).
//
// Oracle (moira/PROPERTIES.md v0.6, transcribed verbatim from the plain
// sentence):
//   「いったん完了して出来高が確定した作業の出来高(EV_abs)は、見積のやり直し・
//     作り直し・キャンセルなど『考えが変わった』操作では減らない…唯一の例外は
//     記録の誤りの訂正（理由必須・計器に常設表示される『音の鳴る』修理）——
//     黙って減る経路は存在しない」
//
// Semantic split (v21 §2.10 精密化: I4「完了済みは、黙っては変わらない」):
//   (i)  SEMANTIC changes on a completed node (a re-estimate, a cancel-then-
//        change-of-mind, etc.) — REJECTED at the fold. The old rejected-path
//        pin below still holds byte-for-byte.
//   (ii) RECORDING-ERROR corrections (§2.10) targeting the completion or the
//        agreement itself — permitted, BUT the correction meter's ②locked
//        bucket increments and structural errors surface any inapplicability.
//        No silent path exists (D-1 v21 carve-out; PR-DONE-LOCK "音の鳴る").
//
// The read-side alternative ("count completed nodes regardless") was the
// explicitly rejected option in D-1 — the fold guard is the ratified one.
// ============================================================================

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { derive, type DeriveOptions } from '../derive.js';
import { fold } from '../fold.js';
import { agent, human } from '../test-utils.js';
import type { Correction, Event } from '../types.js';

const OPTS: DeriveOptions = { asOf: '2026-06-30' };

/** A targeted log: one node, agreed + completed, then estimate reverted to proposed. */
function doneNodeThenRevert(estimate: number, completedTo: 'implemented' | 'accepted'): {
  before: Event[];
  after: Event[];
} {
  const before: Event[] = [
    { kind: 'decompose', id: 'e1', ts: 1, actor: agent('ai'), parent: 'F', reason: 'init', children: [{ node: 'A', estimate }] },
    { kind: 'transition', id: 'e2', ts: 2, actor: human('h1'), node: 'A', machine: 'estimate-agreement', to: 'agreed', frozenBudget: estimate },
    { kind: 'transition', id: 'e3', ts: 3, actor: human('h1'), node: 'A', machine: 'lifecycle', to: completedTo },
  ];
  // The I4-violating move: re-estimate a COMPLETED node back to proposed.
  const revert: Event = {
    kind: 'transition', id: 'e4', ts: 4, actor: human('h1'), node: 'A', machine: 'estimate-agreement', to: 'proposed', reason: 're-estimate',
  };
  return { before, after: [...before, revert] };
}

describe('PR-DONE-LOCK★ (I4·R-E3): completed EV_abs is frozen against re-estimation', () => {
  it('reverting a completed agreed node to proposed must NOT change EV_abs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.constantFrom<'implemented' | 'accepted'>('implemented', 'accepted'),
        (estimate, completedTo) => {
          const { before, after } = doneNodeThenRevert(estimate, completedTo);

          const evBefore = derive(before, OPTS).evAbs;
          const evAfter = derive(after, OPTS).evAbs;

          // Non-vacuity: the node really did earn value before the revert.
          expect(evBefore).toBe(estimate);
          // Oracle (PR-DONE-LOCK): completed EV_abs額 is invariant under re-estimation.
          expect(evAfter).toBe(evBefore);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Companion pinning HOW the lock is enforced (D-1: fold-owned rejection, not a
  // read-side special case): the revert is refused visibly, never silently.
  it('DOCUMENTS the enforcement: the revert is rejected, visible, and non-destructive', () => {
    const { before, after } = doneNodeThenRevert(8, 'implemented');
    expect(derive(before, OPTS).evAbs).toBe(8); // earned...

    const d = derive(after, OPTS);
    expect(d.evAbs).toBe(8); // ...and still earned after the rejected revert (I4).
    // The rejection is honest, not silent (§2.1): one structural error names it.
    expect(d.structuralErrors).toEqual([
      "I4/R-E3: re-estimation (agreed→proposed) on completed node 'A' — rejected (D-1 done-lock)",
    ]);
    // The node's estimate agreement is untouched — no completed+proposed state
    // exists, so R-U13 cannot mis-fire (R-E3).
    expect(fold(after).nodes.get('A')?.estimateState).toBe('agreed');
  });
});

// ---------------------------------------------------------------------------
// v21 §2.10 correction carve-out — the one exception to "does not move".
// ---------------------------------------------------------------------------
//
// Above: a NAKED (uncorrected) agreed→proposed on a completed node is rejected
// at the fold (semantic-change path stays closed). Below: a correction (§2.10)
// targeting the completion or agreement itself is the ONLY path by which a
// completed node's EV_abs can move — and even that path is audibly stamped on
// the correction meter's ②locked bucket. "音の鳴る修理" made concrete:
// enumerating the paths shows exactly one lands anywhere near EV_abs, and it
// increments the meter every time.

describe('PR-DONE-LOCK v21 carve-out (§2.10): the ONLY exception is an audible correction', () => {
  it('nullifying the completion transition is permitted AND rings the ②locked bucket', () => {
    // Base: A is agreed & completed (implemented) → EV_abs=8.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 'e1',
        ts: 1,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 8 }],
      },
      {
        kind: 'transition',
        id: 'e2',
        ts: 2,
        actor: human('h1'),
        node: 'A',
        machine: 'estimate-agreement',
        to: 'agreed',
        frozenBudget: 8,
      },
      {
        kind: 'transition',
        id: 'e3',
        ts: 3,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'implemented',
      },
    ];
    expect(derive(events, OPTS).evAbs).toBe(8);

    // Correction: the completion transition (e3) was recorded in error — A
    // was never actually implemented. The nullify drops e3 from the effective
    // stream (§2.10 誤記表明). A is no longer in the completed region, so its
    // frozen EV_abs is unfrozen ⇒ EV_abs falls to 0. Crucially, this is
    // audible: the correction meter's ②locked bucket increments because the
    // target's node WAS in the completed region at the moment the correction
    // was applied (§2.10 (d) ② "適用直前の読み" — I4 v21 "黙っては変わらない").
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 'e3',
        reason: 'the completion event was entered against the wrong node',
        correctionKind: 'nullify',
      },
    ];
    const d = derive(events, { ...OPTS, corrections });
    // The correction landed: EV_abs moved.
    expect(d.evAbs).toBe(0);
    // The meter rings — this is the "音" of the audible-fix.
    expect(d.correctionMeter.total).toBe(1);
    expect(d.correctionMeter.locked).toBe(1);
    expect(d.correctionMeter.inapplicable).toBe(0);
  });

  it('patching the agreement (frozenBudget) is permitted AND rings the ②locked bucket', () => {
    // Base: A agreed at 8, then implemented ⇒ EV_abs=8.
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 'e1',
        ts: 1,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 8 }],
      },
      {
        kind: 'transition',
        id: 'e2',
        ts: 2,
        actor: human('h1'),
        node: 'A',
        machine: 'estimate-agreement',
        to: 'agreed',
        frozenBudget: 8,
      },
      {
        kind: 'transition',
        id: 'e3',
        ts: 3,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'implemented',
      },
    ];
    expect(derive(events, OPTS).evAbs).toBe(8);

    // Correction: the frozenBudget on the agreement was mis-recorded — it
    // should have been 5. Even though A is completed and locked against
    // semantic re-estimation (see the naked-revert PBT above), THIS path
    // moves EV_abs — and it does so audibly.
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 'e2',
        reason: 'frozenBudget was mis-typed at agreement time',
        correctionKind: 'patch',
        patch: { frozenBudget: 5 },
      },
    ];
    const d = derive(events, { ...OPTS, corrections });
    expect(d.evAbs).toBe(5); // corrected budget flows through
    expect(d.correctionMeter.total).toBe(1);
    // The agreement event's SUBJECT NODE (A) is currently in the completed
    // region — the correction is a locked-target correction.
    expect(d.correctionMeter.locked).toBe(1);
    expect(d.correctionMeter.inapplicable).toBe(0);
  });

  it('no discretional knob: the correction meter has no "exclude from count" option', () => {
    // PR-CORRECTION-METER: fold() has no argument that would remove an
    // applied correction from the meter's counts — every applied correction
    // lands in ①total, and if it targets an event on a completed node it
    // ALSO lands in ②locked. There is no path to a completed-node EV_abs
    // change that leaves the meter untouched (the "silent" path §2.10 (d)
    // and I4 v21 close by construction).
    const events: Event[] = [
      {
        kind: 'decompose',
        id: 'e1',
        ts: 1,
        actor: agent('ai'),
        parent: 'F',
        reason: 'init',
        children: [{ node: 'A', estimate: 8 }],
      },
      {
        kind: 'transition',
        id: 'e2',
        ts: 2,
        actor: human('h1'),
        node: 'A',
        machine: 'estimate-agreement',
        to: 'agreed',
        frozenBudget: 8,
      },
      {
        kind: 'transition',
        id: 'e3',
        ts: 3,
        actor: human('h1'),
        node: 'A',
        machine: 'lifecycle',
        to: 'implemented',
      },
    ];
    const corrections: Correction[] = [
      {
        id: 'c1',
        ts: 100,
        actor: human('h1'),
        targetEventId: 'e2',
        reason: 'audit',
        correctionKind: 'patch',
        patch: { frozenBudget: 6 },
      },
    ];
    const d = derive(events, { ...OPTS, corrections });
    // Every path a caller has: derive() returns a DerivedState with
    // correctionMeter. There is no way to receive a moved-EV state without
    // the meter also moving.
    expect(d.evAbs).toBe(6);
    expect(d.correctionMeter.total).toBeGreaterThan(0);
    expect(d.correctionMeter.locked).toBeGreaterThan(0);
  });
});
