---
status: working-ledger
issue: 5
---

# 変更要求票 — issue #5

## 入口種別

issue直

原文: https://github.com/PrimeBrains/moira/issues/5

## 明確化した変更要求文

sdd-workshop#42 の filter-repo 移管により本リポジトリ（`PrimeBrains/moira`）が独立した後も、
確定文書群に旧リポ（`PrimeBrains/sdd-workshop`）チェックアウト前提の記述と旧リポ直リンクが
残存している。以下 7 項目を確定文書として改稿し、本リポ単体で読者が完結する状態にする。

1. **セットアップ手順の全面改稿** — `moira/GETTING-STARTED.md` §2「インストール」／
   `moira/README.md` の Quick Start / npm link セクション／`moira/cli/README.md` 冒頭の
   「CLI 本体は sdd-workshop に残る」節を、本リポ (`PrimeBrains/moira`) チェックアウト前提へ
   全面改稿する（`git clone https://github.com/PrimeBrains/moira.git` に張り替え、
   ディレクトリ名 `sdd-workshop` を `moira` に、以後のビルド手順もリポジトリルート基準に修正）。

2. **ADR-0001 の前提改訂** — `.kiro/adr/0001-moira-cli-write-path.md` 中の「CLI 本体は
   sdd-workshop チェックアウトに残る」記述は移管後の現実と矛盾する。ADR の来歴主義に配慮して
   本文を機械置換するのではなく、当該記述に**来歴注記**（「本 ADR 起草時は sdd-workshop
   チェックアウト前提だったが、issue #42 移管後は本リポチェックアウト前提へ読み替える」）を
   付す方針で解消する。

3. **moira-track 配布テンプレートの正本 URL 張り替え**（優先度高）—
   `moira/cli/templates/claude/skills/moira-track/SKILL.md` /
   `moira/cli/templates/claude/skills/moira-track/reference.md` /
   `moira/cli/templates/claude/skills/moira-track/provider-reference.cc-sdd.md` /
   `moira/cli/templates/kiro/steering/moira-track.md` /
   `moira/cli/templates/claude/hooks/moira-fire.mjs` / `moira-guard.mjs` 中の
   `github.com/PrimeBrains/sdd-workshop/blob/main/…` 直リンクおよび
   「正本は sdd-workshop moira/cli/templates/」文言を、本リポ URL・本リポパスへ張り替える。
   これらは `moira adapter install` により他プロジェクトへ配布されるため優先。
   `examples/todo-playground/` 配下の配布コピー（`.claude/skills/moira-track/*` /
   `.claude/hooks/moira-*.mjs` / `.kiro/steering/moira-track.md`）は
   `moira adapter install` の再実行で再生成されるため、canonical テンプレート修正後に
   再インストールで同期する（`examples/todo-playground/` の配布コピーは managed file
   であり手編集しない）。

4. **プロトタイプ参照の来歴注記化** — `moira/PROTOTYPE-EVALUATION.md` の表内
   sdd-dashboard / evm-studio エントリ（パス `sdd-workshop/sdd-dashboard/` /
   `sdd-workshop/evm-studio/`）に、実体は旧リポ残留である旨の来歴注記を付す。
   `moira/UI-DESIGN-BRIEF.md` にも同種の参照があれば同じ扱いとする（要調査）。

5. **steering の追随** — `.kiro/steering/structure.md`（現状は sdd-workshop 名指しなし。
   ただし `moira/` 直下の記述が現況の全体像〔backend / frontend / cli / examples 等〕を
   映しているか、および `.kiro/specs/moira-*` 参照の扱いを裁定）／
   `.kiro/steering/testing-conventions.md`（現状は sdd-workshop 名指しなし。汎用ルールと
   Moira 固有事例の整理が必要か裁定）に、必要な追随のみ最小限で反映。
   `decision-conformance` が参照する `.kiro/specs/` については、R/D/T アーカイブは
   sdd-workshop#40 裁定で旧リポ残置——参照の扱いを明示裁定する。

6. **旧 issue 番号の読み替え方針の正典化** — 本リポに残る移管前文書中の `#N` 表記は
   `PrimeBrains/sdd-workshop#N` を指す（移管記録
   [`moira/changes/issue-42/migration-record.md`](../issue-42/migration-record.md) の
   「issue 読み替え表」節が事実上の政策）。しかし当該記録は非正典（working-ledger）であるため、
   確定文書のどこかに**読み替え方針**を canonical に配置し、既存 `#N` 表現の機械置換は行わない
   ことを明示する（配置先の裁定は HA へ——候補は `moira/README.md` 冒頭ノート／新規
   `moira/HISTORICAL-REFERENCES.md`／`.kiro/steering/moira-verification.md` の追記のいずれか）。

7. **kiro-issue スキルの moira 適応版** — 現状 `.claude/skills/kiro-issue/` はリポジトリ
   ルートに存在せず、`moira/examples/todo-playground/.claude/skills/kiro-issue/` にのみ
   存在（`REPO = PrimeBrains/sdd-workshop`・`PROJECT = pj-sdd-workshop` ハードコード）。
   playground demo の位置づけを維持するなら、本リポ用に REPO/Project を書き換える
   （Projects V2 連携は必要になった時点で再構築＝当面は Project 紐付けを omit）か、
   demo skill 自体を削除してデモの起票フローを別手段へ差し替えるかを裁定する。

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL の公理・制約・語彙・既定・イベント意味論には触れない。moira-model-update 所有物（NAMING / 命名文書 / 同スキル自身 / moira 系 agent 定義）にも触れない |
| D（設計判断級） | 候補 | 項目 6（読み替え方針の正典配置先）は、MODEL が沈黙する 0→1 の構造判断（どの確定文書で所有するか）に相当しうる。既存 MODEL 条項との積極的矛盾はないため、境界不明瞭の既定ルート＝D 起票候補（HA で境界裁定） |
| P（プロパティ級） | N | 不変条件の新設・改訂なし |
| S（シナリオ級） | N | 観測ふるまいの変更なし |
| C（コード級） | N | 実装コードには触れない。項目 7 の kiro-issue skill は skill 定義（F 級）扱い |
| V（検証基盤級） | N | 検知器（CI/dependency-cruiser/coverage-check 等）に触れない |
| F（一般確定文書級） | Y | **主クラス**。項目 1〜5・7 はいずれも一般確定文書（README・GETTING-STARTED・ADR・steering・配布テンプレート・skill 定義）の改稿——doc-refine で決着 |

**注記**: 主クラス F・従クラス D（項目 6）候補。境界の最終裁定は HA（P3）で行う。
項目 4 の UI-DESIGN-BRIEF.md 参照有無は P2 影響調査で機械確認する。

## triage 判定

判定: フル工程

理由: 対象文書が 10 件以上に及び、うち複数は他プロジェクトへ配布される moira-track テンプレート
（誤ったリンクが伝播する）。項目 6 の読み替え方針は「非正典→正典」の政策昇格を含み、
項目 7 は kiro-issue skill の存廃裁定を含むため、軽量ルート（issue コメント一言で通常作業へ
送り出し）では捌けない。

## base commit

8eb1b6f975f98b79612afecaa47873a5cec1dc83
