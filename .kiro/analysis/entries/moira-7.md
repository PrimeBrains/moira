---
key: moira#7
schema: v2
status: ratified
analyzed-at: 2026-07-25
verdict: 非障害
---

# 要因分析 — moira#7　シナリオ文言同期（I4 v21 精密化「完了済みは黙っては変わらない」への追随）

> 本 entry は **issue #21（初回バックフィル 13 本）**の一部である。過去分ゆえ大半の欄は
> **後知恵の再構成（`inferred`）**であり、「当時そう判断した記録」ではない。

## 証跡（sources）

- issue: https://github.com/PrimeBrains/moira/issues/7 （closed 2026-07-21T06:57:53Z）
- コメント: P1 triage（2026-07-20T13:53:52Z）／P3 HA（14:00:31Z）／P4→P6 クローズ（2026-07-21T06:57:52Z）
- 台帳: `moira/changes/issue-7/{request,impact-map,intent-ratification,gate-round-records,closure-report}.md`
- 敵対ラウンド記録: `moira/changes/issue-7/gate-round-records.md`（kiro-scenario R1 FAIL → 是正 → R2 PASS）
- 差分: `d660ee7`・`9688a6a`・`fa8771b`・`8a93f57`（base 記録 `8eb1b6f` → 実効 `feeecff` へ再アンカー）

---

## 1. 対象システム　`derived`

`process / scenarios`（`.kiro/scenarios/units/schedule-rebaseline.md`〔agreed〕・
`.kiro/scenarios/units/requirements-spec-returned.md`〔in-review〕）
＋ `frontend / e2e`（`moira/frontend/e2e/specs/requirements-spec-returned.spec.ts`——**波及なしを機械確認**）
出典: `moira/changes/issue-7/impact-map.md` の波及先パス列（R1〜R4）。

## 2. 事象　`inferred`（素材は `derived`）

- **Given**: MODEL v21（`moira#2`）で I4 完了施錠が「完了済みは変わらない」から
  「**完了済みは、黙っては変わらない**」へ精密化された。
- **When**: 確定済み（agreed）の受け入れシナリオ unit は旧 I4 の断定を前提に書かれており、
  正典と文言が食い違う。
- **Then**（変更後）: §7 決定事項の注記が v21 の切り分け——意味的な再ベースライン／再見積は完了で施錠され不可
  （不変）、記録誤りの訂正は §2.10 として完了ノードにも届き reason 必須＋計器常設表示——に整合した。
- **期待値**: ふるまい本体（When/Then）と受入条件（§6 EARS）は**無傷**のまま、境界注記のみが同期すること。
- **実際値**: 期待どおり（3 unit は `agreed` 維持・EARS 無変更・E2E 波及ゼロを機械確認）。

出典: issue #7 本文・P6 クローズコメント。

## 3. 障害判定　`inferred` → HX 確定

**非障害** — 根拠: 本件は `moira#2` が**追跡付き deferred（R11/R12）として明示的に切り出した文言同期**であり、
`moira#6` と同型の「正典先行・追随」工程である。シナリオのふるまい本体は正典と矛盾しておらず、
食い違っていたのは**境界注記の言い回し**だけである。

**境界事例としての読み（HX 確認対象）**: 本 issue の R2 は「v21 で §2.10 が挿入され**行番号アンカーが
指し先を外した**」参照ずれの是正を含む。これは**壊れた参照が実在した**という点で `moira#8`（障害と判定）と
同型であり、障害側に倒す読みがありうる。本 entry が非障害を採るのは、(i) 主題は計画された文言同期であり
R2 は本 issue 自身の P2／HA で発見・同一フロー内で決着した従属行であること、(ii) アンカーずれの原因
（v21 の節挿入）と是正が**同一の変更連鎖の中に収まっている**ことによる。**この読みは割れうる。**

## 4. 変更分類　`inferred`

`doc-only`（確定文書＝受け入れシナリオ unit の記述の追随。ふるまい・受入条件・fixture は不変）

## 5. 変更範囲　`derived`

**S**（受け入れシナリオ 4 行——うち R4 は E2E 波及なしの確認行）
出典: `moira/changes/issue-7/impact-map.md` クラス列（S×4）。

## 6. 発生原因サマリ（専門用語なし）　`inferred`

**大元のルールブックの言い回しを直したので、それを引用している資料の言い回しも直した。**
資料の中身（どう動くべきか）は変えていない。あわせて、ルールブックに新しい章が挿入されて
「何ページ目」という指し方がずれたので、ページ番号ではなく章の名前で指すように直した。

## 7. 発生原因詳細（技術者向け）　`inferred`（素材は `derived`）

v21 は I4 を「意味的な再ベースライン＝不可」と「記録誤りの訂正＝§2.10 で可・ただし音が鳴る」に切り分けた。
`schedule-rebaseline.md` §7 は旧 I4 の断定を前提に「完了サブ単位は再ベースライン不可」と書いており、
v21 では**言い過ぎ**になる（訂正は届く）。`requirements-spec-returned.md` §1/§7 の「後付け分割は却下」は
**結論が不変**（後付け分割は意味的変更であり記録誤りの訂正ではない）だが、根拠の述べ方が旧 I4 依存だった。
加えて §2.10 の節挿入で MODEL の行番号アンカーが陳腐化したため、節／clause 参照（§3・R-U7）へ是正した。
出典: issue #7 本文スコープ・P6 クローズコメント R1〜R3。

