---
status: working-ledger
issue: 2
---

# 影響マップ — issue #2

## 波及先一覧

<!-- append-only。行の削除禁止。P5 の閉包判定は行 ID 単位。 -->

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/MODEL.md | M | 議題 1〜9 が A6・I4・I5・P5・§2.1（警告意味論）・§2.5（終端性）・§2.7（supersede/cancel）・§2.8（4 イベント表・cost 行）・§5（イベント 4 型の必要十分性）・§7#16(c)/#18(d)/#19 に積極的に触れる（P2 条項調査で確認） | moira-model-update | 普遍訂正原則 (a)〜(e) が正典化され、議題 1〜9 が裁定済み。版ヘッダ・§6 来歴・§7 確認事項が整合した不可分確定。実装未着手事項は §7 に正直開示 | moira-gate-judge（残存 Critical=0＋Important 全件 disposition）＋意図整合検査 | resolved | moira-gate-judge PASS（R1・残存C/I=0・意図整合ALIGNED。gate-round-records.md）＋確定 20a639e（MODEL v21・§6 来歴）＋doc-fact-checker CONFIRMED(1-3) |
| R2 | moira/NAMING.md | M | NAMING §7「MODEL 連動」同期義務。新語彙（訂正記録 等）の追記先 | moira-model-update（派生同期） | 新語彙が §7 正式用語表に追記され確定注記が残る | ゲート同期義務＋doc-fact-checker（影響範囲） | resolved | 20a639e（§7 に 4 語彙＋確定注記）＋doc-fact-checker CONFIRMED(4-5) |
| R3 | moira/DECISIONS.md | M | moira-model-update 確定手順（解消した分岐のジャーナル追記）。既存 v20 エントリの「訂正イベント無し」帰結記述は旧来歴として不改変 | moira-model-update（確定手順） | v20→v21 の解消分岐が追記済み | ゲート証跡 | resolved | 20a639e（v20→v21 分岐エントリ）＋doc-fact-checker CONFIRMED(6) |
| R4 | moira/PROPERTIES.md | P | 被覆表: I4→PR-DONE-LOCK/MC-UNAGREED-DONE、R-C2→PR-CANCEL-EXCL/PR-CANCEL-SUNK/PR-CANCEL-INVISIBLE/MC-SUP-CANCEL、§2.7→MC-CANCEL-TERMINAL/PR-SUPERSEDE-SHAPE、A6→PR-CANCEL-SUNK（間接）、P5→DN-MONOTONIC ほか。「MODEL の制約・語彙・既定に触れる変更は bound プロパティを同一 run で再批准」（PROPERTIES.md 次手 2） | moira-model-update（bound プロパティ再批准） | 影響 bound プロパティの一文が新正典に整合（必要な行は proposed 再降格）・被覆表が根拠列と同期 | ゲート証跡＋照合 subagent（被覆表更新確認） | resolved | 20a639e（v0.5: PR-DONE-LOCK/PR-EVENTS-ONLY 改訂＋proposed 再降格・被覆表同期・移行注記）＋HA R4 批准＋doc-fact-checker CONFIRMED(10-13) |
| R5 | moira/DECISIONS-CATALOG.md | M（D 派生同期） | 意味突合: D-1（agreed・「完了済みの再見積を土台が拒否」）が I4 格下げと正面衝突。D-10/D-20/D-22/D-30/D-37/D-58 要改訂候補。D-60/D-62（解除センチネル未確定）は議題 9 が空白を充足 | moira-model-update（派生同期。v20 の目録同期先例） | 衝突判断（特に D-1）が新正典に整合する文面へ改訂（実装が暫定旧挙動のままの間はその移行状態を正直注記）・必要な新エントリ追加 | doc-fact-checker（影響範囲）。事後の Decision↔実装照合は decision-conformance（後続） | resolved | 20a639e（D-1 ほか 7 件の v21 追随注記・D-60/D-62 解消・D-79 新設・凡例更新）＋doc-fact-checker CONFIRMED(7-9) |
| R6 | .kiro/steering/moira-model.md | F（M 派生同期） | I4「施錠…再ベースラインを受け付けない」記述 2 箇所が格下げ後に陳腐化 | moira-model-update（派生同期。steering §5 検証器表の割当） | I4 記述が新正典に整合 | doc-fact-checker（影響マップ範囲） | resolved | 20a639e＋doc-fact-checker CONFIRMED(14) |
| R7 | .kiro/steering/moira-naming.md | F（M 派生同期） | cancelled「終端取消」語彙行の再点検（終端性は維持見込みだが最終文言次第） | 同上 | cancelled 行が新正典と矛盾しない | doc-fact-checker | resolved | 20a639e＋doc-fact-checker CONFIRMED(15) |
| R8 | moira/README.md | F（M 派生同期） | 「現在の版は v20（…）」の版要約エコーが改版で陳腐化 | 同上 | 版要約が確定版に一致 | doc-fact-checker | resolved | 20a639e＋doc-fact-checker CONFIRMED(16) |
| R9 | moira/validation-scenarios.md | F（M 派生同期） | S11「回収不能」・S13「施錠(I4)」の断定文言 | 同上 | 断定文言が新正典に整合 | doc-fact-checker | resolved | 20a639e＋doc-fact-checker CONFIRMED(17) |
| R10 | moira/PROPERTIES-RELEVANCE-REVIEW.md | F（M 派生同期） | I4 の PBT/生成器対応表（done-lock）の再点検 | 同上 | 対応表の注記が現状（実装は後続）を正直に反映 | doc-fact-checker | resolved | 20a639e＋doc-fact-checker CONFIRMED(18) |
| R11 | .kiro/scenarios/units/schedule-rebaseline.md | S | agreed unit の §7 決定事項「完了サブ単位は再ベースライン不可（I4 施錠）」断定が陳腐化（§3/§6 EARS は無傷・境界注記レベル） | kiro-scenario（後続） | 【提案: deferred】後続 issue で文言同期（シナリオ同期は別タスクの v17〜v20 先例） | 後続 issue の openness 機械照合＋kiro-scenario ゲート（後続） | deferred | 後続 issue #7（OPEN 機械照合済 2026-07-20）・owner nakawodayo・再評価条件: v21 確定後の次 kiro-scenario サイクル |
| R12 | .kiro/scenarios/units/requirements-spec-returned.md | S | in-review unit の §1/§7「後付け分割は I4 に抵触し却下」の前提記述が陳腐化（却下の結論自体は不変） | kiro-scenario（in-review 再批准サイクル内・後続） | 【提案: deferred】R11 と同一の後続 issue に含める | 同上 | deferred | 同 #7（OPEN 機械照合済）・owner nakawodayo・再評価条件同上 |
| R13 | moira/backend/ | C | types.ts（CostEvent/RelateEvent に reason 欄なし）・fold.ts（I4 拒否 "D-1 done-lock"・cost 非負ガードに §7#19(a) 埋め込み・cancelled 無条件代入）・derivations（cancelled 訂正の再計算規則）・PBT/単体テスト（done-lock.pbt.test.ts の拒否メッセージ pin・events.test-d.ts の 4 型固定）。fold 再計算規則は議題 5 の裁定に完全依存 | /kiro-impl（後続）＋codex レビュー＋CI | 【提案: deferred】実装同期は後続 issue（表現形裁定の下流）。本サイクル中に本パス配下へ差分が出たら deferral 無効＝P2 再入 | 後続 issue の openness 機械照合。実装時は codex レビュー＋CI | deferred | 後続 issue #6（OPEN 機械照合済 2026-07-20）・owner nakawodayo・再評価条件: v21 確定後の次実装サイクル。本サイクル中の当該パス差分なし（deferral 有効） |
| R14 | moira/cli/ | C | wbs-import.ts の backfill 拒否（issue #37 暫定）の恒久裁定帰結・書き込み層の訂正 UX（§4.2 実装群の残）。cost 入力検証は #37 で先取り済み＝新規義務でない | /kiro-impl（後続） | 【提案: deferred】R13 と同一の後続 issue。裁定自体は R1 で確定 | 同上 | deferred | 同 #6（OPEN 機械照合済）・差分なし |
| R15 | moira/frontend/ | C | warnings.ts／HealthSurface.tsx（議題 6 訂正計器の常設表示）・cli/src/report.ts（議題 7 Δ 表示の訂正跨ぎ・遡及記録警告との区別）※report.ts は cli 配下だが計器層として本行に含めて扱う | /kiro-impl（後続） | 【提案: deferred】R13 と同一の後続 issue | 同上 | deferred | 同 #6（OPEN 機械照合済）・差分なし |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の 3 面のみ）

