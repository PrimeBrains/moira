---
status: working-ledger
issue: 8
---

# 閉包レポート — issue #8

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

面: S（シナリオ）。全 5 行（R6 は誤検出の記録・R7 は E2E 波及なしの機械行——いずれも本体編集なし）。

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification ②/④） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R1 | S | schedule-rebaseline（(A) 深度） | MODEL/参照実装を指すリンクの深度誤り 5 本を `../../` → `../../../` に是正。意味・ふるまい不変 | `schedule-rebaseline.md` L53/186/188/206 の 5 リンクが `](../../../moira/…)` に是正・全解決 | Y |
| R2 | S | schedule-rebaseline（(B) 旧 spec） | 旧 spec 直リンク 8 本を (c1) 撤去→平文条項引用（moira-core 7.3 等は本文保持） | `schedule-rebaseline.md` L53×4/L205×2/L210×2 の切れリンク撤去・条項識別子は平文で残存 | Y |
| R3 | S | schedule-leveled（(A) 深度） | leveler リンク 1 本を深度是正。意味不変 | `schedule-leveled.md` L41 が `](../../../moira/…)` に是正 | Y |
| R4 | S | schedule-reorder（(A) 深度） | MODEL/参照実装/Inspector リンク 8 本を深度是正。意味不変 | `schedule-reorder.md` L54/193/209/211/213/215 の 8 リンク是正・全解決 | Y |
| R5 | S | schedule-reorder（(B) 旧 spec） | 旧 spec 直リンク 1 本を R2 と同一 (c1) で処理 | `schedule-reorder.md` L211 の切れリンク撤去・条項識別子は平文で残存 | Y |

意図整合検査（独立採点者 doc-gate-judge）: **ALIGNED**（深度是正 14／条項引用平文化 9 が HA 批准意図
(A)(B) に一致・When/Then・§6 EARS・§2/§5 fixture は diff 上一切不変＝受け入れ基準 (a)-(d) 充足）。

### ② できないことになったこと（平易な差分）

**なし**（deferred 行なし——影響マップ全行 resolved）。本 issue は issue #7 ゲート内 codex 指摘
（Important・変更管理フロー deferred）の**追跡先**であり、本 issue の resolved によって当該 deferred も解消される。

**開示（scope 外・pre-existing／新たな欠陥ではない）**: 深度是正した MODEL/参照実装リンクの一部に、
**行アンカー（`:NNN`）が現在のソース行と乖離**しているものが残る（例: `fold.ts:113-118` は実際は
containment-cycle コードで frozenSlot ガードは 156-157／`leveler.ts:104` の tie-break は実際 126／
`Inspector.tsx` アンカー乖離——doc-adversary Suggestion #2）。これは #8 が壊したものではなく、行アンカー
正確性は **#6（参照実装同期）の管轄**（#6 は現に `fold.ts`/`types.ts`/`derive.ts` を改変中で、これらアンカーは
#6 で再採番される）。#8 は**深度のみ**を是正しており、それ自体は正しい。#7 閉包も同カテゴリ（行アンカー残置）を
pre-existing・scope 外として開示済み——同じ扱い。

### ③ 閉包判定

**PASS**

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | .kiro/scenarios/units/schedule-rebaseline.md（(A) 深度 5） | resolved | gate-round-records（fact-checker C1/C5 CONFIRMED・gate-judge PASS/ALIGNED）＋grep post_3deep=5・2deep 残 0・14 リンク全解決 |
| R2 | .kiro/scenarios/units/schedule-rebaseline.md（(B) 旧 spec 8） | resolved | gate-round-records（fact-checker C2/C3/C4/C6 CONFIRMED・adversary Important#1〔count〕は健全な反証で棄却〔base L53=4・合計 9 を採点者が独立検算〕・gate-judge PASS）＋grep removed=8・残 0 |
| R3 | .kiro/scenarios/units/schedule-leveled.md（(A) 深度 1） | resolved | gate-judge PASS＋grep post_3deep=1・2deep 残 0 |
| R4 | .kiro/scenarios/units/schedule-reorder.md（(A) 深度 8） | resolved | gate-judge PASS＋grep post_3deep=8・2deep 残 0 |
| R5 | .kiro/scenarios/units/schedule-reorder.md（(B) 旧 spec 1） | resolved | gate-judge PASS/ALIGNED＋grep removed=1・残 0 |
| R6 | .kiro/scenarios/units/requirements-spec-drafted.md | resolved | 誤検出（`](../../moira/` は `](../../../moira/` の部分一致）。実体は正しい 3-deep・変更なしを grep で確認 |
| R7 | moira/frontend/e2e/specs/*（波及なし確認） | resolved | fact-checker C5 CONFIRMED（§2/§5 fixture・§6 EARS・When/Then 不変・変更は `<small>`/§7 のみ）＝E2E 再生成不要。schedule-* は E2E spec 非保有 |

verdict→3値: adversary 残存 Critical=0・Important 全件 disposition（#1 健全な反証で棄却・#2 は Suggestion
かつ scope 外開示）→ 全行 resolved。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: **8a93f57**（request.md 記載。#7 コミット後・worktree `issue-8-scenario-link-audit` 分岐元）
- 対象（判定時点で固定）: 8a93f57（worktree HEAD）＋作業ツリー（= 本 issue でコミット予定の内容）
- changed（`git diff --name-only HEAD` ＋ untracked、`moira/changes/**` 自己除外後）:
  `.kiro/scenarios/units/schedule-rebaseline.md` / `schedule-leveled.md` / `schedule-reorder.md`
- mapped（影響マップ「波及先成果物」列で本体変更する行）: 上記 3 ファイル
- **未マップ差分: ∅**（changed − mapped = 空）
- 判定有効性: 照合中 HEAD 不動（8a93f57）。#6 の未コミット backend 実装は worktree 隔離により本 issue の
  changed 集合に混入しない（`git diff --name-only HEAD -- moira/backend/` = 空）。
- 注: 本 issue の成果物（3 unit ＋台帳）は H5 承認後に単独コミットする。コミット後は `base..HEAD` が上記
  changed 集合に一致することを要件とする（steering §2 P5）。

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

deferred 行なし——照合対象なし。

</details>
