---
status: working-ledger
issue: 7
---

# 閉包レポート — issue #7

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md） | agreed/確定 最終文 | 整合 |
|---|---|---|---|---|---|
| R1 | S | シナリオ「再ベースライン」の I4 境界注記 | 「完了済みは引き直せない」の言い切りを v21 の切り分け（意味的な引き直しは今も不可・記録誤りの訂正は届くが理由必須＋計器常設表示＝黙っては直せない）へ。ふるまい本体は不変 | §6 注記・§7 決定事項が「意味的な再ベースライン不可（不変）／記録の誤りの訂正は §2.10 で届き、施錠対象への訂正は理由必須＋計器常設表示——『完了済みは、黙っては変わらない』」に。§3/§6 EARS 本文は全ラウンド不変（独立ベンダーが diff 確認）。施錠の次元 caveat（予算=合意済みのみ・スロット=スケジュール済みのみ）も正典どおり復元 | Y |
| R2 | S | 同シナリオの正典参照リンク | 版上げによる参照ずれの是正を含める（行番号アンカー→節参照） | MODEL 参照 2 箇所を節参照化＋相対パス深度是正（fold.ts 参照 2 箇所の誤行番号も是正）。旧注記の誤った修正処方（fact-check C6）は撤回注記で明示訂正 | Y（旧 spec 直リンクのみ #8 へ追跡——下記②） |
| R3 | S | シナリオ「差し戻し」の按分却下の前提記述 | 前提文言のみ v21 の言葉で精密化。**却下の結論は不変**・in-review 維持・再批准は既存トラック | §1 脚注・§7 が「decompose 自体は遮断されないが葉基底から外れ EV が消える（3→0）／3→2 は確定済み粒度の遡及的作り直し＝部分EV 密輸・P5 信号消去／I4 が拒むのは完了ノード自身の凍結見積の意味的引き直し」に精密化。却下結論不変・in-review 維持 | Y |

R5（会話ログ）は機械決着（規約準拠を確認済み）。ゲートは 2 ラウンド: R1 採点 FAIL（deferred の証跡・分類不備）→是正→ R2 採点 **PASS**（早期終了・意図整合 ALIGNED・fork 被覆監査 OK）。HB は発生なし（fork F1 は批准記録が被覆——採点者が独立再検証）。

### ② できないことになったこと（平易な差分）

- シナリオ注記内の**旧仕様書への直リンクは今回直していない**——参照先が旧リポジトリに残置されたままの
  リンク切れ状態が続く（対象 unit 内 4 箇所＋他 2 unit の同型リンク。今の文書では引用 ID・条文が本文に
  転記済みのため読解には支障なし）〔追跡 #8——処置方針はリポ自立化 issue #5 の裁定と束ねる〕。
- シナリオ「差し戻し」は引き続き**レビュー中（in-review）のまま**——確定（agreed）への再批准は本 issue の
  対象外で、従前からの再批准トラックに残る（新たに何かができなくなったわけではない）。

### ③ 閉包判定

**PASS**

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | .kiro/scenarios/units/schedule-rebaseline.md | resolved | kiro-scenario ゲート R2 PASS（doc-gate-judge・意図整合 ALIGNED・auto-agreed）＋d660ee7＋会話ログ |
| R2 | 同上（参照是正の別義務） | resolved | doc-fact-checker CONFIRMED/CORRECTED＋ゲート R2 PASS＋d660ee7（旧 spec 直リンク 4 箇所は追跡付き deferred #8——採点者が deferred 要件充足を検証） |
| R3 | .kiro/scenarios/units/requirements-spec-returned.md | resolved | ゲート R2 PASS（Y1 修正を MODEL と逐語照合・却下結論不変・in-review 維持）＋d660ee7 |
| R4 | moira/frontend/e2e/ | resolved | base..HEAD 当該パス差分なし＋`npm run e2e:coverage` 5 tests green（2026-07-21） |
| R5 | .kiro/conversations/2026-07-21-issue-7-i4-v21-scenario-sync.md | resolved | d660ee7＋spec-conversations 規約準拠（frontmatter/要約/覆った判断/生ログ）を P5 照合 |

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base: 8eb1b6f975f98b79612afecaa47873a5cec1dc83（request.md 記載の受付時点 commit）
- HEAD（P5 開始時点で固定）: 9688a6a
- changed（`git diff --name-only base..HEAD`・`moira/changes/**` を自己除外・rename 検出なし）:
  `.kiro/conversations/2026-07-21-issue-7-i4-v21-scenario-sync.md`・`.kiro/scenarios/units/requirements-spec-returned.md`・`.kiro/scenarios/units/schedule-rebaseline.md`（3 件）
- mapped: R1/R2/R3（unit 2 パス）＋R5（会話ログ）と一致。**未マップ差分: 空（changed − mapped = ∅）**
- 判定有効性: 照合開始〜終了まで非台帳パスの HEAD 移動なし（判定後のコミットは台帳のみ＝自己除外対象）

</details>

<details>
<summary>deferred の後続 issue openness（機械照合証跡）</summary>

| deferred 対象 | 後続 issue | owner | 再評価条件 | openness 照合 |
|---|---|---|---|---|
| 対象 unit 内の旧 spec 直リンク 4 箇所＋schedule-leveled/schedule-reorder の同型リンク破れ＋旧 spec 直リンク恒久方針（ゲート内 Important X3 残余） | #8 | pbnakao | issue #5 の spec 参照裁定後または次 kiro-scenario サイクル着手時 | `gh issue view 8 --json state,assignees` → OPEN・pbnakao（2026-07-21 再照合） |

</details>

<details>
<summary>P5 の限界（正直枠・steering §5）</summary>

本判定が担保するのは「影響マップに載った行＋未マップ差分ゼロ」であり、P2 の調査自体の網羅性ではない。
steering §5 の未整備義務（境界モデル検査の未実装・意味突合の網羅性・再生成 R/D/T の忠実性）は本レポート
でも「担保」と主張しない。後日発覚した漏れは新 issue として再入する。

</details>
