---
status: working-ledger
issue: 7
---

# 閉包レポート — issue #7

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

面: S（シナリオ）。全 4 行（R4 は E2E 波及確認の機械行）。

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification ④） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R1 | S | schedule-rebaseline §7 決定「完了は再ベースライン不可（施錠）」断定を v21 精密化へ | 意味的再ベースラインは完了で施錠＝不可のまま／記録誤りの訂正は §2.10 で完了ノードにも届き「音が鳴る」／§3 When/Then・§6 EARS 不変／status=agreed 維持 | `schedule-rebaseline.md` §7（L214）：施錠が拒むのは**完了後の**意味的再ベースライン（正道 supersede §2.7）／記録誤り修理は §2.10 訂正で完了ノードにも届き reason 必須＋計器常設表示（音が鳴る）／本ユニットの未完了 Y 再ベースラインは施錠対象外の許可操作（core 7.3）で前二者と別物 | Y |
| R2 | S | schedule-rebaseline の MODEL 行番号アンカー是正（行番号→節/clause 参照） | 行番号アンカーを §3・R-U7・I4・§2.10 の安定参照へ／types.ts 側は issue #6 管轄と明記／主張内容は不変 | `schedule-rebaseline.md` §3 注（L53）「MODEL §3 導出指標『再ベースライン』」／§5 注（L186）「R-U7・§3 導出指標」＋「MODEL 行番号アンカーは v21 §2.10 節挿入で陳腐化・types.ts 是正は issue #6 管轄」 | Y |
| R3 | S | requirements-spec-returned §1/§7「後付け分割は I4 に抵触し却下」の前提を v21 へ | 却下は不変（後付け分割＝意味的変更ゆえ記録誤り訂正でない）／§2/§4/§5/§6 無変更・status=in-review 維持 | `requirements-spec-returned.md` §1 注（L43）・§7 決定（L411）：v21 §2.10 でも却下不変——後付け分割は意味的変更であり記録誤り訂正でないため精密化後 I4 でも施錠が拒む | Y |
| R4 | S | E2E 波及なし確認（P5 機械証跡化） | R1〜R3 が §2/§5/§6 に触れないこと＝E2E 再生成不要 | `git diff -U0` の変更行は §7/§1 注/§3 注/§5 注のみ（L43/411・L53/186/214）。§2/§5 fixture・§6 EARS 無変更。schedule-rebaseline は E2E spec 非保有・requirements-spec-returned の E2E spec は無変更 | Y |

意図整合検査（独立採点者 doc-gate-judge）: **ALIGNED**（R1(d) When/Then・EARS 不変／R3(c) 無変更・in-review 維持を確認）。

### ② できないことになったこと（平易な差分）

なし（deferred 行なし——issue #7 の全行 resolved）。本 issue は issue #2 の追跡付き deferred 行
R11/R12 の**追跡先**であり、本 issue の resolved によって issue #2 の R11/R12 も解消される。

**開示（scope 外・pre-existing）**: 両 unit には旧リポ（sdd-workshop）残置の使い捨て spec を指す
行番号アンカー（`requirements.md:NNN`）・参照実装の行アンカー（`fold.ts:NNN`）が残る。これらは
v21 が壊したものではなく issue #5 のリポ分割に由来する先在条件で、types.ts アンカーと同カテゴリ
＝本 issue（MODEL アンカー是正＋v21 文言同期）の scope 外。全 unit 共通の参照様式刷新は別 issue 相当
（doc-gate-judge が fork 被覆監査で「批准 scope 内で覆える・HB 不要」と判定）。

### ③ 閉包判定

**PASS**（issue #7 の成果物を単独コミットした場合。下記「git 状態」の分離を要件とする）

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | .kiro/scenarios/units/schedule-rebaseline.md（§7） | resolved | gate-round-records.md（fact-checker CONFIRMED＋adversary #1 修正確認）＋doc-gate-judge PASS・INTENT ALIGNED |
| R2 | .kiro/scenarios/units/schedule-rebaseline.md（MODEL リンク） | resolved | 置換先 clause（§3 L277・R-U7 L320・I4 §2.9・§2.10）実在を fact-checker CONFIRMED |
| R3 | .kiro/scenarios/units/requirements-spec-returned.md（§1/§7） | resolved | gate-round-records.md（fact-checker claim5 CONFIRMED）＋doc-gate-judge INTENT ALIGNED（in-review 維持確認） |
| R4 | moira/frontend/e2e/specs/requirements-spec-returned.spec.ts（＋.meta.ts） | resolved | git diff -U0 で §2/§5/§6 無変更＝E2E 再生成不要（E2E spec ファイル無変更） |

verdict→3値: adversary 残存 Critical=0・Important 全件 disposition（#1 修正済・#2 健全な out-of-scope 反証）→ 全行 resolved。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: request.md 記録 = **8eb1b6f**（issue #2 P5）。**実効 base（再アンカー）= feeecff**。理由: P1 記録後・本 issue 着手前後に、別変更 2 件が独立コミットで介在した——issue #5（CLOSED・df99c48）と issue #6（OPEN・実装同期・feeecff。P5 照合中に別セッション/タスクが staged 作業をコミット＋push）。いずれも本 issue #7 の波及先ではないため、実効 base を「本 issue 着手直前のコミット」= feeecff に再アンカーする（steering §2 P1「変更開始前 commit」の趣旨に忠実）。
- HEAD（P5 開始時点）: feeecff（issue #7 コミット前。コミット後は feeecff..HEAD が issue #7 コミットに一致）
- **issue #7 単独の changed（feeecff 起点）**: `.kiro/scenarios/units/schedule-rebaseline.md`・`.kiro/scenarios/units/requirements-spec-returned.md`・`moira/changes/issue-7/**`
- mapped（波及先成果物列・ルート相対）: 上記 2 unit（R1/R2/R3）＋ moira/frontend/e2e/specs/requirements-spec-returned.spec.ts（R4・無変更）
- 自己除外: `moira/changes/**`（台帳自身）
- **未マップ差分（issue #7 分）**: 空（changed − mapped − moira/changes/** = ∅）→ PASS 要件充足

**git 状態の来歴（分離の帰結）**: P5 照合中、当初 index に staged されていた issue #6 の未コミット作業
（`moira/PROPERTIES.md` v0.5→v0.6・PR-CORRECTION-METER 起票／`moira/changes/issue-6/**`）は、別
セッション/タスクにより **feeecff「issue #6 P1-P4 台帳＋PR-CORRECTION-METER 起票」としてコミット＋
push された**（`git show --stat feeecff` で内容確認済み——issue #7 の unit・台帳は一切含まない）。
これにより issue #6 の作業は本 issue の index から分離され、issue #7 のコミット対象は
`.kiro/scenarios/units/schedule-rebaseline.md`・`.kiro/scenarios/units/requirements-spec-returned.md`・
`moira/changes/issue-7/` **のみ**（`git diff --cached --name-only` で確認済み）。issue #5（df99c48）・
issue #6（feeecff）はいずれも本 issue と独立の別変更として先行コミット済み。

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

本 issue に deferred 行なし。参考: 本 issue は issue #2 の deferred 行 R11/R12 の追跡先であり、
`gh issue view 7 --json state` = **OPEN**（2026-07-21 照合）。本 issue のクローズで issue #2 の
R11/R12 が resolved 化する。

</details>