M 行（R1）は MODEL 条項文でなく平易文に翻訳して載せる。詳細な批准対象は
`intent-ratification.md`（準備稿）の ④ を参照。

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R1-1 | 正典モデル（訂正の大原則） | 記録の間違いはいつでも直せるようになる。ただし①直した事実も履歴に残る（消さない・書き換えない）②理由が必須③どの記録を直したか名指しする④直したことは計器に常に見える⑤直せるのは「記録」であって「起きた事実」ではない | resolved |
| R1-2 | 正典モデル（コスト誤入力） | コストの誤入力（0.5 のつもりが 5 など）を「あの記録は誤りで真値はこれ」という追記で直せる。マイナス値による打ち消しは導入しない（負の投下時間は存在しない、は維持） | resolved |
| R1-3 | 正典モデル（完了済みの訂正） | 完了・合意済みの作業も訂正できるようになる。ただし訂正すると「大きく音が鳴る」——理由必須で、計器に常設表示され、黙って過去を書き換えることはできない | resolved |
| R1-4 | 正典モデル（誤キャンセルの復活） | 誤ってキャンセルした作業は「キャンセルは誤記だった」という記録訂正で復活する。専用の取り消し機構（un-cancel）は作らない。訂正の体裁を持たない裸の逆行書き込みは引き続き入口で拒否する側 | resolved |
| R1-5 | 正典モデル（訂正の置き場所） | 訂正の記録は、容量・期日と同じ「第二層」（追記専用・理由付き・タイムスタンプ付き）として持つ【推奨案】。イベントの種類は 4 つのまま増やさない | resolved |
| R1-6 | 正典モデル（ごまかし防止の計器） | 訂正の件数と「施錠対象（完了済み等）への訂正」は健全性計器に常設表示される。既存の警告と同じく「了解」では消えず、閾値や色分けのさじ加減ノブを持たない | resolved |
| R1-7 | 正典モデル（歴史の読み直し） | 訂正が変えるのは「今の見え方」だけ。保存済みレポートは当時の文書として不変。過去日付の実績を後から混ぜる backfill は拒否のまま恒久ルール化。二時間軸（bitemporal）の全面導入はしない【推奨案】 | resolved |
| R1-8 | 正典モデル（訂正の訂正） | 訂正記録自体が誤りだったら、同じ記録への最新の訂正が勝つ（latest-wins）【推奨案】。全履歴は残る | resolved |
| R1-9 | 正典モデル（付随整備） | コスト・依存辺の記録にも理由欄を付ける。担当・レビュー担当の「解除（未割当に戻す）」を表せるようにする。親の奪い合い（所属の矛盾主張）には警告を出す（正典側の裁定。実装は後続） | resolved |
| R4 | プロパティ目録 | 「完了した作業の出来高は後から減らない」「キャンセルしても使ったコストは消えない」など、施錠・キャンセル・非負に結び付いたプロパティ一文を新しい正典に合わせて読み直し、変わるものは再批准（proposed へ降格→再確定）する | resolved |
| R11 | 受け入れシナリオ（再ベースライン） | 確定済みシナリオの注記に「完了分は再ベースライン不可（施錠）」という断定があり、正典改定後は不正確になる。ふるまい本体（When/Then）は無傷なので、文言同期を後続 issue に出す【提案: 見送り＝追跡付き deferred】 | deferred（#7） |
| R12 | 受け入れシナリオ（差し戻し） | レビュー中シナリオに同種の「施錠に抵触し却下」の前提記述あり（却下の結論は変わらない）。R11 と同じ後続 issue で文言同期【提案: 同上】 | deferred（#7） |

### 文書ゲート内で批准（HA 対象外）

以下の F 級行は独立の文書ゲートを立てず、正典更新ゲート（moira-model-update）の派生同期義務
＋事実検証（doc-fact-checker）で決着する（変更管理規範 §5 検証器表の割当どおり）。

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R6 | .kiro/steering/moira-model.md | moira-model-update 派生同期＋doc-fact-checker |
| R7 | .kiro/steering/moira-naming.md | 同上 |
| R8 | moira/README.md | 同上 |
| R9 | moira/validation-scenarios.md | 同上 |
| R10 | moira/PROPERTIES-RELEVANCE-REVIEW.md | 同上 |

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——ソースコード・
テストコード（C 級）の機械決着行であり、codex レビューおよび CI（計器①②③④）に委譲する。
本サイクルでは全行 deferred（実装後続 issue）を提案しており、実装時に委譲が効く。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R13 | moira/backend/ | C |
| R14 | moira/cli/ | C |
| R15 | moira/frontend/ | C |
