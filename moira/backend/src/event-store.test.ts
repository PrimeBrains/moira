// EventStore.saveJson durability witness (issue #16). The event log is now
// persisted via atomicWriteFileSync (temp→rename) instead of a plain
// writeFileSync, so a crash/kill mid-write can no longer leave a partial
// events.json. The OBSERVABLE output must be byte-identical to before —
// deterministic (ts,id) order, 2-space JSON, NO trailing newline — and no
// `.tmp-` residue may survive. (Cross-process lost-update coverage for the CLI's
// appendEvents read-modify-write lives in moira/cli/src/store-write-safety.test.ts;
// this file pins the store's own save-side contract.)

import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventStore } from './event-store.js';
import type { Event } from './types.js';

const ev = (id: string, ts: number): Event => ({
  id,
  ts,
  actor: { kind: 'human', id: 'me' },
  kind: 'transition',
  node: 'a',
  machine: 'lifecycle',
  to: 'implementing',
});

describe('EventStore.saveJson (atomic persistence — issue #16)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'moira-eventstore-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes 2-space JSON in deterministic (ts,id) order with NO trailing newline (byte-format unchanged)', () => {
    const store = new EventStore();
    store.append(ev('e2', 2));
    store.append(ev('e1', 1)); // inserted out of order — saveJson must sort
    const path = join(dir, 'events.json');
    store.saveJson(path);
    const raw = readFileSync(path, 'utf8');
    expect(raw).toBe(JSON.stringify([ev('e1', 1), ev('e2', 2)], null, 2)); // sorted, exact bytes
    expect(raw.endsWith('\n')).toBe(false);
  });

  it('leaves no `.tmp-` residue after saveJson', () => {
    const store = new EventStore();
    store.append(ev('e1', 1));
    store.saveJson(join(dir, 'events.json'));
    expect(readdirSync(dir).filter((f) => f.includes('.tmp-'))).toEqual([]);
  });

  it('round-trips through loadJson (save then load yields the same events)', () => {
    const store = new EventStore();
    store.append(ev('e1', 1));
    store.append(ev('e2', 2));
    const path = join(dir, 'events.json');
    store.saveJson(path);
    const reloaded = new EventStore();
    reloaded.loadJson(path);
    expect(reloaded.all()).toEqual([ev('e1', 1), ev('e2', 2)]);
  });
});
