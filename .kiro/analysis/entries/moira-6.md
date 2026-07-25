---
key: moira#6
schema: v2
status: aggregated
analyzed-at: 2026-07-25
verdict: 非障害
---

# 要因分析 — moira#6　普遍訂正原則の実装同期（訂正層・訂正計器・解除センチネル・矛盾所属警告）

> 本 entry は **issue #21（初回バックフィル 13 本）**の一部である。過去分ゆえ大半の欄は
> **後知恵の再構成（`inferred`）**であり、「当時そう判断した記録」ではない。

## 証跡（sources）

- issue: https://github.com/PrimeBrains/moira/issues/6 （closed 2026-07-21T08:23:23Z）
- コメント: P1 triage（2026-07-21T05:48:19Z）／P3 HA（05:57:58Z）／P4 部分完了（06:29:26Z）／
  P4 大幅進行（07:23:44Z）／P6 クローズ（08:23:23Z）
- 台帳: `moira/changes/issue-6/{request,impact-map,intent-ratification,closure-report}.md`
- 敵対ラウンド記録: **なし**（C 級経路——`/kiro-impl` worker ＋ codex ＋ CI。`gate-round-records.md` は存在しない）
- 差分: `feeecff`・`cbfdeb8`・`db609ba`・`7ccdfd3`・`a1242bd`・`10b6612`（＋閉包 `27ce37e`）

---

## 1. 対象システム　`derived`

`backend / types.ts・fold.ts・derivations・pbt`／`cli / wbs-import・report`／
`frontend / warnings・surfaces/health`／`process`（`moira/PROPERTIES.md` v0.5→v0.6・
`moira/DECISIONS-CATALOG.md` の実装状態注記）
出典: `moira/changes/issue-6/impact-map.md` の波及先パス列（R1〜R18＋追加行、全 22 行）。

## 2. 事象　`inferred`（素材は `derived`）

- **Given**: MODEL v21（`moira#2`）が §2.10 普遍訂正原則を正典化した一方、参照実装は v20 挙動のまま
  だった（v21 §7#20 が本 issue を追跡先として名指し）。
- **When**: 正典と道具が食い違っている間、DECISIONS-CATALOG の関係判断は「移行注記どおり v20 挙動が正」
  という二重状態で運用される。
- **Then**（変更後）: backend に第二層の `Correction` 型・`fold(events, corrections?)` の合成読み・
  訂正計器 4 区分・解除センチネル・v21 done-lock carve-out が入り、frontend に矛盾所属警告と
  HealthSurface の訂正計器ゾーンが入った。
- **期待値**: 正典 §2.10 の中核規則（訂正適用後ログは既存意味論でそのまま読み直される一つのログ）が
  実装で成り立つこと。
- **実際値**: 期待どおり（backend 182 pass・frontend 172 pass・cli 302 pass・型テスト 5 pass）。
  ただし **4 行が deferred** で残った（CLI 訂正書き込み UX・bound プロパティ 3 件の agreed 昇格 → `moira#11`）。

出典: issue #6 本文・P6 クローズコメント。

## 3. 障害判定　`inferred` → HX 確定

**非障害** — 根拠: 本件は `moira#2` が**追跡付き deferred として明示的に切り出した実装工程**であり、
「意図した仕様から外れた状態」ではない。正典先行・実装追随という時間差は v21 §7#20 が
**正直開示として明記**していたため、開示済みの既知状態である。

**境界事例としての読み**: 「正典と実装が食い違っている状態」を仕様違反と読む余地はある。
しかし正典自身がその食い違いを宣言し追跡先を名指ししていた以上、隠れた逸脱ではない。よって非障害。

**なお本 issue の実行中に、別事象の欠陥 1 件が発見・是正されている**——CLI テスト 31 件失敗
（`MOIRA_DIR` 継承によるテスト隔離漏れ・commit `3fc5b23`「pre-existing bug」）。
**これは本件とは別の変更であり、`moira#13` として独立に分析する**（項目 10 参照）。

