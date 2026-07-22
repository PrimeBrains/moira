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
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
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
// spin. 15 attempts × 15ms ≈ 225ms worst case — modest, per the task mandate.
const LOCK_MAX_ATTEMPTS = 15;
const LOCK_RETRY_DELAY_MS = 15;
// A held lock older than this is presumed abandoned (its holder crashed
// without reaching the `finally` unlink) EVEN IF the pid happens to still
// resolve to a live (but unrelated/reused) process — mtime is the fallback
// trigger, `process.kill(pid, 0)` liveness is the primary one (see
// isLockStale below; either alone is sufficient to steal).
const LOCK_STALE_MS = 30_000;

interface LockFileContents {
  pid: number;
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

/** Stale iff the recorded holder pid is dead, OR the lock file is older than
 * `LOCK_STALE_MS` — either alone is sufficient (see LOCK_STALE_MS comment).
 * A lock file that has disappeared or is unreadable/malformed by the time we
 * look is treated as "not provably stale, not provably live" → false; the
 * caller's own retry loop naturally re-contends the exclusive create next. */
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
    // malformed content — fall through to the mtime check alone
  }
  if (holderPid !== undefined && !isProcessAlive(holderPid)) return true;
  try {
    return Date.now() - statSync(lockPath).mtimeMs > LOCK_STALE_MS;
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

  /**
   * Acquire the corrections.json advisory lock (issue #15). Exclusive create
   * (`wx`) is the actual mutual-exclusion primitive — two processes racing
   * to create the same path can never both succeed. On contention (EEXIST):
   * check whether the CURRENT holder looks abandoned (`isLockStale`) and, if
   * so, steal it (unlink) so the NEXT attempt's exclusive create can win;
   * either way, back off briefly and retry, bounded by LOCK_MAX_ATTEMPTS —
   * exhausting the budget is a loud CliError, never a silent pass-through
   * (a caller that ignored the lock would reintroduce the exact lost-update
   * this exists to prevent).
   */
  private acquireCorrectionsLock(): void {
    const lockPath = this.correctionsLockPath;
    for (let attempt = 1; attempt <= LOCK_MAX_ATTEMPTS; attempt += 1) {
      try {
        const contents: LockFileContents = { pid: process.pid, ts: Date.now() };
        writeFileSync(lockPath, JSON.stringify(contents), { flag: 'wx' });
        return; // acquired
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; // unexpected fs error — surface as-is
        if (isLockStale(lockPath)) {
          try {
            unlinkSync(lockPath); // best-effort steal; a concurrent stealer racing us just re-contends below
          } catch {
            // already gone (another process stole/released it first) — fine
          }
        }
        if (attempt === LOCK_MAX_ATTEMPTS) {
          throw new CliError(
            `corrections.json の書き込みロックを取得できませんでした（他のプロセスが処理中の可能性があります: ${lockPath}）`,
          );
        }
        sleepSync(LOCK_RETRY_DELAY_MS);
      }
    }
  }

  /**
   * Unlink the lock ONLY if it is still stamped with OUR pid. A plain
   * unconditional unlink would be wrong: if THIS holder stalled past
   * LOCK_STALE_MS mid-critical-section, another writer may have already
   * judged the lock stale, stolen it (unlink + recreate under ITS OWN pid),
   * and be in ITS OWN critical section right now — an unconditional unlink
   * here would delete THAT LIVE lock out from under it (re-opening exactly
   * the lost-update window this mechanism exists to close), not a harmless
   * no-op on an already-gone file. Re-reading and pid-matching before
   * unlinking closes that cross-delete, though the read-then-unlink pair is
   * itself not atomic (a classic advisory-lock TOCTOU) — an extremely
   * narrow residual race remains if a steal lands in that exact window; this
   * is a best-effort mutual-exclusion guard, not a linearizable lock.
   */
  private releaseCorrectionsLock(): void {
    let owned = false;
    try {
      const parsed = JSON.parse(readFileSync(this.correctionsLockPath, 'utf8')) as
        Partial<LockFileContents>;
      owned = parsed.pid === process.pid;
    } catch {
      return; // gone or unreadable — nothing of ours left to release
    }
    if (!owned) return; // stolen by (and now owned by) another writer — not ours to delete
    try {
      unlinkSync(this.correctionsLockPath);
    } catch {
      // already gone (e.g. raced with a steal between our read and unlink
      // above — the residual TOCTOU noted in the doc comment) — no-op
    }
  }

  appendCorrections(recs: readonly Correction[]): void {
    this.acquireCorrectionsLock();
    try {
      const all = [...this.loadCorrections(), ...recs];
      const tmp = `${this.correctionsPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      writeFileSync(tmp, `${JSON.stringify(all, null, 2)}\n`, 'utf8');
      renameSync(tmp, this.correctionsPath); // atomic replace — no torn/partial write on interruption
    } finally {
      this.releaseCorrectionsLock();
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
