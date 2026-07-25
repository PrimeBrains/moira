---
key: moira#1
schema: v2
status: aggregated
analyzed-at: 2026-07-25
verdict: 非障害
---

# 要因分析 — moira#1　DECISIONS-CATALOG の裏面を削除 — 計器⑥の照合を AI 意味突合へ置換

> 本 entry は **issue #21（初回バックフィル 13 本）**の一部である。過去分ゆえ大半の欄は
> **後知恵の再構成（`inferred`）**であり、「当時そう判断した記録」ではない。

## 証跡（sources）

- issue: https://github.com/PrimeBrains/moira/issues/1 （closed 2026-07-20T04:16:42Z）
- コメント: P1 受付（2026-07-20T02:27:42Z）／P2・P3 HA 批准（02:56:12Z）／閉包・クローズ（04:16:42Z）
- 台帳: `moira/changes/issue-1/{request,impact-map,intent-ratification,fork-batch,gate-round-records,negative-control-trial,closure-report}.md`
- 敵対ラウンド記録: `moira/changes/issue-1/gate-round-records.md`
- 差分: base `ab709ad` → HEAD `37651ab`（閉包コメントの記載）
- 母集団確認: `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 時点）

---

## 1. 対象システム　`derived`

`process`（`moira/DECISIONS-CATALOG.md`・`.claude/skills/decision-conformance/`・
`.claude/agents/decision-conformance-checker.md`・`.kiro/steering/moira-verification.md`・
`.kiro/steering/moira-change-management.md`・`.claude/skills/moira-change/` テンプレート）
＋ `backend / .dependency-cruiser.cjs`（コメント 1 箇所のみ）
出典: `moira/changes/issue-1/impact-map.md` の波及先パス列（R1〜R12）。

## 2. 事象　`inferred`（素材は `derived`）

- **Given**: `moira/DECISIONS-CATALOG.md` の全 77 判断が〔裏面〕欄（根拠 clause ID・関連実装 ref）を持ち、
  計器⑥（`decision-conformance`）はこの手書き対応表を起点に照合対象を特定していた。
- **When**: 実装が動いても対応表は自動では追随しない——維持義務のある対応表は原理的にドリフトする。
- **Then**（変更後）: 裏面を全削除し、照合対象の同定を**判断文からの AI 意味突合**に置き換えた。
  被覆マップ（計器割付）は各エントリの計器タグを正典とする派生ビューへ格下げした。
- **期待値**: 手で維持する対応表がゼロになり、対応は照合のたびに導出される。
- **実際値**: 期待どおり（表面 77 件無傷・裏面残存ゼロを機械確認）。代償として照合ごとの探索コストが増える。

出典: issue #1 本文「問題」「やること」・閉包コメント「実施内容」。

## 3. 障害判定　`inferred` → HX 確定

**非障害** — 根拠: 裏面は「ドリフトしうる面」であって、**削除の時点で仕様違反状態が実在したという記録はない**。
issue 本文も「維持する対応表を増やすのではなく、対応の導出を毎回 AI に任せる」という**方式の選択**として
書かれており、欠陥是正ではない。

**境界事例としての読み**（steering §2「境界事例は障害側に倒す」の適用検討）: 「自由記述混在のため機械逆引きの
完全性も主張できない」（issue 本文）を「計器⑥が主張どおりに動いていなかった＝潜在欠陥」と読む余地はある。
しかしその限界は #39 DFD §5 が**正直枠として事前に計上済み**であり、約束していない完全性を果たせなかった
だけで、約束からの逸脱ではない。よって非障害。

## 4. 変更分類　`inferred`

`process-improve`（設計判断目録の様式と計器⑥の照合方式という**開発プロセス側の仕組み**の改善）

## 5. 変更範囲　`derived`

**D**（D-78 起票・`agreed`）／**F**（目録本体・skill／agent 定義・steering 2 件・テンプレート・README）／
**V**（計器⑥の陰性対照試走）／**C**（`.dependency-cruiser.cjs` コメント）
出典: `moira/changes/issue-1/impact-map.md` クラス列（D×1・F×9・V×2・C×1）。

## 6. 発生原因サマリ（専門用語なし）　`inferred`

**「この決め事はどのコードに対応するか」を手書きの一覧で持っていたが、コードが動いても一覧は自動では
直らない。**放っておけば必ずズレる表を維持し続けるより、確かめるたびに AI に探させるほうが安いという
判断に切り替えた。ズレる表を作ってしまったこと自体が原因ではなく、**維持コストのかかる対応表を持つ
という設計方針**が原因である。

## 7. 発生原因詳細（技術者向け）　`inferred`（素材は `derived`）

`DECISIONS-CATALOG.md` の各エントリは〔裏面〕として根拠 clause ID と関連実装 ref を保持し、規律節 L12 が
その存在理由を、L17 が末尾被覆マップとの役割分担を宣言していた。`decision-conformance-checker` は
この ref を照合対象特定の入口としていたため、**ref が古びると計器⑥が誤った対象を照合する**。
ref は自由記述混在で機械逆引きの完全性も主張できず（#39 DFD §5 の正直枠）、
「維持義務つき対応表」という R/D/T 使い捨て化（sdd-workshop#40）と同型の構造問題を抱えていた。
出典: `moira/changes/issue-1/impact-map.md` R2 行の根拠列・issue #1 本文。

## 8. 根本要因　`inferred` → HX 確定

- **仕組み帰責（必須で一度は問う）**: **確定文書の様式を決める工程に「この欄は誰が・何を契機に更新するのか」
  を問う規律がなかった。** 裏面は「あると便利な情報」として様式に入ったが、更新契機（実装が動いたとき誰が
  気づくか）が設計されていなかった。同型の問題は sdd-workshop#40（R/D/T 使い捨て化）で既に一度裁定されて
  おり、**その裁定が「目録の裏面」には波及していなかった**——つまり過去の裁定を横展開する工程が無い。
- **根本要因分類**（Why 軸）: `verification-gap`（対応表のドリフトを検出する手段を整備しないまま
  対応表に依存する設計を採った）
- **要因分類**（What 軸）: `design-error`（欠陥が宿るのは目録の様式＝設計判断であり、要件文でも実装ミスでもない）
- **詳細**: 「対応表を持つ」ことの真のコストは作成時ではなく**維持時**に現れる。#40 で同じ経済学が裁定
  された後も、目録の裏面はその適用対象として棚卸しされなかった。issue #1 はその棚卸しを 9 か月遅れで
  行ったに等しい（本リポでは移管直後）。

<!-- 撤回条件タグ（deferred-important / rdt-disposal / intent-drift）は該当なし。
     ※ rdt-disposal は「R/D/T 使い捨て方針下での維持 spec 不在／再生成物の不忠実」の実害化を数える
     タグであり、本件は R/D/T そのものではなく同型の別対応表の話ゆえ付けない。
     角括弧付きの literal は grep 計数される計器のため、否定文の中でも書かない。 -->

## 9. 同件調査対象　`derived`

走査した母集団: (i) `.kiro/analysis/entries/` の既存 entry（`moira-9.md` 1 件）(ii) `.kiro/postmortem/defects.md`
の既存 entry（#0001・`Schema: v1`）(iii) **本リポのクローズ済み issue 14 本**（`moira#1`・`#2`・`#5`・`#6`・
`#7`・`#8`・`#9`・`#10`・`#11`・`#13`・`#15`・`#16`・`#17`・`#19`。出典:
`gh issue list --repo PrimeBrains/moira --state closed`）と対応する `moira/changes/issue-*/` 台帳。
**旧リポ由来の `issue-39/42/43` は対象外**（D-80）。

