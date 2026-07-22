---
status: working-ledger
issue: 10
---

# 意図批准記録 — issue #10（HA 前半集約セッション・2026-07-21）

## ① 影響マップ確認

- 確認: YES（2026-07-21）
- 指摘・追加された波及先: なし（R1〜R4 で全部。すべて F 級 → doc-refine）。

## ② 境界裁定＋設計選択

| 論点 | 裁定 | 日付 |
|---|---|---|
| P6 マージモデル | **main 直マージ（ff/rebase）**。現行 #2/#5/#6/#7 の main 直運用に整合。PR は作らない——レビューは既存ゲート（kiro-scenario/doc-refine 等）＋H5 が担い、PR 人間レビューは冗長 | 2026-07-21 |
| worktree 作成機構（規約に記す機構） | **`git worktree`（ツール非依存）**。skill の P1 に `git worktree add` 手順を書く（skill は Bash 保持）。ハーネス固有の worktree ツール（例 Claude Code の EnterWorktree）があればそれを使ってもよい、と併記 | 2026-07-21 |
| 適用範囲 | **full-flow のみ**。軽量 exit の issue は worktree 不要（従来どおり通常作業へ送り出す） | 2026-07-21 |
| base の意味 | **base = worktree 分岐点**（fresh な origin/main から分岐）。非 worktree 運用・軽量時は従来の受付時 commit を base とする（両立・後方互換） | 2026-07-21 |

## ③ S 級 When/Then の発案

該当なし（S 級行なし）。

## ④ 意図批准（F 行の方針）

全 4 行は F 級で文面は doc-refine が批准するが、その文面を形づくる方針を以下に確定する（doc-refine
ゲートの意図整合検査の基準）:

| 対象 | 決める方針 | 受け入れ基準 | 却下したい方向 |
|---|---|---|---|
| steering §2 P1 行 | full-flow triage 時に issue 専用 worktree を fresh base（origin/main）から作成し分岐点を base 記録、を追加 | (a) worktree は full-flow のみ・軽量 exit は不要と明記／(b) base=分岐点、非 worktree 時は受付時 commit と両立明記／(c) 既存 DFD 規範（クラス M/D/P/S/C/V/F・§4 順序・§5 閉包 3 値・HA/HB/H5）は不変 | 既存規範の変更／全 issue 必須化 |
| steering §5・§4 base 定義 | 未マップ差分検査の base を「worktree 分岐点（または非 worktree 時の受付時 commit）」に精密化 | (d) `diff(base..HEAD)` が当該フローの作業に一致する旨／(e) moira/changes/** 自己除外は不変 | 閉包判定規則そのものの変更 |
| steering §7 実装形態 | worktree 置き場（`.claude/worktrees/issue-N` 目安）・P6 の main 直マージ（ff/rebase）＋worktree 撤去・cleanup 規律を追加 | (f) マージモデル=main 直（ff/rebase）／(g) クローズ後 worktree 撤去／(h) 台帳 `moira/changes/issue-N/` の置き場・非正典性は不変 | PR 必須化／ledger 置き場の変更 |
| skill SKILL.ja.md §1 P1・§6 P6 | P1 に worktree 作成ステップ（full-flow のみ・`git worktree`）、P6 に H5 承認後 main 直マージ＋worktree 撤去を追加。steering を複製せず参照 | (i) `git worktree` 機構・ハーネスツール併記／(j) steering 非複製原則の維持 | steering 規則本文の skill への複製 |
| skill SKILL.md（英語 shell） | P1/P6 の一行を SKILL.ja.md と同期 | (k) ja と整合 | ja との齟齬 |
| templates/request.template.md | base commit 欄に worktree/branch/分岐点の記載様式（full-flow）＋従来様式の併記 | (l) full-flow/軽量の両様式併記 | 従来様式の削除 |

## ⑤ 実行計画承認＋一次資料セット確定

- 実行計画（経路列・依存順）:
  1. R1〜R4（F）→ `doc-refine`（1 サイクルで 4 文書を整合改稿・敵対ゲート）。
  2. P5 閉包（worktree 分岐点 base で未マップ差分∅）→ P6 main 直マージ＋push＋クローズ＋worktree 撤去。
- 一次資料セット（SOURCE_SET_CONFIRMED）: `.kiro/steering/moira-change-management.md`（現行）・
  `moira-change` SKILL.md/SKILL.ja.md・templates/request.template.md・issue #7 台帳（事故の来歴
  `moira/changes/issue-7/closure-report.md`）・issue #10 本文。
- 承認: YES（2026-07-21）

## issue コメントへの要約

- issue #10 コメント（P3 完了・2026-07-21）に要約を残す。
