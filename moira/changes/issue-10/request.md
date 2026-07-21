---
status: working-ledger
issue: 10
---

# 変更要求票 — issue #10

## 入口種別

会話依頼起票（issue #7 を回した運用知見からの提案 → `gh issue create` で正規化）

原文: https://github.com/PrimeBrains/moira/issues/10

## 明確化した変更要求文

**変更管理フローの起点（P1 full-flow triage 時）で issue 専用の git worktree を切り、その中で
フローを回す運用を正典化する。** 目的は、複数セッション/タスクが同一チェックアウトの作業ツリー・
index を共有することに起因する混線（他 issue の staged 作業の紛れ込み・照合中の HEAD/base 移動）の
根治。

具体:
- **P1**: full-flow と判定したら、fresh な base（`origin/main`）から issue 専用ブランチの worktree を
  作成し、その分岐点を base として記録。軽量 exit の issue は worktree 不要。
- **P2〜P5**: その worktree 内で台帳・編集・ゲート・閉包を完結（ledger も枝上にコミット）。
- **P6（H5 承認後）**: main へ反映（マージモデルは HA で裁定）→ push → issue クローズ → worktree 撤去。
- P5 の base は「worktree 分岐点」に固定され、`diff(base..HEAD)` が当該フローの作業そのものになる
  （base 再アンカーの体操が不要化）。

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL（製品ドメインの公理）には触れない。変更管理フローは紳士協定（steering §0）であり MODEL 所有物でない |
| D（設計判断級） | N | 製品ドメインの MODEL 沈黙 0→1 構造判断ではない。マージモデル等は運用方針で HA 意図批准に載せる |
| P（プロパティ級） | N | 不変条件なし |
| S（シナリオ級） | N | 受け入れシナリオなし |
| C（コード級） | N | 実装コードなし |
| V（検証基盤級） | N | 検知器（CI・dependency-cruiser 等）そのものは変えない |
| F（一般確定文書級） | **Y** | ratified steering `moira-change-management.md`＋`moira-change` skill＋template の改稿 |

## triage 判定

判定: フル工程
理由: ratified steering `moira-change-management.md` を触る変更であり、同文書「本文書自体の以後の
改訂は本フロー（変更管理）を通す」規則に従う。併せて F 級の skill/template 改稿は doc-refine ゲート必須。

## base commit

`8a93f572bf5377036134194140f63d3c6db21697`（origin/main・issue #7 P6 push 後）。

**worktree 隔離（本 issue の実施形態＝提案のドッグフーディング）**: 本 issue は
`.claude/worktrees/issue-10`（branch `worktree-issue-10`・上記 base から fresh 分岐）で回す。
P5 未マップ差分検査は `diff(8a93f57..worktree-issue-10 tip)`。同一チェックアウトの concurrent 作業
（issue #6 backend・issue #8 scenario-link-audit も各々別 worktree で進行中）から隔離される。
