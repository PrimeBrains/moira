---
status: working-ledger
issue: 7
---

# 変更要求票 — issue #7

## 入口種別

issue直（(a) GitHub issue。PrimeBrains/moira#7「シナリオ文言同期——I4 v21 精密化（『完了済みは黙っては変わらない』）への追随」。発生元は issue #2 変更管理フローの追跡付き deferred 行 R11/R12——deferred の追跡先 issue がフロー入口 (a) として再入する形）

## 明確化した変更要求文

MODEL v21（issue #2・確定 20a639e）で I4 完了施錠が「完了済みは変わらない」から
**「完了済みは、黙っては変わらない」**（意味的再ベースライン不可は不変・記録誤りの訂正は §2.10 で
可能かつ音が鳴る）へ精密化されたことに伴い、受け入れシナリオ unit 2 件の**注記・前提記述の文言**を
新正典に同期する。**ふるまい本体（§3 When/Then・§6 EARS）は無傷**——境界注記レベルの文言同期であり、
新規シナリオの発案ではない。

対象と改稿方針（issue 本文の記述を発案として扱う——steering §3 S 行「既存 unit の変更は issue に
人間が書いた記述を発案として扱う」）:

1. `.kiro/scenarios/units/schedule-rebaseline.md`（agreed）: §7 決定事項の「完了サブ単位は
   再ベースライン不可（I4 施錠）」という断定を、v21 の切り分け——**意味的再ベースライン不可は不変・
   記録誤りの訂正は §2.10 で可能かつ計器で音が鳴る**——に整合する文言へ改める。
2. `.kiro/scenarios/units/requirements-spec-returned.md`（in-review）: §1/§7 の「後付け分割は
   I4 完了施錠・R-E3 に抵触し却下」の前提記述を同様に精密化する。**却下の結論自体は不変**
   （後付け分割は意味的変更であり記録誤りの訂正ではない）。

原文: https://github.com/PrimeBrains/moira/issues/7

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL v21 は確定済み（issue #2）。本 issue は下流同期のみで正典に触れない |
| D（設計判断級） | N | 構造判断なし——確定済み正典への文言追随 |
| P（プロパティ級） | N | プロパティ一文・PBT 資産に触れない（issue #2 R4 で再批准済み） |
| S（シナリオ級） | Y | agreed/in-review の受け入れシナリオ unit 2 件の文言変更。kiro-scenario（既存 unit 改稿ルート） |
| C（コード級） | N（暫定） | §6 EARS 無傷のため E2E spec 再生成は不要見込み（P2 で SPEC_META・被覆定義を照合して確認） |
| V（検証基盤級） | N | 検知器そのものは触らない |
| F（一般確定文書級） | N（暫定） | 他の確定文書への波及なし見込み（P2 で確認） |

## triage 判定

判定: フル工程
理由: agreed な受け入れシナリオ unit（確定文書）の改稿であり kiro-scenario ゲート必須。issue #2 の deferred 行の追跡先として閉包証跡の連鎖を要するため。

## base commit

8eb1b6f975f98b79612afecaa47873a5cec1dc83
