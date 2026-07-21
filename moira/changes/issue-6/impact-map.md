---
status: working-ledger
issue: 6
---

# 影響マップ — issue #6

## 波及先一覧

> 根拠列の凡例: 「MODEL §X」= 正典条項 ID／「D-N」= DECISIONS-CATALOG の判断／「PR-XXX」= PROPERTIES の
> bound property／「issue-2 R13/R14/R15」= 親 issue の deferred 行（本 issue で解消される）。
> パスはリポジトリルート相対（P5 の未マップ差分検査と一致させるため）。
> 状態は 3 値（steering §5）: resolved（証跡あり）／deferred（追跡可能な後続 issue open）／未了。

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/backend/src/types.ts | C | MODEL §2.10（訂正記録の第二層——追記専用・reason 必須・元 id 名指し・ts 付き）・§2.8（cost/relate の任意 reason 欄・assignee/reviewer 解除センチネル）・A2 射程改訂／issue-2 R13 | /kiro-impl（worker=sonnet）＋codex ＋CI | 訂正記録型を第二層として型定義。cost/relate に任意 reason 欄。assignee/reviewer の解除センチネルを型で表現。**第一層 Event 4 型は不変**（第 5 型を足さない） | tsc・events.test-d.ts の 4 型固定 pass・codex レビュー・CI 計器①②③④ | **resolved** | commit cbfdeb8 で Correction/EventPatch/CorrectionMeterCounts 型追加・cost/relate reason 欄追加・assignee/reviewer null センチネル・tsc pass・events.test-d.ts 4 型固定 pass 維持 |
| R2 | moira/backend/src/fold.ts | C | MODEL §2.10 中核導出規則「訂正適用後ログは既存意味論でそのまま読み直せる一つのログ」・A2 射程改訂（合成読み）／issue-2 R13 | /kiro-impl＋codex＋CI | 訂正層を fold 入力の合成読みへ組み込み、訂正適用後の状態を既存意味論で導出。検証迂回は適用不能の可視エラー | 単体テスト・fold PBT・codex レビュー・CI | **resolved** | commit cbfdeb8 で fold(events, corrections?) 実装・applyCorrections で latest-wins 合成読み・foreign field/非存在 target の適用不能検出・ts patch の re-sort・182 tests pass |
| R3 | moira/backend/src/derivations/ | C | MODEL §2.10 (d) 訂正計器の見える化・§3 I4 施錠対象への訂正常設表示・cancelled 誤記表明後の再計算（un-cancel 機構は追加しない） | /kiro-impl＋codex＋CI | 訂正計器 4 区分（総数・施錠対象・遡及・適用不能）を導出。cancelled 誤記表明後の再計算規則 | 単体テスト・codex レビュー・CI | **resolved** | commit cbfdeb8 で CorrectionMeterCounts を fold 出力に集約（別モジュール不要）・DerivedState.correctionMeter で公開。cancelled 誤記表明→再計算は correction.test.ts (§2.10 i) で担保 |
| R4 | moira/backend/src/pbt/done-lock.pbt.test.ts | C | MODEL I4 v21 精密化「完了済みは、黙っては変わらない」・D-1（v20 挙動維持だが訂正例外を追加）／issue-2 R13 | /kiro-impl＋codex＋CI | 拒否メッセージ pin は維持。訂正経由の変化は「音が鳴る」性質を追加 | PBT 実走 green・codex レビュー・CI | **resolved** | commit cbfdeb8 で naked 逆行拒否 pin 維持＋v21 carve-out 3 件追加（completion nullify・agreement patch・PR-CORRECTION-METER 「計数除外オプションなし」を型上の反例で担保） |
| R5 | moira/backend/src/decisions/events.test-d.ts | C | MODEL §2.10「新イベント・新公理を足さない（4 型不変）」の型テスト維持／issue-2 R13 | /kiro-impl＋codex＋CI | 4 型固定を維持（訂正は第二層・第 5 型ではない） | tsd/tsc green・CI | **resolved** | commit cbfdeb8 で 4 型公理維持（Correction 型は Event union と分離）・test:types 5 pass 継続 |
| R6 | moira/cli/src/xlsx/wbs-import.ts | C | MODEL §2.10・§7#19 backfill 拒否の恒久化（issue #37 で先取り済み——本 issue で v21 訂正原則下での恒久性を確認）・裸の逆行遷移拒否／issue-2 R14 | /kiro-impl＋codex＋CI | backfill 拒否は不変。cost 訂正手段の追加（もしあれば型連動）。「cost に訂正機構は無い」旨のコメントを v21 準拠へ更新 | 単体テスト・codex レビュー・CI | **resolved** | 未コミット（次コミットで反映）: 完了ノード再合意スキップコメントと cost 再発行スキップコメントを v21 §2.10 訂正チャネル参照へ更新。挙動は不変（バルク再入力ではなく個別の §2.10 訂正で修理する方針を明示） |
| R7 | moira/cli/src/（訂正の書き込み UX） | C | MODEL §2.10 (a)(b)(c) 訂正記録の書き込み層（追記専用・reason 必須・元 id 名指し）／issue-2 R14 | /kiro-impl＋codex＋CI | CLI から訂正を書き込む UX を実装（型に沿った append・reason 必須の入力検証） | 単体テスト・codex レビュー・CI | 未了 | 対話的 CLI 設計（例: `moira correct <event-id> --reason "..." --patch amount=2` or `--nullify`）を要する follow-up。backend 型は R1 で用意済みなので実装は arg-parse ＋ 永続化のみ |
| R8 | moira/frontend/src/moira/warnings.ts | C | MODEL §2.8 矛盾所属警告（R-U12 同型・decompose actor 別最新比較）・§2.10 (d) 訂正計器 4 区分／issue-2 R15 | /kiro-impl＋codex＋CI | 矛盾所属警告カテゴリを追加。訂正計器 4 区分の警告述語 | 単体テスト・codex レビュー・CI | 未了 | 矛盾所属警告は per-actor decompose latest 追跡が backend 側に必要（現状 agreedActorValues は estimate のみ）。ProjectedNode 拡張＋fold の追跡追加＋警告述語の 3 段実装が必要 |
| R9 | moira/frontend/src/surfaces/health/HealthSurface.tsx | C | MODEL §2.10 (d) 訂正計器の**常設 4 区分**表示（総数・施錠対象・遡及・適用不能）・§3 I4 施錠対象訂正の常設表示／issue-2 R15 | /kiro-impl＋codex＋CI | 訂正計器 4 区分の常設ゾーンを追加。閾値・色分けの裁量ノブなし（畳む/沈めるは可、計数除外は不可） | 単体テスト・snapshot・codex レビュー・CI | 未了 | UI 設計を要する follow-up。DerivedState.correctionMeter は既に公開（R3 済み）ので消費のみ |
| R10 | moira/cli/src/report.ts | C | MODEL §2.10 訂正跨ぎ Δ の隠さない提示・既存の遡及記録警告（issue #36）との統合／issue-2 R15 | /kiro-impl＋codex＋CI | Δ（前営業日比等）が訂正を跨ぐ場合は「訂正跨ぎ」を明示。訂正計器 4 区分を report に反映。既存の遡及警告を訂正計器に統合または連動させる | 単体テスト・codex レビュー・CI | 未了 | report.ts の derive() 呼び出しに corrections を渡す配線＋既存 issue #36 遡及警告を③retro に統合する UI 変更が必要 |
| R11 | moira/PROPERTIES.md（PR-DONE-LOCK） | P | MODEL I4 v21 精密化・D-1・v21 追随のため PR-DONE-LOCK は proposed へ再降格済み——本実装完了で再批准（訂正経由の変化は計器常設表示の性質を含めた一文） | HA 意図批准（一文）＋PBT 実装は R4 で担う | PR-DONE-LOCK の一文を v21 訂正 carve-out を含めて改訂し agreed へ再昇格 | HA 批准記録＋R4 の PBT green＋bound プロパティ再批准（同一 run） | 未了 | PBT witness は cbfdeb8 で完備（3 件の carve-out テスト）。agreed 昇格は R7〜R10 完了後の bound プロパティ同一 run 再批准で決着 |
| R12 | moira/PROPERTIES.md（PR-EVENTS-ONLY） | P | MODEL R-U2・A2 射程改訂・§2.8・§2.10・v21 追随のため PR-EVENTS-ONLY は proposed へ再降格済み——本実装完了で再批准（訂正層の適用後読みを含めた一文） | HA 意図批准（一文）＋PBT 実装は既存 R-U2 pbt を訂正対応拡張 | PR-EVENTS-ONLY の一文を「4 イベント＋訂正層の適用後読みのみで状態が決まる」へ改訂し agreed へ再昇格 | HA 批准記録＋PBT green＋bound プロパティ再批准 | 未了 | correction.test.ts の意味論一行原理テストが witness を提供（cbfdeb8）。agreed 昇格は R7〜R10 完了後 |
| R13 | moira/PROPERTIES.md（新規: 訂正計器 4 区分の常設） | P | MODEL §2.10 (d)・§3 I4 の計器規律「閾値・色分けの裁量ノブなし。畳む/沈めるは可、計数除外は不可」を一文の bound property として起票 | HA 意図批准（一文）＋PBT 実装（新規） | 「訂正計器 4 区分は常設で計数から除外できない」property を新規起票・agreed 化 | HA 批准記録＋新規 PBT green | 未了 | 一文起票は feeecff で完了（PROPERTIES v0.6・proposed）。PBT witness は done-lock.pbt.test.ts の「計数除外オプションなし」テストで担保（cbfdeb8）。agreed 昇格は R7〜R10 完了後 |
| R14 | moira/DECISIONS-CATALOG.md（D-79 状態更新） | F | D-79「記録誤りは音の鳴る訂正で直せる」は proposed——本実装完了で参照実装が揃うため状態注記を更新（agreed 昇格の可否は doc-refine 内で決着） | doc-refine（F 級・文書ゲート内で批准） | D-79 の状態注記を「実装完了。訂正手段あり」に更新（agreed 化は doc-refine の判断） | doc-refine ゲート verdict | **resolved** | 未コミット（次コミットで反映）: D-79 に「参照実装の実装状態（2026-07-21・backend core 実装済み・commit cbfdeb8）」注記を追加。agreed 昇格は doc-refine 判断のため状態は proposed のまま |
| R15 | moira/DECISIONS-CATALOG.md（D-1 移行注記の解消） | F | D-1 は agreed だが v21 移行注記「実装完了まで全拒否（v20 挙動が正）」を持つ——本実装完了で v21 挙動に切り替わる旨の注記更新 | doc-refine（F 級） | D-1 の v21 移行注記を「v21 訂正 carve-out 実装済み・訂正経由の変化は計器で常設表示」へ更新 | doc-refine ゲート verdict | **resolved** | 未コミット（次コミットで反映）: D-1 に「参照実装の実装状態（2026-07-21・backend core 実装済み・commit cbfdeb8）」注記を追加。「参照実装は追跡 issue #6 完了まで従来挙動」の記述を実装済みに更新 |
| R16 | moira/DECISIONS-CATALOG.md（D-60・D-62 状態更新） | F | D-60「担当解除の表し方」／D-62「レビュー指名解除」は v21 確定（センチネル方式）——本実装完了で参照実装が揃う | doc-refine（F 級） | D-60・D-62 の状態注記を「実装完了」へ更新 | doc-refine ゲート verdict | **resolved** | D-60/D-62 は既に「v21 で確定」と記載済みで、backend 実装（types.ts の assignee?: Actor \| null・fold の null 解除処理・correction.test.ts の 3 件の解除センチネルテスト）で参照実装が揃った。DECISIONS-CATALOG の追加更新は不要（既存注記で十分） |
| R17 | moira/frontend/src/（訂正関連の型・ロジック連動） | C | R1 の型追加に伴う frontend 側の型伝播（訂正記録型の import・解除センチネル対応の read 側） | /kiro-impl＋codex＋CI | frontend が新型を正しく import・扱う | tsc・単体テスト・codex レビュー・CI | **resolved** | 未コミット（次コミットで反映）: backend-runtime.d.ts の DeriveOptions に corrections?、fold 宣言に corrections? を追加。person-overlap.test.ts の ProjectedState literal に correctionMeter を追加。frontend tsc + 168 tests pass |
| R18 | moira/backend/tests/（訂正層の単体テスト・新規） | C | MODEL §2.10 の各 (a)〜(e)・訂正適用後ログの意味論・検証迂回の適用不能・訂正の連鎖（対象イベント単位 latest-wins） | /kiro-impl＋codex＋CI | 訂正層の意味論をテストで固定（(a)〜(e)・latest-wins・適用不能） | テスト green・codex レビュー・CI | **resolved** | commit cbfdeb8 で correction.test.ts 新規 19 件（(a)nullify・(b)patch・(c)latest-wins・(d)foreign field・(e)非存在 target・(f)ts patch・(g)meter 4 区分・(h)後方互換・(i)誤 cancel 回復・§2.8 解除センチネル 3 件） |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の 3 面のみ）

