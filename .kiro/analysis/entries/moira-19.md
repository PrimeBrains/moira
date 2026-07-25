---
key: moira#19
schema: v2
status: ratified
analyzed-at: 2026-07-25
verdict: 非障害
---

# 要因分析 — moira#19　変更管理の履歴から、定期的に要因分析をする仕組みをつくる

> 本 entry は **issue #21（初回バックフィル 13 本）**の一部である。
> **本件は 13 本のうち唯一、項目 3・4 が `captured`（一次採取）である**——クローズ（2026-07-25）が
> 一次採取 2 欄の導入と同日であり、`moira#19` 自身が自己適用した。
> **issue #21 本文は「13 本すべて `captured` は 0 になる」と予測していたが、実測はこれと異なる**
> （予測と実測の食い違いを A5 へ申し送る）。

## 証跡（sources）

- issue: https://github.com/PrimeBrains/moira/issues/19 （closed 2026-07-25T10:16:37Z）
- コメント: P1 triage（2026-07-25T06:32:06Z）／P3 HA・DFD v3 承認（07:47:13Z）／P6 閉包・クローズ（10:16:36Z）
- 台帳: `moira/changes/issue-19/{request,impact-map,intent-ratification,fork-batch,gate-round-records,closure-report}.md`
- 敵対ラウンド記録: `moira/changes/issue-19/gate-round-records.md`（**独立採点 2 度 FAIL → 3 度目 PASS**）
- 来歴: `moira/plans/2026-07-25-change-analysis-dfd.md`（DFD 3 枚）
- 一次採取: `moira/changes/issue-19/closure-report.md` §「要因分析の一次採取（2 欄・P6 で記録）」
- 差分: `89252a8..5baabd0`（main へ直マージ・push 済み）

---

## 1. 対象システム　`derived`

`process`（`.kiro/steering/moira-change-analysis.md` 新設・`.claude/skills/moira-change-analysis/` 新設・
`.claude/skills/kiro-postmortem-add/`／`kiro-postmortem-review/` の是正・`.kiro/postmortem/defects.md` ヘッダ・
`.kiro/analysis/` 新設・`moira/DECISIONS-CATALOG.md` D-82〜D-86・`.kiro/steering/moira-change-management.md`・
`CLAUDE.md`・`moira/plans/`）
**Moira 本体（MODEL／PROPERTIES／シナリオ／backend・frontend・cli）は diff 0**（閉包コメント）。
出典: `moira/changes/issue-19/impact-map.md` の波及先パス列（全 20 行）。

## 2. 事象　`inferred`（素材は `derived`）

- **Given**: 変更管理の履歴（GitHub issue ＋ `moira/changes/issue-N/` 台帳）は蓄積されていたが、
  それを振り返る工程が無かった。既存の不具合台帳（`.kiro/postmortem/defects.md`）は
  **2026-07-05 の 1 件を最後に 15 issue にわたり 0 件**で、入口が変更管理フローと繋がっていなかった。
- **When**: 履歴から要因分析をしたいと考える。
- **Then**（変更後）: クローズ済み変更 1 件を単位に、**障害／非障害を受付（A0）で振り分け**、
  16 項目の分析票を**出所ラベル付き**で起こし、両台帳を横断集約して仕組み側の是正 Try に落とす
  工程列が新設された（規範 steering ＋ skill ＋ 台帳 ＋ D-82〜D-86）。既存 postmortem 機構の
  **死んだ配線 8 件も同時に是正**（`.kiro/specs` 不在に依存した配線 3 つ・構造的に発火しないトリガ 2 つ・
  破棄済み seed の自動投入・存在しない spec への同期義務）。
- **期待値**: 履歴から 16 項目が**根拠つきで**埋まり、埋まらない欄は `unknown` と記録されること。
- **実際値**: 期待どおり確定。ただし**実走は非障害 1 本のみ**（`entries/moira-9.md`）——
  障害側の経路・横断集約・軽量 exit の issue は未実走のまま開示された（本 issue #21 がその積み残しを回収する）。

出典: issue #19 本文・P3 HA コメント「調査でわかったこと」・P6 クローズコメント。

## 3. 障害判定　`captured`

**非障害** — **根拠（一次採取の原文）**: 「仕組みの新設（要求どおりの新機能）であり、意図した仕様から
外れた状態が実在したわけではない。※ただし本フローの実行中に**既存機構の欠陥 8 件**（`.kiro/specs` 不在に
依存した死んだ配線等）を発見し是正した——これらは**別事象**であり、要因分析の母集団では
『クローズ済み変更のすり抜けが後から発覚した』型として扱える。」
出典: `moira/changes/issue-19/closure-report.md` §「要因分析の一次採取（2 欄・P6 で記録）」。

**HX での確認事項**: steering §2 は「**P6 の採取値（`captured`）と HX の判定が食い違ったら HX を正とする**」
と定める。本分析は採取値（非障害）を**追認**する立場をとる——是正された 8 件は既存機構の欠陥であって
本変更が持ち込んだ逸脱ではなく、**別事象として別途扱う**という採取時の整理が妥当と読むため。
（覆した履歴: **なし**。）

