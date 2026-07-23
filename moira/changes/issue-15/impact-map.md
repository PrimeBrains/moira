---
status: working-ledger
issue: 15
---

# 影響マップ — issue #15

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/backend/src/fold.ts | C | MODEL §2.10 帰結ブレット「検証の迂回は不能」（列挙 4 例のうち残余 3 例）・D-37/D-79・fold.ts の SCOPE NOTE（「PRE-EXISTING gap」正直開示） | /kiro-impl＋codex レビュー＋CI | 残余 3 例（親→子孫 decompose 値訂正・負 amount cost 訂正・循環 relate 端点訂正）の訂正が `winnerByTarget` 登録前の pre-admission で弾かれ、④inapplicable に計上され、先行する有効な読み（先行訂正 or 元イベント）が現行のまま残り、§2.10 文言の可視エラーになる。record 単位で全部 or 無（child 部分適用しない）。SCOPE NOTE の gap 開示は解消後の状態へ更新 | R2 の witness テスト＋CI green＋codex レビュー | resolved | correction.test.ts 3 系統＋F1 nullify witness・独立レビュー R1→R3 PASS（意図整合 CONFIRMED）・codex R1 で fold.ts FYI クリーン・backend 201 green/tsc/depcruise clean（ローカル実走。GitHub CI は P6 push 後）。F1 裁定 (a) により nullify は gate 対象外（fork-batch.md）。gate-round-records.md |
| R2 | moira/backend/src/correction.test.ts | C | PR-EVENTS-ONLY／PR-CORRECTION-METER の非空虚性 witness・#11 gate-2 R1 #1 テストと同型 | /kiro-impl＋codex レビュー＋CI | 3 例それぞれの witness（(i) effective に先行有効読みが残る (ii) meter.inapplicable 増加 (iii) §2.10 inapplicable 文言 (iv) record 単位全部 or 無）が追加され green | vitest 実行結果＋codex レビュー | resolved | correction.test.ts 38 件 green（多重集合差分 witness の件数比較弱化・nullify witness の一様ゲート revert、いずれも実際に落ちることを実証）。独立レビュー R3 非空虚性 CONFIRMED |
| R3 | moira/cli/src/store.ts | C | D-11（永続化方式は土台が所有）・#11 台帳 R7 残余「多プロセスロックは #15 へ deferred」 | /kiro-impl＋codex レビュー＋CI | `appendCorrections` の load→append→rename 全体が advisory lock の排他区間になり、並行 read-modify-write の lost update が防止される（stale lock 検知・EEXIST リトライ込み。新規ランタイム依存なし） | R4 のテスト＋codex レビュー＋CI green | resolved | rename 方式奪取・dead-pid 限定 stale・トークン release・.steal-* GC へ再設計。codex R2 で 4 CONFIRMED-FIXED＋PARTIAL 1（≥3 者交錯——コード内開示済み・best-effort 契約内受容）・独立レビュー R3 PASS。CLI 355 green |
| R4 | moira/cli/src/correct.test.ts | C | 同上（並行書き込みテスト現状ゼロ） | /kiro-impl＋codex レビュー＋CI | 並行 append で lost update が起きない witness＋ロック競合/stale 経路のテストが追加され green | vitest 実行結果＋codex レビュー | resolved | correct.test.ts 40 件 green（実子プロセス保持中の並行 append——lock 無効化で lost update して落ちることを実証・pid ガード両分岐・トークン照合・GC・live 不奪取・dead 奪取）。独立レビュー R3 CONFIRMED |
| R5 | moira/MODEL.md（§7#20 実装状態追補・日英 2 箇所） | M | §7#20 追補「実装面のさらなる残余…は issue #15 で追跡」（日 664 行相当・英 667 行相当） | moira-model-update | 追補が実装完了後の状態へ日英同期で更新される（#15 追跡記述の解消追補）。**§2.10 の規範文・公理・不変条件は一切不変** | moira-model-update ゲート判定（敵対＋fact-check）＋独立採点者の意図整合検査 | 未了 | — |
| R6 | moira/DECISIONS-CATALOG.md（D-79 実装状態注記） | D | D-79 注記「実装面の残余…は本リポの issue #15 で追跡」 | doc-refine | 注記が実装完了の記述へ同期される（決めたこと一文・判定文は不変。D-80 の新旧 #15 読み分け注意は保持） | doc-refine ゲート決着＋意図整合検査 | 未了 | — |
| R7 | moira/DECISIONS-CATALOG.md（D-1 実装状態追補） | D | D-1 追補「訂正機能全体の実装残余は D-79 の同日注記と issue #15 を参照——集合は別」 | doc-refine | D-1 側の #15 参照が解消後の状態へ整合する最小追補（判断一文は不変） | doc-refine ゲート決着＋意図整合検査 | 未了 | — |
| R8 | moira/PROPERTIES.md | P | v0.7・PR-EVENTS-ONLY／PR-CORRECTION-METER／MC-CYCLE-REJECT が §2.10/I2/A6 に bound 済み | （変更なしの確認）照合 worker | 新規プロパティ・文面変更が不要であることが確認される（#11 前例と同型: witness 拡張は R2 が担い、プロパティ文面は動かない）。#15 言及ゼロのまま | 照合確認の記録（閉包時） | 未了 | — |
| R9 | .kiro/scenarios/units/・moira/frontend/e2e/specs/（S 級新規の要否） | S | §2.10 pre-admission ふるまいを描く unit/spec は現状ゼロ。D-79 の #11 注記「シナリオ/E2E への波及ゼロ（E2E 化は将来のシナリオ整備時）」既定 | HA 境界裁定（継続適用なら新規なし） | HA 裁定どおり: #11 の既定判断を継続適用し S 級新規は起こさない（将来の訂正機能シナリオ整備時に一括）——裁定記録が証跡。継続適用しない裁定なら kiro-scenario 行を追記 | HA 批准記録（intent-ratification.md） | 未了 | — |
| R10 | moira/frontend/src/surfaces/health/HealthSurface.tsx | C | correctionMeter.inapplicable の既存読み手（`metric:correction-inapplicable`・crit tone） | 既存 CI（frontend） | コード変更なし。pre-admission 化後に④計上経由で crit タイルが意図どおり点くことは backend witness（R2）が担保——「変更不要」の確認 | 既存 CI green＋R2 witness | 未了 | — |