## 8. 根本要因　`inferred` → HX 確定

- **仕組み帰責**: **確定文書どうしの引用に、引用元の版が変わったことを知る手立てが無い。**
  行番号アンカーは節挿入で無言のうちに指し先を外す——本件の R2 はまさにそれである。
  正典側は版を上げるが、**引用側に「あなたの引用は古い」と伝える機構は無く**、
  人間が deferred 行として覚えておくことに依存している。
  なお `moira#8` の閉包コメントは「行アンカー正確性は #6 の管轄」と述べており、
  **同じ脆さが複数 issue にまたがって観測されている**。
- **根本要因分類**（Why 軸）: `spec-impl-mismatch`（正典文と引用側文書が、独立にはそれぞれ妥当だが
  互いを参照したときに食い違う——R14 の定義そのもの）
- **要因分類**（What 軸）: `requirements-error`（欠陥が宿るのは受け入れシナリオ＝要件文書側の記述）
- **詳細**: 追随そのものは計画されていた（#2 の deferred）。計画外だったのは**アンカーずれ**で、
  これは版を上げた側ではなく引用した側に現れる。行番号での参照を許す様式が残っている限り再発する。

<!-- 撤回条件タグ: 該当なし（#2 の deferred R11/R12 は本 issue で解消済み・実害化していない）。 -->

## 9. 同件調査対象　`derived`

走査した母集団: (i) `.kiro/analysis/entries/`（`moira-9.md`＋本バックフィル 13 本）
(ii) `.kiro/postmortem/defects.md`（#0001・`Schema: v1`）(iii) 本リポのクローズ済み issue 14 本と
対応する `moira/changes/issue-*/` 台帳。旧リポ由来の `issue-39/42/43` は対象外（D-80）。

## 10. 同件調査結果　`inferred`（意味検索・網羅性は保証しない）

**あり（2 件）**: `moira#8`——本 issue のゲート内で codex が指摘したリンク破れの棚卸しであり、
**本 issue から直接派生した**。`moira#5`——移管に伴う参照崩れという点で同系統（原因は版ではなく配置の移動）。
いずれも「手で書いた参照が現実からズレる」系統に属する（`moira#1` 項目 10 も同じ系統を指している）。

## 11. 同件の対応状況　`derived`

- `moira#8` — https://github.com/PrimeBrains/moira/issues/8 — state: **CLOSED**（2026-07-21）
- `moira#5` — https://github.com/PrimeBrains/moira/issues/5 — state: **CLOSED**（2026-07-21）
出典: `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 実行）。

## 12. 再発防止策　`inferred` → HX 確定

1. **確定文書間の参照を行番号で書くことを禁じ、節／clause 名での参照に統一する**——
   本 issue の R2 で実施した是正を、**全 unit・全確定文書の様式規則**に昇格させる。
   出口: `.kiro/steering/moira-model.md`（clause ID 参照の規律）または `.kiro/scenarios/README.md` の様式。
   **根拠: 項目 8 の仕組み帰責。**
2. **正典の版を上げるとき、引用側の棚卸しを閉包の必須行にする**——#2 は deferred で正しく追跡したが、
   それは担当者が気づいたからである。出口: `.claude/skills/moira-change/templates/impact-map.template.md`
   （M 級変更時の「引用側文書」行の必須化）。**根拠: 項目 8。**

## 13. 検知すべき工程　`derived`

`p5-closure`——`moira#2` の P5 同期閉包。実際にそこで deferred 行 R11/R12 として切り出された。
出典: issue #2 閉包サマリ「できないことになったこと（deferred・追跡付き）」。

## 14. 実際に検知した工程　`derived`

`p5-closure`——同上。本 issue はその追跡先として起票された。
出典: issue #7 本文「発生元: issue #2（変更管理フロー・追跡付き deferred 行 R11/R12）」。

## 15. なぜ然るべき工程で検知できなかったか　`inferred` → HX 確定

**主題については同工程で検知している（13＝14）。** ただし**従属行 R2（行番号アンカーのずれ）は
#2 の閉包では検知されておらず**、本 issue の P2 影響調査で初めて見つかった。
すなわち「文言の同期が要る」ことは検知できていたが、「**参照の指し先が壊れた**」ことは検知できていない。
**タクソノミーは 1 issue に 1 組の検知工程しか持てないため、この差が entry 上で表現できない**
（機構の限界として A5 へ申し送る）。

## 16. 検知するための対策　`inferred` → HX 確定

**チェックリストを足す**（計器・ゲートの新設は不要）: `moira-change` の P2 影響調査に
「正典の**節構造**が変わる変更では、引用側文書の行番号アンカーを機械掃射する」を加える。
掃射は `grep` で足りる。出口: `.claude/skills/moira-change/SKILL.ja.md` P2 ／
`impact-map.template.md`。**項目 12-1（行番号参照の禁止）が実現すれば本対策は不要になる。**

---

## 出所の集計

| ラベル | 欄数 |
|---|---|
| `derived` | 6（項目 1・5・9・11・13・14） |
| `inferred` | 10（項目 2・3・4・6・7・8・10・12・15・16） |
| `captured` | **0**——本件のクローズ（2026-07-21）は一次採取 2 欄の導入（issue #19・2026-07-25）より前 |
| `unknown` | 0 |

**`unknown` の欄**: なし。
