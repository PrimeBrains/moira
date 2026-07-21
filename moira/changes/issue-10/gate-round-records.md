---
status: working-ledger
issue: 10
---

# P4 doc-refine ゲート ラウンド記録 — issue #10

対象（F 級 4 文書）: `.kiro/steering/moira-change-management.md`（§2 P1/§2 P5/§5/§7）／
`.claude/skills/moira-change/SKILL.ja.md`（§1 P1・§6 P6）／`.claude/skills/moira-change/SKILL.md`／
`.claude/skills/moira-change/templates/request.template.md`。加えて `.gitignore`（#1 是正で追加）。

## ラウンド 1

### doc-fact-checker — VERDICT: NO_OBJECTION

全 6 主張 CONFIRMED: ① `git worktree add/remove` 構文正当 ② クロス参照（§7「作業の隔離」）全解決
③ 既存記述（base 定義・moira/changes/** 自己除外・base..HEAD）整合 ④ main 直運用・PR 履歴なし前提正
（gh/git 照合）⑤ 4 文書間の (a)適用範囲 (b)機構 (c)マージ (d)base (e)cleanup 一致 ⑥ 台帳 frontmatter 規約準拠。

### doc-adversary — 指摘と決着（Important 6・Minor 4）

| # | 重大度 | 指摘 | 決着 |
|---|---|---|---|
| 1 | Important | `.claude/worktrees/issue-N` が gitignore も §5 自己除外も未処理。親 checkout で untracked（`?? .claude/worktrees/` 実測）＝汚染・`git add -A` 巻き込み・差分混入で閉包数学破壊のハザード | **修正済み**。`.gitignore` に `.claude/worktrees/` を追加（理由コメント付き）。steering §7 に gitignore による除外を明記（§5 自己除外と同趣旨） |
| 2 | Important | §7「full-flow は worktree で回す（必須）」↔ §5/§2P1「非 worktree 時は受付時 commit」の緊張——非 worktree full-flow の発生条件が未記載で base 定義が空虚化のおそれ | **修正済み**。批准意図 ④(b)（後方互換・両立明記）に沿い、§7 を「full-flow **原則**」に緩め、非 worktree フォールバック条件（作成不能な環境・手動運用・導入前 in-flight・§0 非強制）を明記。base 定義の消費者が確定し空虚性を解消 |
| 3 | Important | 「fresh origin/main」と謳うがコマンドに先行 `git fetch origin` が無く、陳腐な base 再導入のおそれ | **修正済み**。steering §7・SKILL.ja P1.4 のコマンドに `git fetch origin` を前置（「fresh は fetch を挟んで初めて成立」と明記） |
| 4 | Important | ff 不能時の rebase 後再検証・コンフリクト・凍結 base に対する閉包が rebase 後 live main とずれるドリフトが未規定/未開示 | **修正済み**。P6 に「ff 不能なら rebase→**rebase 後に P5 未マップ差分検査を新 base で再走**してから push」を追加（steering §7・SKILL.ja P6.3）。並行マージとの意味衝突は検知器（DRIFTED/CI/E2E）が新 issue 再入で拾う旨を §0 に接続して開示 |
| 5 | Important | 「index に他人の作業が紛れる型の事故を**根絶する**」は過剰主張——同一 worktree 内で複数 subagent/書き手が stage/commit すれば混線復活 | **修正済み**。「根絶」を撤回し「**別セッション/タスクが同一チェックアウトを共有して**紛れる型を防ぐ（1 worktree = 1 書き手前提。同一 worktree 内の複数書き手なら混線は残る）」に hedge |
| 6 | Important | cleanup 規律が薄い：`git worktree remove` は未コミット差分で失敗（--force 要）・残置作業の漂流・merge/remove 間の crash で冪等性なし | **修正済み**。§7・SKILL.ja P6.3 に「未コミット差分は先にコミットか `--force`／残存 worktree は再入時に再利用か撤去し作り直す（`git worktree add` はパス衝突で失敗＝冪等に扱う）」を追加 |
| 7 | Minor | 受付時 HEAD 記録 vs fresh origin/main 分岐点の曖昧さ（どちらが正か散文で誤誘導） | **修正済み**。§7 に「full-flow では分岐点が正・ローカル HEAD 記録は破棄/上書き」を明記 |
| 8 | Minor | §2 P5 行だけ旧文言「変更開始前 commit」で worktree 修飾なし | **修正済み**。§2 P5 行に「（full-flow の worktree 運用では worktree 分岐点＝§7）」を追記 |
| 9 | Minor | 分岐名の規約が未固定（`<branch>` プレースホルダ・例のみ） | **修正済み**。ブランチ名を `worktree-issue-N` に固定（steering §7・SKILL.ja・template 例と整合） |
| 10 | Minor/Suggestion | skill が steering の理由句（隔離目的・PR 不作成の正当化）を複製＝非複製原則ボーダー | **修正済み**。SKILL.ja P1.4/P6.3 の理由句を落とし「規範・目的・限界は steering §7」への参照に一本化（振り付けのみ） |

**CLAIMS_FOR_FACT_CHECK（adversary→fact 前提）**: `git worktree remove` の未コミット差分での失敗・ff 不能条件・
linked worktree の untracked 露出——いずれも一般 git 仕様として妥当（fact-checker 主張① worktree コマンド
群 CONFIRMED と整合。#1 は現物 `?? .claude/worktrees/` で確認済み）。

**FORKS（adversary 提示）**: ①「非 worktree full-flow をサポートするか」→ 批准意図 ④(b) が後方互換を
明示批准済み＝**サポートする（Fork A）**を採用し #2 で反映（新規 HB 不要）。②「rebase 後に閉包再走するか」
→ **再走する（Fork A）**を採用し #4 で反映（閉包の鮮度を保つ）。いずれも批准意図の射程内で決着。

**残存 Critical: 0。Important 6 件・Minor 4 件すべて修正で disposition 済み。**
