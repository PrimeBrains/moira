---
status: working-ledger
issue: 7
---

# 変更要求票 — issue #7

## 入口種別

issue直（＋ issue #2 P5 の追跡付き deferred 行 R11/R12 の追跡先。issue #2 台帳
`moira/changes/issue-2/impact-map.md` R11/R12・`closure-report.md` 参照）

原文: https://github.com/PrimeBrains/moira/issues/7

## 明確化した変更要求文

MODEL v21（issue #2）で不変条件 **I4 完了施錠**が「完了済みは変わらない」から
「**完了済みは、黙っては変わらない**」へ精密化された（意味的な再ベースライン／再見積は完了で
施錠され不可のまま＝不変。一方、**記録の誤り**の修理は §2.10 の訂正として完了済みノードにも
届き、施錠対象への訂正として reason 必須＋訂正計器の専用区分で常設表示される＝「音が鳴る」）。

これに伴い、この切り分けを断定していない旧い言い回しを持つ受け入れシナリオ unit の**注記・
決定事項レベルの文言**を v21 の切り分けへ同期する。**ふるまい本体（When/Then）・EARS 受入条件は
無傷**——同期対象は境界注記・決定事項・MODEL 参照リンクに限る。

対象:
1. `.kiro/scenarios/units/schedule-rebaseline.md`（agreed）§7 決定事項の
   「完了サブ単位は再ベースライン不可（I4 施錠）」断定 → v21 の切り分けへ整合。
2. 同 unit の MODEL 行番号アンカー（v21 の §2.10 節挿入で陳腐化）→ 安定 clause/節参照へ是正。
3. `.kiro/scenarios/units/requirements-spec-returned.md`（in-review）§1/§7 の
   「後付け分割は I4 完了施錠・R-E3 に抵触し却下」の前提記述 → v21 整合
   （却下の結論自体は不変——後付け分割は意味的変更であり記録誤りの訂正ではない）。

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL は改訂しない（v21 は issue #2 で確定済み）。本 issue は正典追随のみ |
| D（設計判断級） | N | 新規構造判断なし |
| P（プロパティ級） | N | 不変条件の新設・改訂なし |
| S（シナリオ級） | **Y** | 確定/レビュー中の受け入れシナリオ unit の文言同期（境界注記・決定事項レベル） |
| C（コード級） | N | 参照実装・計器の実装同期は別 issue #6 |
| V（検証基盤級） | N | 検知器の変更なし |
| F（一般確定文書級） | N | steering/agent 定義の改訂なし |

## triage 判定

判定: フル工程
理由: agreed な受け入れシナリオ unit（確定文書）の改稿であり kiro-scenario ゲート必須、
かつ issue #2 deferred 行（R11/R12）の追跡先として閉包証跡の連鎖を要するため。

## base commit

P1 受付時点（2026-07-20）の記録 base: **8eb1b6f**（issue #2 P5 閉包 commit）。

**実効 base の再アンカー（差分検査用）**: P1 記録後、本 issue と独立の別変更が 2 件、独立コミットで
main に介在した——(1) issue #5（CLOSED・リポジトリ自立化）の `fed1500`・`df99c48`、(2) issue #6
（OPEN・普遍訂正原則の実装同期）の `feeecff`（P5 照合中に別セッション/タスクが staged 作業を
コミット＋push）。いずれも本 issue #7 の波及先ではないため、未マップ差分検査（P4 各ゲート完了時・
P5）の**実効 base を、本 issue 着手直前の commit = `feeecff` に再アンカー**する
（`diff(feeecff..HEAD)` で検査）。steering §2 P1「変更開始前 commit」の趣旨に忠実であり、介在した
無関係な別変更を本 issue の差分に混入させないための操作である。