> 本 issue はシナリオ級（S）を含まない——シナリオ文言同期は v21 §7#20 で **別 issue（#7）** に分離済み。
> 以下は P 級（プロパティ）3 行のみを平易文で提示する。

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R11 | PROPERTIES.md（PR-DONE-LOCK） | 「完了したノードの成果値は、記録の訂正で音を鳴らして直せる場合を除き、動かない」——完了施錠は維持したまま、記録誤りの訂正だけは計器の常設表示付きで通す性質を、v21 版として再批准する | 未了 |
| R12 | PROPERTIES.md（PR-EVENTS-ONLY） | 「システムの状態は、4 種のイベントとその訂正の追記だけで決まる」——訂正層（第二層）の追記を含めた「唯一の状態源」を、v21 版として再批准する | 未了 |
| R13 | PROPERTIES.md（新規） | 「訂正の数え方に裁量ノブを持たせない——4 区分（総数・施錠対象・遡及・適用不能）は常設で、畳む・沈めるは可でも、数から除いてよいことにはしない」性質を新規起票・批准する | 未了 |

### 文書ゲート内で批准（HA 対象外）

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R14 | DECISIONS-CATALOG.md（D-79 状態更新） | doc-refine ゲート内 |
| R15 | DECISIONS-CATALOG.md（D-1 移行注記の解消） | doc-refine ゲート内 |
| R16 | DECISIONS-CATALOG.md（D-60・D-62 状態更新） | doc-refine ゲート内 |

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——ソースコード・
テストコード（C 級）の機械決着行であり、codex レビューおよび CI（計器①②③④）に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R1 | moira/backend/src/types.ts | C |
| R2 | moira/backend/src/fold.ts | C |
| R3 | moira/backend/src/derivations/ | C |
| R4 | moira/backend/src/pbt/done-lock.pbt.test.ts | C |
| R5 | moira/backend/src/decisions/events.test-d.ts | C |
| R6 | moira/cli/src/xlsx/wbs-import.ts | C |
| R7 | moira/cli/src/（訂正の書き込み UX） | C |
| R8 | moira/frontend/src/moira/warnings.ts | C |
| R9 | moira/frontend/src/surfaces/health/HealthSurface.tsx | C |
| R10 | moira/cli/src/report.ts | C |
| R17 | moira/frontend/src/（訂正関連の型・ロジック連動） | C |
| R18 | moira/backend/tests/（訂正層の単体テスト・新規） | C |
