---
status: working-ledger
issue: 8
---

# 意図批准記録 — issue #8（HA 前半集約セッション）

> **状態: 確定（HA 批准済み・2026-07-21）。**

## ① 影響マップ確認

- 確認: **YES**（2026-07-21）——波及先は 3 ファイル（R1–R5）で全部・requirements-spec-drafted は誤検出につき除外
- 提示: `moira/changes/issue-8/impact-map.md` 人間断面ビュー。波及先は 3 ファイル（schedule-rebaseline /
  schedule-leveled / schedule-reorder）の R1–R5。requirements-spec-drafted は grep 部分一致の**誤検出**
  （実体は正しい 3-deep）につきスコープ外（R6 に記録）。E2E 波及なし確認は R7。
- 提案: 「はねる先はこの 3 ファイルで全部・requirements-spec-drafted は除外」で確認を求める。

## ② 境界裁定

| 行 ID | 争点（平易文） | 裁定 | 批准 |
|---|---|---|---|
| R1 | rebaseline の MODEL/参照実装リンクの**深度**是正は #7 帰属か #8 か（#7 はアンカー形式のみ是正・深度は未是正で 5 occ 残存） | **#8 が吸収**。3 ファイル横断で uniform に `../../` → `../../../` | **YES**（2026-07-21） |
| R2/R5 | 旧 spec 直リンクの恒久参照書式 | **(c1) 壊れた相対リンク＋冗長行番号を撤去し clause 名の平文引用に落とす**（clause 識別子は本文保持）。(c3) 深度のみ訂正は参照先不存在ゆえ不可 | **YES**（2026-07-21） |

## ③ S 級 When/Then の発案

**該当なし。** 本 issue は既存 unit（agreed/in-review）の**参照リンク是正**であり、観測ふるまい
（When/Then）・EARS・§2/§5 fixture を一切変更しない。人間発案の When/Then は不要（新規シナリオでない）。
issue 本文＋コメントが人間の変更記述（発案）として機能する（steering §3 S 行「既存 unit の変更は issue に
人間が書いた記述を発案として扱う」）。

## ④ 意図批准（M/D/P 対象行）

M 行・P 行なし。**D 境界は (C) の参照書式方針のみ**（(a) ドメイン意味を含みうるため HA 対象）。

| 行 ID | 対象クラス | 何を決めるか | 受け入れ基準 | 却下したい方向 | 批准 |
|---|---|---|---|---|---|
| R2/R5 | D 境界（→ S 内で実施） | 旧リポ残置の使い捨て spec を指す切れリンクを、agreed シナリオ unit でどう引くか | (a) 切れた相対リンクが 0 になる (b) どの条項を指すかの意味（moira-core 7.3 等）は本文に保持され失われない (c) #40/D-80/moira-verification（アーカイブは当時の射影・リンク整合は追わない）と矛盾しない (d) 既存 unit の平文条項引用 precedent と書式が揃う | 深度だけ直して切れリンクを温存する方向／条項識別子ごと消して意味参照を失う方向 | **YES**（2026-07-21・(c1) 採択） |

**D 起票の要否（HA 判断）**: **起票不要**（2026-07-21 批准）。上記は既存政策（#40・D-80・
moira-verification）の**適用**であり、新規 0→1 判断ではないため DECISIONS-CATALOG への新規 D 起票は
行わない（台帳と閉包レポートに方針を記録するのみ）。

## ⑤ 実行計画承認＋一次資料セット確定

- 実行計画（経路列・依存順）:
  1. R1–R5（S 級）→ `Skill: kiro-scenario`（既存 unit 改稿ルート）。HA 批准済み意図（②深度是正の
     #8 吸収・(c1) 参照書式）を事前批准記録として渡す。3 ファイルを一括で処理（相互依存なし・
     schedule 三部作）。
  2. R7（E2E 波及なし確認）→ `git diff -U0` で §2/§5/§6 無変更を機械確認（agreed unit の E2E 再生成は
     §2/§5/§6 に触れた場合のみ——本 issue は触れないため再生成不要）。
- 一次資料セット（SOURCE_SET_CONFIRMED）: 本リポ `moira/MODEL.md`／参照実装
  （`moira/backend/src`・`moira/frontend/src`）の実在パス／`.kiro/scenarios/units/` の既存 precedent
  （平文条項引用）／`moira/HISTORICAL-REFERENCES.md`・DECISIONS-CATALOG D-80／
  `.kiro/steering/moira-verification.md`「R/D/T は使い捨て」節／#40 裁定。
- 承認: **YES**（2026-07-21）

## issue コメントへの要約

- issue コメント: P3 HA 批准要約を投稿済み（下記コメント参照）。