## 4. 変更分類　`inferred`

`req-add`（正典で新設された要件の実装追加。訂正を発行しない限り既存挙動は不変であり、
既定挙動を変える `req-change` ではない——既定変更は `moira#2` 側で起きている）

## 5. 変更範囲　`derived`

**C**（backend/cli/frontend 実装・PBT・単体テスト）／**P**（PR-DONE-LOCK・PR-EVENTS-ONLY 一文改訂＋
PR-CORRECTION-METER 新規起票）／**F**（DECISIONS-CATALOG 状態注記）／**S**（シナリオ波及確認）
出典: `moira/changes/issue-6/impact-map.md` クラス列（C×27・F×3・P×3・S×1。※前面／人間断面の
両テーブルに同じ行が現れるため実行数より多く数えられる）。

## 6. 発生原因サマリ（専門用語なし）　`inferred`

**先に「こう決めた」を文書で確定し、道具（プログラム）はあとから追いつかせる、という進め方を採った。**
そのため一時的に「決め事どおりに動かない道具」を使う期間ができる。本件はその追いつき作業であり、
何かが壊れていたわけではない。

## 7. 発生原因詳細（技術者向け）　`inferred`（素材は `derived`）

v21 §2.10 は訂正を**第二層ファイル**として表現する（イベント 4 型は不変）。実装側はこれを
`fold(events, corrections?)` の合成読みとして受け、`applyCorrections` で latest-wins 合成・
foreign field／非存在 target の適用不能検出を行う。訂正計器 4 区分（総数・施錠対象・遡及・適用不能）は
`CorrectionMeterCounts` として fold 出力に集約され `DerivedState.correctionMeter` で公開される。
`done-lock.pbt.test.ts` には naked 逆行拒否の pin を維持したまま v21 carve-out 3 件を追加した。
出典: issue #6 P4 コメント（2026-07-21T07:23:44Z）の resolved 11 行の記述。

## 8. 根本要因　`inferred` → HX 確定

- **仕組み帰責（必須で一度は問う）**: **「正典先行・実装追随」という分割そのものは規範に無く、
  その都度の裁定で行われている。** v17〜v20 の先例に倣うと HA で述べられているが、
  分割の可否・分割後の二重状態をどう開示するかは `.kiro/steering/moira-change-management.md` にも
  `moira-model.md` にも規則として書かれていない。今回は §7#20 の正直開示という**良い運用**が
  行われたが、それは規律ではなく担当者の練度に依存している。
- **根本要因分類**（Why 軸）: `other`——本件は「ミスが起きたメカニズム」を問う枠に乗らない。
  計画された追随工程であり、失敗メカニズムが存在しない。**R14 のどのラベルも当てはまらないため
  `other` を選ぶが、これは「分類できないほど不明」ではなく「分類対象たる失敗が無い」の意である
  （タクソノミーの適用限界として A5 へ申し送る）。**
- **要因分類**（What 軸）: `other`（同上）
- **詳細**: 非障害のうち「別の変更が意図的に切り出した後続工程」型は、原因分析の 4 軸が
  想定する「欠陥が宿る成果物 × 失敗メカニズム」の格子に載らない。

<!-- 撤回条件タグ: 該当なし。本件の deferred 4 行は #11 で全て解消済み（実害化していない）。 -->

## 9. 同件調査対象　`derived`

走査した母集団: (i) `.kiro/analysis/entries/`（`moira-9.md`・本バックフィル分）(ii) `.kiro/postmortem/defects.md`
（#0001・`Schema: v1`）(iii) 本リポのクローズ済み issue 14 本と対応する `moira/changes/issue-*/` 台帳。
旧リポ由来の `issue-39/42/43` は対象外（D-80）。

## 10. 同件調査結果　`inferred`（意味検索・網羅性は保証しない）

