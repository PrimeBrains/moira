---
status: working-ledger
issue: 8
---

# 影響マップ — issue #8

base: `8a93f57`（#7 コミット後）。調査は worktree `issue-8-scenario-link-audit` にて実施。

## 調査方法（トレース機構・既存）

- 対象は S 面成果物 `.kiro/scenarios/units/*.md`。参照リンクは trace 機構の ref-list ではなく
  Markdown リンク実体（`](path)`）の**深度**と**参照先の実在性**を機械照合した。
- **grep の落とし穴を回避**: `../../moira/` は `../../../moira/` の部分文字列としても一致するため、
  リンク開き `](` を接頭に付けた `](\.\./\.\./moira/` で 2-deep のみを厳密抽出した。これにより
  `requirements-spec-drafted.md:409`（`](../../../moira/UI-ARCHITECTURE.md)`＝**正しい 3-deep**）を
  誤検出から除外した（＝本 issue のスコープ外・変更しない）。
- 参照先実在性: MODEL/参照実装ターゲットは `../../../moira/…` に**全て実在**（MODEL.md・types.ts・
  fold.ts・leveler.ts・Inspector.tsx を確認）。旧 spec ターゲット
  `.kiro/specs/moira-core|moira-schedule/requirements.md` は本リポに**不存在**（`.kiro/specs/` は空。
  R/D/T は sdd-workshop#40 裁定で旧リポ残置）。
