---
status: working-ledger
issue: 7
---

# P4 kiro-scenario ゲート ラウンド記録 — issue #7

対象: `.kiro/scenarios/units/schedule-rebaseline.md`（agreed）／
`.kiro/scenarios/units/requirements-spec-returned.md`（in-review）。
編集: R1（schedule-rebaseline §7 決定）・R2（同 MODEL 参照リンク是正・§3/§5 注）・
R3（requirements-spec-returned §1 注・§7 決定）。ふるまい本体（When/Then）・EARS・fixture 無変更。

## ラウンド 1

### doc-fact-checker（事実検証）— VERDICT: NO_OBJECTION

全 6 主張 CONFIRMED（根拠付き）:
1. I4 精密化文言「完了済みは、黙っては変わらない」= MODEL v21 §2.9 I4（L7/L186）字句一致。
2. I4 が拒むのは意味的変更（完了後の再見積・再ベースライン）・正道 supersede §2.7 = MODEL L186 一致。
3. 記録誤りの訂正は §2.10 で完了ノードに届く・reason 必須＋計器常設表示 = MODEL L186/L218 一致。
4. R-U7（現 L320）・§3 導出指標「再ベースライン」（L277）実在。旧行番号アンカー陳腐化は unit 側で是正済み。
5. 「後付け分割＝意味的変更、§2.10 訂正でない」= MODEL L186/L224（補償 vs 訂正）と整合。
6. issue #6 が参照実装＋計器の実装同期の追跡先 = MODEL L7/L661（§7#20）で裏付け。

### doc-adversary（敵対レビュー）— 指摘と決着

| # | 重大度 | 指摘 | 決着 |
|---|---|---|---|
| 1 | Important | schedule-rebaseline L214：I4 の写し崩れ。「意味的変更（＝本ユニットが扱う理由付き再ベースライン…その正道は supersede §2.7）」が、I4 の**拒否対象（完了ノードの意味的変更）**と本ユニットの**許可操作（未完了 Y の再ベースライン）**を等号で結び、supersede を後者の正道に誤係属 | **修正済み**。L214 を「施錠が拒むのは意味的変更——**完了後の**再見積・再ベースライン（正道 supersede §2.7）」と MODEL の限定語を復し、「**本ユニットの再ベースライン（未完了 Y）は施錠対象ではない許可操作**（core 7.3 carve-out）で、I4 の拒否対象とも §2.10 訂正とも別物」と明示分離 |
| 2 | Important | 両 unit の carve-out 引用が `requirements.md:140/142/185/103`（moira-core/moira-schedule）の行番号アンカーに依存。`.kiro/specs/` は空で当該ファイルはリポ内に不在（裏取り不能・断リンク）。R2 は MODEL アンカーを是正したが同注の spec アンカーは手つかず | **健全な反証（out of scope）＋追跡**。当該 spec ファイルは使い捨て再生成物であり旧リポ（sdd-workshop）に残置する canonical arrangement（CLAUDE.md・issue #5 D-80「移管前 #N 読み替え」）。参照実装 types.ts アンカーを issue #6 管轄と切り分けた R2 批准意図（intent-ratification ④R2(c)）と**同一カテゴリ**＝「MODEL 以外の成果物アンカーは本 issue scope 外」。**issue #7 の v21 追随 scope（MODEL アンカー是正＋v21 文言同期）を超えるため据え置き**。全 unit 共通の spec 参照様式の刷新は別 issue 相当（H5 で開示・要すれば follow-up 起票）。本編集はこの断リンクを悪化させていない（pre-existing） |
| 3 | Minor | schedule-rebaseline L188/L206 の `fold.ts:113-118` が実測 156-158 にドリフト | **out of scope（pre-existing）**。参照実装（fold.ts）の行アンカーは types.ts と同カテゴリ＝ issue #6 管轄。本編集は当該行（L188）に触れていない |
| 4 | Minor | requirements-spec-returned L43 の「後付け分割＝I4 完了施錠に抵触」は MODEL §2.8（I4 は所属を施錠せず完了葉への decompose 可）と緊張。真の阻止根拠は R-E3＋凍結予算再ベースライン施錠＋部分EV＋P5 | **維持（防御可能・pre-existing 帰属）**。adversary 自身「按分は完了予算(3→2)の再ベースラインを要するため I4 帰属は防御可能」と認定。I4/R-E3/§2.7 の連記は編集前からの既存記述で、本編集の v21 追記（按分＝意味的変更）は fact-checker CONFIRMED。過剰精密化は scope 外 |
| 5 | Minor | §2.7 が L43「抵触」・L411「正道」で二役 | **維持（両立・pre-existing）**。後付け分割案は「supersede を使わず decompose+按分で意味変更する」点で supersede 規律に抵触し、supersede は依然意味的変更の正道——両立する読み。L43「抵触」は編集前からの既存記述、L411 の v21 追記は正確 |

**残存 Critical: 0。Important 2 件はいずれも disposition 済み（#1 修正／#2 健全な反証＋追跡）。**
