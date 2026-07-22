---
status: working-ledger
issue: 11
---

# 影響マップ — issue #11

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/MODEL.md | M | §2.10 (d) 計器定義文の③「遡及訂正（対象イベントの ts を現行の読みより過去へ動かす訂正）」——(1) HA B5 批准済み統合（issue #36 遡及書き込み警告を③に吸収・「訂正跨ぎと遡及書き込みは同じ計器を鳴らす」issue-6 intent-ratification B5）は現行定義文の字義（訂正スコープ）を超える。(2) #6 実装の③述語（fold.ts RETROACTIVE_THRESHOLD_MS: 対象 ts より 1 日超後着の訂正）が現行定義文と不一致（正典↔実装ドリフトの先行発見） | moira-model-update | §2.10 (d) の③定義が B5 裁定・参照実装意図（1 日閾値）を含めて整合的に確定し、派生文書同期（journal・§7 追跡）が済む | moira-model-update ゲート PASS（敵対ゲート＋moira-gate-judge・意図整合検査） | resolved | ゲート 1 R2 採点 PASS（2026-07-22・残存 Critical/Important=0・意図整合 ALIGNED・fork 被覆監査 OK）。MODEL v22・§6 来歴・gate-round-records.md。HB F1〜F3 裁定込み |
| R2 | moira/PROPERTIES.md（PR-DONE-LOCK） | P | #6 R11 継承（I4・R-E3・§2.10）。一文は v0.5 で改訂済み・proposed。PBT witness 完備（done-lock.pbt.test.ts v21 carve-out 3 件・cbfdeb8） | moira-model-update 内 bound プロパティ再批准（同一 run 規律・HA 事前批准） | 一文（現行 v0.6 文面のまま）が agreed へ昇格 | HA 批准記録＋PBT green＋同一 run 再批准記録 | resolved | **注**: HB F3 裁定により一文は締め直し改稿のうえ agreed（改稿文面を HB で批准・PROPERTIES v0.7・fork-batch.md F3）。witness green（fact-check R1 claim4 CONFIRMED） |
| R3 | moira/PROPERTIES.md（PR-EVENTS-ONLY） | P | #6 R12 継承（R-U2・A2・§2.8・§2.10）。一文は v0.5 で改訂済み・proposed。witness は correction.test.ts §2.10 (a)〜(h)＋意味論一行原理（cbfdeb8） | 同上 | 一文（現行 v0.6 文面のまま）が agreed へ昇格 | HA 批准記録＋PBT green＋同一 run 再批准記録 | resolved | v0.7 で agreed（HA P-R3 批准 verbatim・witness green・R2 採点 PASS） |
| R4 | moira/PROPERTIES.md（PR-CORRECTION-METER ★） | P | #6 R13 継承（§2.10 (d)・§3・§2.1）。一文は v0.6 で起票済み・proposed——B5 統合（③への吸収・二重表示回避）を既に織り込んだ文面。witness は correction.test.ts (g) 4 件＋done-lock.pbt.test.ts「計数除外オプションなし」 | 同上 | 一文が agreed へ昇格＋★impl-pending 解除（backend 実装到達済み・witness green——v0.3→v0.4 の MC 系★解除と同じ前例） | HA 批准記録＋PBT green＋同一 run 再批准記録 | resolved | agreed 昇格は v0.7（一語同期＋検知開示句は F1 被覆・採点者監査 OK）。★解除は HB F2 裁定どおりゲート 2 の③a 判定（fold）・③c 検知（report 観測層）到達をもって実施（2026-07-22・PROPERTIES 変更点 2 更新済み） |
| R5 | moira/PROPERTIES.md（版規律・被覆表・件数行） | P | PROPERTIES 規約「件数・批准状態に触れるため版を上げる」——批准状態が 49 agreed＋6 proposed → 52 agreed＋3 proposed に変わる | 同上（ゲート内編集） | v0.6→v0.7: 冒頭件数行・I4/A2 被覆行の（proposed）注記解消・「次手」節更新・v0.6→v0.7 変更点節の追加 | 照合 subagent による表整合確認（doc-fact-checker・影響マップ範囲） | resolved | fact-check R1 claim6 CONFIRMED（55=52+3 の機械照合）＋R2 採点 PASS（被覆表 F3 同期・変更点節整合の現物確認） |
| R6 | moira/cli/src/commands.ts | C | #6 R7 継承。MODEL §2.10 (a)(b)(c)。cmdCorrect 新設（case 'correct'）・cmdReport が corrections を buildReport へ渡していない現状（correction meter 行が常時ゼロ）の解消・cmdLog がイベント id を表示しない UX ギャップ | /kiro-impl（worker=sonnet）＋codex＋CI | `moira correct <event-id> --reason --patch k=v…/--nullify` 実装（reason 必須検証・confirmDestructive 再利用・locked target の事前 fold 判定と警告・--yes バイパス・非 TTY 素通し）＋cmdReport への corrections 配線＋id 発見手段（log 出力 or --json 案内） | 単体テスト・codex レビュー・CI 計器①②③④ | resolved | cmdCorrect/cmdReport 配線/cmdLog id 実装＋correct.test.ts。codex レビュー #7/#8 CONFIRMED-FIXED（drift 残余も是正）・CLI 344 tests green・tsc clean |
| R7 | moira/cli/src/store.ts | C | #6 R7 継承。MoiraRepo に correctionsPath が無い（corrections.json 永続化層の欠落） | /kiro-impl＋codex＋CI | correctionsPath＋loadCorrections/appendCorrections（dates.json 型の追記パターン）＋init() での `[]` seed | 単体テスト・codex レビュー・CI | resolved | store.ts 実装＋スキーマ検証＋原子的置換＋patch 値形状検証。codex #9 是正確認済み・テスト green（多プロセスロックは #15 へ deferred） |
| R8 | moira/cli/src/report.ts | C | HA B5 完全配線（#6 R10 の残注記「配線は今後」）。formatReportText の二重表示（498-505 ⚠遡及記録 と 507-518 ⚠訂正記録 が背中合わせ）・ReportJson.retroactive と correctionMeter の二重フィールド | /kiro-impl＋codex＋CI | ⚠遡及記録 セクションを訂正計器行へ吸収し単一表示化（表現は HA 受け入れ基準に従う）。corrections が meter に反映される | 単体テスト・codex レビュー・CI | resolved | 単一警告面「⚠ 訂正・遡及」実装・as-of 時点カット・③c 常設化・到着順の乱れ分離・feature/milestone/landing への実効ストリーム供給。codex #3〜#6 CONFIRMED-FIXED |
| R9 | moira/cli/src/report.test.ts | C | 377-405 が現行二重表示の文言を固定（「正常時は遡及に言及しない」含む）。訂正計器行の render path は現在テストゼロ | /kiro-impl＋codex＋CI | issue #36 アサーションを統合後表示へ改稿＋訂正計器行の新規カバレッジ | テスト green・codex レビュー・CI | resolved | report.test.ts 改稿＋新規（as-of カット・常設・順序異常・統合ヘッダ regression guard・rollup 反映）。CLI 344 green |
| R10 | moira/backend/src/fold.ts・moira/backend/src/types.ts | C | R1 で確定する③意味論の実装同期（遡及イベント書き込みの計上経路を含む——types.ts:180-190 コメントは目標状態を既に記述） | /kiro-impl＋codex＋CI | ③の計数が確定した正典定義に一致（correction 遡及 OR 遡及イベント書き込み） | 単体テスト・PBT・codex レビュー・CI | resolved | 訂正系③a∨③b（1 記録 1 カウント）・①全数計上是正・per-record 評価（適用直前読み）・有効訂正のみ winner 化（Critical #1 是正）・actor merge＋非人間 agreed の適用不能ゲート・materializeEffectiveEvents export。codex #1/#2/#8 CONFIRMED-FIXED・backend 193 green。※③c は観測層＝CLI report 側（HB F1 裁定どおり fold 会計に入れない） |
| R11 | moira/backend/src/correction.test.ts | C | R10 の意味論変更に伴う (g) 計器テストの更新・③拡張の witness 追加 | /kiro-impl＋codex＋CI | ③の新意味論を非空虚に witness | テスト green・CI | resolved | correction.test.ts 19→backend 全 193（③a/両条件 1 カウント/①全数/Critical#1 3 本/②per-record/actor 3 本） |
| R12 | moira/frontend/src/surfaces/health/HealthSurface.tsx | C | ③ゾーン（100-106）のサブラベル「対象イベントより1日以上後に発行された訂正」と脚注 119「統合予定（配線は今後）」が新意味論と不整合になる | /kiro-impl＋codex＋CI | ③ゾーンの文言を新意味論へ更新・「配線は今後」脚注を撤去 | 単体テスト・tsc・codex レビュー・CI | resolved | HealthSurface ③（訂正系）ラベル/サブラベル/脚注更新。frontend 172 green・typecheck clean |
| R13 | moira/cli/src/（新規 correct コマンドテストファイル） | C | R6 の非空虚 witness（commands-write-safety.test.ts の confirm ゲート規約と互換であること） | /kiro-impl＋codex＋CI | patch/nullify・reason 欠落拒否・locked 警告・--yes・非 TTY 素通しをテストで固定 | テスト green・CI | resolved | correct.test.ts 18→型変換 6/合成読み 2/スキーマ 5/原子性 1 追加。CLI 344 green |
| R14 | moira/frontend/src/moira/backend-runtime.d.ts ほか frontend 型伝播 | C | R10 で fold/derive の入力が変わる場合の型同期（#6 R17 と同型） | /kiro-impl＋codex＋CI | frontend tsc 0 errors・テスト green（シグネチャ不変なら変更なしの確認） | tsc・テスト green・CI | resolved | シグネチャ不変を確認（変更なし）・frontend typecheck clean・172 green |
| R15 | moira/DECISIONS-CATALOG.md（D-79 状態注記） | F | D-79:654 の残工程注記「CLI 書き込み UX…report Δ の訂正跨ぎ表示（issue #36 遡及警告の統合含む）は issue #6 の残工程」が本 issue で解消される | doc-refine（F 級・文書ゲート内で批准） | D-79 の実装状態注記を「CLI UX・report 統合 実装完了」へ更新（agreed 昇格可否は doc-refine 判断） | doc-refine ゲート verdict | resolved | doc-refine ゲート PASS（2026-07-22・doc-adversary F-1 Critical 含む全指摘修正・doc-fact-checker 6/7 CONFIRMED＋精度 hedge 反映・doc-gate-judge 判定）。状態は proposed 維持（昇格は HA 批准対象外——judge 確認済み） |
| R16 | moira/DECISIONS-CATALOG.md（D-1 状態注記） | F | D-1:33 の残工程注記「CLI 書き込み UX と frontend 常設ゾーン表示は issue #6 の残工程」が本 issue で解消される | doc-refine（F 級） | D-1 の実装状態注記を実装完了へ更新 | doc-refine ゲート verdict | resolved | 同上（時点差の追補として append-only 規律で記載・F-1/F-2/F-8 是正済み） |
| R17 | moira/NAMING.md | M | ゲート 1 完了時の未マップ差分検査で検出（P2 追記）。M ゲートの派生同期義務の出力——訂正計器・遡及の 2 行＋v22 追記 note。HA ⑤ 実行計画（ゲート 1 の派生文書同期）と R1 postcondition が被覆——新規判断なし | moira-model-update（ゲート内派生同期） | NAMING の 2 行が MODEL v22 の区分名・二系定義と一致 | fact-check（R1 claim8 CONFIRMED）＋R2 採点の現物確認 | resolved | gate-round-records.md（fact-check claim8・R2 C-R2-2 修正確認） |
| R18 | moira/DECISIONS.md | M | 同上（P2 追記）。moira-model-update 確定手順 5「解消した分岐を追記」の出力（HB F1〜F3 の記録） | moira-model-update（ゲート内派生同期） | v21→v22 の確定済み分岐節が HB 裁定と一致 | ゲート確定手順の実施記録（本 run） | resolved | DECISIONS.md「確定済みの分岐(v21 → v22)」節・fork-batch.md 裁定記録と同文 |
| R19 | moira/backend/src/index.ts | C | ゲート 2 完了時の未マップ差分検査で検出（P2 追記）。#6 実装以来 CLI の tsc/CI が赤だった既存欠陥——barrel が Correction/EventPatch/CorrectionMeterCounts 型を export しておらず cli/report.ts の既存 import が破綻していた。純加法の型 export のみ（意味変更なし） | /kiro-impl＋codex＋CI | barrel が訂正関連型を export し CLI の tsc が clean | tsc・全テスト green・codex レビュー | resolved | 型 export 追加＋materializeEffectiveEvents export。codex FYI「sound by inspection」・全パッケージ tsc clean |
| R20 | moira/cli/src/xlsx/wbs-import.ts | C | 同上（P2 追記）。EMPTY_PROJECTED リテラルに ProjectedState 必須の correctionMeter が欠落（#6 型追加時の同期漏れ・既存 CI 赤の一部） | /kiro-impl＋codex＋CI | 型リテラル同期（挙動不変） | tsc・単体テスト green・codex レビュー | resolved | correctionMeter ゼロ値追加。codex FYI sound・テスト green |
| R21 | moira/cli/src/adapter/drift/drift.ts | C | ゲート 2 是正確認（codex R2 #7 PARTIAL）で検出（P2 追記）——drift 比較が無訂正 fold のままの split-brain 残余 | /kiro-impl＋codex＋CI | drift 比較も合成読み（events＋corrections）に対して行う | codex 是正確認＋テスト green | resolved | drift.ts へ loadCorrections 配線（著者是正・2026-07-22）・CLI 344 green |