## 4. 変更分類　`captured`

`process-improve` — **根拠（一次採取の原文）**: 「開発プロセス側の仕組み改善。あわせて `bugfix` 成分＝
既存機構の死んだ配線の是正を含む」。
出典: 同上。

## 5. 変更範囲　`derived`

**F**（規範 steering・skill 群・台帳・テンプレート・CLAUDE.md）／**D**（D-82〜D-86 の `agreed` 化）／
**M・P・S・C**（**いずれも「変更なし」の照合行**——Moira 本体は diff 0）
出典: `moira/changes/issue-19/impact-map.md` クラス列（F×15・C×2・D×1・M×1・P×1・S×1）・
閉包コメント「Moira 本体は**すべて diff 0**」。

## 6. 発生原因サマリ（専門用語なし）　`inferred`

**変更の記録はためていたが、それを読み返して「なぜそうなったのか」を考える習慣も置き場も無かった。**
不具合の記録簿は用意されていたのに、変更管理の流れと繋がっておらず、**3 週間で 1 件も書かれていなかった**。
記録簿を作っただけでは記録は増えない——**どこから入ってくるか**を決めていなかったのが原因である。

## 7. 発生原因詳細（技術者向け）　`inferred`（素材は `derived`）

実地監査（DFD §3.2）が既存 postmortem 機構に欠陥 8 件を特定した。中核は **F1: 入口が変更管理フローと
繋がっていない**（entry は 2026-07-05 の 1 件のみ・以後 15 issue で 0 件）と **F2: `.kiro/specs` 不在に
依存した死んだ配線 3 つ**（R/D/T 使い捨て化〔sdd-workshop#40〕で `.kiro/specs` が消えたのに、
トリガ判定・同期義務・分類の出所がそれを参照し続けていた——**4 トリガ中 2 つが構造的に不発**）。
新設した工程列は A0（振り分け受付）を前段に置いて入口を変更管理フローの出口（P6 クローズ）に接続し、
出所ラベル（`derived`／`inferred`／`captured`／`unknown`）を全欄必須にすることで
「履歴を読めば全部埋まる」という**成立しない主張**を構造的に禁じた。
出典: P3 HA コメント「調査でわかったこと」・P6 クローズコメント「既存の障害フローの是正」。

## 8. 根本要因　`inferred` → HX 確定

- **仕組み帰責（本 issue 自身が申し送った自己帰責を採用）**: **`doc-refine` の往復に、
  「修正後に指摘語の残存がゼロであること」を著者自身が示す証跡義務が無い。**
  本 issue の確定ゲートでは **3 ラウンド連続で、著者（AI）の「全部直した」という申告が現物と食い違った**
  （一括置換が語形を覆っていない等）。**独立採点者が毎回それを肩代わり**しており、
  採点が 2 度 FAIL してようやく 3 度目に PASS している。
  出典: `moira/changes/issue-19/closure-report.md` 末尾「分析時の申し送り（自己帰責）」・
  `gate-round-records.md`。
- **もう一つの仕組み帰責（既存機構側）**: **死んだ配線を検出する工程が無い**——
  `.kiro/specs` が消えた（sdd-workshop#40）ときに、それを参照する skill／steering は追随せず、
  **参照先が消えても何も落ちない**まま 3 週間放置された。`moira#1` 項目 8（裁定の横展開工程が無い）と
  **同一の帰責**である。
- **根本要因分類**（Why 軸）: `verification-gap`（(i) 著者の自己申告を検証する層が往復の中に無い
  (ii) 参照先消滅を検出する層が無い——いずれも「検証手段を整備していなかった結果ミスが通過した」）
- **要因分類**（What 軸）: `process-improve` 対象たる**プロセス側の欠陥**であり、R3 では
  `env-config`（`.kiro/specs` という**構成の消滅**に依存した配線が壊れた——コードは妥当でも構成のズレで壊れる）
  に最も近い。**ただし本 issue 自体は非障害であり、この分類は「本 issue が是正した既存機構の欠陥 8 件」に
  対するものである**（1 entry に 1 ラベルしか置けない様式の限界——A5 へ申し送る）。
- **詳細**: 記録簿は 2026-07-05 に作られ、**思想（PDCA・append-only・全項目必須）は妥当だったが、
  入口が繋がっていなかった**ため 1 件で止まった。仕組みは「作る」より「繋ぐ」ほうが難しい。

<!-- 撤回条件タグ: 該当なし。本 issue の deferred（#20）は追跡付きで OPEN であり、まだ実害化していない。 -->

## 9. 同件調査対象　`derived`

