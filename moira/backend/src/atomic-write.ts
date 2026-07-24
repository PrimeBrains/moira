// Atomic file replacement (temp-file → rename) — the "how to save" primitive,
// owned by the substrate (D-11: 永続化方式を決める責任は土台が持つ). Writing to
// a fresh temp path and renaming it over the real path means the real path is
// only ever observed as fully-old or fully-new, never a partial/truncated file:
// this guards against TORN WRITES — even a SOLE writer's own save interrupted
// mid-write (crash, kill -9, disk-full at the wrong moment) can no longer leave
// a half-written JSON file behind.
//
// What it does NOT guard against: LOST UPDATES — two writers each doing their
// own "load all → append → save all" would still each compute a fresh full
// contents from a now-stale load and the later rename would win outright,
// silently discarding the earlier writer's append. Serializing that
// read-modify-write section needs a lock, which is a SEPARATE concern layered on
// top by the caller (see moira/cli/src/store.ts's advisory lock — `withLock`).
// The rename says nothing about concurrent RMW; the lock says nothing about a
// torn write from a single interrupted writer. Both are needed; neither alone
// suffices.
//
// History: issue #11 introduced this as an inline temp→rename inside
// corrections.json's writer; issue #16 (events.json) and issue #17 (the
// remaining .moira files) generalize it here so events.json
// (EventStore.saveJson), capacity.json (CapacityStore.saveJson), and the CLI's
// store-less files (dates/milestones/labels/members/config) all share one
// audited implementation instead of re-inlining the same idiom five more times.

import { renameSync, unlinkSync, writeFileSync } from 'node:fs';

/**
 * Atomically replace `path`'s contents with `data` via a temp-file → rename.
 * `data` is written verbatim (the caller controls the exact bytes, including
 * any trailing newline) so this is a drop-in for the plain `writeFileSync(path,
 * data, 'utf8')` it replaces — byte-for-byte identical output on success.
 *
 * The temp path carries pid + wall-clock + a random suffix so two concurrent
 * writers (even in the same process, even landing in the same millisecond)
 * never collide on the same temp file. On ANY failure (the temp write OR the
 * rename) the temp file is cleaned up best-effort and the ORIGINAL error is
 * re-thrown (the cleanup's own failure, if any, is swallowed — it is not the
 * interesting failure to surface).
 */
export function atomicWriteFileSync(path: string, data: string): void {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    writeFileSync(tmp, data, 'utf8');
    renameSync(tmp, path); // atomic replace — no torn/partial write on interruption
  } catch (e) {
    // ANY failure — the temp write OR the rename — must not leak a temp file:
    // best-effort cleanup, then surface the ORIGINAL error (the removal itself
    // is not the interesting failure; if the temp write never created the file
    // the unlink simply no-ops through its own catch).
    try {
      unlinkSync(tmp);
    } catch {
      // never created it, or the removal failed — nothing more we can do here
    }
    throw e;
  }
}
