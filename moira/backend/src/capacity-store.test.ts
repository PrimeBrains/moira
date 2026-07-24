// c(i,d) resolution (A4 MODEL:35): explicit CapacityEntry always wins; the
// ABSENCE of an entry falls through to a caller-supplied fallback (issue #32 —
// orgCalendarFallback in org-calendar.ts is the motivating fallback, but this
// file tests capacity-store.ts's own contract independent of that calendar).

import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CapacityStore, DEFAULT_CAPACITY } from './capacity-store.js';
import type { CapacityEntry, CapacityLookup } from './types.js';

describe('CapacityStore.capacityOf (explicit entry vs fallback)', () => {
  it('defaults to DEFAULT_CAPACITY with no fallback and no entry (backward compatible)', () => {
    const store = new CapacityStore();
    expect(store.capacityOf('alice', '2026-07-06')).toBe(DEFAULT_CAPACITY);
  });

  it('an explicit entry always wins over the fallback, even a nonzero fallback', () => {
    const store = new CapacityStore();
    store.append({ humanId: 'alice', date: '2026-07-06', capacity: 0.5, reason: 'leave', ts: 1 });
    const fallback: CapacityLookup = () => 1.0;
    expect(store.capacityOf('alice', '2026-07-06', fallback)).toBe(0.5);
  });

  it('an explicit entry of 0 is never overridden by the fallback (c=0 is in-domain, MODEL:34)', () => {
    const store = new CapacityStore();
    store.append({ humanId: 'alice', date: '2026-07-06', capacity: 0, reason: 'holiday', ts: 1 });
    const fallback: CapacityLookup = () => 1.0;
    expect(store.capacityOf('alice', '2026-07-06', fallback)).toBe(0);
  });

  it('an unspecified (human, date) falls through to the fallback', () => {
    const store = new CapacityStore();
    const fallback: CapacityLookup = (humanId, date) => (humanId === 'alice' && date === '2026-07-04' ? 0 : 1.0);
    expect(store.capacityOf('alice', '2026-07-04', fallback)).toBe(0); // weekend-like fallback
    expect(store.capacityOf('alice', '2026-07-06', fallback)).toBe(1.0);
  });

  it('latest-ts entry wins among multiple entries for the same (human, date), fallback irrelevant once any entry exists', () => {
    const store = new CapacityStore();
    store.append({ humanId: 'alice', date: '2026-07-06', capacity: 0.3, reason: 'temporary-reduction', ts: 1 });
    store.append({ humanId: 'alice', date: '2026-07-06', capacity: 0.8, reason: 'temporary-reduction', ts: 2 });
    expect(store.capacityOf('alice', '2026-07-06', () => 1.0)).toBe(0.8);
  });
});

describe('CapacityStore.lookup (bound CapacityLookup, fallback passthrough)', () => {
  it('binds capacityOf with no fallback (backward compatible: defaults to DEFAULT_CAPACITY)', () => {
    const store = new CapacityStore();
    const lookup = store.lookup();
    expect(lookup('alice', '2026-07-06')).toBe(DEFAULT_CAPACITY);
  });

  it('passes the fallback through to every lookup call', () => {
    const store = new CapacityStore();
    store.append({ humanId: 'alice', date: '2026-07-06', capacity: 0.5, reason: 'leave', ts: 1 });
    const fallback: CapacityLookup = (_h, d) => (d === '2026-07-04' ? 0 : 1.0);
    const lookup = store.lookup(fallback);
    expect(lookup('alice', '2026-07-06')).toBe(0.5); // explicit entry still wins
    expect(lookup('alice', '2026-07-04')).toBe(0); // no entry → fallback
    expect(lookup('alice', '2026-07-05')).toBe(1.0); // no entry → fallback
  });
});

// issue #17 R5: capacity.json is now persisted via atomicWriteFileSync
// (temp→rename) — same durability treatment as EventStore.saveJson (#16). The
// observable output must stay byte-identical (2-space JSON, NO trailing newline,
// insertion order preserved by all()) and leave no `.tmp-` residue.
describe('CapacityStore.saveJson (atomic persistence — issue #17)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'moira-capacity-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const entry = (humanId: string, date: string, capacity: number, ts: number): CapacityEntry => ({
    humanId,
    date,
    capacity,
    reason: 'temporary-reduction',
    ts,
  });

  it('writes 2-space JSON with NO trailing newline, entries in append order (byte-format unchanged)', () => {
    const store = new CapacityStore();
    store.append(entry('alice', '2026-08-01', 0.5, 1));
    store.append(entry('bob', '2026-08-02', 0.8, 2));
    const path = join(dir, 'capacity.json');
    store.saveJson(path);
    const raw = readFileSync(path, 'utf8');
    expect(raw).toBe(
      JSON.stringify([entry('alice', '2026-08-01', 0.5, 1), entry('bob', '2026-08-02', 0.8, 2)], null, 2),
    );
    expect(raw.endsWith('\n')).toBe(false);
  });

  it('leaves no `.tmp-` residue after saveJson', () => {
    const store = new CapacityStore();
    store.append(entry('alice', '2026-08-01', 0.5, 1));
    store.saveJson(join(dir, 'capacity.json'));
    expect(readdirSync(dir).filter((f) => f.includes('.tmp-'))).toEqual([]);
  });

  it('round-trips through loadJson (save then load yields the same entries)', () => {
    const store = new CapacityStore();
    store.append(entry('alice', '2026-08-01', 0.5, 1));
    store.append(entry('bob', '2026-08-02', 0.8, 2));
    const path = join(dir, 'capacity.json');
    store.saveJson(path);
    const reloaded = new CapacityStore();
    reloaded.loadJson(path);
    expect(reloaded.all()).toEqual([
      entry('alice', '2026-08-01', 0.5, 1),
      entry('bob', '2026-08-02', 0.8, 2),
    ]);
  });
});
