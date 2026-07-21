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
| R1 | moira/backend/src/types.ts | C | MODEL §2.10（訂正記録の第二層——追記専用・reason 必須・元 id 名指し・ts 付き）・§2.8（cost/relate の任意 reason 欄・assignee/reviewer 解除センチネル）・A2 射程改訂／issue-2 R13 | /kiro-impl（worker=sonnet）＋codex ＋CI | 訂正記録型を第二層として型定義。cost/relate に任意 reason 欄。assignee/reviewer の解除センチネルを型で表現。**第一層 Event 4 型は不変**（第 5 型を足さない） | tsc・events.test-d.ts の 4 型固定 pass・codex レビュー・CI 計器①②③④ | 未了 | — |
| R2 | moira/backend/src/fold.ts | C | MODEL §2.10 中核導出規則「訂正適用後ログは既存意味論でそのまま読み直せる一つのログ」・A2 射程改訂（合成読み）／issue-2 R13 | /kiro-impl＋codex＋CI | 訂正層を fold 入力の合成読みへ組み込み、訂正適用後の状態を既存意味論で導出。検証迂回は適用不能の可視エラー | 単体テスト・fold PBT・codex レビュー・CI | 未了 | — |
| R3 | moira/backend/src/derivations/ | C | MODEL §2.10 (d) 訂正計器の見える化・§3 I4 施錠対象への訂正常設表示・cancelled 誤記表明後の再計算（un-cancel 機構は追加しない） | /kiro-impl＋codex＋CI | 訂正計器 4 区分（総数・施錠対象・遡及・適用不能）を導出。cancelled 誤記表明後の再計算規則 | 単体テスト・codex レビュー・CI | 未了 | — |
| R4 | moira/backend/src/pbt/done-lock.pbt.test.ts | C | MODEL I4 v21 精密化「完了済みは、黙っては変わらない」・D-1（v20 挙動維持だが訂正例外を追加）／issue-2 R13 | /kiro-impl＋codex＋CI | 拒否メッセージ pin は維持。訂正経由の変化は「音が鳴る」性質を追加 | PBT 実走 green・codex レビュー・CI | 未了 | — |
| R5 | moira/backend/src/decisions/events.test-d.ts | C | MODEL §2.10「新イベント・新公理を足さない（4 型不変）」の型テスト維持／issue-2 R13 | /kiro-impl＋codex＋CI | 4 型固定を維持（訂正は第二層・第 5 型ではない） | tsd/tsc green・CI | 未了 | — |
| R6 | moira/cli/src/xlsx/wbs-import.ts | C | MODEL §2.10・§7#19 backfill 拒否の恒久化（issue #37 で先取り済み——本 issue で v21 訂正原則下での恒久性を確認）・裸の逆行遷移拒否／issue-2 R14 | /kiro-impl＋codex＋CI | backfill 拒否は不変。cost 訂正手段の追加（もしあれば型連動）。「cost に訂正機構は無い」旨のコメントを v21 準拠へ更新 | 単体テスト・codex レビュー・CI | 未了 | — |
| R7 | moira/cli/src/（訂正の書き込み UX） | C | MODEL §2.10 (a)(b)(c) 訂正記録の書き込み層（追記専用・reason 必須・元 id 名指し）／issue-2 R14 | /kiro-impl＋codex＋CI | CLI から訂正を書き込む UX を実装（型に沿った append・reason 必須の入力検証） | 単体テスト・codex レビュー・CI | 未了 | — |
| R8 | moira/frontend/src/moira/warnings.ts | C | MODEL §2.8 矛盾所属警告（R-U12 同型・decompose actor 別最新比較）・§2.10 (d) 訂正計器 4 区分／issue-2 R15 | /kiro-impl＋codex＋CI | 矛盾所属警告カテゴリを追加。訂正計器 4 区分の警告述語 | 単体テスト・codex レビュー・CI | 未了 | — |
| R9 | moira/frontend/src/surfaces/health/HealthSurface.tsx | C | MODEL §2.10 (d) 訂正計器の**常設 4 区分**表示（総数・施錠対象・遡及・適用不能）・§3 I4 施錠対象訂正の常設表示／issue-2 R15 | /kiro-impl＋codex＋CI | 訂正計器 4 区分の常設ゾーンを追加。閾値・色分けの裁量ノブなし（畳む/沈めるは可、計数除外は不可） | 単体テスト・snapshot・codex レビュー・CI | 未了 | — |
| R10 | moira/cli/src/report.ts | C | MODEL §2.10 訂正跨ぎ Δ の隠さない提示・既存の遡及記録警告（issue #36）との統合／issue-2 R15 | /kiro-impl＋codex＋CI | Δ（前営業日比等）が訂正を跨ぐ場合は「訂正跨ぎ」を明示。訂正計器 4 区分を report に反映。既存の遡及警告を訂正計器に統合または連動させる | 単体テスト・codex レビュー・CI | 未了 | — |
| R11 | moira/PROPERTIES.md（PR-DONE-LOCK） | P | MODEL I4 v21 精密化・D-1・v21 追随のため PR-DONE-LOCK は proposed へ再降格済み——本実装完了で再批准（訂正経由の変化は計器常設表示の性質を含めた一文） | HA 意図批准（一文）＋PBT 実装は R4 で担う | PR-DONE-LOCK の一文を v21 訂正 carve-out を含めて改訂し agreed へ再昇格 | HA 批准記録＋R4 の PBT green＋bound プロパティ再批准（同一 run） | 未了 | — |
| R12 | moira/PROPERTIES.md（PR-EVENTS-ONLY） | P | MODEL R-U2・A2 射程改訂・§2.8・§2.10・v21 追随のため PR-EVENTS-ONLY は proposed へ再降格済み——本実装完了で再批准（訂正層の適用後読みを含めた一文） | HA 意図批准（一文）＋PBT 実装は既存 R-U2 pbt を訂正対応拡張 | PR-EVENTS-ONLY の一文を「4 イベント＋訂正層の適用後読みのみで状態が決まる」へ改訂し agreed へ再昇格 | HA 批准記録＋PBT green＋bound プロパティ再批准 | 未了 | — |
| R13 | moira/PROPERTIES.md（新規: 訂正計器 4 区分の常設） | P | MODEL §2.10 (d)・§3 I4 の計器規律「閾値・色分けの裁量ノブなし。畳む/沈めるは可、計数除外は不可」を一文の bound property として起票 | HA 意図批准（一文）＋PBT 実装（新規） | 「訂正計器 4 区分は常設で計数から除外できない」property を新規起票・agreed 化 | HA 批准記録＋新規 PBT green | 未了 | — |
| R14 | moira/DECISIONS-CATALOG.md（D-79 状態更新） | F | D-79「記録誤りは音の鳴る訂正で直せる」は proposed——本実装完了で参照実装が揃うため状態注記を更新（agreed 昇格の可否は doc-refine 内で決着） | doc-refine（F 級・文書ゲート内で批准） | D-79 の状態注記を「実装完了。訂正手段あり」に更新（agreed 化は doc-refine の判断） | doc-refine ゲート verdict | 未了 | — |
| R15 | moira/DECISIONS-CATALOG.md（D-1 移行注記の解消） | F | D-1 は agreed だが v21 移行注記「実装完了まで全拒否（v20 挙動が正）」を持つ——本実装完了で v21 挙動に切り替わる旨の注記更新 | doc-refine（F 級） | D-1 の v21 移行注記を「v21 訂正 carve-out 実装済み・訂正経由の変化は計器で常設表示」へ更新 | doc-refine ゲート verdict | 未了 | — |
| R16 | moira/DECISIONS-CATALOG.md（D-60・D-62 状態更新） | F | D-60「担当解除の表し方」／D-62「レビュー指名解除」は v21 確定（センチネル方式）——本実装完了で参照実装が揃う | doc-refine（F 級） | D-60・D-62 の状態注記を「実装完了」へ更新 | doc-refine ゲート verdict | 未了 | — |
| R17 | moira/frontend/src/（訂正関連の型・ロジック連動） | C | R1 の型追加に伴う frontend 側の型伝播（訂正記録型の import・解除センチネル対応の read 側） | /kiro-impl＋codex＋CI | frontend が新型を正しく import・扱う | tsc・単体テスト・codex レビュー・CI | 未了 | — |
| R18 | moira/backend/tests/（訂正層の単体テスト・新規） | C | MODEL §2.10 の各 (a)〜(e)・訂正適用後ログの意味論・検証迂回の適用不能・訂正の連鎖（対象イベント単位 latest-wins） | /kiro-impl＋codex＋CI | 訂正層の意味論をテストで固定（(a)〜(e)・latest-wins・適用不能） | テスト green・codex レビュー・CI | 未了 | — |

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
