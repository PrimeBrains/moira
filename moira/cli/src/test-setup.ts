// vitest global setup (registered in vitest.config.ts:test.setupFiles).
//
// Why this exists (issue #13):
//   `runCli` and any code path that reaches resolveMoiraHome falls through to
//   `process.env.MOIRA_DIR` when no `--dir` flag is passed and no in-tree
//   `.moira/` is found by walk-up. A developer shell with `MOIRA_DIR=<real
//   workspace>` set therefore routes every `runCli(['add', ...])` test invocation
//   at that real log home and silently corrupts its append-only `events.json`.
//
// Individual test files that need `MOIRA_DIR` for resolver-behavior tests
// (home.test.ts / adapter/hooks.test.ts / member-cli.test.ts) still assign it
// inside their own beforeEach/it — this file only clears the ambient value at
// worker startup so a NEW test file that forgets the per-file guard cannot
// silently regress. Second layer of defense; the per-file delete pattern in
// commands-write-safety / milestone / dates / adapter/drift/drift-golden is
// preserved as the first layer.
delete process.env.MOIRA_DIR;
