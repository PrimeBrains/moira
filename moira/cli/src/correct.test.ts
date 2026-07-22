// `moira correct` (issue #11 R6/R13) — v21/v22 §2.10 universal correction
// principle, CLI wiring end to end. Covers:
//   - corrections.json (R7): init seed + append-only round-trip (store-level)
//   - --reason required / --patch·--nullify mutual exclusivity
//   - patch form: k=v→EventPatch (amount/ts numeric conversion, YYYY-MM-DD→
//     epoch, id/kind/actor rejected)
//   - nullify form
//   - unknown-target ("幽霊訂正") warning — still appends (§2.10: 追記可能・
//     可視ギャップ)
//   - locked-target ("施錠対象"／"音の鳴る訂正") warning (I4/§2.10)
//   - confirmDestructive reuse: --yes / non-TTY pass-through (this suite's own
//     process is not a TTY — mirrors commands-write-safety.test.ts's item 7
//     pattern, no readline mocking needed)
//   - `moira log` prints each event's id (target discovery, no --json needed)
//   - report reflection: correctionMeter goes non-zero after a correct

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fold } from 'moira-backend';
import type { Correction, Event } from 'moira-backend';
import { runCli } from './commands.js';
import { CliError } from './errors.js';
import { MoiraRepo } from './store.js';