## 10. 同件調査結果　`inferred`（意味検索・網羅性は保証しない）

**あり（1 件・同型ではなく同系統）**: `moira#8`（シナリオ unit の参照リンク破れ）は「手で書いた参照が
現実からズレる」という同じ系統の問題である。ただし #8 は**ズレが実際に壊れたリンクとして実在した**点で
本件（削除時点では実害未確認）と異なる。**根本要因分類 `verification-gap` を共有する記録**は
`.kiro/postmortem/defects.md` entry #0001（サブエージェント報告の検証層不在）にもある。

## 11. 同件の対応状況　`derived`

- `moira#8` — https://github.com/PrimeBrains/moira/issues/8 — state: **CLOSED**（2026-07-21）
- `.kiro/postmortem/defects.md` #0001 — 台帳内 entry（issue なし）・Status: `recorded`
出典: `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 実行）。

## 12. 再発防止策　`inferred` → HX 確定

1. **確定文書に「維持義務のある欄」を新設するときは、更新契機と検出手段をセットで書く規律を足す**——
   「誰が・何を契機に・どう気づくか」が書けない欄は作らない。出口: `doc-refine` の確定チェック
   （`.claude/skills/doc-refine/`）または `.kiro/steering/moira-verification.md`。
   **根拠: 項目 8 の仕組み帰責そのもの。**
2. **裁定の横展開を工程にする**——#40 のような「同型の構造問題への裁定」が出たら、既存の確定文書に
   同型の面が無いか棚卸しする一手を入れる。出口: `.kiro/steering/moira-change-management.md`
   （P2 影響調査の観点追加）。**根拠: 項目 8 の「横展開する工程が無い」。**

## 13. 検知すべき工程　`unknown`

**`unknown`** — 本件は「実在した欠陥をどこかで捕まえ損ねた」型ではなく**設計方針の転換**であり、
「本来これを検知すべきだった工程」を特定する根拠が証跡に無い。反実仮想（目録を起こした時点で
ドリフト面だと気づけたか）は立てられるが、それを支える記述が台帳・issue のどこにも無いため、
推測での穴埋めを避けて `unknown` とする。
（**同種の緊張は `entries/moira-9.md` 項目 15 が先に開示している**——検知系 4 項目は障害を念頭に
設計された枠であり、非障害への適用には無理がある。）

## 14. 実際に検知した工程　`inferred`

`post-close`——旧リポ #39 DFD §5 の正直枠として限界が計上され、その後ユーザー裁定（2026-07-19）で
方針転換が決まった。ゲート内の指摘ではなく、**確定後の設計議論**で顕在化している。
出典: issue #1 本文「当初案は…2026-07-19 のユーザー裁定で方向転換した」。

## 15. なぜ然るべき工程で検知できなかったか　`unknown`

**`unknown`** — 項目 13 が `unknown` である以上、13≠14 の差を根拠づけられない。
「気づけたはずの工程」を推測で置くことは捏造にあたるため書かない。

## 16. 検知するための対策　`inferred` → HX 確定

**計器・ゲートの新設は要さない。** 項目 12-1 と同一の出口——`doc-refine` の確定チェックに
「維持義務のある欄には更新契機と検出手段が書かれているか」の 1 行を足す。これは検知（detect）ではなく
**発生の予防**であり、本件について「検知」の対策を名指すこと自体に無理がある（項目 13 の `unknown` と同根）。

---

## 出所の集計

| ラベル | 欄数 |
|---|---|
| `derived` | 4（項目 1・5・9・11） |
| `inferred` | 10（項目 2・3・4・6・7・8・10・12・14・16） |
| `captured` | **0**——本件のクローズ（2026-07-20）は一次採取 2 欄の導入（issue #19・2026-07-25）より前 |
| `unknown` | 2（項目 13・15） |

**`unknown` の欄**: **項目 13（検知すべき工程）・項目 15（なぜ検知できなかったか）**。
理由は各項目に記載——設計方針の転換に「検知すべき工程」を当てる根拠が証跡に存在しないため。
