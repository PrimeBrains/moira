# 分析済み索引

要因分析（[`.kiro/steering/moira-change-analysis.md`](../steering/moira-change-analysis.md)）で分析済みの
変更を 1 行ずつ載せる。**障害・非障害の両方**を載せる——横断集約の入口を 1 か所にするため
（障害の本体は `.kiro/postmortem/defects.md` 側にある）。

> **未分析キューはここに載せない**（保存せず毎回算出する。D-85・[README](README.md)）。

| キー | 障害判定 | 変更分類 | 対象システム | 変更範囲 | 分析日 | 状態 | entry |
|---|---|---|---|---|---|---|---|
| moira#9 | 非障害 | req-add | frontend | D, S, C, F | 2026-07-25 | ratified | [entries/moira-9.md](entries/moira-9.md) |

<!-- 列の意味は .claude/skills/moira-change-analysis/templates/index-row.template.md 参照。
     状態: drafted | ratified | aggregated -->
