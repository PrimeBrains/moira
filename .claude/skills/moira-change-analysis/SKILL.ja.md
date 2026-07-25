---
name: moira-change-analysis
description: >
  変更管理の履歴（GitHub issue ＋ `moira/changes/issue-N/` 台帳 ＋ 実差分）から、変更 1 件ごとの
  要因分析（17 項目）を起こし、横断集約して仕組み側の是正 Try に落とすオーケストレーション skill。
  「要因分析を回す」「振り返りをする」「変更履歴から要因分析」「未分析のを分析して」「定期の振り返り」
  などで起動。まず障害／非障害を受付で振り分け、障害の記録は `/kiro-postmortem-add` へ委譲する。
  規範は `.kiro/steering/moira-change-analysis.md`——本スキルは振り付けのみを所有し、規則の本文を
  複製しない。検証器（計器）ではなく事後分析であり、変更を止めない。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, Skill
argument-hint: <なし（未分析キューを算出）| キー（例 moira#16）| "since:2026-07-01" 等の絞り込み>
model: opus
metadata:
  origin: "custom"
  shared-rules: "templates/"
---

# moira-change-analysis — 変更の履歴を振り返り、仕組みの穴を見つける

クローズ済みの変更 1 件を単位に、**障害か非障害かを受付で振り分け**、17 項目の分析票を
**出所ラベル付き**で起こし、両台帳を**横断集約**して、仕組み（skill・steering）側の是正 Try に落とす（A0〜A5）。

**規範（正）は [`.kiro/steering/moira-change-analysis.md`](../../../.kiro/steering/moira-change-analysis.md)。**
判定基準（障害／非障害・すり抜けギャップの入口フィルタ）・17 項目の定義・出所ラベル・タクソノミーの所在・
起動トリガ・保存先・正直枠の本文はすべて steering が所有する。本スキルは**操作手順（振り付け）だけ**を所有し、
規則を複製しない——食い違えば steering が勝つ。

> **ガードレール（最重要）:**
> 1. **本フローはゲートではない。** 合否を出さず、変更を止めない。計器①〜⑥にも変更管理フローのゲート群にも
>    加わらない。
> 2. **欄を捏造しない。** 根拠を示せない欄は `unknown` と書く。**空欄を answer のように見せることが、
>    本スキルが防ぐために存在する唯一の失敗様式**である。
> 3. **過去の記録を書き換えない。** 読み取りは `Schema: v1`（10 項目）と `v2`（17 項目）の両方を受理し、
>    **v1 entry を malformed として集計から落とさない**。
> 4. **steering を直接書かない。** 承認された Try は既存の出口（`/kiro-steering-custom`／issue 起票 →
>    `moira-change`）からのみ反映する。
> 5. **確認なしに起動しない。** AI は 1 行で提案するだけ。起動は人間が決める。

## 引数

- **なし**: 未分析キューを算出して提示する（既定）。
- **キー**（例 `moira#16`）: その 1 件だけを分析する。
- **絞り込み**（例 `since:2026-07-01`）: 母集団を絞る。

## 手順（規範）

### 0. 起動前提

規範 steering と [`.kiro/analysis/README.md`](../../../.kiro/analysis/README.md) を読む。
**この skill は自分から起動しない**——トリガ該当時は §6 の提案 1 行を出すだけ。

### 1. A0 受付・振り分け

1. **母集団を列挙**する:
   - `gh issue list --repo PrimeBrains/moira --state closed --limit 200 --json number,title,closedAt`
   - `ls moira/changes/`（台帳の有無は問わない——台帳のない軽量 exit の issue も母集団に含む）
2. **分析済みキーを引く**: `.kiro/analysis/INDEX.md` の行 ＋ `.kiro/postmortem/defects.md` の
   `Key:` メタ。差集合が**未分析キュー**（**保存しない・毎回算出**。steering §6）。
3. **キーは repo 修飾**（`moira#16`）。旧リポ由来（`sdd-workshop#*`）は既定で対象外。
4. **障害／非障害を判定**する（steering §2 の基準。境界事例は `障害` 側に倒す）。判定は AI がドラフトし、
   **HX で人間が確定**する——判定と根拠は必ず分析票の項目 3 に記録する（暗黙の振り分けを禁じる）。
5. 欠陥検出を契機に積む場合は **steering §2.1 の「すり抜けギャップ」フィルタ**を通す
   （「検知すべき工程 ≠ 実際に検知した工程」のみ。ラウンド内で決着した指摘・実装中のテスト失敗は積まない）。

### 2. A1 証跡収集（1 件ごと）

出典パス／URL を**必ず添えて**集める:

| 証跡 | 取り方 |
|---|---|
| issue 本文・**全コメント** | `gh api repos/PrimeBrains/moira/issues/<N> --jq '.body'`／`.../comments`（triage 判定・HA 裁定・閉包サマリはコメントにある） |
| 変更管理の台帳 | `moira/changes/issue-<N>/`（request／impact-map／intent-ratification／fork-batch／closure-report＋補助 md） |
| 敵対ラウンドの指摘 | `moira/changes/issue-<N>/gate-round-records.md`（**項目 14「実際に検知した工程」の一次証跡**。全 issue にはない） |
| 実差分 | `git log --oneline --grep "#<N>"`／`git diff --name-only <base>..<merge>` |
| 関連する既存 entry | `.kiro/analysis/entries/`・`.kiro/postmortem/defects.md` を意味検索（**表記ゆれがあるため regex に頼らない**） |

