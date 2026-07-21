---
status: working-ledger
issue: 13
---

# 影響マップ — issue #13

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/cli/vitest.config.ts | C | issue #13 提案 #5 の実施先——vitest テスト実行時に `MOIRA_DIR` を env から落とすため `setupFiles` を追加する必要がある | /kiro-impl（設定 1 行追記） | `test.setupFiles` に新 setup ファイルへの相対パスが記述されている | `vitest --run` が新 setup ファイルを読み込み、既存全テストが緑のまま通る | resolved | commit 4795d25：vitest.config.ts 8-11 行目に `setupFiles: ['./src/test-setup.ts']` 追記。`setup 250ms` として vitest が読み込みを認識、302 pass + 2 skipped |
| R2 | moira/cli/src/test-setup.ts（新規） | C | R1 の setupFiles が参照する実体。テスト worker 起動直後に `delete process.env.MOIRA_DIR` を実行する | /kiro-impl（新規ファイル・数行） | 起動時に process.env.MOIRA_DIR が undefined になる。個別テストが後から代入する既存パス（home.test.ts の resolver 検証・hooks.test.ts・member-cli.test.ts）は無影響で動く | `vitest --run` の 302 pass + 2 skipped が回復・R3 の陰性対照が緑 | resolved | commit 4795d25：`delete process.env.MOIRA_DIR` の 1 行実体＋rationale コメント。home.test.ts・adapter/hooks.test.ts・member-cli.test.ts の resolver 検証テストは無影響で全 green |
| R3 | 陰性対照（一時テストで確認・commit しない） | C | 「未来の著者忘れ」を setup が捕まえる証明——`runCli` を \--dir なし・per-file delete なしで呼ぶ最小テストが、`MOIRA_DIR=<victim>` 環境下でも実 log-home に触れないこと | /kiro-impl（作業ツリーで走らせ捨てる） | 修正前は失敗し（ENOENT または JSON 破壊）、修正後は成功する | 手動: `MOIRA_DIR=/tmp/moira-victim-canary-13 npx vitest run <cannary>.test.ts` を修正前後で走らせて差を確認 | resolved | bidirectional witness: (a) 修正あり＋`MOIRA_DIR=/tmp/moira-victim-13` → canary green・victim `events.json` `[]` のまま不変・victim に `.moira/` 未生成 (b) setupFiles 一時撤去＋同 env → canary ENOENT で fail・victim に `.moira/` が生えた。canary test は削除済み（`src/canary-issue13.test.ts` 作業ツリーからも消去）、setupFiles は復元済み |
| R4 | 全 cli test スイート | C | R1/R2 が既存テストの挙動を変えないことの回帰確認（cli 302 pass + 2 skipped の維持） | /kiro-impl（自動テスト） | 全テスト green（現状値 302 pass + 2 skipped 維持） | `cd moira/cli && npx vitest run` | resolved | 復元後の最終走行 (19:20:05 JST): 33 files・302 passed・2 skipped・Duration 8.17s。origin/main 27ce37e 実績と完全一致 |
| R5 | 波及外 unit の回帰（backend + frontend） | C | vitest config は cli-scoped であり backend/frontend の設定には触れない。R1/R2 の影響が漏れないことの静的確認 | codex レビュー | backend/frontend の vitest.config.ts と test に diff が入らない | `git diff --name-only 27ce37e..HEAD | grep -E '(backend\|frontend)/'` が空 | resolved | `git diff --name-only 27ce37e..HEAD` の出力は `moira/cli/src/test-setup.ts`・`moira/cli/vitest.config.ts` の 2 パスのみ。backend/frontend パスの diff は空 |
| R6 | moira/changes/issue-13/ （台帳一式） | — | 本フローの作業台帳（正典性なし） | moira-change 自身 | request.md / impact-map.md / intent-ratification.md / closure-report.md が揃っている | ファイル存在確認。**未マップ差分計算からは self-除外**（steering §5） | resolved | request.md（P1）・impact-map.md（本ファイル・P2/P5 更新）・intent-ratification.md（P3）・closure-report.md（P5）の 4 本を `moira/changes/issue-13/` 直下に配置済み |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

**該当なし。** 本 issue は C 級（テスト隔離のインフラ強化）のみで、シナリオ・プロパティ・
設計判断のいずれも変更しない。resolver の precedence（`--dir > MOIRA_DIR > walk`）は
ADR-0003 の既存判断を保つ（テスト実行時の env サニタイズはテスト基盤側の責務であり、
本体側の設計判断を触らない——issue request.md「意図的スコープ外」節と同じ）。

### 文書ゲート内で批准（HA 対象外）

**該当なし。** F 級行はない。

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——
テストコード・vitest 設定の機械決着行であり、codex レビューおよび CI に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R1 | moira/cli/vitest.config.ts | C |
| R2 | moira/cli/src/test-setup.ts | C |
| R3 | 陰性対照（一時） | C |
| R4 | 全 cli test スイート | C |
| R5 | backend/frontend 非影響 | C |
