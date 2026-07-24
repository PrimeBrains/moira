---
status: working-ledger
issue: 9
---

# 変更要求票 — issue #9

<!-- 台帳来歴（正直開示）: 本 issue-9 台帳 4 点（request / impact-map / intent-ratification /
     gate-round-records）は 2026-07-21 セッションで作成されたが未コミットのまま失われた。本ファイル群は
     2026-07-24 に issue #9 の公開コメント（P1 受付〜R2 E2E＋中断 handoff の全 6 コメント）を一次記録として
     復元したもの。非正典（working-ledger）。数式・値・裁定は当時コメントの記載に忠実。 -->

## 入口種別

issue直（https://github.com/PrimeBrains/moira/issues/9・起票 2026-07-21）

## 明確化した変更要求文

schedule-time ガントのラベルペイン「開始」「終了」列に**表示モード切替**を導入する。少なくとも「ベースライン
基準（frozenSlot のみ・predicted 不使用）」モードを提供し、既定モード（現行の predicted 優先）は維持する。
既定モードとモード数（A/B/C の 3 択で行くか）は HA で意図批准する。

- **モード A（baseline）**: `plannedStart = frozenSlot − nominalDuration`／`plannedEnd = frozenSlot`
  （＝ベースライン基準・予測不使用。未凍結葉は両列 '—'）。
- **モード B（predicted）**: 現行（predicted 優先・frozenSlot フォールバック）。**既定**。
- **モード C（both）**: 両方併記（`基準線 → 予測` の 2 値）。

現行実装の起点: `moira/frontend/src/surfaces/schedule/gantt-geometry.ts`（`plannedStart`/`plannedEnd` の
predicted 優先導出）。列見出し・値バインドは `ScheduleGantt.tsx`。永続化は端末側記憶。

### 実運用上の困りごと（issue 本文より）

後続タスクを持たず担当者が律速資源の葉は、leveler の並び順（トポロジ→cp 降順→id 昇順）でキュー最後尾に
落ち、`predictedStart/Completion` が他タスクを詰め終えた後の遠い日付になる。UI 一覧列にこの予測が出ると
「委任時に凍結した予定（基準完了日）」と食い違い、朝会・進捗共有で予測を予定と誤読しうる。Inspector は
基準完了日と予測を並置しているため、一覧列と Inspector の呼び分け意図が食い違う。

### Out of scope（issue 本文より）

- EVM 計算そのもの（R-S6/R-S7 の予測 vs 基準乖離）の変更は求めない。一覧「開始／終了」列の**表示ソース**のみ。
- ガントバーの色分け（divergence tone）は既存のまま。

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N（見込み） | 表示層のラベルペイン列切替のみ。MODEL の制約・語彙・既定・イベント意味論に触れない。 |
| D（設計判断級） | **Y** | 「一覧列に予測／基準線のどちらを主として出すか」は 0→1 の射影規則の派生判断。D-76〔agreed〕の射影規則の派生であり新規 Decision を要する。 |
| P（プロパティ級） | N | 不変条件に触れない。 |
| S（シナリオ級） | **Y（暫定・境界は HA）** | 観測ふるまいに切替が加わる。既存 `schedule-leveled.md` への追記か新規 unit かは境界裁定を HA へ。 |
| C（コード級） | **Y** | frontend の導出・UI・永続化・テストを実装。 |
| V（検証基盤級） | N | 検知器（CI・coverage-check 等）を変更しない。 |
| F（一般確定文書級） | **Y（暫定）** | `UI-DESIGN-BRIEF.md`／`UI-ARCHITECTURE.md` の追随要否は HA 裁定。 |

## triage 判定

判定: **フル工程**
理由: D-76〔`agreed`〕の射影規則の派生であり、D 級判断＋シナリオ影響＋F 級文書追随の可能性を含むため。
軽量ルートでは捌けない。

## base commit

`db609ba06cd98b8d81b41e94a1ea10c34a26b7a9`（P1 で宣言。以後の差分検査は当時 `base..HEAD`）。

<!-- 時点差の開示: 本 issue の作業ツリーはその後 origin/main を取り込み（merge 6b0e45d）、現行 worktree の
     base は 6b0e45d。閉包（P5）の未マップ差分検査は worktree 実態の base=6b0e45d で行い、closure-report.md に
     この時点差を明記する。db609ba..6b0e45d は origin/main 側の無関係変更（#7/#11 等）であり本 issue の
     成果物差分には混じらない（P5 で `git diff 6b0e45d` を用い、`moira/changes/**` 自己除外で照合）。 -->