**あり（2 系統）**:

1. **同型（正典先行の追随工程）**: `moira#7`（シナリオ文言同期）は同じ `moira#2` の deferred から
   派生した姉妹 issue であり、要因分析上の性質が同じ（計画された追随・失敗メカニズム不在）。
   `moira#11` は本 issue の deferred から派生した孫にあたる。
2. **本 issue の実行中に発見された別事象**: CLI テスト 31 件失敗（`MOIRA_DIR` 継承）→ `moira#13`。
   **これは「すり抜け」型の欠陥であり、本 issue の作業中に偶発的に露出した**——
   `moira#6` の影響マップには載っていない（載せる筋のものでもない）。

## 11. 同件の対応状況　`derived`

- `moira#7` — https://github.com/PrimeBrains/moira/issues/7 — state: **CLOSED**
- `moira#11` — https://github.com/PrimeBrains/moira/issues/11 — state: **CLOSED**（#6 deferred 4 行を全解消）
- `moira#13` — https://github.com/PrimeBrains/moira/issues/13 — state: **CLOSED**
出典: `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 実行）。

## 12. 再発防止策　`inferred` → HX 確定

1. **「正典先行・実装追随」の分割を規範に明文化する**——分割してよい条件・二重状態の開示義務
   （どこに・どの様式で書くか）・追跡先の命名。今回の §7#20 開示を**先例ではなく規則**にする。
   出口: `.kiro/steering/moira-change-management.md`（または `moira-model.md`）。
   **根拠: 項目 8 の仕組み帰責。**
2. **要因分析の 4 軸に「計画された後続工程」を表現する術がないことを機構側の課題として記録する**——
   `other` で逃がすと集計が濁る。出口: `.kiro/steering/moira-change-analysis.md` §3／
   `rules/taxonomy-reference.md`（R3／R14 に「非該当」を明示する扱いの追加）。
   **根拠: 項目 8 で `other` を選ばざるを得なかったこと。**

## 13. 検知すべき工程　`derived`

`p5-closure`——`moira#2` の P5 同期閉包で「実装同期は未了」と判定され deferred 行 R13〜R15 として
切り出された。本 issue はその追跡先である。
出典: issue #2 閉包サマリ「できないことになったこと（deferred・追跡付き）」。

## 14. 実際に検知した工程　`derived`

`p5-closure`——同上（`moira#2` の閉包工程）。本 issue の存在自体がその工程の出力である。
出典: issue #6 本文「発生元: issue #2（変更管理フロー・追跡付き deferred 行 R13〜R15）」。

## 15. なぜ然るべき工程で検知できなかったか　`inferred` → HX 確定

**同工程で検知している（13＝14）。** 工程は設計どおり働いた——閉包が未了を検出し、
追跡付き deferred として後続 issue に渡し、その issue が実際にクローズされた。
**検知漏れは存在しない。**

## 16. 検知するための対策　`inferred` → HX 確定

**不要**（項目 15 のとおり検知は成立している）。計器・ゲート・チェックリストのいずれも追加しない。
足すとすれば項目 12-1 の「分割の規範化」だが、それは検知ではなく**手続きの明文化**である。

---

## 出所の集計

| ラベル | 欄数 |
|---|---|
| `derived` | 6（項目 1・5・9・11・13・14） |
| `inferred` | 10（項目 2・3・4・6・7・8・10・12・15・16） |
| `captured` | **0**——本件のクローズ（2026-07-21）は一次採取 2 欄の導入（issue #19・2026-07-25）より前 |
| `unknown` | 0 |

**`unknown` の欄**: なし。

**正直開示**: 項目 8 の 2 ラベルを `other` としたのは「わからない」からではなく
「分類対象たる失敗が存在しない」ためである。**`unknown` とは別種の空白**であり、
A5 の集計ではこの区別が失われる（機構の課題として申し送る）。
