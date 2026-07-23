// .moira/ repository — the per-repo data dir the CLI reads and appends to.
//   events.json   append-only log of the four events (single source of truth)
//   corrections.json  v21/v22 §2.10 correction (third) tier — append-only,
//                 reason-required, targets a first-tier event by id
//                 (CorrectionNullify | CorrectionPatch). Same "load all →
//                 append → save all" discipline as dates.json/milestones.json
//                 below (no latest-wins collapse at the storage layer — that
//                 happens inside fold, per targetEventId).
//   capacity.json c(i,d) second tier (CapacityEntry[])
//   dates.json    deadline / target-date second tier (R-T6 MODEL:233-240;
//                 append-only, reason-stamped, timestamped — R-U14-isomorphic,
//                 project-level single via latest-ts resolution)
//   milestones.json  milestone (name + constituent node-id bundle) second tier
//                 (issue #35). Same append-only/reason-stamped/timestamped/
//                 latest-ts-wins discipline as dates.json — but keyed per
//                 MILESTONE NAME (many milestones can coexist, unlike the
//                 project-level single deadline/target). Deliberately NO date
//                 or buffer field: MODEL §7#12 explicitly deferred that: a
//                 milestone's "end" is DERIVED (see backend
//                 derivations/milestone-rollup.ts), never a stored input.
//   labels.json   presentation-only display labels (NOT model data)
//   members.json  the ROSTER — who exists to be assigned/scheduled (issue #11).
//                 A separate storage tier, NOT events and NOT a calendar concept:
//                 the engine still sees only c(i,d) (D-16/D-30). Used to seed the
//                 UI roster so no name the user never supplied leaks into a view.
//   config.json   projectRoot / me / default asOf / orgCalendar.enabled (#32)
// Uses the engine's EventStore/CapacityStore for load+save (deterministic order).

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { CapacityStore, EventStore } from 'moira-backend';
import type { CapacityEntry, Correction, Event, MilestoneDefinition, NodeId } from 'moira-backend';
import { CliError } from './errors.js';

export interface MoiraConfig {
  projectRoot: string;
  me: string;
  asOf?: string;
  startDate?: string;
  /** Org calendar (weekends + JP holidays) as the capacity fallback (issue #32).
   *  UNSET → enabled (default-on): `cfg.orgCalendar?.enabled !== false` is the
   *  read discipline everywhere this is consulted. `moira config org-calendar
   *  off` is the only way to disable it. */
  orgCalendar?: { enabled: boolean };
}

export interface Labels {
  nodeLabels: Record<string, string>;
  actorLabels: Record<string, string>;
}

/**
 * A roster member — a person or agent that exists to be assigned/scheduled.
 * This is deliberately NOT an event and NOT a calendar concept: the engine reads
 * only c(i,d) (D-16), and membership lives in its own storage tier (D-30). It
 * exists so the UI can show ONLY the names the user actually supplied — never the
 * demo roster — even before any capacity/assignment data exists.
 *   defaultCapacity is retained for display/future use; v1 does NOT materialize it
 *   into c-entries (the engine default stays 1.0). Omit the key when absent
 *   (exactOptionalPropertyTypes).
 */
export interface Member {
  id: string;
  kind: 'human' | 'agent';
  label: string;
  defaultCapacity?: number;
}

/**
 * R-T6 reference dates (MODEL:233-240, §2.1#3 MODEL:67): the project deadline
 * (externally imposed hard ceiling) and target date (human-managed planned-
 * completion reference) are second-tier CONFIGURATION INPUTS — never events.
 * Stored as an append-only, reason-stamped, timestamped history (isomorphic to
 * capacity.json's R-U14 discipline); "project-level single" is realized by
 * latest-ts resolution, exactly like CapacityStore.capacityOf.
 */
export interface ReferenceDateEntry {
  kind: 'deadline' | 'target';
  date: string; // IsoDate 'YYYY-MM-DD'
  reason: string;
  ts: number;
}

export interface ReferenceDates {
  deadline?: string;
  targetDate?: string;
}

/** Strict 'YYYY-MM-DD' — shape AND calendar existence (rejects 2026-02-30). */
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) === s;
}

/** Latest-ts entry wins per kind (ties: the later entry, like CapacityStore). */
export function resolveReferenceDates(
  entries: readonly ReferenceDateEntry[],
): ReferenceDates {
  let deadline: ReferenceDateEntry | undefined;
  let target: ReferenceDateEntry | undefined;
  for (const e of entries) {
    if (e.kind === 'deadline' && (deadline === undefined || e.ts >= deadline.ts)) deadline = e;
    if (e.kind === 'target' && (target === undefined || e.ts >= target.ts)) target = e;
  }
  return {
    ...(deadline !== undefined ? { deadline: deadline.date } : {}),
    ...(target !== undefined ? { targetDate: target.date } : {}),
  };
}

