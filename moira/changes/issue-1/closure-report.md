---
status: working-ledger
issue: 1
---

# 閉包レポート — issue #1

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ④/③ の行） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R1-i | D | 裏面廃止・照合は毎回の意味導出を目録の正式判断に | R1-i「記録する。D-78 は (a) 級・proposed で起票し文書ゲートで agreed 化。判定文の骨子: 対応表が実装とズレたまま放置されていたら破られている」＋HB 追補（計器⑦） | `moira/DECISIONS-CATALOG.md` D-78（agreed・⑦人間のみ）——判定文「設計判断の照合根拠が、判断文からのその都度の導出ではなく手で維持した対応表に頼っていたら——その表がよく手入れされていても——この判断が破られている。」※敵対指摘で骨子より**強い形**に確定（維持された表もすり抜けない）——批准意図の範囲内の強化 | Y |
| R1-ii | D | 被覆マップ（どの判断をどの検査器で見るか）の形態 | R1-ii「派生ビュー化——正典は各エントリの検査器タグのみ・末尾集計表は削除」 | 目録末尾の集計表は削除・1 行注記化。規律節「割付の正典は各エントリの計器タグ——集計表は持たず、必要なときはタグからその都度導出」。タグ由来⑥集合＝旧表⑥行と完全一致を機械確認（導出可能性の実証） | Y |

（S・P 面の行はなし——本 issue はシナリオ・プロパティに触れない）

### ② できないことになったこと（平易な差分）

なし（deferred 行 0 件——影響マップ全 13 行が証跡付き resolved）。

参考・正直開示（deferred ではないが「今できないこと」として批准済み）: 判断と実装の対応を**保存した一覧表は
もう存在しない**——対応はその都度 AI が導出し、探し当て損ないの危険は残る（緩和: 探索範囲の明示＋わざと壊した
見本での検知力確認。D-78 の代償として目録に明記済み）。

### ③ 閉包判定

**PASS**（resolved 13／deferred 0／未了 0・未マップ差分 ∅）

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

全 13 行の判定と証跡は `moira/changes/issue-1/impact-map.md` の状態・証跡列に記載（R1〜R12: doc-refine ゲート
PASS＋fact-checker＋HA/HB 記録、R11: 陰性対照試走記録＋codex accept-with-notes、R13: judge 確認＋CI）。
doc-refine ゲートの決着内訳: Critical 1→修正済み・Important 8→全件同一ラウンド内修正・反証 0・deferred 0
（`gate-round-records.md`）。R13 の CI: commit 37651ab の CI run 29716290767——**green 確認は本レポート確定時点の
`gh run` 照合による**（H5 提示時に最新結果を添える）。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: ab709ad57ed936bf5a4a2ed35159e17bedcaae76（request.md 記載の受付時点 commit）
- HEAD（P5 開始時点で固定）: 37651ab
- 未マップ差分: **空**——`git diff --name-only ab709ad..37651ab` の changed（`moira/changes/**` 自己除外後）は
  10 パスで、影響マップの mapped パス集合（R1〜R13）と完全一致
- 判定有効性: 照合開始から本レポート作成まで HEAD は 37651ab から不動（台帳ファイルの追記は自己除外対象）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

該当なし（deferred 0 件）。

</details>
