# 分析済み索引

要因分析（[`.kiro/steering/moira-change-analysis.md`](../steering/moira-change-analysis.md)）で分析済みの
変更を 1 行ずつ載せる。**障害・非障害の両方**を載せる——横断集約の入口を 1 か所にするため
（障害の本体は `.kiro/postmortem/defects.md` 側にあり、**この索引行は `moira-change-analysis` が書く**）。

> **未分析キューはここに載せない**（保存せず毎回算出する。D-85・[README](README.md)）。

| キー | 障害判定 | 変更分類 | 対象システム | 変更範囲 | 分析日 | 状態 | entry |
|---|---|---|---|---|---|---|---|
| moira#9 | 非障害 | req-add | frontend, process | D, S, C | 2026-07-25 | ratified | [entries/moira-9.md](entries/moira-9.md) |

<!-- 列の意味は .claude/skills/moira-change-analysis/templates/index-row.template.md 参照。
     状態: 非障害 = drafted | ratified | aggregated ／ 障害 = recorded | reviewed | steered -->

## すり抜け検出ログ

「本来捕まえるべき工程より下流で見つかった」欠陥（steering §2.1・D-84）を、**検出したその場で** 1 行残す。
未分析キューは算出できるが、**「いつ・どこで・何がすり抜けたか」は後から再構成できない**ため、
ここだけは観測として記録する（キューの保存ではない）。

| 検出日 | キー | 実際に検知した工程 | すり抜けたと見る工程 | 一言 |
|---|---|---|---|---|

<!-- 例: | 2026-08-01 | moira#16 | p2-impact-survey | p5-closure | #15 の是正漏れが後続 issue の影響調査で発覚 |
     工程ラベルは正本 .claude/skills/kiro-postmortem-add/rules/taxonomy-reference.md R4 から。
     投入時点の工程判定は暫定でよい（分析時に項目 13/14 として確定する）。 -->