### 3. A2 導出 → A3 推論

1. **A2 導出**: 履歴に**在る**項目を写す（項目 1・5・9・11・14）。各欄に `derived` ＋**出典パス**を付す。
   - 項目 1（対象システム）: 変更 path → `backend`／`frontend`／`cli`／`adapter`／`process` の写像。
   - 項目 5（変更範囲）: 影響マップの「クラス」列（M/D/P/S/C/V/F）をそのまま。
2. **A3 推論**: 履歴に**在らざる**項目を埋める（項目 2・3・4・6・7・8・10・12・13・15・16）。
   各欄に `inferred` ＋**根拠（どの記述から）**を付す。**根拠を示せない欄は `unknown`**。
   - 項目 8（根本要因）は**仕組み帰責を必ず一度は問う**——SKILL／steering／テンプレート／工程配線／
     タクソノミー／人間タッチポイント設計に穴がなかったか。**該当時は literal タグ
     `[deferred-important]`／`[rdt-disposal]`／`[intent-drift]` を本文に含める**（他機構の撤回条件が
     grep で数える計器。落とすと別機構の計器が黙って死ぬ）。
3. `templates/analysis-entry.template.md` に流し込む。

### 4. HX 人間確認

- **人間が読むのは 4 群だけ**: ①障害判定 ②根本要因（仕組み帰責）③再発防止策 ④検知対策。
- **提示規約**: ①詳細は entry の md に人間可読最優先で吐き出す ②コンソールには確認点のサマリとパスを出す
  ③`AskUserQuestion` は md を読んだうえでの**最終裁定だけ**に使う（狭い選択肢欄に術語を詰め込まない）。
- 人間が判定を覆したら、**覆した履歴も entry に残す**。

### 5. A4 記録

- **障害** → `Skill: kiro-postmortem-add` へ委譲（引き渡すのは確定済みの 17 項目と出所ラベル）。
  台帳は `.kiro/postmortem/defects.md`。**本スキルは同ファイルを直接編集しない。**
- **非障害** → `.kiro/analysis/entries/<repo>-<番号>.md` を Write ＋ `.kiro/analysis/INDEX.md` に 1 行 append
  （`templates/index-row.template.md`）。
- どちらも `Schema: v2`・`status: ratified` で記録する。

### 6. A5 横断集約（両台帳をまたぐ）

1. **起動条件**（steering §6）: 未分析 10 件／前回から 1 か月／ユーザー明示。**該当を検出したら 1 行で提案するだけ**:

   ```
   要因分析を回しますか？ 未分析 X 件・該当トリガー: {triggers}
   ```

2. 集約自体は `Skill: kiro-postmortem-review` へ委譲する（4 軸頻度・クラスタ・Try 抽出・steering hand-off は
   同 skill が所有）。**対象は両台帳**（`.kiro/postmortem/defects.md` ＋ `.kiro/analysis/entries/`）。
3. 結果は `.kiro/analysis/reviews/<日付>.md`（`templates/aggregate-report.template.md`）。
4. **HY Try 裁定**（人間）→ 採用分は既存の出口へ: `/kiro-steering-custom`（steering 反映）／
   `gh issue create` → `moira-change`（skill・確定文書の改訂）。**本スキルは確定文書を書き換えない。**

## 正直枠（過大主張の禁止）

保証範囲と未整備義務の本文は **steering §0・§11 が正**（本スキルは複製しない）。本スキルを実行する者への
拘束はひとつ: 報告・entry・集約レポートで、steering が「保証しない」と挙げるものを「担保」「保証」と
言わないこと。特に——**全項目が自動で埋まるとは書かない**、**過去分を「当時の判断」と書かない**
（`inferred` は事後の再構成）、**同件調査の網羅性を主張しない**。

## 既存スキルとの境界

- `kiro-postmortem-add`: 障害 entry の記録先（**本スキルが起動する側**）。台帳の追記規律とタクソノミー正本を所有。
  依存は一方向（本スキル → 同 skill）。
- `kiro-postmortem-review`: 横断集約（A5）の実施主体（**本スキルが起動する側**）。対象は両台帳。
- `moira-change`: 出口（P6 クローズ）が本フローの入口。一次採取 2 欄（障害判定・変更分類）も同フローが行う。
  **本スキルは同フローのゲートを再実行しない。**
- `kiro-steering-custom`: 承認された Try が `.kiro/steering/` に届く唯一の経路。

## 出力フォーマット（Analysis Verdict）

```md
## Analysis Verdict
- QUEUE: <未分析 X 件（算出値）／内訳: 障害 A・非障害 B・未判定 C>
- ANALYZED: <今回分析したキー一覧>
- VERDICTS: <キーごとに 障害/非障害＋根拠一言>
- PROVENANCE: <derived X 欄 / inferred Y 欄 / captured Z 欄 / unknown W 欄（全体集計）>
- UNKNOWN: <unknown になった欄の一覧（隠さず全列挙）>
- LEDGERS: <書き込んだファイルのパス>
- AGGREGATE: <A5 を回した場合のみ: reviews/<日付>.md のパスと Try 件数・裁定>
- EXITS: <Try の反映先（/kiro-steering-custom・issue 起票）または「なし」>
```