調査済みで**行を立てない**もの（正直開示）: `.kiro/scenarios/units/`・`flows/`（§3/§6 に訂正・遡及・report 出力への言及なし——ヒット 3 件は全て決定注記/別義）、`moira/frontend/e2e/`（訂正計器 testid・report への参照ゼロ・E2E は frontend 専用で CLI 出力を見ない）、golden テスト群（report/訂正への参照なし）、V 級（検知器変更なし）。

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R1 | 正典モデル（計器の定義） | 訂正計器の「遡及」区分の意味を確定させる。いま正典は「対象の日時を過去に動かす訂正」と書いているが、(1) すでに批准済みの統合方針（B5）は「過去日付へのイベント追記（遡及書き込み）でも同じ計器を鳴らす」ことを求めており、(2) 実装は「対象より 1 日超あとに出された訂正」を数えている——三者がずれている。この「遡及」の数え方を一本化して正典に書く | resolved（v22・HB F1 裁定「一つの警告面の下の二系」込み） |
| R2 | プロパティ（完了施錠） | 「完了した作業の出来高は、考えが変わった操作では減らない。唯一の例外は音の鳴る訂正」という一文を批准し agreed にする | resolved（HB F3 で「そのノード自身の凍結額」へ締め直した改稿文面で agreed） |
| R3 | プロパティ（追記だけで状態が決まる） | 「状態の変化は 4 種類の追記イベント＋訂正の第二層だけで起こり、保存済みを直接書き換えることはできない」という一文（文面は確定済み）を批准し agreed にする | resolved（批准 verbatim で agreed） |
| R4 | プロパティ（訂正の数え方に裁量なし） | 「訂正の 4 区分は常に見える形で数え、特定の訂正を名目を付けて数から除くことはできない。遡及書き込み警告はこの計器の③に統合」という一文（文面は確定済み）を批准し agreed にする。あわせて「実装待ち」印（★）を外す | resolved（agreed 化済み・★は実装到達で解除済み——HB F2 裁定どおり） |
| R5 | プロパティ目録の版 | 批准状態が変わる（agreed 49→52）ため版を v0.6→v0.7 に上げ、目録内の件数・注記を同期する | resolved |

### 文書ゲート内で批准（HA 対象外）

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R15 | 設計判断目録（D-79 の実装状態注記） | doc-refine ゲート内 |
| R16 | 設計判断目録（D-1 の実装状態注記） | doc-refine ゲート内 |

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——ソースコード・
テストコード（C級）の機械決着行であり、codex レビューおよび CI（計器①②③④）に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R6 | moira/cli/src/commands.ts | C |
| R7 | moira/cli/src/store.ts | C |
| R8 | moira/cli/src/report.ts | C |
| R9 | moira/cli/src/report.test.ts | C |
| R10 | moira/backend/src/fold.ts・types.ts | C |
| R11 | moira/backend/src/correction.test.ts | C |
| R12 | moira/frontend/src/surfaces/health/HealthSurface.tsx | C |
| R13 | moira/cli/src/（新規 correct テスト） | C |
| R14 | moira/frontend/src/moira/backend-runtime.d.ts ほか | C |