describe('MoiraRepo corrections.json (append-only third tier — issue #11 R7)', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'moira-corrections-'));
  });
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('init seeds an empty corrections.json', () => {
    const repo = new MoiraRepo(tmp);
    repo.init({ projectRoot: 'p', me: 'me' });
    expect(repo.loadCorrections()).toEqual([]);
  });

  it('appendCorrections preserves prior entries (append-only round-trip)', () => {
    const repo = new MoiraRepo(tmp);
    repo.init({ projectRoot: 'p', me: 'me' });
    const c1: Correction = {
      id: 'c1',
      ts: 1,
      actor: { kind: 'human', id: 'me' },
      targetEventId: 'e1',
      reason: 'r1',
      correctionKind: 'nullify',
    };
    const c2: Correction = {
      id: 'c2',
      ts: 2,
      actor: { kind: 'human', id: 'me' },
      targetEventId: 'e2',
      reason: 'r2',
      correctionKind: 'patch',
      patch: { amount: 3 },
    };
    repo.appendCorrections([c1]);
    repo.appendCorrections([c2]);
    expect(repo.loadCorrections()).toEqual([c1, c2]);
  });

  // issue #11 #9: loadCorrections fails LOUDLY (a clear CliError) on a
  // malformed corrections.json, instead of crashing deep inside fold/derive
  // with an opaque TypeError or silently feeding garbage into the correction
  // layer.
  describe('loadCorrections schema validation (issue #11 #9)', () => {
    it('rejects invalid JSON', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      writeFileSync(repo.correctionsPath, 'not json{{{', 'utf8');
      expect(() => repo.loadCorrections()).toThrow(CliError);
    });

    it('rejects a non-array top level', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      writeFileSync(repo.correctionsPath, '{"not":"an array"}', 'utf8');
      expect(() => repo.loadCorrections()).toThrow(CliError);
    });

    it('rejects a record missing a required field', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      writeFileSync(repo.correctionsPath, JSON.stringify([{ id: 'c1', ts: 1 }]), 'utf8');
      expect(() => repo.loadCorrections()).toThrow(CliError);
    });

    it('rejects an invalid correctionKind', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      writeFileSync(
        repo.correctionsPath,
        JSON.stringify([
          {
            id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' },
            targetEventId: 'e1', reason: 'r', correctionKind: 'bogus',
          },
        ]),
        'utf8',
      );
      expect(() => repo.loadCorrections()).toThrow(CliError);
    });

    it('rejects a patch-kind record missing its patch object', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      writeFileSync(
        repo.correctionsPath,
        JSON.stringify([
          {
            id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' },
            targetEventId: 'e1', reason: 'r', correctionKind: 'patch',
          },
        ]),
        'utf8',
      );
      expect(() => repo.loadCorrections()).toThrow(CliError);
    });
  });

  it('appendCorrections replaces the file atomically (no leftover temp file after a normal write)', () => {
    const repo = new MoiraRepo(tmp);
    repo.init({ projectRoot: 'p', me: 'me' });
    repo.appendCorrections([
      {
        id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' },
        targetEventId: 'e1', reason: 'r', correctionKind: 'nullify',
      },
    ]);
    const files = readdirSync(join(tmp, '.moira'));
    expect(files).toContain('corrections.json');
    expect(files.some((f) => f.includes('.tmp-'))).toBe(false);
  });

  // issue #15 R3/R4: corrections.json's advisory lock. appendCorrections'
  // load→append→write critical section is guarded by an exclusive-create
  // (`wx`) lockfile (`corrections.json.lock`) so two concurrent writers can
  // never both load the same prior contents and have the later save silently
  // discard the earlier writer's append (lost update) — see store.ts's
  // appendCorrections doc comment for the lock/atomic-rename role split.
  describe('advisory lock (issue #15 R3/R4)', () => {
    it('two MoiraRepo instances alternating appends on the same repo both survive, and no lockfile is left behind', () => {
      // Not true multiprocess (Node is single-threaded here), but this is a
      // real witness of the mechanism the task calls out as sufficient when
      // true multiprocess is impractical: TWO INDEPENDENT MoiraRepo instances
      // pointed at the SAME .moira dir, alternating appends — each call must
      // acquire, use, and cleanly release the lock so the NEXT instance's
      // call is never blocked by a leftover lock, and BOTH records must
      // survive in the final file (no lost update across instances).
      const repoA = new MoiraRepo(tmp);
      repoA.init({ projectRoot: 'p', me: 'me' });
      const repoB = new MoiraRepo(tmp);
      repoA.appendCorrections([
        { id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' }, targetEventId: 'e1', reason: 'r1', correctionKind: 'nullify' },
      ]);
      repoB.appendCorrections([
        { id: 'c2', ts: 2, actor: { kind: 'human', id: 'me' }, targetEventId: 'e2', reason: 'r2', correctionKind: 'nullify' },
      ]);
      repoA.appendCorrections([
        { id: 'c3', ts: 3, actor: { kind: 'human', id: 'me' }, targetEventId: 'e3', reason: 'r3', correctionKind: 'nullify' },
      ]);
      expect(repoB.loadCorrections().map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
      const files = readdirSync(join(tmp, '.moira'));
      expect(files.some((f) => f.endsWith('.lock'))).toBe(false); // no leftover lock
      expect(files.some((f) => f.includes('.tmp-'))).toBe(false); // no leftover temp file either
    });

    it('a lock held by a LIVE pid blocks a writer through the retry budget, then throws CliError — no partial/lost write', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      const lockPath = `${repo.correctionsPath}.lock`;
      // Our own test process — guaranteed alive — holds the lock, freshly
      // timestamped (so neither the pid-liveness nor the mtime staleness
      // trigger clears it).
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid, ts: Date.now() }), 'utf8');
      const t0 = Date.now();
      expect(() =>
        repo.appendCorrections([
          { id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' }, targetEventId: 'e1', reason: 'r', correctionKind: 'nullify' },
        ]),
      ).toThrow(CliError);
      const elapsedMs = Date.now() - t0;
      // Proves it actually RETRIED with backoff rather than failing instantly
      // (an immediate single-attempt failure would be well under 10ms).
      expect(elapsedMs).toBeGreaterThan(50);
      // No lost/partial write — corrections.json is untouched (still the
      // init-seeded empty array), and the (still-live) lock is left in place
      // (this call never acquired it, so it must not delete someone else's
      // lock on its way out).
      expect(repo.loadCorrections()).toEqual([]);
      expect(existsSync(lockPath)).toBe(true);
    });

    it('a lock held by a DEAD pid is treated as stale and taken over — the append still succeeds', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      const lockPath = `${repo.correctionsPath}.lock`;
      // A pid guaranteed dead by the time we read it: spawnSync blocks until
      // the child has already exited, so its pid is free for staleness
      // detection to identify via ESRCH.
      const dead = spawnSync(process.execPath, ['-e', '0']);
      const deadPid = dead.pid;
      expect(typeof deadPid).toBe('number');
      writeFileSync(lockPath, JSON.stringify({ pid: deadPid, ts: Date.now() }), 'utf8');
      expect(() =>
        repo.appendCorrections([
          { id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' }, targetEventId: 'e1', reason: 'r', correctionKind: 'nullify' },
        ]),
      ).not.toThrow();
      expect(repo.loadCorrections().map((c) => c.id)).toEqual(['c1']);
      expect(existsSync(lockPath)).toBe(false); // released after the (stolen-then-used) critical section
    });

    it('a stale-by-AGE lock (old mtime, even with a live pid) is also taken over', () => {
      const repo = new MoiraRepo(tmp);
      repo.init({ projectRoot: 'p', me: 'me' });
      const lockPath = `${repo.correctionsPath}.lock`;
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid, ts: Date.now() }), 'utf8');
      const old = new Date(Date.now() - 60_000); // well past the staleness threshold
      utimesSync(lockPath, old, old);
      expect(() =>
        repo.appendCorrections([
          { id: 'c1', ts: 1, actor: { kind: 'human', id: 'me' }, targetEventId: 'e1', reason: 'r', correctionKind: 'nullify' },
        ]),
      ).not.toThrow();
      expect(repo.loadCorrections().map((c) => c.id)).toEqual(['c1']);
    });
  });
});

