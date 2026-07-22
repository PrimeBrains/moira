---
status: working-ledger
issue: 11
---

# 閉包レポート — issue #11

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ④/③・HB） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R1 | M-翻訳 | 訂正計器の「遡及」区分の定義一本化 | M-R1「(ア) 過去の記録への訂正と (イ) 過去日付へのイベント追記の両方で鳴る」＋HB F1「一つの警告面の下の二系（訂正系＝会計層／追記系＝観測層の検知）・単一合算数にしない」 | MODEL v22 §2.10「訂正計器」段落③遡及（moira/MODEL.md）——一つの警告面の下の二系・1 日=経過 24h 超の固定境界・検知の被覆限界を正直開示 | Y（gate-judge 意図整合 ALIGNED・R2 PASS） |
| R2 | P | 完了施錠の一文（PR-DONE-LOCK） | P-R2 批准＋**HB F3 で改稿文面を再批准**——「そのノード自身の凍結額は黙って減らない。集計への寄与は所属の再編で動きうる（正典が開示する既知の残余）」 | moira/PROPERTIES.md v0.7 PR-DONE-LOCK 行（agreed）——F3 批准文面と逐語一致（gate-judge 確認） | Y |
| R3 | P | 追記だけで状態が決まる一文（PR-EVENTS-ONLY） | P-R3 批准（verbatim・4 イベント＋訂正の第二層のみ・再生決定的） | moira/PROPERTIES.md v0.7 PR-EVENTS-ONLY 行（agreed）——批准 verbatim | Y |
| R4 | P | 訂正の数え方に裁量なしの一文（PR-CORRECTION-METER） | P-R4 批准＋HB F1（区分名「遡及」への一語同期と検知開示句は F1 裁定の帰結——採点者被覆監査 OK）＋HB F2（★は実装到達で解除） | moira/PROPERTIES.md v0.7 PR-CORRECTION-METER 行（agreed・★解除済み 2026-07-22） | Y |
| R5 | P | プロパティ目録の版 | P-R5（R2〜R4 の帰結の機械的同期・v0.6→v0.7） | moira/PROPERTIES.md v0.7（55=52 agreed＋3 proposed・被覆表/次手/変更点節同期） | Y |
| R15/R16 | D | 設計判断目録の実装状態注記（D-79/D-1） | HA ⑤「実装完了後の事実注記——文書により批准（HA 対象外・doc-refine 内決着）」 | DECISIONS-CATALOG D-1/D-79 の 2026-07-22 注記（doc-refine PASS・D-79 は proposed 維持） | Y |

S 面の行はなし（シナリオ・E2E への波及ゼロは P2 調査で確認・影響マップ末尾に開示）。

### ② できないことになったこと（平易な差分）

**deferred 行はなし**（全 21 行 resolved）。ただし本 issue が新たに正直開示した「できないこと」が 2 点ある（機能の欠落ではなく保証の限界の明文化）:

- 過去日付へのイベント書き足し（遡及書き込み）の検知は**記録の見た目から書き込み時刻が読める場合に限る**——読めない形式の記録では鳴らない（検知器の限界として正典に明文化。回避経路の存在も開示済み）〔正典 v22 の設計判断・追加実装の追跡はなし〕
- 「構造的に不正な訂正が先行の有効な読みを常に残す」保証は、木の循環・負の額・依存の循環の 3 例についてはまだ完全でない＋訂正ファイルの同時書き込み保護は未実装〔追跡 **#15**（OPEN・機械照合済み）〕

### ③ 閉包判定

**PASS**（全 21 行 resolved・deferred 0・未マップ差分 ∅・HEAD 固定 1d7f493 で照合）

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

- 差分の両端: base=edb6be7（worktree 分岐点・origin/main）／HEAD=1d7f493（P5 開始時固定・照合中の移動なし・作業ツリー clean）。
- R1（M）: resolved——moira-model-update ゲート 2 ラウンド（R1 FAIL→是正→R2 PASS・残存 Critical/Important=0・意図整合 ALIGNED・fork 被覆監査 OK）。MODEL v22・§6 来歴・NAMING/DECISIONS.md 派生同期。
- R2〜R5（P）: resolved——同一 run 再批准（HA ④＋HB F1/F2/F3）・PROPERTIES v0.7・witness green（fact-check CONFIRMED）。
- R6〜R14・R19〜R21（C）: resolved——/kiro-impl 相当の実装＋codex 独立レビュー 2 巡（R1: Critical 1・Important 7 全件是正→R2 是正確認 9 件 CONFIRMED/是正済み）＋CI 計器（backend 193・CLI 344＋2 skip・frontend 172 全 green・tsc/typecheck clean・新鮮実走 2026-07-22）。
- R15/R16（F）: resolved——doc-refine ゲート PASS（doc-adversary Critical 1 含む全指摘修正・doc-fact-checker 6/7 CONFIRMED＋精度 hedge・doc-gate-judge 残存 0）。
- R17/R18（M 派生）: resolved——fact-check claim8 CONFIRMED・R2 採点の現物確認／DECISIONS.md はゲート確定手順 5 の実施記録。
- 未マップ差分: changed（17 パス）− mapped ＝ ∅（`git diff --name-only edb6be7..1d7f493`・rename 検出なし・`moira/changes/**` は台帳自己除外）。
- deferred openness 機械照合: deferred 行 0。参考——証跡列で追跡先として引用した #15 は `gh issue view 15 --json state` → OPEN（2026-07-22 照合）。
- ゲート証跡の所在: moira/changes/issue-11/gate-round-records.md（codex 生指摘全文 R1 16 件＋R2 8 件＋実装レビュー 11 件＋是正確認・敵対/採点/事実検証の全記録）・fork-batch.md（HB F1〜F3 裁定）・intent-ratification.md（HA 確定記録）。

</details>

<details>
<summary>P5 の限界（正直枠——steering §5 のとおり）</summary>

P5 が確認したのは「影響マップに載った行＋未マップ差分ゼロ」であり、P2 調査自体の網羅性は保証しない。M 級変更時の境界モデル検査（第2器）は未実装・意味突合の網羅性の限界・再生成 R/D/T の忠実性は steering §5 の未整備義務のとおり（本レポートはこれらを「担保」と主張しない）。後日発覚した漏れは新 issue として再入する。

</details>
