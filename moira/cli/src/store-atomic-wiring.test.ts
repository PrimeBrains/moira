// CLI store-layer atomic-replace WIRING witness (issue #17).
//
// The backend store-atomic-wiring.test.ts pins that EventStore/CapacityStore
// .saveJson route through atomicWriteFileSync (events + capacity). But the CLI
// MoiraRepo writes the OTHER five .moira files — dates / milestones / labels /
// members / config — by calling moira-backend's atomicWriteFileSync DIRECTLY
// (store.ts writeConfig/appendDateEntries/appendMilestoneEntries/writeLabels/
// writeMembers), and NONE of the existing CLI tests guard that torn-write wiring:
// the byte-format assertions and the cross-process lost-update witnesses in
// store-write-safety.test.ts all still pass if a writer is reverted to a plain
// writeFileSync — a plain sync write is byte-identical, leaves no `.tmp-`
// residue, and the advisory lock still serializes the RMW, so both concurrent
// records survive and `expectNoResidue` holds. So the lost-update (lock) half of
// the "均一適用 / uniform application" claim was witnessed 7/7 files, but the
// torn-write (atomic-replace) half was witnessed for only events + capacity.
// This file closes that reversion-sensitivity gap for the remaining five: it
// mocks moira-backend's atomicWriteFileSync with a CALL-THROUGH spy and asserts
// each of the five CLI writers routes its save through it EXACTLY once (and, via
// the call-through, writes the exact trailing-`\n` bytes that land on disk).
// Reverting any of these writers to a plain writeFileSync makes
// toHaveBeenCalledTimes(1) drop to 0 — a genuine reversion-sensitive witness.
//
// events + capacity go through the backend stores (EventStore/CapacityStore),
// whose OWN internal atomic-write import ('./atomic-write.js') is a separate
// module binding this backend-barrel mock intentionally does NOT intercept, so
// this file does not (and need not) re-witness them — the backend witness does.
// (vi.mock is hoisted above the imports by vitest at runtime; imports stay first
// to satisfy ESLint import/first.)

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { atomicWriteFileSync } from 'moira-backend';
import { MoiraRepo } from './store.js';

vi.mock('moira-backend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('moira-backend')>();
  return { ...actual, atomicWriteFileSync: vi.fn(actual.atomicWriteFileSync) };
});

const spy = vi.mocked(atomicWriteFileSync);

describe('CLI MoiraRepo direct-write atomic wiring (issue #17)', () => {
  let tmp: string;
  let repo: MoiraRepo;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'moira-cli-atomic-wiring-'));
    repo = new MoiraRepo(tmp);
    repo.init({ projectRoot: 'p', me: 'me' });
    spy.mockClear(); // drop init's seed writes; the call-through implementation is retained
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  // Each writer: (1) routes its save through atomicWriteFileSync EXACTLY once —
  // reverting the writer to a plain writeFileSync makes this drop to 0; (2) the
  // spied call's bytes equal what actually landed on disk (call-through); (3) the
  // on-disk bytes are the trailing-`\n` CLI store-less format (byte-format guard).

  it('appendDateEntries persists dates.json via atomicWriteFileSync (#17)', () => {
    repo.appendDateEntries([{ kind: 'target', date: '2030-01-01', reason: 'r', ts: 1 }]);
    const onDisk = readFileSync(repo.datesPath, 'utf8');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(repo.datesPath, onDisk);
    expect(onDisk).toBe(`${JSON.stringify(repo.loadDateEntries(), null, 2)}\n`);
  });

  it('appendMilestoneEntries persists milestones.json via atomicWriteFileSync (#17)', () => {
    repo.appendMilestoneEntries([{ milestone: 'ms', nodes: ['x'], reason: 'r', ts: 1 }]);
    const onDisk = readFileSync(repo.milestonesPath, 'utf8');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(repo.milestonesPath, onDisk);
    expect(onDisk).toBe(`${JSON.stringify(repo.loadMilestoneEntries(), null, 2)}\n`);
  });

  it('setNodeLabel persists labels.json via atomicWriteFileSync (#17)', () => {
    repo.setNodeLabel('n1', 'L1');
    const onDisk = readFileSync(repo.labelsPath, 'utf8');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(repo.labelsPath, onDisk);
    expect(onDisk).toBe(`${JSON.stringify(repo.loadLabels(), null, 2)}\n`);
  });

  it('upsertMember persists members.json via atomicWriteFileSync (#17)', () => {
    repo.upsertMember({ id: 'a', kind: 'human', label: 'A' });
    const onDisk = readFileSync(repo.membersPath, 'utf8');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(repo.membersPath, onDisk);
    expect(onDisk).toBe(`${JSON.stringify(repo.loadMembers(), null, 2)}\n`);
  });

  it('updateConfig persists config.json via atomicWriteFileSync (#17)', () => {
    const merged = repo.updateConfig({ asOf: '2031-02-02' });
    const onDisk = readFileSync(repo.configPath, 'utf8');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(repo.configPath, onDisk);
    expect(onDisk).toBe(`${JSON.stringify(merged, null, 2)}\n`);
  });
});
