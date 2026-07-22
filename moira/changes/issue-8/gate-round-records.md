---
status: working-ledger
issue: 8
---

# P4 kiro-scenario ゲート ラウンド記録 — issue #8

対象: `.kiro/scenarios/units/schedule-rebaseline.md`（agreed）／`schedule-leveled.md`（agreed）／
`schedule-reorder.md`（agreed）。編集: (A) 深度是正 `](../../moira/…)`→`](../../../moira/…)` 14 occ／
(B) 旧 spec 直リンク撤去→平文条項引用（c1）9 occ。**ふるまい（When/Then）・EARS・§2/§5 fixture 無変更。**
起動は moira-change P4（事前批准記録 `intent-ratification.md` を人間承認証跡として受領）。

## ラウンド 1

### doc-fact-checker（事実検証）— VERDICT: NO_OBJECTION

全 6 主張 CONFIRMED:
- C1 是正後 14 本の `](../../../moira/…)` は units/ 相対で実在解決（MODEL.md×4・fold.ts×4・leveler.ts×2・
  types.ts×2・Inspector.tsx×2）。
- C2 3 ファイルに 2-deep `](../../moira/…)`・旧 spec 直リンク `](../../.kiro/specs/…)` は残 0。
- C3 撤去後も条項識別子（moira-core 7.3/7.4・moira-schedule 6.3/6.1・Req12 AC2）は平文保持・意味参照喪失なし。
- C4 参照先 `.kiro/specs/moira-core|moira-schedule/requirements.md` は本リポ（worktree/HEAD/origin/main）不存在
  ＝旧 spec 直リンクは撤去が妥当・深度のみ訂正では依然リンク切れ。
- C5 編集は参照リンク行に限定・§3 When/Then・§6 EARS・§2/§5 fixture 不変・p4-diff.patch は git diff HEAD と一致。
- C6 撤去後の日本語文法破綻なし。

### doc-adversary（敵対）— 指摘と決着

- **[Important] #1** 「(B) occurrence 数が 1 過大（9 でなく 8・L53×3）」→ **健全な反証で棄却（REFUTED）**。
  機械証跡: `git show HEAD:…/schedule-rebaseline.md` の L53 spec リンクは :140/:142/:185/:103 の **4 本**。
  base vs post grep: rebaseline base_speclinks=8→0（removed 8）・reorder removed 1・**合計 9**。敵対者は
  diff の L53 hunk を目視 3 と数え誤り（:142 見落とし）。impact-map「L53×4／合計 9」は正。
- **[Suggestion] #2** 「深度是正で切れリンクが『誤った行アンカーへ解決する』リンクに変わる（fold.ts:113-118 は
  実際 containment-cycle・frozenSlot ガードは 156-157／leveler.ts:104 は隣接構築・tie-break は 126／
  Inspector.tsx アンカー乖離）」→ **本 issue スコープ外・開示扱い**。行アンカー正確性は #6 参照実装同期の管轄
  （#6 は現に fold.ts/types.ts/derive.ts 改変中で再採番される）。#8 は深度のみ是正でありそれ自体は正しい。
  #7 閉包も同カテゴリ（行アンカー残置）を pre-existing・scope 外として開示済み。Suggestion は非ブロッキング。
- **FORKS: NONE**。

### doc-gate-judge（採点）— GATE: **PASS**

- 反論されない Critical = 0。Important #1 は採点者が patch base L53 を実読し old-spec リンク 4 本・合計 9 を
  独立検算——反証は健全。Suggestion #2 はスコープ外・非ブロッキング。
- INTENT_CONFORMANCE: **ALIGNED**（深度是正 14／条項引用平文化 9 が HA 批准意図 (A)(B) に一致・
  When/Then・EARS・§2/§5 fixture は diff 上不変＝受け入れ基準 (a)-(d) 充足）。
- SOURCE_SET_CONFIRMED: YES／FORKS_ROUTED: ALL_ROUTED／DEFERRED_IMPORTANTS: NONE／
  FORK_COVERAGE_AUDIT: OK／SURVIVING_CRITICAL_OR_IMPORTANT: NONE。

## 確定

3 unit はいずれも参照リンク行のみ改変（When/Then・EARS・§2/§5・§7 決定の意味は不変）ゆえ **status は
`agreed` 維持**（降格せず）。新規 0→1 確定分岐なし（(c1) は既存政策の適用——ジャーナル来歴・会話ログ不要）。
