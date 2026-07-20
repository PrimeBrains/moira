# Moira

[![CI](https://github.com/PrimeBrains/moira/actions/workflows/ci.yml/badge.svg)](https://github.com/PrimeBrains/moira/actions/workflows/ci.yml)

**Moira（モイラ）** — 仕様駆動（Spec-Driven）× チケット駆動（Ticket-Driven）× EVM を一つに統合するプロジェクト管理基盤。正典モデル（思想の確定）と、それを縦に貫く動く参照実装（backend / frontend / CLI）、そして正典を守るための検証機構までを一つに収めたリポジトリです。

> **一文定義** — プロジェクトとは、見積を持つノードの木とポリシー付きの辺で結ばれた DAG の上を流れる4種の追記専用イベント列であり、進捗・スケジュール・健全性はすべてその導出である。

**入口はこちら → [`moira/README.md`](./moira/README.md)**（Moira とは何か・インストール・使い方・磨き方）

## リポジトリ構成

| パス | 中身 |
|---|---|
| [`moira/`](./moira/) | ワークスペース本体 — 正典（[`MODEL.md`](./moira/MODEL.md)・[`PROPERTIES.md`](./moira/PROPERTIES.md)・[`DECISIONS-CATALOG.md`](./moira/DECISIONS-CATALOG.md)・[`DECISIONS.md`](./moira/DECISIONS.md)）と参照実装（[`backend/`](./moira/backend/)・[`frontend/`](./moira/frontend/)・[`cli/`](./moira/cli/)） |
| [`.kiro/scenarios/`](./.kiro/scenarios/) | 受け入れシナリオ正典（人間発案の When/Then — units / flows） |
| [`.kiro/steering/`](./.kiro/steering/) | プロジェクト規範（正典の守り方・検証方針・変更管理フロー） |
| [`.kiro/adr/`](./.kiro/adr/) | アーキテクチャ意思決定記録 |
| `.claude/` | 検証機構（変更ゲート・敵対的レビュー・整合チェックの skill / agent 群） |

## はじめる

```bash
git clone https://github.com/PrimeBrains/moira.git
```

セットアップ手順は [`moira/GETTING-STARTED.md`](./moira/GETTING-STARTED.md) を参照してください。

## 変更の出し方

正典・確定文書の更新はゲート経由です（入口は [`moira/README.md` の「moira への変更の出し方」](./moira/README.md#moira-への変更の出し方変更管理フローの入口)、規範は [`.kiro/steering/moira-change-management.md`](./.kiro/steering/moira-change-management.md)）。

## 来歴

本リポジトリは 2026-07-20 に [PrimeBrains/sdd-workshop](https://github.com/PrimeBrains/sdd-workshop) から git filter-repo により履歴ごと分離されました（sdd-workshop#42）。詳細と issue 番号の読み替えは [`moira/changes/issue-42/migration-record.md`](./moira/changes/issue-42/migration-record.md) を参照。文書中に残る sdd-workshop 前提の記述（clone 手順等）は [#5](https://github.com/PrimeBrains/moira/issues/5) で改稿予定です。