/**
 * A milestone (issue #35) — a NAME + a constituent node-id bundle only.
 * Deliberately NO date/buffer field (MODEL §7#12 explicitly deferred that;
 * adding one here would require a canon amendment). Stored as an append-only,
 * reason-stamped, timestamped history — isomorphic to ReferenceDateEntry, but
 * keyed per milestone NAME (many milestones coexist; latest-ts wins PER NAME,
 * not project-level single).
 */
export interface MilestoneEntry {
  milestone: string;
  nodes: NodeId[];
  reason: string;
  ts: number;
}

/**
 * Latest-ts entry wins per milestone name (ties: the later entry, same rule as
 * resolveReferenceDates/CapacityStore). A redefinition with an EMPTY `nodes`
 * is a dissolution: the milestone is dropped from the resolved list entirely
 * (never surfaced as a visible empty-bundle row) — matching `moira milestone
 * remove`'s discipline.
 */
export function resolveMilestones(entries: readonly MilestoneEntry[]): MilestoneDefinition[] {
  const latest = new Map<string, MilestoneEntry>();
  for (const e of entries) {
    const cur = latest.get(e.milestone);
    if (cur === undefined || e.ts >= cur.ts) latest.set(e.milestone, e);
  }
  const defs: MilestoneDefinition[] = [];
  for (const e of latest.values()) {
    if (e.nodes.length === 0) continue; // dissolved — R-U14-isomorphic append kept, but not surfaced
    defs.push({ name: e.milestone, nodes: e.nodes });
  }
  return defs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

// ---------------------------------------------------------------------------
// corrections.json advisory lock (issue #15) — see appendCorrections's own
// doc comment for the lock/rename role split. No new runtime dependency: a
// self-contained fs advisory lock via exclusive file creation (`wx`), same
// tradition as Node's other zero-dependency lockfile idioms.
// ---------------------------------------------------------------------------

// Bounded — "no silent hang" (moira-verification discipline): a lock that
// never clears must surface as a loud CliError, not an infinite/near-infinite
// spin. 30 attempts × 30ms ≈ 900ms worst case — modest for a CLI, and (issue
// #15 codex review) comfortably outlasts a genuine short-lived contended
// hold (e.g. a concurrent writer's own load→append→write section), which the
// original 15×15ms≈225ms budget did not reliably do.
const LOCK_MAX_ATTEMPTS = 30;
const LOCK_RETRY_DELAY_MS = 30;
// issue #15 codex review (Important): a held lock is NEVER stolen purely on
// age while its recorded pid is confirmed LIVE — a legitimate holder that
// simply stalls past this threshold (slow disk, GC pause, debugger) must NOT
// lose its exclusivity; a stolen-then-double-critical-section write would be
// strictly worse than a stuck CLI invocation. `LOCK_STALE_MS` is therefore
// used ONLY as the fallback signal for the narrow case where the lock's
// CONTENT itself cannot establish a pid at all (unreadable/malformed file) —
// see `isLockStale` below, where pid-liveness is the sole and authoritative
// signal whenever a pid IS readable.
const LOCK_STALE_MS = 30_000;

interface LockFileContents {
  // issue #15 codex review: pid is the PRIMARY and (whenever readable) SOLE
  // staleness signal — see isLockStale. Previously a dead field for
  // staleness purposes (mtime alone decided); no longer.
  pid: number;
  // Per-ACQUISITION random token (issue #15 codex review, NOT-FIXED item):
  // release now matches on `pid` AND `token` together, not `pid` alone.
  // `pid` alone cannot distinguish two DIFFERENT acquisitions made by the
  // SAME process (e.g. two `MoiraRepo` instances in one Node process, or a
  // re-acquisition after a fast release/re-acquire cycle) — a pid-only
  // match would let a lagging/delayed release call from an EARLIER
  // acquisition incorrectly delete a LATER, still-live acquisition's lock
  // just because they share a pid. The token makes ownership specific to
  // the exact acquisition, not merely the process. Generated fresh in
  // `acquireCorrectionsLock` and threaded back to the matching
  // `releaseCorrectionsLock` call by the caller (`appendCorrections`) —
  // never read back by `isLockStale` (staleness still keys on `pid` alone,
  // per the coordinator's instruction: identifying an ABANDONED lock only
  // needs to know whether ANY process claims that pid, not which specific
  // acquisition it was).
  token: string;
  // Acquire-time wall clock — NOT read back by any staleness/ownership logic.
  // Kept purely as an operator-debugging aid: a human `cat`-ing a stuck
  // `.lock` file mid-incident can see when it was written without
  // cross-referencing `stat`.
  ts: number;
}

/** Synchronous sleep — Node's main thread supports `Atomics.wait` (unlike a
 * browser main thread), so a short bounded backoff needs no new dependency
 * and no callback/async threading through otherwise-synchronous store.ts
 * methods. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Is `pid` a live process? `process.kill(pid, 0)` sends no signal — it only
 * probes existence/permission. ESRCH = no such process (dead — the ONLY
 * case treated as "not alive" here); any other outcome (success, or EPERM —
 * exists but owned by another user) is conservatively treated as alive, so a
 * live-but-unsignalable holder is never mistaken for stale. */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    return code !== 'ESRCH';
  }
}