**スコープ外の正直開示（本マップの行ではない）**: `moira/backend/src/event-store.ts` の events.json 書き込み（素の writeFileSync・rename なし）は corrections.json より脆弱な同型レースを持つが、issue #15 の残作業リストは corrections.json のみを名指ししており本フローのスコープ外。HA で新 issue 起票の要否を確認する。

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R5 | モデル文書の実装状態メモ | メモ「残り 3 例の入口検証と訂正ファイルの同時書き込み保護は issue #15 で追跡中」を、実装完了後に「実装済み」へ書き換える。**ルール本文（「不正な訂正は適用不能で、先行の有効な訂正がそのまま残る」）は一字も変えない**——ルールどおりに実装が追いつくだけ | 未了 |
| R6 | 設計判断カタログ D-79 のメモ | 判断「記録の間違いは、理由を書いて・名指しして・計器に見える形でなら直せる。黙って直す道はない」についている「残余は #15 で追跡」メモを実装完了の記述へ更新する。判断の一文は変えない | 未了 |
| R7 | 設計判断カタログ D-1 のメモ | 判断「完了して確定した出来高は後から減らない」についている「#15 を参照」メモを整合させる。判断の一文は変えない | 未了 |
| R8 | プロパティ集 | 新しい約束は作らず、文面も変えない。既存の約束（「訂正は 4 区分で必ず数える」「同じ記録＋同じ訂正を再生すれば同じ状態になる」）のテスト証拠が増えるだけ | 未了 |
| R9 | 受け入れシナリオ | 今回の変更で「不正な訂正を出したときの見え方」（適用不能カウントが増える・重大表示が点く）は変わるが、これを描くシナリオは現状存在しない。前回 issue #11 のときの判断（「訂正機能のシナリオ/E2E 整備は将来まとめて行う」）を今回も踏襲し、**新しいシナリオは起こさない**——でよいかの裁定 | 未了 |

### 文書ゲート内で批准（HA 対象外）

該当なし（F 級行なし）。

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——ソースコード・
テストコード（C級）の機械決着行であり、codex レビューおよび CI（計器①②③④）に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R1 | moira/backend/src/fold.ts | C |
| R2 | moira/backend/src/correction.test.ts | C |
| R3 | moira/cli/src/store.ts | C |
| R4 | moira/cli/src/correct.test.ts | C |
| R10 | moira/frontend/src/surfaces/health/HealthSurface.tsx（変更不要確認） | C |
