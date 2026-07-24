// Cross-process write-safety witnesses for MoiraRepo's read-modify-write files
// (issue #16 events.json; issue #17 capacity/dates/milestones/labels/members/
// config). Each test spawns a REAL separate OS process that follows the exact
// advisory-lock protocol — wx-create `<path>.lock` under its own live pid, read
// the file, hold for a real wall-clock interval, write back via temp→rename,
// then unlink the lock — while the PARENT concurrently calls the corresponding
// MoiraRepo write. The parent's call is synchronous and blocks on the lock's
// retry loop until the child releases; asserting BOTH writers' records survive
// is the lost-update witness. It is NON-VACUOUS in the #15/#16 sense: with the
// lock disabled the parent would load the pre-child contents and clobber the
// child's write (or vice versa), dropping one record — the assertion would then
// fail. (corrections.json's own generalized-lock regression lives in
// correct.test.ts — 40 tests including its own real-child witness — so it is
// not re-exercised here.)

import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MoiraRepo } from './store.js';

describe('MoiraRepo cross-process write safety (issue #16/#17)', () => {
  let tmp: string;
  let repo: MoiraRepo;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'moira-write-safety-'));
    repo = new MoiraRepo(tmp);
    repo.init({ projectRoot: 'p', me: 'me' });
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  const HOLD_MS = 150; // comfortably under the ~900ms parent retry budget, over spawn overhead

  // Spawn a real child OS process holding `<dataPath>.lock` across a
  // read→(hold)→write of dataPath. `mutate` is a JS statement operating on the
  // parsed `data` (an array or object, matching the file's shape). Returns a
  // promise for the child's exit code.
  const spawnLockHolder = (dataPath: string, mutate: string): Promise<number | null> => {
    const childScript = [
      "const fs = require('fs');",
      `const dataPath = ${JSON.stringify(dataPath)};`,
      "const lockPath = dataPath + '.lock';",
      // (1) acquire — same wx-create protocol as MoiraRepo.acquireLock
      "fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, ts: Date.now() }), { flag: 'wx' });",
      // (2) read
      "const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));",
      // (3) hold — real wall-clock delay in a SEPARATE OS process
      `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${HOLD_MS});`,
      // (4) modify + write via temp→rename, same discipline as the store
      `${mutate};`,
      "const tmp = dataPath + '.tmp-child-' + process.pid;",
      "fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\\n', 'utf8');",
      "fs.renameSync(tmp, dataPath);",
      // (5) release
      'fs.unlinkSync(lockPath);',
    ].join('\n');
    const child = spawn(process.execPath, ['-e', childScript]);
    return new Promise<number | null>((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (code) => resolve(code));
    });
  };

  // Block until the child has actually created the lockfile, so the parent
  // genuinely contends — otherwise the parent could slip in first and the test
  // would degenerate into the purely-sequential case.
  const waitForLock = (lockPath: string): void => {
    const deadline = Date.now() + 2000;
    while (!existsSync(lockPath)) {
      if (Date.now() > deadline) throw new Error('child never created the lockfile — test setup failed');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
    }
  };

  // No temp/lock artifact may survive a completed write.
  const expectNoResidue = (): void => {
    const leftovers = readdirSync(join(tmp, '.moira')).filter(
      (f) => f.includes('.tmp-') || f.endsWith('.lock'),
    );
    expect(leftovers).toEqual([]);
  };

  it('events.json: appendEvents waits out a lock-holding child — BOTH events survive (#16)', async () => {
    const childExit = spawnLockHolder(
      repo.eventsPath,
      "data.push({ id: 'child-e', ts: 999, actor: { kind: 'human', id: 'child' }, kind: 'transition', node: 'a', machine: 'lifecycle', to: 'implementing' })",
    );
    waitForLock(`${repo.eventsPath}.lock`);
    repo.appendEvents([
      { id: 'parent-e', ts: 1, actor: { kind: 'human', id: 'me' }, kind: 'transition', node: 'a', machine: 'lifecycle', to: 'implementing' },
    ]);
    expect(await childExit).toBe(0);
    expect(repo.loadEvents().map((e) => e.id).sort()).toEqual(['child-e', 'parent-e']);
    expectNoResidue();
  }, 10000);

  it('capacity.json: appendCapacity waits out a lock-holding child — BOTH entries survive (#17)', async () => {
    const childExit = spawnLockHolder(
      repo.capacityPath,
      "data.push({ humanId: 'child', date: '2030-01-01', capacity: 0.5, reason: 'child', ts: 999 })",
    );
    waitForLock(`${repo.capacityPath}.lock`);
    repo.appendCapacity([{ humanId: 'parent', date: '2030-02-02', capacity: 0.7, reason: 'parent', ts: 1 }]);
    expect(await childExit).toBe(0);
    expect(repo.loadCapacity().map((c) => c.humanId).sort()).toEqual(['child', 'parent']);
    expectNoResidue();
  }, 10000);

  it('dates.json: appendDateEntries waits out a lock-holding child — BOTH entries survive (#17)', async () => {
    const childExit = spawnLockHolder(
      repo.datesPath,
      "data.push({ kind: 'target', date: '2030-01-01', reason: 'child', ts: 999 })",
    );
    waitForLock(`${repo.datesPath}.lock`);
    repo.appendDateEntries([{ kind: 'deadline', date: '2030-03-03', reason: 'parent', ts: 1 }]);
    expect(await childExit).toBe(0);
    expect(repo.loadDateEntries().map((d) => d.kind).sort()).toEqual(['deadline', 'target']);
    expectNoResidue();
  }, 10000);

  it('milestones.json: appendMilestoneEntries waits out a lock-holding child — BOTH entries survive (#17)', async () => {
    const childExit = spawnLockHolder(
      repo.milestonesPath,
      "data.push({ milestone: 'child-ms', nodes: ['x'], reason: 'child', ts: 999 })",
    );
    waitForLock(`${repo.milestonesPath}.lock`);
    repo.appendMilestoneEntries([{ milestone: 'parent-ms', nodes: ['y'], reason: 'parent', ts: 1 }]);
    expect(await childExit).toBe(0);
    expect(repo.loadMilestoneEntries().map((m) => m.milestone).sort()).toEqual(['child-ms', 'parent-ms']);
    expectNoResidue();
  }, 10000);

  it('labels.json: setNodeLabel waits out a lock-holding child — BOTH labels survive (#17)', async () => {
    const childExit = spawnLockHolder(repo.labelsPath, "data.nodeLabels['child'] = 'C'");
    waitForLock(`${repo.labelsPath}.lock`);
    repo.setNodeLabel('parent', 'P');
    expect(await childExit).toBe(0);
    expect(repo.loadLabels().nodeLabels).toEqual({ child: 'C', parent: 'P' });
    expectNoResidue();
  }, 10000);

  it('members.json: upsertMember waits out a lock-holding child — BOTH members survive (#17, 案A)', async () => {
    const childExit = spawnLockHolder(
      repo.membersPath,
      "data.push({ id: 'child', kind: 'human', label: 'Child' })",
    );
    waitForLock(`${repo.membersPath}.lock`);
    repo.upsertMember({ id: 'parent', kind: 'human', label: 'Parent' });
    expect(await childExit).toBe(0);
    expect(repo.loadMembers().map((m) => m.id).sort()).toEqual(['child', 'parent']);
    expectNoResidue();
  }, 10000);

  it('members.json: upsertMembers (import members path) waits out a lock-holding child — BOTH survive (#17, import lost-update fix)', async () => {
    const childExit = spawnLockHolder(
      repo.membersPath,
      "data.push({ id: 'child', kind: 'human', label: 'Child' })",
    );
    waitForLock(`${repo.membersPath}.lock`);
    repo.upsertMembers([{ id: 'imported', kind: 'human', label: 'Imported' }]);
    expect(await childExit).toBe(0);
    // With the OLD load-outside-lock import (`saveMembers(plan.members)`, whose
    // `existing` was read in the command before any lock), the parent would have
    // clobbered the child's 'child' with its wholesale save — this asserts the
    // concurrent `member add` survives the import commit.
    expect(repo.loadMembers().map((m) => m.id).sort()).toEqual(['child', 'imported']);
    expectNoResidue();
  }, 10000);

  it('config.json: updateConfig waits out a lock-holding child — BOTH fields survive (#17, 案A)', async () => {
    const childExit = spawnLockHolder(repo.configPath, "data.startDate = '2030-01-01'");
    waitForLock(`${repo.configPath}.lock`);
    repo.updateConfig({ asOf: '2031-02-02' });
    expect(await childExit).toBe(0);
    const cfg = repo.loadConfig();
    expect(cfg.startDate).toBe('2030-01-01'); // child's write survived
    expect(cfg.asOf).toBe('2031-02-02'); // parent's merge applied
    expect(cfg.me).toBe('me'); // untouched field preserved
    expectNoResidue();
  }, 10000);
});

