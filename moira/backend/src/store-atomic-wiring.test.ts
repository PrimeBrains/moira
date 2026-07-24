// Store-layer atomic-replace WIRING witness (issue #16/#17, Reviewer B).
//
// event-store.test.ts / capacity-store.test.ts pin the OUTPUT contract
// (byte-format, no `.tmp-` residue, round-trip) — but every one of those
// assertions still passes if saveJson is reverted to a plain writeFileSync, so
// none of them GUARDS the wiring "saveJson persists via atomicWriteFileSync".
// This file closes that reversion-sensitivity gap: it mocks the atomic-write
// module with a CALL-THROUGH spy and asserts each saveJson actually routes
// through atomicWriteFileSync (and still writes the exact bytes via the
// call-through). Reverting either saveJson back to writeFileSync makes the spy
// assertion fail — a genuine reversion-sensitive witness, not one that trivially
// holds. (vi.mock is hoisted above the imports by vitest at runtime, so the
// EventStore/CapacityStore under test see the spied module; imports stay first
// to satisfy ESLint import/first.)

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { atomicWriteFileSync } from './atomic-write.js';
import { CapacityStore } from './capacity-store.js';
import { EventStore } from './event-store.js';
import type { Event } from './types.js';

vi.mock('./atomic-write.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./atomic-write.js')>();
  return { ...actual, atomicWriteFileSync: vi.fn(actual.atomicWriteFileSync) };
});

const spy = vi.mocked(atomicWriteFileSync);

describe('store-layer atomic-replace wiring (issue #16/#17)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'moira-atomic-wiring-'));
    spy.mockClear(); // clear call history; the call-through implementation is retained
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('EventStore.saveJson persists via atomicWriteFileSync (not a plain write) with the exact bytes (#16)', () => {
    const ev: Event = {
      id: 'e1',
      ts: 1,
      actor: { kind: 'human', id: 'me' },
      kind: 'transition',
      node: 'a',
      machine: 'lifecycle',
      to: 'implementing',
    };
    const store = new EventStore();
    store.append(ev);
    const path = join(dir, 'events.json');
    store.saveJson(path);

    const expected = JSON.stringify([ev], null, 2); // events byte-format: NO trailing newline
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(path, expected);
    expect(readFileSync(path, 'utf8')).toBe(expected); // the call-through actually wrote it
  });

  it('CapacityStore.saveJson persists via atomicWriteFileSync (not a plain write) with the exact bytes (#17)', () => {
    const store = new CapacityStore();
    store.append({ humanId: 'alice', date: '2026-08-01', capacity: 0.5, reason: 'leave', ts: 1 });
    const path = join(dir, 'capacity.json');
    store.saveJson(path);

    const expected = JSON.stringify(store.all(), null, 2); // capacity byte-format: NO trailing newline
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(path, expected);
    expect(readFileSync(path, 'utf8')).toBe(expected);
  });
});