describe('moira correct (CLI, issue #11 R6)', () => {
  const cwd0 = process.cwd();
  let tmp: string;
  let savedMoiraDir: string | undefined;
  let stderrBuf: string[];

  beforeEach(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'moira-correct-'));
    process.chdir(tmp);
    // Isolate from the parent shell's MOIRA_DIR (resolveMoiraHome honors it
    // above the cwd walk) — same discipline as commands-write-safety.test.ts.
    savedMoiraDir = process.env.MOIRA_DIR;
    delete process.env.MOIRA_DIR;
    // Strictly-increasing mocked clock: several write commands run back-to-back
    // in-process here, and realStamper()'s (ts,id) tie-break can otherwise
    // scramble ordering if two calls land in the same real millisecond.
    let clock = Date.parse('2026-07-18T00:00:00Z');
    vi.spyOn(Date, 'now').mockImplementation(() => (clock += 1000));
    await runCli(['init', '--me', 'me', '--root', 'p']);
    stderrBuf = [];
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      stderrBuf.push(String(chunk));
      return true;
    });
  });
  afterEach(() => {
    process.chdir(cwd0);
    rmSync(tmp, { recursive: true, force: true });
    vi.restoreAllMocks();
    if (savedMoiraDir === undefined) delete process.env.MOIRA_DIR;
    else process.env.MOIRA_DIR = savedMoiraDir;
  });

  const stderrText = (): string => stderrBuf.join('');
  const events = (): Event[] =>
    JSON.parse(readFileSync(join(tmp, '.moira', 'events.json'), 'utf8')) as Event[];
  const corrections = (): Correction[] =>
    JSON.parse(readFileSync(join(tmp, '.moira', 'corrections.json'), 'utf8')) as Correction[];

  it('--reason is required (absent/blank rejected without appending)', async () => {
    await runCli(['add', 'a', '--estimate', '2']);
    const target = events()[0]!.id;
    await expect(runCli(['correct', target, '--patch', 'amount=1'])).rejects.toThrow(CliError);
    await expect(
      runCli(['correct', target, '--reason', '   ', '--patch', 'amount=1']),
    ).rejects.toThrow(CliError);
    expect(corrections()).toEqual([]);
  });

  it('--patch and --nullify are mutually exclusive — neither, and both, are rejected', async () => {
    await runCli(['add', 'a', '--estimate', '2']);
    const target = events()[0]!.id;
    await expect(runCli(['correct', target, '--reason', 'r'])).rejects.toThrow(CliError); // neither
    await expect(
      runCli(['correct', target, '--reason', 'r', '--patch', 'amount=1', '--nullify']),
    ).rejects.toThrow(CliError); // both
    expect(corrections()).toEqual([]);
  });

  it('a stray extra positional after event-id is rejected (parseArgs "--patch a=1 b=2" would otherwise silently drop b=2)', async () => {
    await runCli(['add', 'a', '--estimate', '2']);
    const target = events()[0]!.id;
    await expect(
      runCli(['correct', target, 'stray', '--reason', 'r', '--patch', 'amount=1']),
    ).rejects.toThrow(CliError);
    expect(corrections()).toEqual([]);
  });

  describe('patch form', () => {
    it('records a value correction that round-trips through corrections.json and is visible to fold', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      const costEv = events().find((e) => e.kind === 'cost')!;
      await runCli([
        'correct',
        costEv.id,
        '--reason',
        '実績の入力ミス（5MDではなく0.5MD が正しい）',
        '--patch',
        'amount=0.5',
      ]);
      const recs = corrections();
      expect(recs).toHaveLength(1);
      expect(recs[0]).toMatchObject({
        targetEventId: costEv.id,
        correctionKind: 'patch',
        reason: '実績の入力ミス（5MDではなく0.5MD が正しい）',
        patch: { amount: 0.5 },
      });
      expect(fold(events(), recs).nodes.get('a')!.ownCost).toBe(0.5);
    });

    it('converts amount to a number and ts to epoch ms (numeric literal or YYYY-MM-DD)', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      const costEv = events().find((e) => e.kind === 'cost')!;
      await runCli([
        'correct',
        costEv.id,
        '--reason',
        'r',
        '--patch',
        'amount=1.25',
        '--patch',
        'ts=2026-08-01',
      ]);
      const rec = corrections()[0]!;
      expect(rec.correctionKind).toBe('patch');
      if (rec.correctionKind !== 'patch') throw new Error('unreachable');
      // EventPatch is a per-kind structural partial with no discriminant of
      // its own (patches don't carry `kind`) — this correction targets a cost
      // event, so the k=v map is known (not statically provable) to carry
      // `amount`/`ts`.
      const patch = rec.patch as { amount?: number; ts?: number };
      expect(patch.amount).toBe(1.25);
      expect(patch.ts).toBe(Date.parse('2026-08-01T00:00:00Z'));
    });

    it('rejects id/kind as patch keys (identity fields — §2.10 EventPatch)', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'id=x']),
      ).rejects.toThrow(CliError);
      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'kind=cost']),
      ).rejects.toThrow(CliError);
      expect(corrections()).toEqual([]);
    });

    it('rejects a non-numeric amount and a non-numeric/non-date ts', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'amount=abc']),
      ).rejects.toThrow(CliError);
      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'ts=not-a-date']),
      ).rejects.toThrow(CliError);
      expect(corrections()).toEqual([]);
    });

    // issue #11 #8: actor is patchable per MODEL §2.10 (i) ("amount・node・
    // ts・actor・凍結値等") — a prior version of this CLI wrongly rejected it.
    it('accepts and type-converts actor as an Actor object (human:<id>/agent:<id>)', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await runCli(['correct', target, '--reason', 'r', '--patch', 'actor=agent:bot']);
      const rec = corrections()[0]!;
      if (rec.correctionKind !== 'patch') throw new Error('unreachable');
      expect(rec.patch).toMatchObject({ actor: { kind: 'agent', id: 'bot' } });
    });

    it('accepts assignee/reviewer as Actor objects, and "null" as the §2.8 release sentinel', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await runCli([
        'correct', target, '--reason', 'r',
        '--patch', 'assignee=human:alice',
        '--patch', 'reviewer=null',
      ]);
      const rec = corrections()[0]!;
      if (rec.correctionKind !== 'patch') throw new Error('unreachable');
      expect(rec.patch).toMatchObject({
        assignee: { kind: 'human', id: 'alice' },
        reviewer: null,
      });
    });

    it('converts frozenBudget to a number', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await runCli(['correct', target, '--reason', 'r', '--patch', 'frozenBudget=3']);
      const rec = corrections()[0]!;
      if (rec.correctionKind !== 'patch') throw new Error('unreachable');
      const patch = rec.patch as { frozenBudget?: number };
      expect(patch.frozenBudget).toBe(3);
      expect(typeof patch.frozenBudget).toBe('number');
    });

    it('converts children to a validated JSON array, and rejects malformed JSON/shape', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await runCli([
        'correct', target, '--reason', 'r',
        '--patch', 'children=[{"node":"x","estimate":2},{"node":"y"}]',
      ]);
      const rec = corrections()[0]!;
      if (rec.correctionKind !== 'patch') throw new Error('unreachable');
      const patch = rec.patch as { children?: Array<{ node: string; estimate?: number }> };
      expect(patch.children).toEqual([{ node: 'x', estimate: 2 }, { node: 'y' }]);

      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'children=not-json']),
      ).rejects.toThrow(CliError);
      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'children=[1,2]']),
      ).rejects.toThrow(CliError);
    });

    it('converts an unrecognized key\'s "true"/"false" to a boolean', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      await runCli(['correct', target, '--reason', 'r', '--patch', 'someFlag=true']);
      const rec = corrections()[0]!;
      if (rec.correctionKind !== 'patch') throw new Error('unreachable');
      expect((rec.patch as Record<string, unknown>).someFlag).toBe(true);
    });

    it('rejects --patch with no k=v pairs given', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      // no --patch flag at all AND no --nullify → mutual-exclusivity rejection
      // (covered above); this checks the "at least one field" guard is wired
      // by feeding a key this layer itself rejects, leaving nothing behind.
      await expect(
        runCli(['correct', target, '--reason', 'r', '--patch', 'id=x']),
      ).rejects.toThrow(/識別子|k=v/);
    });
  });

  describe('nullify form', () => {
    it('records a nullify correction that round-trips, and the effective fold drops the target event', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cancel', 'a']); // mistaken cancel
      const cancelEv = events().find((e) => e.kind === 'transition' && e.to === 'cancelled')!;
      await runCli(['correct', cancelEv.id, '--reason', 'cancel は誤記だった（§2.5 誤記表明による回復）', '--nullify']);
      const recs = corrections();
      expect(recs).toHaveLength(1);
      expect(recs[0]!.correctionKind).toBe('nullify');
      expect(fold(events(), recs).nodes.get('a')!.lifecycle).not.toBe('cancelled');
    });
  });

  describe('unknown-target ("幽霊訂正") warning', () => {
    it('warns but still appends — §2.10 permits a correction naming an id not (yet) in the log', async () => {
      await expect(
        runCli(['correct', 'nonexistent-id', '--reason', 'r', '--patch', 'amount=1']),
      ).resolves.not.toThrow();
      expect(stderrText()).toContain('幽霊訂正');
      expect(corrections()).toHaveLength(1);
    });
  });

  describe('locked-target warning (I4/§2.10 「音の鳴る訂正」)', () => {
    it('warns when the target event\'s subject node is already implemented/accepted', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      await runCli(['done', 'a']);
      await runCli(['accept', 'a']);
      const costEv = events().find((e) => e.kind === 'cost')!;
      await runCli(['correct', costEv.id, '--reason', 'r', '--patch', 'amount=1']);
      expect(stderrText()).toContain('施錠対象');
      expect(stderrText()).toContain('音の鳴る訂正');
      expect(corrections()).toHaveLength(1); // non-TTY → warned, then still proceeds
    });

    it('does NOT warn 施錠対象 when the target node has not reached implemented/accepted', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']); // node 'a' stays pending — never assigned/started
      const costEv = events().find((e) => e.kind === 'cost')!;
      await runCli(['correct', costEv.id, '--reason', 'r', '--patch', 'amount=1']);
      expect(stderrText()).not.toContain('施錠対象');
    });
  });

  describe('confirmDestructive reuse — --yes / non-TTY pass-through', () => {
    it('this test process is not a TTY, so a locked-target correct proceeds WITHOUT hanging or requiring --yes', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      await runCli(['done', 'a']);
      const costEv = events().find((e) => e.kind === 'cost')!;
      await expect(
        runCli(['correct', costEv.id, '--reason', 'r', '--patch', 'amount=1']),
      ).resolves.not.toThrow();
      expect(corrections()).toHaveLength(1);
    });

    it('--yes/-y are accepted flags (harmless no-op off a TTY, must not break parsing)', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      const costEv = events().find((e) => e.kind === 'cost')!;
      await expect(
        runCli(['correct', costEv.id, '--reason', 'r', '--patch', 'amount=1', '--yes']),
      ).resolves.not.toThrow();
      await runCli(['add', 'b', '--estimate', '1']);
      await runCli(['cost', 'b', '1']);
      const costEv2 = events().find((e) => e.kind === 'cost' && e.node === 'b')!;
      await expect(
        runCli(['correct', costEv2.id, '--reason', 'r', '--nullify', '-y']),
      ).resolves.not.toThrow();
    });
  });

  describe('moira log — event id discovery (issue #11 R6, no --json needed)', () => {
    it('prints each event\'s id in brackets so it can be fed straight into `moira correct`', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      const target = events()[0]!.id;
      const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
      await runCli(['log']);
      const printed = stdout.mock.calls.map((c) => String(c[0])).join('');
      expect(printed).toContain(`[${target}]`);
    });
  });

  describe('report reflection — correctionMeter goes non-zero after a correct', () => {
    it('moira report --json carries a non-zero correctionMeter.total after a correct lands', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      const costEv = events().find((e) => e.kind === 'cost')!;

      let printed = '';
      {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((s: unknown) => {
          printed += String(s);
          return true;
        });
        await runCli(['report', '--json']);
        stdout.mockRestore();
      }
      const before = JSON.parse(printed) as { correctionMeter: { total: number } };
      expect(before.correctionMeter.total).toBe(0);

      await runCli(['correct', costEv.id, '--reason', 'r', '--patch', 'amount=1']);

      printed = '';
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((s: unknown) => {
        printed += String(s);
        return true;
      });
      await runCli(['report', '--json']);
      stdout.mockRestore();
      const after = JSON.parse(printed) as { correctionMeter: { total: number } };
      expect(after.correctionMeter.total).toBe(1);
    });
  });

  // issue #11 #7: corrections must be wired into EVERY existing derive()/
  // fold() call site, not just `report`/`correct`'s own lock check — a
  // "split-brain" where `report` saw a correction but every other command
  // still read the raw log (foldRepo/buildDeriveOptions close this gap).
  describe('existing commands observe corrections (issue #11 #7 — no split-brain)', () => {
    it('moira show reflects a cost correction (2 → 0.5) via derive()', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cost', 'a', '2']);
      const costEv = events().find((e) => e.kind === 'cost')!;

      let printed = '';
      {
        const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((s: unknown) => {
          printed += String(s);
          return true;
        });
        await runCli(['show', '--json']);
        stdout.mockRestore();
      }
      expect((JSON.parse(printed) as { ac: number }).ac).toBe(2);

      await runCli(['correct', costEv.id, '--reason', '実績の入力ミス', '--patch', 'amount=0.5']);

      printed = '';
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((s: unknown) => {
        printed += String(s);
        return true;
      });
      await runCli(['show', '--json']);
      stdout.mockRestore();
      expect((JSON.parse(printed) as { ac: number }).ac).toBe(0.5);
    });

    it('nullifying a mistaken cancel lets a subsequent lifecycle command see the recovered (non-cancelled) state', async () => {
      await runCli(['add', 'a', '--estimate', '2']);
      await runCli(['cancel', 'a']); // mistaken cancel
      const cancelEv = events().find((e) => e.kind === 'transition' && e.to === 'cancelled')!;

      // Before the fix: cmdLifecycle's terminality guard read the RAW log
      // (fold(repo.loadEvents())), so it would still see 'cancelled' here and
      // reject `start` even after the nullify below landed in corrections.json.
      await runCli(['correct', cancelEv.id, '--reason', 'cancel は誤記だった（§2.5 誤記表明による回復）', '--nullify']);

      await expect(runCli(['start', 'a'])).resolves.not.toThrow();
      expect(events().some((e) => e.kind === 'transition' && e.to === 'implementing')).toBe(true);
    });
  });
});
