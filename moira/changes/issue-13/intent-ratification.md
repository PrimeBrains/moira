---
status: working-ledger
issue: 13
---

# 意図批准記録（P3 HA） — issue #13

## HA ①〜⑤ の一括提示

### ① 影響マップ人間断面の確認

**該当なし。** C 級のみで前面ビュー（シナリオ・プロパティ・設計判断）はゼロ行。
「はねる先はこれで全部か」の確認対象は codex＋CI 委譲の C 行のみ。

### ② 境界裁定

**該当なし。** 境界不明瞭な行はない。V 級との境界は impact-map の候補クラス表で
説明済み（`vitest.config.ts` に触るが gate inventory・CI job 構成は不変なので C）。

### ③ When/Then の発案

**該当なし。** S 級行なし。

### ④ M/D/P 各行の意図批准

**該当なし。** M/D/P 各行いずれもゼロ。

### ⑤ 実行計画の承認（人間の裁定対象）

**経路列と依存順**（steering §4）:

1. **R1**（`moira/cli/vitest.config.ts` に `setupFiles: ['./src/test-setup.ts']` を追記）
2. **R2**（`moira/cli/src/test-setup.ts` を新規作成。1 行: `delete process.env.MOIRA_DIR`）
3. **R3**（陰性対照——修正前後で `MOIRA_DIR=<victim>` シェル下の最小 test の失敗→成功を確認）
4. **R4**（cli 全 test スイート走らせて 302 pass + 2 skipped の維持を確認）
5. **R5**（backend/frontend の diff が空であることを静的確認）

依存順の根拠: R1 と R2 は同一 commit で追加（片方だけでは vitest が起動時に落ちる）。
R3〜R5 は verify 順（R3=陰性対照→R4=回帰→R5=波及外静的）。

**受け入れ基準**:
- R1/R2: 追加後 `cd moira/cli && npx vitest run` が全 pass。setup ファイルは
  1 行（＋コメント）で、既存の per-file delete pattern（4 ファイル）はそのまま残す
  （それらは今回除去しない——多層防御の 2 段目として温存）。
- R3: 陰性対照 canary test（作業ツリーで tmpfile として書く・commit しない）が、
  修正前（`git stash` した状態）で失敗し、修正後で成功する 2 方向の witness を取る。
- R4: cli 302 pass + 2 skipped（origin/main 27ce37e の実績）。
- R5: `git diff --name-only 27ce37e..HEAD` が `moira/cli/` と `moira/changes/issue-13/`
  以外を含まない。

**P4 各ゲートが依拠する一次資料セット**: 本 issue は C 級のみで doc-refine 系ゲート
（SOURCE_SET_CONFIRMED 要求）を通らないため、対象外。

### 却下したい方向

- **`runCli` ヘルパー本体の force override**（issue 提案 #1）: 現状の per-file pattern
  ＋ `setupFiles` の二段構えで十分。ヘルパー API を変えると波及が広い。
- **CLI 本体の safeguard**（提案 #3・#4）: resolver precedence の設計判断（ADR-0003）
  を保つ。テスト実行検知（`VITEST` env 分岐）を本体に混ぜるのは責務逆転。

## 撤回条件

事前批准した意図と agreed 文面が乖離して実害化した場合、`/kiro-postmortem-add` で
literal タグ `[intent-drift]` を含めて記録する（steering §6）。
