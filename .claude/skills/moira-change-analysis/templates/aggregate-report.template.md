<!--
  横断集約レポート（A5）テンプレート。`.kiro/analysis/reviews/<YYYY-MM-DD>.md` として保存。
  集約の実施主体は /kiro-postmortem-review（4 軸頻度・クラスタ・Try 抽出・steering hand-off を所有）。
  規範: .kiro/steering/moira-change-analysis.md §1 A5・§6。
  対象は **両台帳**（.kiro/postmortem/defects.md ＋ .kiro/analysis/entries/）。
-->
---
date: {{YYYY-MM-DD}}
scope: {{全件 | since:YYYY-MM-DD | feature:LABEL}}
---

# 要因分析 横断集約 — {{YYYY-MM-DD}}

## 対象

| | 件数 |
|---|---|
| 障害台帳（`.kiro/postmortem/defects.md`） | {{N}}（うち `Schema: v1` {{N}} 件） |
| 変更分析台帳（`.kiro/analysis/entries/`） | {{N}} |
| **合計** | {{N}} |

<!-- v1（10 項目）entry は malformed にしない——欠落項目は `unknown` として集計に載せる
     （steering §10・D-86）。落とした entry があるなら ID を必ずここに書く。 -->

**集計から外した entry**: {{なし | ID と理由を全列挙}}

## 4 軸頻度

### 変更分類

| ラベル | 件数 | 割合 |
|---|---|---|
| {{LABEL}} | {{N}} | {{%}} |

### 根本要因分類

| ラベル | 件数 | 割合 |
|---|---|---|
| {{LABEL}} | {{N}} | {{%}} |

### 対象システム

| ラベル | 件数 | 割合 |
|---|---|---|
| {{LABEL}} | {{N}} | {{%}} |

### 検知工程ギャップ（検知すべき → 実際に検知した）

| ペア | 件数 | すり抜けた層の解釈 |
|---|---|---|
| {{SHOULD}} → {{ACTUAL}} | {{N}} | {{INTERPRETATION}} |

<!-- 「同工程で検知」（should = actual）の件はギャップなし——D-84 の入口フィルタにより
     そもそも欠陥検出契機では積まれないが、P6 クローズ契機の分析では出現しうる。 -->

## クラスタ

- **根本要因別**: {{LABEL}} → {{キー列挙}}
- **対象システム別**: {{LABEL}} → {{キー列挙}}
- **同件 cross-reference**: {{キー同士の参照グラフ}}

## 出所の健全性（本機構の正直枠の自己点検）

| ラベル | 全欄に占める割合 |
|---|---|
| `derived` | {{%}} |
| `inferred` | {{%}} |
| `captured` | {{%}} |
| `unknown` | {{%}} |

<!-- `inferred` が支配的なのは想定内（過去分は事後の再構成）。
     ただし `unknown` が特定の項目に集中しているなら、それ自体が
     「その情報を採取していない」という仕組みの穴の兆候であり、Try の材料になる。 -->

**`unknown` が集中している項目**: {{項目番号と件数}}

## Try 候補

| # | Try | 根拠 entry | 出口の名指し | 裁定 |
|---|---|---|---|---|
| {{N}} | {{TRY}} | {{KEYS}} | {{`/kiro-steering-custom` の対象ファイル ／ issue 起票 → `moira-change`}} | {{approved / rejected / pending}} |

<!-- 本レポートは確定文書を書き換えない。approved の反映は既存の出口経由のみ（steering §11）。 -->

## 反映結果

| Try | 反映先 | 結果 |
|---|---|---|
| {{N}} | {{PATH_OR_ISSUE_URL}} | {{success / failed / 未着手}} |