- 全 `units/*.md` を掃射し、対象は下記 3 ファイルに限られることを確認（他 unit にはヒットなし。
  `flows/` にもヒットなし）。

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | .kiro/scenarios/units/schedule-rebaseline.md | S | (A) 深度誤り `](../../moira/…)` 5 occ（L53 MODEL.md／L186 MODEL.md・types.ts／L188 fold.ts／L206 fold.ts）。参照先は `../../../moira/…` に実在 | kiro-scenario | 当該 5 リンクが `](../../../moira/…)` に是正され units/ から解決可能。§2/§5 fixture・§6 EARS・When/Then 無変更 | kiro-scenario ゲート（doc-fact-checker がリンク解決性 CONFIRMED）＋grep 再確認（2-deep 残 0） | **resolved** | gate-round-records.md（fact-checker C1/C5 CONFIRMED・gate-judge PASS/ALIGNED）＋grep post_3deep=5・2deep 残 0 |
| R2 | .kiro/scenarios/units/schedule-rebaseline.md | S（(B) の書式方針は D 境界・HA 裁定） | (B) 旧 spec 直リンク `](../../.kiro/specs/…)` 8 occ（L53×4／L205×2／L210×2）。参照先が本リポ不存在（#40 旧リポ残置） | kiro-scenario（書式方針は HA 裁定に従う） | HA 裁定 (c1)（壊れた相対リンク＋冗長な行番号を撤去し clause 名の平文引用に落とす。clause 識別子〔moira-core 7.3 等〕は本文に保持）が全 8 occ に適用され、切れリンクが 0 になる | kiro-scenario ゲート＋grep 再確認（`](../../.kiro/specs/` 残 0）＋意図整合検査（HA 批准書式との突合） | **resolved** | gate-round-records.md（fact-checker C2/C3/C4/C6 CONFIRMED・adversary Important#1〔count〕は健全な反証で棄却・gate-judge PASS）＋grep removed=8・残 0 |
| R3 | .kiro/scenarios/units/schedule-leveled.md | S | (A) 深度誤り `](../../moira/…)` 1 occ（L41 leveler.ts）。参照先実在 | kiro-scenario | 当該リンクが `](../../../moira/…)` に是正。ふるまい・EARS 無変更 | kiro-scenario ゲート＋grep 再確認 | **resolved** | gate-round-records.md（gate-judge PASS）＋grep post_3deep=1・2deep 残 0 |
| R4 | .kiro/scenarios/units/schedule-reorder.md | S | (A) 深度誤り `](../../moira/…)` 8 occ（L54 MODEL.md・Inspector.tsx／L193 types.ts・fold.ts／L209 fold.ts／L211 MODEL.md／L213 leveler.ts／L215 Inspector.tsx）。参照先実在 | kiro-scenario | 当該 8 リンクが `](../../../moira/…)` に是正。ふるまい・EARS 無変更 | kiro-scenario ゲート＋grep 再確認 | **resolved** | gate-round-records.md（gate-judge PASS）＋grep post_3deep=8・2deep 残 0 |
| R5 | .kiro/scenarios/units/schedule-reorder.md | S（(B) 書式方針は HA 裁定） | (B) 旧 spec 直リンク `](../../.kiro/specs/…)` 1 occ（L211 moira-schedule/requirements.md）。参照先不存在 | kiro-scenario（書式方針は HA 裁定に従う） | R2 と同一書式方針 (c1) を適用し切れリンクが 0 | kiro-scenario ゲート＋grep 再確認＋意図整合検査 | **resolved** | gate-round-records.md（gate-judge PASS/ALIGNED）＋grep removed=1・残 0 |
| R6 | .kiro/scenarios/units/requirements-spec-drafted.md | S | 掃射で `../../moira/` 部分一致ヒットしたが実体は `](../../../moira/UI-ARCHITECTURE.md)`＝**正しい 3-deep**。**変更不要**（スコープ外の記録行） | （なし） | 変更しない（誤検出であることを記録） | grep 再確認（genuine 2-deep ヒット 0） | resolved | 本影響マップ「調査方法」節（`](\.\./\.\./moira/` 抽出で 0 件） |
| R7 | moira/frontend/e2e/specs/*.spec.ts（＋coverage-check） | S 波及確認 | 計器③ 波及なし確認。R1–R5 は §2/§5 fixture・§6 EARS・When/Then を触らない（参照注記のみ）ため E2E 再生成不要 | （機械確認） | `git diff` の変更が §7/注記行に限られ §2/§5/§6 無変更＝E2E 波及なし | git diff -U0＋SPEC_META 確認 | **resolved** | fact-checker C5 CONFIRMED（変更は `<small>` 注記・§7 bullet のみ・§2/§5 fixture・§6 EARS・When/Then fence 無改変）＋gate-judge「diff hunk は §3/§6/§2/§5 に不触」。schedule-* 3 unit は E2E spec 非保有——本 issue で E2E 再生成不要 |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R1 | schedule-rebaseline | 「moira フォルダの MODEL やソースを指すリンク」5 本を正しい深さに直した（意味・ふるまいは不変）。全 5 本が開けることを確認。 | **resolved** |
| R2 | schedule-rebaseline | 旧 spec を指す切れリンク 8 本を、HA 裁定 (c1) どおり撤去し「moira-core 7.3」等の条項名を平文で残した。切れリンク 0。 | **resolved** |
| R3 | schedule-leveled | leveler を指すリンク 1 本を正しい深さに（意味不変）。 | **resolved** |
| R4 | schedule-reorder | MODEL・ソース・Inspector を指すリンク 8 本を正しい深さに（意味不変）。 | **resolved** |
| R5 | schedule-reorder | 旧 spec 切れリンク 1 本を R2 と同じ (c1) で処理。切れリンク 0。 | **resolved** |
| R6 | requirements-spec-drafted | **変更なし**。機械掃射で一瞬ヒットしたが、実際は正しい深さのリンクだった（誤検出）。触らない。 | resolved |

### 文書ゲート内で批准（HA 対象外）

（F 級行なし）

### 人間はレビューしない（codex＋CI に委譲）

| 行 ID | 波及先 | クラス |
|---|---|---|
| R7 | moira/frontend/e2e/specs/*（波及なし確認の機械行） | S 波及確認（CI/checker） |

## 裁定事項（HA へ）

- **A: 影響マップ網羅の確認** — はねる先は上記 3 ファイル（R1–R5）で全部か。requirements-spec-drafted は
  誤検出につき除外でよいか。
- **B: rebaseline の深度是正（R1）の帰属** — issue コメントは rebaseline の MODEL/参照実装リンクを #7
  帰属と見なしたが、**#7 が是正したのはアンカー形式であって深度ではない**（#7 コミット後も 5 occ 残存）。
  よって深度是正を #8 が吸収する（3 ファイル横断で uniform に `../../` → `../../../`）——この scope 拡張でよいか。
- **C: 旧 spec 直リンク（R2/R5）の恒久参照書式** — 候補: (c1) 壊れた相対リンク＋冗長行番号を撤去し
  clause 名の平文引用に落とす（**推奨**。#40「使い捨て R/D/T のリンク整合は追わない」・#5 D-80 来歴主義・
  既存 unit の平文条項引用 precedent に整合）／(c2) 来歴注記化（旧リポ archive を指す旨を明記）／
  (c3) 深度のみ `../../../.kiro/specs/…` に訂正（**不可**——参照先が本リポに存在せず依然リンク切れ）。
  この方針を DECISIONS-CATALOG に新規 D 起票して canonical 化するか、既存政策（#40/D-80/moira-verification）の
  適用として D 起票せずに済ませるか。
