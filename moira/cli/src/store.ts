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

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
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
  // structural error at fold-time, not rejected here). appendCorrections
  // writes via temp-file → rename (atomic replace) so an interrupted write
  // can never truncate the existing history — the previous direct
  // writeFileSync could leave a torn/partial JSON file on interruption.
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
  appendCorrections(recs: readonly Correction[]): void {
    const all = [...this.loadCorrections(), ...recs];
    const tmp = `${this.correctionsPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    writeFileSync(tmp, `${JSON.stringify(all, null, 2)}\n`, 'utf8');
    renameSync(tmp, this.correctionsPath); // atomic replace — no torn/partial write on interruption
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