/**
 * Best-effort read of the holder pid recorded in a lock file, for inclusion
 * in diagnostics (the CliError thrown when the retry budget is exhausted).
 * `undefined` on any failure (gone/unreadable/malformed/wrong-shaped) —
 * callers render that as "unknown", never as a false claim.
 */
function readLockHolderPid(lockPath: string): number | undefined {
  try {
    const parsed = JSON.parse(readFileSync(lockPath, 'utf8')) as Partial<LockFileContents>;
    return typeof parsed.pid === 'number' ? parsed.pid : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Stale iff the recorded holder pid is CONFIRMED DEAD (ESRCH) — the ONLY
 * steal trigger whenever a pid can be read at all (issue #15 codex review,
 * Important: a live pid is NEVER stolen from, no matter how old the lock
 * file's mtime — see LOCK_STALE_MS's own comment for why). `LOCK_STALE_MS`
 * is consulted ONLY when the lock's pid cannot be established in the first
 * place (unreadable file, malformed JSON, non-numeric/missing `pid`) — in
 * that narrow case there is no liveness signal to check at all, so age is
 * the only available fallback for "this looks abandoned, not merely busy".
 * A lock file that has disappeared by the time we look is treated as "not
 * provably stale, not provably live" → false; the caller's own retry loop
 * naturally re-contends the exclusive create next.
 */
function isLockStale(lockPath: string): boolean {
  let raw: string;
  try {
    raw = readFileSync(lockPath, 'utf8');
  } catch {
    return false;
  }
  let holderPid: number | undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<LockFileContents>;
    if (typeof parsed.pid === 'number') holderPid = parsed.pid;
  } catch {
    // malformed content — pid unknowable; fall through to the mtime-only path below
  }
  if (holderPid !== undefined) return !isProcessAlive(holderPid); // pid known — this is the ENTIRE verdict, live or dead
  try {
    return Date.now() - statSync(lockPath).mtimeMs > LOCK_STALE_MS; // pid unknowable — age is the only signal left
  } catch {
    return false;
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isActorShape(v: unknown): boolean {
  return isPlainObject(v) && (v.kind === 'human' || v.kind === 'agent') && typeof v.id === 'string';
}

/**
 * Lightweight structural check for one corrections.json row (issue #11 #9).
 * Deliberately NOT full §2.10 validation (patch-field applicability per
 * target kind is fold's job, surfaced as a structural error at fold-time,
 * §2.10) — this only guards against a MALFORMED record (missing/mistyped
 * required keys) reaching fold/derive, where it would otherwise fail with an
 * opaque TypeError deep in the derivation, or worse, silently coerce into
 * wrong behavior.
 */
/**
 * patch 値の形状検証（codex 是正確認 PARTIAL #9 の残余）: 値の「意味」の検証は fold の仕事
 * （適用不能＝可視エラー・§2.10）だが、構造的に成立しない値（children が配列でない等）は
 * 導出の奥で不透明な TypeError になるため、ここで型形状だけ弾く。
 */
const PATCH_VALUE_CHECKS: Record<string, (x: unknown) => boolean> = {
  amount: (x) => typeof x === 'number' && Number.isFinite(x),
  ts: (x) => typeof x === 'number' && Number.isFinite(x),
  frozenBudget: (x) => typeof x === 'number' && Number.isFinite(x),
  actor: isActorShape,
  assignee: (x) => x === null || isActorShape(x),
  reviewer: (x) => x === null || isActorShape(x),
  children: (x) =>
    Array.isArray(x) &&
    x.every((c) => isPlainObject(c) && typeof (c as Record<string, unknown>).node === 'string'),
  node: (x) => typeof x === 'string',
  parent: (x) => typeof x === 'string',
  to: (x) => typeof x === 'string',
  from: (x) => typeof x === 'string',
};

function assertCorrectionShape(v: unknown, index: number): asserts v is Correction {
  const where = `corrections.json[${index}]`;
  if (!isPlainObject(v)) {
    throw new CliError(`${where} は object ではありません（corrections.json が壊れています）`);
  }
  const required: ReadonlyArray<[string, (x: unknown) => boolean]> = [
    ['id', (x) => typeof x === 'string'],
    ['ts', (x) => typeof x === 'number'],
    ['actor', isActorShape],
    ['targetEventId', (x) => typeof x === 'string'],
    ['reason', (x) => typeof x === 'string'],
  ];
  for (const [key, check] of required) {
    if (!check(v[key])) {
      throw new CliError(`${where}.${key} が欠落または不正です（corrections.json が壊れています）`);
    }
  }
  if (v.correctionKind === 'nullify') return;
  if (v.correctionKind === 'patch') {
    if (!isPlainObject(v.patch)) {
      throw new CliError(
        `${where}.patch が欠落または不正です（correctionKind='patch' には object の patch が必須）`,
      );
    }
    const p = v.patch as Record<string, unknown>;
    if ('id' in p || 'kind' in p) {
      throw new CliError(`${where}.patch に id/kind は含められません（§2.10——同一性は訂正不能）`);
    }
    for (const [k, checker] of Object.entries(PATCH_VALUE_CHECKS)) {
      if (k in p && !checker(p[k])) {
        throw new CliError(`${where}.patch.${k} の値が不正な形です（corrections.json が壊れています）`);
      }
    }
    return;
  }
  throw new CliError(
    `${where}.correctionKind は 'nullify' か 'patch' のいずれかである必要があります（corrections.json が壊れています）`,
  );
}

export class MoiraRepo {
  readonly dir: string;
  readonly eventsPath: string;
  readonly correctionsPath: string;
  readonly capacityPath: string;
  readonly datesPath: string;
  readonly milestonesPath: string;
  readonly labelsPath: string;
  readonly membersPath: string;
  readonly configPath: string;

  constructor(cwd: string) {
    this.dir = join(cwd, '.moira');
    this.eventsPath = join(this.dir, 'events.json');
    this.correctionsPath = join(this.dir, 'corrections.json');
    this.capacityPath = join(this.dir, 'capacity.json');
    this.datesPath = join(this.dir, 'dates.json');
    this.milestonesPath = join(this.dir, 'milestones.json');
    this.labelsPath = join(this.dir, 'labels.json');
    this.membersPath = join(this.dir, 'members.json');
    this.configPath = join(this.dir, 'config.json');
  }

  exists(): boolean {
    return existsSync(this.configPath);
  }

  init(config: MoiraConfig): void {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.eventsPath)) writeFileSync(this.eventsPath, '[]\n', 'utf8');
    if (!existsSync(this.correctionsPath)) writeFileSync(this.correctionsPath, '[]\n', 'utf8');
    if (!existsSync(this.capacityPath)) writeFileSync(this.capacityPath, '[]\n', 'utf8');
    if (!existsSync(this.datesPath)) writeFileSync(this.datesPath, '[]\n', 'utf8');
    if (!existsSync(this.milestonesPath)) writeFileSync(this.milestonesPath, '[]\n', 'utf8');
    if (!existsSync(this.labelsPath)) this.writeLabels({ nodeLabels: {}, actorLabels: {} });
    if (!existsSync(this.membersPath)) writeFileSync(this.membersPath, '[]\n', 'utf8');
    this.writeConfig(config);
  }

  // --- config ---
  loadConfig(): MoiraConfig {
    return JSON.parse(readFileSync(this.configPath, 'utf8')) as MoiraConfig;
  }
  writeConfig(config: MoiraConfig): void {
    writeFileSync(this.configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }

  // --- events ---
  loadEvents(): Event[] {
    if (!existsSync(this.eventsPath)) return [];
    return JSON.parse(readFileSync(this.eventsPath, 'utf8')) as Event[];
  }
  appendEvents(events: readonly Event[]): void {
    const store = new EventStore();
    if (existsSync(this.eventsPath)) store.loadJson(this.eventsPath);
    store.appendAll(events);
    store.saveJson(this.eventsPath);
  }

  // --- corrections (v21/v22 §2.10 third tier; append-only, reason-required) ---
  // No dedicated backend store class (unlike EventStore/CapacityStore) — fold()
  // takes the raw Correction[] directly, so plain "load all → append → save
  // all" (dates.json/milestones.json's discipline) is the whole story here.
  // issue #11 #9: loadCorrections does a lightweight structural check (fails
  // LOUDLY with a clear CliError on a malformed file, instead of crashing
  // deep inside fold/derive with an opaque TypeError, or silently feeding
  // garbage into the correction layer) — NOT full §2.10 applicability
  // validation, which stays fold's job (a foreign patch key is a visible
  // structural error at fold-time, not rejected here).
  //
  // appendCorrections' critical section (load → append → write) is guarded
  // by TWO independent, complementary mechanisms with distinct jobs (issue
  // #15):
  //   - the advisory LOCK (`<correctionsPath>.lock`, acquireCorrectionsLock/
  //     releaseCorrectionsLock below) guards against LOST UPDATES — two
  //     concurrent writers each doing their own "load all → append → save
  //     all" would otherwise each load the SAME prior contents and the
  //     later save wins outright, silently discarding the earlier writer's
  //     append. The lock serializes the whole load→append→write section
  //     across writers.
  //   - the temp-file → rename (atomic replace, unchanged from before issue
  //     #15) guards against TORN WRITES — even a SOLE writer's own save can
  //     be interrupted mid-write (crash, kill -9); writing to a fresh temp
  //     path and renaming over the real path means the real path is only
  //     ever seen as fully-old or fully-new, never a partial/truncated JSON
  //     file.
  // Neither alone is sufficient: the lock says nothing about a torn write
  // from a single interrupted writer; the atomic rename says nothing about
  // two writers each innocently computing a `[...old, ...new]` from a
  // now-stale `old`.
  loadCorrections(): Correction[] {
    if (!existsSync(this.correctionsPath)) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(this.correctionsPath, 'utf8'));
    } catch (e) {
      throw new CliError(
        `corrections.json の読み込みに失敗しました（不正な JSON）: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    if (!Array.isArray(parsed)) {
      throw new CliError('corrections.json は配列である必要があります（corrections.json が壊れています）');
    }
    parsed.forEach((c, i) => assertCorrectionShape(c, i));
    return parsed as Correction[];
  }

  private get correctionsLockPath(): string {
    return `${this.correctionsPath}.lock`;
  }

  /** One non-blocking attempt at the exclusive create, stamped with the
   * given per-acquisition `token` (see `LockFileContents.token`'s doc
   * comment). `true` = acquired. */
  private tryCreateLock(lockPath: string, token: string): boolean {
    try {
      const contents: LockFileContents = { pid: process.pid, token, ts: Date.now() };
      writeFileSync(lockPath, JSON.stringify(contents), { flag: 'wx' });
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; // unexpected fs error — surface as-is
      return false;
    }
  }

  /**
   * Best-effort garbage-collection of orphaned `.steal-*` artifacts (issue
   * #15 codex review, new Minor): a live-capture in `tryStealIfStale`
   * permanently abandons its captured file rather than risk an unsafe
   * discard (see that function's doc comment) — over a long-running repo's
   * lifetime these can accumulate. Called once per `acquireCorrectionsLock`
   * invocation (cheap in the common case: an empty/small directory listing
   * and zero matches). Only removes an orphan whose EMBEDDED pid is
   * CONFIRMED DEAD — a still-live one (however it got orphaned) is left
   * untouched, and one whose pid can't be read at all is ALSO left
   * untouched (no basis to declare it safe to remove — this is narrower
   * than `isLockStale`'s own unreadable+aged fallback, deliberately: this
   * is opportunistic tidying, not a correctness-load-bearing path, so it
   * errs conservative). Any failure scanning the directory or removing an
   * entry is swallowed — this is availability housekeeping, not a
   * correctness mechanism; a failure here must never block or fail the
   * caller's actual lock acquisition.
   */
  private gcOrphanedStealFiles(lockPath: string): void {
    try {
      const dir = dirname(lockPath);
      const prefix = `${basename(lockPath)}.steal-`;
      for (const name of readdirSync(dir)) {
        if (!name.startsWith(prefix)) continue;
        const full = join(dir, name);
        const pid = readLockHolderPid(full);
        if (pid !== undefined && !isProcessAlive(pid)) {
          try {
            unlinkSync(full);
          } catch {
            // raced with something else clearing it, or a permissions
            // hiccup — best-effort, move on
          }
        }
      }
    } catch {
      // directory listing itself failed — best-effort, not correctness-critical
    }
  }

  /**
   * Best-effort steal of an apparently-abandoned (per `isLockStale` —
   * confirmed-dead-pid, or unreadable+aged) lock, called only after a
   * `tryCreateLock` EEXIST. issue #15 codex review (Critical): stealing via
   * a plain `unlinkSync(lockPath)` was UNSAFE — between `isLockStale`'s own
   * read and the unlink, another writer racing us could already have judged
   * the SAME lock stale, stolen it FIRST (taking ownership under its OWN
   * pid), and be inside its OWN live critical section by the time our
   * unlink runs — deleting that LIVE lock, not a phantom, and opening a
   * double-critical-section window (the exact lost-update this mechanism
   * exists to prevent).
   *
   * Fix: steal via ATOMIC RENAME, never unlink. `renameSync(lockPath,
   * claimPath)` is a single atomic filesystem operation — if two writers
   * race to rename the SAME `lockPath` to their own distinct `claimPath`s,
   * the OS serializes them: exactly one succeeds (physically taking
   * `lockPath`'s current content away), and the other gets ENOENT (because
   * `lockPath` no longer exists under that name by the time its rename
   * runs) and simply falls through to ordinary re-contention on its next
   * loop iteration — it NEVER touches the winner's `claimPath`, and (this is
   * the key correctness property) on its NEXT `isLockStale` check it
   * re-reads whatever is CURRENTLY at `lockPath` from scratch, so it never
   * acts on stale information about a lock instance it no longer has any
   * claim to. Only the rename's WINNER ever gets to decide what happens to
   * the file it captured.
   *
   * After winning the rename, the content is RE-VERIFIED (not just trusted
   * from the pre-rename `isLockStale` read) before being discarded: if the
   * captured file's pid is confirmed dead, it is genuinely ours to delete —
   * `unlinkSync(claimPath)` (a uniquely-named path only this call knows, so
   * this unlink can never collide with anyone else's file) — and the caller
   * then re-contends `lockPath` via an ordinary `tryCreateLock`.
   *
   * HONEST RESIDUAL — the LIVE-capture case is NOT safely resolved, and this
   * is NOT claimed to close the race, only to narrow it from a common 2-party
   * shape to a rare 3-party one. If the captured content instead shows a LIVE
   * pid — meaning the narrow interleaving above happened (someone else
   * legitimately stole AND recreated a fresh live lock inside the gap
   * between our `isLockStale` read and this `renameSync`) — this call does
   * NOT unlink it (that would be the original Critical bug all over again)
   * and does NOT try to hand it back (no atomic primitive exists here to do
   * so safely, and a naive rename-back could itself clobber whatever a THIRD
   * party has since created at `lockPath`). It abandons the captured file in
   * place (parked under its unique claimPath — inert, never looked up again,
   * a permanent small leak on this exact rare path) and returns. BUT: by
   * this point `renameSync` has ALREADY vacated `lockPath` — this function
   * cannot undo that. The caller (`acquireCorrectionsLock`) does NOT know a
   * live lock was just displaced and has no signal telling it to stand down;
   * on its very NEXT loop iteration, its own `tryCreateLock(lockPath)` will
   * see an empty path and SUCCEED, entering ITS OWN critical section
   * concurrently with the live holder this call just displaced — the same
   * double-critical-section shape the rename fix exists to prevent, just
   * relocated to one syscall later and gated behind a ≥3-way interleaving
   * (rather than the 2-party race that triggered on every ordinary steal
   * before this fix). The displaced holder itself is not corrupted by any of
   * this — its own `releaseCorrectionsLock` pid-guard simply no-ops when it
   * can no longer find its lock — but exclusivity between it and whoever
   * grabs the vacated `lockPath` next is not preserved. Plain POSIX
   * rename/unlink offer no compare-and-swap primitive that would close this
   * outright; this is a best-effort advisory lock, not a linearizable one,
   * and this comment does not claim otherwise. NOT exercised by any current
   * test (reaching it needs the same ≥3-way interleaving) — reasoned, not
   * verified.
   */
  private tryStealIfStale(lockPath: string): void {
    if (!isLockStale(lockPath)) return;
    const claimPath = `${lockPath}.steal-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      renameSync(lockPath, claimPath); // atomic — losers of this race get ENOENT and fall through to ordinary re-contention
    } catch {
      return; // lost the steal race, or lockPath was already gone — nothing captured, nothing to do
    }
    // We now hold EXCLUSIVE possession of whatever was at `lockPath` — no
    // one else can also have captured it. Re-verify before acting on it.
    const capturedPid = readLockHolderPid(claimPath);
    const capturedIsDead = capturedPid !== undefined && !isProcessAlive(capturedPid);
    if (capturedPid === undefined || capturedIsDead) {
      // Genuinely stale (or unreadable — same disposition as isLockStale's
      // own unreadable/malformed fallback: treat as abandoned) — safe to
      // discard; the caller's next tryCreateLock re-contends `lockPath` cleanly.
      try {
        unlinkSync(claimPath);
      } catch {
        // already gone somehow — nothing left to clean up
      }
      return;
    }
    // capturedPid is LIVE — we accidentally captured a legitimate fresh lock
    // via the narrow race documented above. Do NOT unlink it (see this
    // function's doc comment — that would repeat the original Critical bug)
    // and do NOT try to hand it back (no safe atomic primitive for that
    // here). Abandon it, parked at claimPath, permanently orphaned. This
    // does NOT prevent the caller's OWN next tryCreateLock from succeeding
    // at the now-vacated lockPath and colliding with the displaced live
    // holder — see the doc comment's HONEST RESIDUAL for the un-closed part
    // of this race. There is no cheaper correct move available with plain
    // POSIX rename/unlink.
  }

  /**
   * Acquire the corrections.json advisory lock (issue #15). Exclusive create
   * (`wx`, via `tryCreateLock`) is the actual mutual-exclusion primitive —
   * two processes racing to create the same path can never both succeed. A
   * fresh per-acquisition TOKEN (issue #15 codex review) is generated here
   * and returned to the caller, which must thread it through to the matching
   * `releaseCorrectionsLock(token)` call — see `LockFileContents.token`'s
   * doc comment for why pid alone is not enough to identify ownership. On
   * contention (EEXIST): opportunistically GC any dead-pid `.steal-*`
   * orphans from a past live-capture (`gcOrphanedStealFiles`, new Minor —
   * availability housekeeping, not correctness), attempt a rename-based
   * steal of an abandoned lock (`tryStealIfStale` — see its own doc comment
   * for the full design and its honest residual), then back off briefly and
   * retry, bounded by LOCK_MAX_ATTEMPTS — exhausting the budget is a loud
   * CliError, never a silent pass-through (a caller that ignored the lock
   * would reintroduce the exact lost-update this exists to prevent). The
   * error names the lock path and the (best-effort) current holder pid, and
   * reads as operator guidance: since a LIVE holder's lock is now never
   * auto-stolen (see LOCK_STALE_MS's comment), a wedged-but-alive holder
   * genuinely requires a human to intervene — this is not something the
   * retry loop can resolve for itself, and the message says so rather than
   * implying it will eventually clear on its own. M-2 (issue #15 review): a
   * steal that lands on the FINAL budgeted attempt would otherwise be
   * wasted — we'd throw despite having just cleared the contention
   * ourselves — so the last attempt gets one immediate extra
   * `tryCreateLock` before giving up.
   */
  private acquireCorrectionsLock(): string {
    const lockPath = this.correctionsLockPath;
    const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.gcOrphanedStealFiles(lockPath);
    for (let attempt = 1; attempt <= LOCK_MAX_ATTEMPTS; attempt += 1) {
      if (this.tryCreateLock(lockPath, token)) return token;
      this.tryStealIfStale(lockPath);
      if (attempt === LOCK_MAX_ATTEMPTS) {
        if (this.tryCreateLock(lockPath, token)) return token; // M-2: cash in a steal that just happened on this final attempt
        const holderPid = readLockHolderPid(lockPath);
        throw new CliError(
          `corrections.json の書き込みロックを取得できませんでした（${lockPath}` +
            (holderPid !== undefined ? `, 保持プロセス pid=${holderPid}` : ', 保持プロセス pid 不明') +
            `）。保持プロセスが生存している場合、自動では解除されません——処理の完了を待つか、` +
            `そのプロセスが実際には停止していることを確認したうえで、ロックファイルを手動で削除してください。`,
        );
      }
      sleepSync(LOCK_RETRY_DELAY_MS);
    }
    // Unreachable — the loop above always either returns or throws on its
    // LOCK_MAX_ATTEMPTS-th iteration; this satisfies the compiler only.
    throw new CliError('corrections.json の書き込みロック取得ループが異常終了しました（到達しないはずの経路）');
  }

  /**
   * Unlink the lock ONLY if it is still stamped with BOTH our pid AND the
   * exact per-acquisition `token` returned by the matching
   * `acquireCorrectionsLock` call — never unconditionally, and (issue #15
   * codex review, NOT-FIXED item addressed here) never on pid alone.
   *
   * Why pid alone was insufficient: pid identifies a PROCESS, not a
   * particular ACQUISITION — two different acquisitions (e.g. two
   * `MoiraRepo` instances constructed in the same Node process, or a fast
   * release-then-reacquire on the same instance) share a pid but must not
   * be treated as interchangeable for release purposes. A pid-only guard
   * would let a release call belonging to an EARLIER acquisition delete a
   * LATER, still-live acquisition's lock merely because both happen to run
   * in the same process. Matching the token closes that.
   *
   * issue #15 codex review (residual re-evaluated after the Critical
   * rename-based-steal fix): now that `tryStealIfStale` NEVER steals a lock
   * whose recorded pid is confirmed LIVE — regardless of the lock file's
   * age — the "our live lock gets stolen out from under us BY ANOTHER
   * PROCESS" pathway is CLOSED under ordinary operation; the token
   * refinement above closes the SAME-PROCESS analogue of that pathway. The
   * read-then-unlink pair below is STILL a TOCTOU (unchanged by
   * tokenization — that is a separate, orthogonal property from WHOM the
   * check identifies): between the read and the unlink, in principle
   * something could still rename/replace the file. In practice, since only
   * a CONFIRMED-DEAD pid is ever stolen (see LOCK_STALE_MS and
   * `isLockStale`), and this call's own process is (by construction) alive
   * while it runs, this specific gap has no realistic trigger left, but the
   * two operations are still not one atomic syscall.
   *
   * The only remaining theoretical residual is OS PID REUSE combined with
   * this process dying WITHOUT reaching this `finally` block (not reachable
   * via this function's own normal control flow — it only ever runs inside
   * a `finally` — but conceivable under e.g. SIGKILL or a host crash): its
   * pid becomes free, and if the OS reassigns that EXACT pid to an
   * unrelated new process before any stealer re-checks, the stealer would
   * (correctly, per the information available to it) see a live process at
   * that pid and hold off. This is an AVAILABILITY hiccup for the abandoned
   * lock (stays parked until manually cleared or the reused pid exits) —
   * not a correctness violation; nothing gets double-written.
   */
  private releaseCorrectionsLock(token: string): void {
    let owned = false;
    try {
      const parsed = JSON.parse(readFileSync(this.correctionsLockPath, 'utf8')) as
        Partial<LockFileContents>;
      owned = parsed.pid === process.pid && parsed.token === token;
    } catch {
      return; // gone or unreadable — nothing of ours left to release
    }
    if (!owned) return; // not THIS acquisition's lock (stolen, or a different acquisition by the same pid) — not ours to delete
    try {
      unlinkSync(this.correctionsLockPath);
    } catch {
      // already gone (e.g. raced with a steal between our read and unlink
      // above — the residual TOCTOU noted in the doc comment) — no-op
    }
  }

  appendCorrections(recs: readonly Correction[]): void {
    const lockToken = this.acquireCorrectionsLock();
    try {
      const all = [...this.loadCorrections(), ...recs];
      const tmp = `${this.correctionsPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      writeFileSync(tmp, `${JSON.stringify(all, null, 2)}\n`, 'utf8');
      try {
        renameSync(tmp, this.correctionsPath); // atomic replace — no torn/partial write on interruption
      } catch (e) {
        // issue #15 codex review (Minor): a failed rename must not leak the
        // temp file — best-effort cleanup, then surface the ORIGINAL error
        // (the temp-file removal itself is not the interesting failure).
        try {
          unlinkSync(tmp);
        } catch {
          // couldn't clean up either — nothing more we can do here
        }
        throw e;
      }
    } finally {
      this.releaseCorrectionsLock(lockToken);
    }
  }

  // --- capacity ---
  loadCapacity(): CapacityEntry[] {
    if (!existsSync(this.capacityPath)) return [];
    return JSON.parse(readFileSync(this.capacityPath, 'utf8')) as CapacityEntry[];
  }
  appendCapacity(entries: readonly CapacityEntry[]): void {
    const store = new CapacityStore();
    if (existsSync(this.capacityPath)) store.loadJson(this.capacityPath);
    store.appendAll(entries);
    store.saveJson(this.capacityPath);
  }

  // --- reference dates (R-T6 second tier; append-only, latest-ts wins) ---
  loadDateEntries(): ReferenceDateEntry[] {
    if (!existsSync(this.datesPath)) return [];
    return JSON.parse(readFileSync(this.datesPath, 'utf8')) as ReferenceDateEntry[];
  }
  appendDateEntries(entries: readonly ReferenceDateEntry[]): void {
    const all = [...this.loadDateEntries(), ...entries];
    writeFileSync(this.datesPath, `${JSON.stringify(all, null, 2)}\n`, 'utf8');
  }

  // --- milestones (name+node-bundle second tier; append-only, latest-ts wins per name — issue #35) ---
  loadMilestoneEntries(): MilestoneEntry[] {
    if (!existsSync(this.milestonesPath)) return [];
    return JSON.parse(readFileSync(this.milestonesPath, 'utf8')) as MilestoneEntry[];
  }
  appendMilestoneEntries(entries: readonly MilestoneEntry[]): void {
    const all = [...this.loadMilestoneEntries(), ...entries];
    writeFileSync(this.milestonesPath, `${JSON.stringify(all, null, 2)}\n`, 'utf8');
  }

  // --- labels (presentation-only) ---
  loadLabels(): Labels {
    if (!existsSync(this.labelsPath)) return { nodeLabels: {}, actorLabels: {} };
    return JSON.parse(readFileSync(this.labelsPath, 'utf8')) as Labels;
  }
  private writeLabels(labels: Labels): void {
    writeFileSync(this.labelsPath, `${JSON.stringify(labels, null, 2)}\n`, 'utf8');
  }
  setNodeLabel(node: string, label: string): void {
    const labels = this.loadLabels();
    labels.nodeLabels[node] = label;
    this.writeLabels(labels);
  }
  setActorLabel(id: string, label: string): void {
    const labels = this.loadLabels();
    labels.actorLabels[id] = label;
    this.writeLabels(labels);
  }
  // Bulk variants for `import wbs` — one load + one write (avoid O(n²) per-row I/O).
  setNodeLabels(map: Record<string, string>): void {
    const labels = this.loadLabels();
    Object.assign(labels.nodeLabels, map);
    this.writeLabels(labels);
  }
  setActorLabels(map: Record<string, string>): void {
    const labels = this.loadLabels();
    Object.assign(labels.actorLabels, map);
    this.writeLabels(labels);
  }

  // --- members (the roster; separate tier, NOT events — D-16/D-30) ---
  loadMembers(): Member[] {
    if (!existsSync(this.membersPath)) return [];
    return JSON.parse(readFileSync(this.membersPath, 'utf8')) as Member[];
  }
  saveMembers(members: readonly Member[]): void {
    writeFileSync(this.membersPath, `${JSON.stringify(members, null, 2)}\n`, 'utf8');
  }
}
