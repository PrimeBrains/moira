<!--
  `.kiro/analysis/INDEX.md` の 1 行（分析済みキーの索引）テンプレート。
  規範: .kiro/steering/moira-change-analysis.md §9（保存先）。
  未分析キューは **保存しない**（毎回算出）——本 INDEX に「未分析」行を作らないこと。
-->

| {{REPO}}#{{NUMBER}} | {{障害|非障害}} | {{変更分類}} | {{対象システム}} | {{変更範囲}} | {{YYYY-MM-DD}} | {{status}} | {{台帳へのリンク}} |

<!--
  列の意味（INDEX.md のヘッダと対応）:
  | キー | 障害判定 | 変更分類 | 対象システム | 変更範囲 | 分析日 | 状態 | entry |

  - キー: repo 修飾（`moira#16`）。無修飾の `#N` を書かない（steering §8・D-80 の適用）
  - 状態: drafted | ratified | aggregated
  - entry: 非障害は `entries/<repo>-<番号>.md`、障害は `.kiro/postmortem/defects.md#<Entry ID>`
    （障害も INDEX に 1 行載せる——横断集約の入口を 1 か所にするため。本体は postmortem 側）
-->