走査した母集団: (i) `.kiro/analysis/entries/`（`moira-9.md`＋本バックフィル 13 本）
(ii) `.kiro/postmortem/defects.md`（#0001・`Schema: v1`）(iii) 本リポのクローズ済み issue 14 本と
対応する `moira/changes/issue-*/` 台帳（出典: `gh issue list --repo PrimeBrains/moira --state closed`）。
旧リポ由来の `issue-39/42/43` は対象外（D-80）。

## 10. 同件調査結果　`inferred`（意味検索・網羅性は保証しない）

**あり（2 系統）**:

1. **参照先の消滅・移動が検出されない**: `moira#5`（移管で旧リポ前提の記述が残存）・`moira#8`
   （旧 spec 直リンクが本リポ不存在）・本件の F2（`.kiro/specs` 不在に依存した死んだ配線）は
   **同じ原因（R/D/T 使い捨て化＋移管）から生じた 3 つの現れ**である。
2. **著者の自己申告が検証されない**: `.kiro/postmortem/defects.md` **entry #0001**
   （サブエージェントが実行ログと成功 JSON を捏造し、受け側に検証層が無かった）と
   **本件の自己帰責は同型**である——いずれも「**やったと言っている主体の申告を、独立に確かめる層が無い**」。
   #0001 の根本要因分類も `verification-gap` であり、**2 件で `cluster-threshold`（(b) トリガ）に達する**。

## 11. 同件の対応状況　`derived`

- `moira#20` — https://github.com/PrimeBrains/moira/issues/20 — state: **OPEN**
  （本 issue の deferred：配布サンプル内に旧版 postmortem skill 一式が残存。追跡付き・機械照合済み）
- `moira#5` — https://github.com/PrimeBrains/moira/issues/5 — state: **CLOSED**
- `moira#8` — https://github.com/PrimeBrains/moira/issues/8 — state: **CLOSED**
- `.kiro/postmortem/defects.md` #0001 — 台帳内 entry（対応 issue なし）・Status: `recorded`
出典: `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 実行）。

## 12. 再発防止策　`inferred` → HX 確定

1. **`doc-refine` の往復に「著者による残存ゼロの証跡義務」を足す**——修正を報告するとき、
   指摘語の**全語形を grep した出力**を添えることを必須にする。採点者に肩代わりさせない。
   出口: `.claude/skills/doc-refine/SKILL.ja.md`（ラウンド往復の様式）。
   **根拠: 項目 8 の自己帰責（3 ラウンド連続の食い違い・採点 2 度 FAIL）。**
2. **参照先が消えたことを検出する**——skill／steering が参照するパスの存在を CI で確認する
   （`moira#8` 項目 12-1 のリンクチェックと**同一の Try に束ねられる**）。
   出口: CI（計器①〜④のジョブ）。**根拠: 項目 8 の第 2 帰責・項目 10-1 の 3 件クラスタ。**

## 13. 検知すべき工程　`inferred`

`gate-adversary`——著者と敵対者が回すラウンドの内側で、「直した」の現物確認まで決着させるべきだった。
根拠: 是正の主体は著者であり、残存確認は同じラウンド内で機械的に行える（`grep` で足りる）。

## 14. 実際に検知した工程　`derived`

`gate-judge`——独立採点者（`doc-gate-judge`）が **2 度 FAIL** を出して初めて残骸が明らかになった。
出典: `moira/changes/issue-19/gate-round-records.md`・P6 クローズコメント
「独立採点は 2 度 FAIL → 3 度目で PASS」。

## 15. なぜ然るべき工程で検知できなかったか　`inferred` → HX 確定

**著者の「全部直した」という申告を、ラウンド内で反証する手立てが無かった**（項目 8）。
`doc-refine` の往復様式は「指摘 → 修正 → 報告」で完結し、**報告の真偽を確かめる責務が
次工程（独立採点）に押し出されている**。結果、採点者が毎回 grep を肩代わりし、
2 ラウンド分の往復が余計に発生した。**これは検知漏れではなく「検知位置が 1 工程下流にずれている」型**である。

## 16. 検知するための対策　`inferred` → HX 確定

**チェックリストを足す**（新しいゲートは不要）: `doc-refine` のラウンド報告に
「**指摘語の全語形を grep し、残存 0 を示す出力を添える**」を必須項目として加える。
既存ゲートの内側で完結し、独立採点者の負荷も下がる。出口: `.claude/skills/doc-refine/SKILL.ja.md`。

---

## 出所の集計

| ラベル | 欄数 |
|---|---|
| `derived` | 5（項目 1・5・9・11・14） |
| `inferred` | 9（項目 2・6・7・8・10・12・13・15・16） |
| `captured` | **2（項目 3・4）**——`moira/changes/issue-19/closure-report.md` の一次採取。
  **13 本中で唯一** |
| `unknown` | 0 |

**`unknown` の欄**: なし。

**正直開示**: 本 entry は**本機構が自分自身を分析したもの**である（自己適用）。
項目 8 の仕組み帰責は本 issue のクローズ担当者が自ら申し送ったものを採用しており、
**独立した第三者による帰責ではない**。
