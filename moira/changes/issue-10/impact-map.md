---
status: working-ledger
issue: 10
---

# 影響マップ — issue #10

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | .kiro/steering/moira-change-management.md | F | ratified steering。本文書「以後の改訂は本フロー（変更管理）を通す」。§2 P1 行・§2 P5 行・§4 再調査契機・§5 未マップ差分の base 定義・§7 実装形態が worktree 運用の追加で影響 | doc-refine | §2 P1 行に「full-flow 判定時に issue 専用 worktree を fresh base から作成し分岐点を base 記録」を追加／§5・§4 の base 定義を「worktree 分岐点（軽量 exit や非 worktree 運用時は従来どおり受付時 commit）」に精密化／§7 実装形態に worktree 置き場（`.claude/worktrees/issue-N`）・P6 merge/cleanup・cleanup 規律を追加。DFD 本文の既存規範（クラス・順序・閉包・人間タッチポイント）は不変 | doc-refine ゲート（doc-adversary＋doc-fact-checker＋doc-gate-judge）＋意図整合検査 | pending | — |
| R2 | .claude/skills/moira-change/SKILL.ja.md | F | 規範手順（振り付け）。§1 P1・§6 P6 が worktree ステップの追加で影響 | doc-refine | §1「1. P1」に worktree 作成ステップ（full-flow のみ）／§6「6. P6」に H5 承認後の main 反映（HA 裁定のマージモデル）＋worktree 撤去を追加。steering を複製せず参照する原則は維持 | 同ゲート＋意図整合検査 | pending | — |
| R3 | .claude/skills/moira-change/SKILL.md | F | 英語 convention shell。P1/P6 の一行記述を SKILL.ja.md と同期 | doc-refine | 冒頭サマリ（P1→…→P6）と本文の該当箇所に worktree の一行を SKILL.ja.md と整合させて追記 | 同ゲート | pending | — |
| R4 | .claude/skills/moira-change/templates/request.template.md | F | P1 出力テンプレート。base commit 欄が worktree/分岐点の記載様式で影響 | doc-refine | base commit セクションに worktree/branch/分岐点の記載欄（full-flow）と、軽量/非 worktree 時の従来様式の併記を追加 | 同ゲート | resolved | gate-round-records.md（doc-gate-judge PASS）・closure-report.md |
| R5 | .gitignore | F | **P4 再調査契機で追記**（§4）。doc-refine の #1 是正で判明——worktree dir `.claude/worktrees/issue-N` が親 checkout に untracked で現れ（`?? .claude/worktrees/` 実測）、汚染・`git add -A` 巻き込み・差分混入で §5 閉包数学を壊すハザード | doc-refine | `.gitignore` に `.claude/worktrees/` を追加（理由コメント付き）。steering §7 でも除外を明記 | git status で worktree が untracked に出ないこと＋§5 自己除外と同趣旨 | resolved | gate-round-records.md #1（doc-gate-judge PASS で成立確認）・closure-report.md |

<!-- append-only。R1〜R4 は当初調査、R5 は P4 doc-refine 中の再調査契機（§4）で追記。 -->

（R1〜R3 の状態も doc-gate-judge PASS により resolved：R1 `.kiro/steering/moira-change-management.md`・R2 `SKILL.ja.md`・R3 `SKILL.md`。証跡は gate-round-records.md・closure-report.md）

## 人間断面ビュー

### 文書ゲート内で批准（HA 対象外・doc-refine 内で決着）

全 4 行は F 級（一般確定文書）——最終文面は doc-refine の敵対ゲートで批准する（steering §3 F 行「文書により批准」）。人間の逐語レビュー対象ではない。

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R1 | .kiro/steering/moira-change-management.md | doc-refine ゲート内 |
| R2 | .claude/skills/moira-change/SKILL.ja.md | doc-refine ゲート内 |
| R3 | .claude/skills/moira-change/SKILL.md | doc-refine ゲート内 |
| R4 | .claude/skills/moira-change/templates/request.template.md | doc-refine ゲート内 |

### HA で裁定する設計選択（文面ではなく方針）

F 行の文面は doc-refine が決めるが、その文面を形づくる**運用方針**は HA で人間が裁定する（steering §6 HA ② 境界裁定・⑤ 実行計画）:

- **マージモデル**: worktree ブランチを main へどう反映するか（main 直マージ／PR）。
- **worktree 機構**: 規約として記す機構（`git worktree`〔ツール非依存・skill Bash〕／ハーネス `EnterWorktree`）。
- **適用範囲**: worktree は full-flow のみ・軽量 exit は不要、で妥当か。
- **base の意味**: base=worktree 分岐点への精密化（従来の「受付時 commit」との関係）。