// The RMW methods moved into MoiraRepo for #17 (案A) — direct, non-concurrent
// correctness of their return/merge semantics (the observable contract
// cmdMemberAdd / cmdConfigOrgCalendar depend on).
describe('MoiraRepo.upsertMember / updateConfig RMW semantics (issue #17 案A)', () => {
  let tmp: string;
  let repo: MoiraRepo;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'moira-rmw-'));
    repo = new MoiraRepo(tmp);
    repo.init({ projectRoot: 'p', me: 'me' });
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('upsertMember returns false on a fresh add and true on an in-place replace by id (order preserved)', () => {
    expect(repo.upsertMember({ id: 'a', kind: 'human', label: 'A' })).toBe(false);
    expect(repo.upsertMember({ id: 'b', kind: 'agent', label: 'B' })).toBe(false);
    expect(repo.upsertMember({ id: 'a', kind: 'human', label: 'A2' })).toBe(true); // replace
    expect(repo.loadMembers()).toEqual([
      { id: 'a', kind: 'human', label: 'A2' }, // replaced in place, still index 0
      { id: 'b', kind: 'agent', label: 'B' },
    ]);
  });

  it('upsertMembers bulk-upserts incoming onto the fresh roster (overwrite by id in place, append new, order preserved) and returns the merged roster', () => {
    expect(repo.upsertMember({ id: 'a', kind: 'human', label: 'A' })).toBe(false);
    expect(repo.upsertMember({ id: 'b', kind: 'agent', label: 'B' })).toBe(false);
    const merged = repo.upsertMembers([
      { id: 'b', kind: 'agent', label: 'B2', defaultCapacity: 0.5 }, // replace in place
      { id: 'c', kind: 'human', label: 'C' }, // append new
    ]);
    expect(merged).toEqual([
      { id: 'a', kind: 'human', label: 'A' },
      { id: 'b', kind: 'agent', label: 'B2', defaultCapacity: 0.5 }, // replaced, still index 1
      { id: 'c', kind: 'human', label: 'C' },
    ]);
    expect(repo.loadMembers()).toEqual(merged); // and persisted to disk (same as the return)
  });

  it('updateConfig merges the patch over the current config, persists it, and returns the merged config', () => {
    const merged = repo.updateConfig({ asOf: '2031-01-01' });
    expect(merged.me).toBe('me'); // untouched field preserved
    expect(merged.asOf).toBe('2031-01-01'); // patch applied
    expect(repo.loadConfig().asOf).toBe('2031-01-01'); // and persisted to disk
    // a second patch merges over the first, not over the init default
    repo.updateConfig({ orgCalendar: { enabled: false } });
    const cfg = repo.loadConfig();
    expect(cfg.asOf).toBe('2031-01-01'); // first patch still present
    expect(cfg.orgCalendar).toEqual({ enabled: false });
  });
});
