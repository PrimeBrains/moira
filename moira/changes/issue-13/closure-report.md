---
status: working-ledger
issue: 13
---

# 閉包レポート — issue #13

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

**該当なし。** 本 issue は C 級のみで、シナリオ（S）・プロパティ（P）・設計判断（D）
面の agreed 最終文はいずれも生成しない。M-翻訳もなし（M 級行なし）。

批准済み意図（intent-ratification.md ⑤ 実行計画）と実装の対応:

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ⑤ の該当行） | 実装 | 整合 |
|---|---|---|---|---|---|
| R1 | — | vitest.config.ts | `setupFiles: ['./src/test-setup.ts']` の追記 | commit 4795d25 `moira/cli/vitest.config.ts:8-11` | Y |
| R2 | — | test-setup.ts | `delete process.env.MOIRA_DIR` の 1 行のみ | commit 4795d25 `moira/cli/src/test-setup.ts` | Y |
| R3 | — | 陰性対照 canary | 修正前後で失敗→成功の bidirectional witness | 本レポート §機械決着詳細 R3 に witness ログ | Y |
| R4 | — | cli 全 test | 302 pass + 2 skipped 維持 | 19:20:05 走行実績（33 files・302 passed・2 skipped・Duration 8.17s） | Y |
| R5 | — | backend/frontend | 波及外 diff = ∅ | `git diff --name-only 27ce37e..HEAD` は cli 2 パスのみ | Y |

### ② できないことになったこと（平易な差分）

**なし。** deferred 行はゼロ。issue #13 意図的スコープ外の 3 項目（`runCli` ヘルパー
改造・CLI 本体 safeguard・書き込み前ガード）は request.md「意図的スコープ外」で明示
却下しており、deferred として追跡する対象ではない（＝「今回はやらない」ではなく
「本 issue の設計判断としてやらない」）。将来これらを再検討したくなった場合は新規
issue として立てる。

### ③ 閉包判定

**PASS**

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | moira/cli/vitest.config.ts | resolved | commit 4795d25：`setupFiles: ['./src/test-setup.ts']` 追記。`setup 250ms` として vitest が読み込みを認識、全 test 緑 |
| R2 | moira/cli/src/test-setup.ts | resolved | commit 4795d25：新規ファイル・`delete process.env.MOIRA_DIR` 1 行＋rationale コメント。resolver 検証テスト（home.test.ts・adapter/hooks.test.ts・member-cli.test.ts）は無影響 |
| R3 | 陰性対照 canary | resolved | bidirectional witness: 修正あり＋`MOIRA_DIR=/tmp/moira-victim-13` → canary green・victim `events.json` `[]` 不変。setupFiles 一時撤去＋同 env → canary ENOENT で fail・victim に `.moira/` 生成。canary ファイル削除済み・setupFiles 復元済み |
| R4 | 全 cli test | resolved | 復元後の最終走行 19:20:05 JST: 33 files・302 passed・2 skipped・Duration 8.17s。origin/main 27ce37e と一致 |
| R5 | 波及外 diff | resolved | `git diff --name-only 27ce37e..HEAD` の出力は `moira/cli/src/test-setup.ts`・`moira/cli/vitest.config.ts` の 2 パスのみ。backend/frontend パスは 0 件 |
| R6 | 台帳一式 | resolved | request.md / impact-map.md / intent-ratification.md / closure-report.md（本ファイル）の 4 本を `moira/changes/issue-13/` に配置済み |

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: `27ce37e4093a08ec2566d42ac453307bbac420de`（request.md 記載の worktree 分岐点）
- HEAD（P5 開始時点で固定）: `4795d25079eaadaeb4183a8ba77a8c30afc5a3c3`
- 未マップ差分: **∅**
  - changed（`git diff --name-only 27ce37e..HEAD`・rename 検出なし）:
    - `moira/cli/src/test-setup.ts`
    - `moira/cli/vitest.config.ts`
  - mapped（impact-map.md の「波及先成果物」列・root 相対に正規化）:
    - R1 `moira/cli/vitest.config.ts` ✓
    - R2 `moira/cli/src/test-setup.ts` ✓
  - `moira/changes/**` は self-除外（steering §5・moira/changes/README.md）——本レポート自体および impact-map/request/intent-ratification は untracked のまま P5 判定に含めない
  - changed − mapped = ∅
- 判定有効性: P5 開始（HEAD=4795d25）から本レポート書き出しまで、`git rev-parse HEAD` が動いていないことを確認。作業ツリーは clean（canary ファイル削除・setupFiles 復元後の最終走行が最後の変更）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

**deferred 行なし** ゆえ機械照合の対象ゼロ。

</details>
