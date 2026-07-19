---
status: working-ledger
issue: 42
---

> **非正典宣言**: 本ファイルは[`moira/changes/README.md`](../README.md)の規約に従う**作業台帳（非正典）**
> であり、ここに書かれた内容は根拠として引用しない。正典と食い違えば、常に正典
> （MODEL・agreed シナリオ・agreed Decisions・PROPERTIES・steering）が勝つ。

# リポジトリ移管記録 — issue #42

## 概要

2026-07-20、`PrimeBrains/sdd-workshop` から `PrimeBrains/moira` へ、`git filter-repo` により
Moira 関連パス一式を**履歴ごと**移管した（[sdd-workshop#42](https://github.com/PrimeBrains/sdd-workshop/issues/42)）。

- **抽出ベースコミット**（sdd-workshop 側）: `084edebbd668e53cd666bf979a344b0d12221677`
- **移管コミット数**: 142
- **移管ファイル数**: 522

## 抽出対象パス一覧

- `moira/`
- `.kiro/scenarios/`
- `.kiro/adr/`
- `.kiro/postmortem/`
- `.kiro/steering/`（全 14 件: `adr.md` / `moira-change-management.md` / `moira-model.md` /
  `moira-naming.md` / `moira-verification.md` / `product.md` / `requirements-style.md` /
  `roadmap.md` / `spec-conversations.md` / `spec-deliverables.md` / `structure.md` / `tech.md` /
  `testing-conventions.md` / `trace-notation.md`）
- moira 系／ゲート系／postmortem 系スキル 11 件（`.claude/skills/`）: `decision-conformance` /
  `doc-refine` / `kiro-postmortem-add` / `kiro-postmortem-review` / `kiro-scenario` /
  `kiro-scenario-e2e` / `kiro-scenario-flow` / `moira-adapter-gen` / `moira-change` /
  `moira-evm-digest` / `moira-model-update`
- エージェント定義 8 体（`.claude/agents/`）: `decision-conformance-checker.md` /
  `doc-adversary.md` / `doc-fact-checker.md` / `doc-gate-judge.md` / `e2e-scenario-checker.md` /
  `moira-adversary.md` / `moira-fact-checker.md` / `moira-gate-judge.md`
- `.github/workflows/ci.yml`
- `.gitignore`

## 持ってこなかったもの

- `.kiro/specs/moira-*`（requirements/design/tasks のアーカイブ）—
  R/D/T は使い捨ての再生成物であり正典を持たないため（sdd-workshop#40 裁定。
  [`.kiro/steering/moira-verification.md`](../../../.kiro/steering/moira-verification.md)
  「R/D/T は使い捨ての再生成物」節）、移管せず旧リポ（`PrimeBrains/sdd-workshop`）側に残置した。
- sdd-workshop 固有の機構（Moira と無関係な cc-sdd 標準スキル以外のワークショップ運営資産・
  atelier/ 系コンテンツ制作機構・sdd-dashboard／spec-model 等の宿主固有ツール等）。

## issue 読み替え表

移管前文書中の `#N` 表記は、移管に際して機械置換を行わない（来歴主義）。文中の issue 番号は
すべて **`PrimeBrains/sdd-workshop#N` を指す**ものとして読む。以下は本リポで新たに起票された
issue との対応表（参考情報。文書内の `#N` を書き換える根拠にはしない）:

| sdd-workshop 側 | 本リポ（moira）側 |
|---|---|
| #41 | #1 |
| #38 | #2 |
| #19 | #3 |
| #15 | #4 |

**重要**: 上記対応表は移管記録としての参考情報にとどまる。本リポに残る移管前文書（`moira/`・
`.kiro/` 配下の既存ファイル）中の `#N` は、この表を使って読み替えて理解してよいが、**本文自体は
書き換えない**——リポジトリ移管という事実そのものが来歴であり、当時のコミット時点の意味を保持する
ことを優先する。

## 後続作業

自立化（sdd-workshop への依存記述の解消・本リポ単体で完結する文書への改稿）は、本リポの
issue #5 にて `moira-change` フロー経由で実施予定。
