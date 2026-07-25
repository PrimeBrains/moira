# 分析済み索引

要因分析（[`.kiro/steering/moira-change-analysis.md`](../steering/moira-change-analysis.md)）で分析済みの
変更を 1 行ずつ載せる。**障害・非障害の両方**を載せる——横断集約の入口を 1 か所にするため
（障害の本体は `.kiro/postmortem/defects.md` 側にあり、**この索引行は `moira-change-analysis` が書く**）。

> **未分析キューはここに載せない**（保存せず毎回算出する。D-85・[README](README.md)）。

| キー | 障害判定 | 変更分類 | 対象システム | 変更範囲 | 分析日 | 状態 | entry |
|---|---|---|---|---|---|---|---|
| moira#1 | 非障害 | process-improve | process, backend | D, F, V, C | 2026-07-25 | aggregated | [entries/moira-1.md](entries/moira-1.md) |
| moira#2 | 非障害 | req-change | process | M, P, S, C | 2026-07-25 | aggregated | [entries/moira-2.md](entries/moira-2.md) |
| moira#5 | 障害 | bugfix | process, adapter | D, F | 2026-07-25 | reviewed | [postmortem #0002](../postmortem/defects.md) |
| moira#6 | 非障害 | req-add | backend, cli, frontend, process | C, P, F, S | 2026-07-25 | aggregated | [entries/moira-6.md](entries/moira-6.md) |
| moira#7 | 非障害 | doc-only | process | S | 2026-07-25 | aggregated | [entries/moira-7.md](entries/moira-7.md) |
| moira#8 | 障害 | bugfix | process | S | 2026-07-25 | reviewed | [postmortem #0003](../postmortem/defects.md) |
| moira#9 | 非障害 | req-add | frontend, process | D, S, C | 2026-07-25 | aggregated | [entries/moira-9.md](entries/moira-9.md) |
| moira#10 | 非障害 | process-improve | process | F | 2026-07-25 | aggregated | [entries/moira-10.md](entries/moira-10.md) |
| moira#11 | 障害 | req-add | process, cli, backend | M, D, P, C | 2026-07-25 | reviewed | [postmortem #0004](../postmortem/defects.md) |
| moira#13 | 障害 | bugfix | cli | C | 2026-07-25 | reviewed | [postmortem #0005](../postmortem/defects.md) |
| moira#15 | 障害 | bugfix | backend, cli, process | C, M, D, P, S | 2026-07-25 | reviewed | [postmortem #0006](../postmortem/defects.md) |
| moira#16 | 障害 | bugfix | backend, cli, process | C, M, D, P, S | 2026-07-25 | reviewed | [postmortem #0007](../postmortem/defects.md) |
| moira#17 | 障害 | bugfix | backend, cli, process | C, M, D, P, S | 2026-07-25 | reviewed | [postmortem #0008](../postmortem/defects.md) |
| moira#19 | 非障害 | process-improve | process | F, D（M/P/S/C は差分ゼロ照合行） | 2026-07-25 | aggregated | [entries/moira-19.md](entries/moira-19.md) |

> **本表 14 行の出自**: issue #21（クローズ済み 13 本の初回バックフィル）＋ 先行分析済みの `moira#9`。
> 母集団は `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 時点）の CLOSED 14 本と一致し、
> **未分析キューは 0**（OPEN の #3 / #4 / #20 / #21 はクローズしていないため母集団外）。

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
