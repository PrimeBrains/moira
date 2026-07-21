---
status: working-ledger
issue: 7
---

# 影響マップ — issue #7

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | .kiro/scenarios/units/schedule-rebaseline.md | S | MODEL I4（§2.9）・§2.10 訂正層・§3 導出指標「再ベースライン／凍結属性と訂正」・issue #2 R11。§7 決定事項「完了サブ単位は再ベースライン不可（I4 施錠）」断定が v21 精密化で陳腐化（§3 When/Then・§6 EARS は無傷＝境界注記レベル） | kiro-scenario | §7 の「引き直せない」断定を v21 の切り分け（意味的再ベースラインは完了で施錠＝不可のまま／記録誤りの訂正は §2.10 で完了ノードにも届き「音が鳴る」）に整合する文言へ。When/Then・EARS 不変・status=agreed 維持 | kiro-scenario ゲート（doc-adversary＋doc-fact-checker＋doc-gate-judge）＋意図整合検査 | resolved | intent-ratification.md ④R1・gate-round-records.md・closure-report.md |
| R2 | .kiro/scenarios/units/schedule-rebaseline.md | S | 変更管理 steering §2「MODEL 参照は安定 clause ID・行番号禁止」。v21 の §2.10 節挿入（約36行）で unit 内の MODEL 行番号アンカー（MODEL.md:217／:260／:232）が陳腐化（R1 と同一成果物・別義務ゆえ別行） | kiro-scenario | MODEL 行番号アンカーを安定な節/clause 参照（§3 導出指標・R-U7・I4・§2.10）へ置換。types.ts 側アンカー是正は参照実装同期 issue #6 の管轄と明記 | kiro-scenario ゲート＋リンク解決確認（MODEL 側 clause の実在確認） | resolved | gate-round-records.md・closure-report.md（リンク解決確認） |
| R3 | .kiro/scenarios/units/requirements-spec-returned.md | S | MODEL I4（§2.9）・§2.10・issue #2 R12。§1/§7「後付け分割は I4 完了施錠・R-E3 に抵触し却下」の前提記述が v21 で陳腐化（却下の結論自体は不変） | kiro-scenario（前提文言同期のみ・in-review 維持・agreed 再批准は既存トラックに残す） | §1/§7 の前提文言を v21 I4 精密化へ整合（後付け分割は**意味的変更**であり記録誤りの訂正ではないため I4 は依然これを拒む＝却下不変）。§2/§4/§5/§6 は無変更・status=in-review 維持 | kiro-scenario ゲート＋意図整合検査 | resolved | intent-ratification.md ④R3・gate-round-records.md・closure-report.md |
| R4 | moira/frontend/e2e/specs/requirements-spec-returned.spec.ts（＋ requirements-spec-returned.meta.ts） | S | 計器③（kiro-scenario-e2e）: unit の §2/§5 fixture・§6 EARS が SPEC_META 経由で E2E に写る。R1〜R3 の編集が §2/§5/§6 に触れないなら E2E 再生成は不要（schedule-rebaseline は E2E spec を持たない） | （E2E 波及なし——P5 で機械証跡化） | R1〜R3 の編集が §2/§5/§6（fixture・EARS）に一切触れないことを確認し、E2E 再生成不要を証跡化 | git diff で対象 unit の §2/§5/§6 無変更＋moira/frontend/e2e coverage-check green | resolved | closure-report.md（diff 範囲確認・CI） |

<!-- append-only。再入があれば R5 以降を追記する。 -->

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R1 | 受け入れシナリオ（再ベースライン） | 「完了した作業は再ベースラインできない（施錠）」という決定事項の言い回しを、正典 v21 の精密化に合わせる。**意味を変える再ベースライン（引き直し）は完了で施錠され不可、これは変わらない**。ただし v21 で「**記録の入力ミスの訂正**は完了した作業にも届き、その訂正は必ず理由付きで計器に常設表示される（＝黙っては変えられない）」ことが正典化されたので、決定事項の注記をその切り分けに整合させる。ふるまい本体（When/Then）と受入条件（EARS）は変えない | resolved |
| R2 | 受け入れシナリオ（再ベースライン）の正典参照リンク | v21 で正典に新しい節（§2.10 訂正）が挿入され行番号がずれたため、unit 内の「正典の何行目」というリンクが指し先を外した。行番号ではなく**節・条項の名前**で参照する形に直す（内容は変えない・ずれの修理のみ） | resolved |
| R3 | 受け入れシナリオ（差し戻し） | 「完了後に作業を後から分割して出来高を按分する案は、完了施錠（I4）に抵触するので却下」という前提記述の言い回しを v21 に合わせる。**却下という結論は変わらない**——後付け分割は「考えの変更（意味的変更）」であって「記録ミスの訂正」ではないため、v21 でも I4 はこれを拒む。この unit はレビュー中（in-review）のままで、正式合意（agreed）への再批准は既存の別トラックに残す | resolved |

### 人間はレビューしない（codex＋CI に委譲）

R4（E2E 波及の有無確認）は機械決着行——ふるまい（§2/§5 fixture・§6 EARS）に触れないことを diff で
確認し、E2E 再生成不要を CI（coverage-check）と併せ証跡化する。判断項目ではない。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R4 | moira/frontend/e2e/specs/requirements-spec-returned.spec.ts（＋.meta.ts） | S（E2E 波及確認・機械決着） |
