// The atomic-replacement primitive (issue #16/#17). atomicWriteFileSync writes
// to a fresh temp sibling then renames it over the target, so the target is
// only ever observed fully-old or fully-new — never partial/truncated. This is
// the backend-side durability witness the impact maps ask for (#16 R4 / #17 R5,
// generalized here since capacity/event stores and the CLI all share it):
//   (i)   the on-disk bytes are EXACTLY what the caller passed — a drop-in for
//         the plain writeFileSync it replaces (trailing newline or not, verbatim)
//   (ii)  a successful write leaves NO `.tmp-` sibling behind
//   (iii) a rename FAILURE cleans up the temp file and re-throws the ORIGINAL
//         error (the temp-file removal is not allowed to mask the real failure)

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { atomicWriteFileSync } from './atomic-write.js';

describe('atomicWriteFileSync (issue #16/#17)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'moira-atomic-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const tmpSiblings = (target: string): string[] =>
    readdirSync(dir).filter((f) => f.startsWith(`${basename(target)}.tmp-`));

  it('writes the exact bytes given, verbatim (WITH a trailing newline — the CLI store-less shape)', () => {
    const target = join(dir, 'labels.json');
    const body = `${JSON.stringify({ nodeLabels: {} }, null, 2)}\n`;
    atomicWriteFileSync(target, body);
    expect(readFileSync(target, 'utf8')).toBe(body);
  });

  it('writes the exact bytes given, verbatim (WITHOUT a trailing newline — the EventStore/CapacityStore shape)', () => {
    const target = join(dir, 'events.json');
    const body = JSON.stringify([{ id: 'e1' }], null, 2); // no trailing newline, as the stores write
    atomicWriteFileSync(target, body);
    const raw = readFileSync(target, 'utf8');
    expect(raw).toBe(body);
    expect(raw.endsWith('\n')).toBe(false);
  });

  it('fully replaces prior contents (never appends/merges — the target is fully-new)', () => {
    const target = join(dir, 'a.json');
    writeFileSync(target, 'OLD-CONTENTS-THAT-MUST-VANISH', 'utf8');
    atomicWriteFileSync(target, 'NEW');
    expect(readFileSync(target, 'utf8')).toBe('NEW');
  });

  it('leaves NO `.tmp-` sibling behind on a successful write', () => {
    const target = join(dir, 'a.json');
    atomicWriteFileSync(target, 'x');
    expect(tmpSiblings(target)).toEqual([]);
  });

  it('on a rename failure, cleans up the temp file and re-throws the ORIGINAL error (no leaked temp)', () => {
    // Force renameSync to fail deterministically by making the target an
    // existing DIRECTORY: renaming a plain temp FILE onto a directory fails
    // (EISDIR/ENOTDIR on POSIX). The temp write itself still succeeds, so the
    // catch/cleanup branch is exercised exactly — not short-circuited earlier.
    const target = join(dir, 'as-a-dir');
    mkdirSync(target);
    expect(() => atomicWriteFileSync(target, 'data')).toThrow();
    expect(existsSync(target)).toBe(true); // the (directory) target is untouched
    expect(tmpSiblings(target)).toEqual([]); // and no temp file leaked behind
  });
});
