---
status: working-ledger
issue: 19
---

# 閉包レポート — issue #19（変更管理の履歴からの要因分析機構）

date: 2026-07-25。base: `89252a8`（worktree 分岐点＝`origin/main`）。対象: `3aae775`（P5 開始時 HEAD）。
判定: **閉包 PASS（H5 承認待ち）**。

---

## 人間が読む 3 点（H5）

### ① 3 面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（`intent-ratification.md`） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R2 | D | 台帳の置き場と分担 | Q1: 障害／非障害で**別台帳**。ただし**前段に振り分け受付**を置き、判定と根拠を必ず記録。既存の障害フローも DFD 化して是正 | **D-82**『変更の振り返りは「障害か否か」を受付で振り分ける——台帳は分けるが、項目定義とものさしは共有する』（`agreed`） | Y |
| R2 | D | 履歴に無い項目の埋め方 | Q2: **AI 推論＋人間確認**（人間は 4 群のみ）。一次採取は**2 欄だけ**追加 | **D-83**『履歴にない項目は推論で埋めてよい——ただし出所を各欄に明示し、根拠のない欄は「わからない」と書く』（`agreed`） | Y |
| R2 | D | 欠陥検出を入口にする範囲 | Q5: **すり抜けギャップのあるものだけ**（検知すべき工程 ≠ 実際に検知した工程）。ラウンド内で決着した指摘は入口にしない | **D-84**『欠陥検出を振り返りの入口にするのは「すり抜けた」ものだけ——工程が設計どおり捕まえた指摘は入口にしない』（`agreed`） | Y |
| R2 | D | 起動トリガ | Q3: **未分析 10 件**でたまったら提案。AI は確認なしに起動しない | **D-85**『分析はためてから回す——AI は提案するが、確認なしに起動しない』（`agreed`） | Y |
| R2 | D | 既存フローの改訂範囲 | D-f/D-g: **配線の是正に限る**・思想は変えない・**過去の記録は書き換えない** | **D-86**『既存の振り返り機構は「死んだ配線」だけを直す——思想は変えず、過去の記録も書き換えない』（`agreed`） | Y |
| R2 | D | 分類語彙 | Q4: 既存 **M/D/P/S/C/V/F の 7 値**に統一。競合語彙を作らない | D-82 の「決めたこと」に明記（変更範囲は 7 値・タクソノミー正本は 1 ファイル） | Y |
| R2 | D | キーの名前空間 | D-e: repo 修飾で旧リポと衝突しない | **新判断を起こさず既存 D-80 の適用**として整理（D-80 の「本文は書き換えない」に従い遡及修飾しない） | Y |
| R12 | M | Moira 本体のモデル | 変わらないことの確認（プロセス側の道具であり製品の決まりごとに触れない） | `moira/MODEL.md` **diff 0** | Y |
| R13 | P | 不変条件 | 変わらない | `moira/PROPERTIES.md` **diff 0** | Y |
| R14 | S | 受け入れシナリオ | **新規シナリオは起こさない**（画面・CLI のふるまいが変わらない） | `.kiro/scenarios/` **diff 0**（HA 批准記録 ③ が証跡） | Y |

### ② できないことになったこと（平易な差分）

- **配布サンプル（todo-playground）の中にある古い振り返り道具は、今回直していません**——本体側で消した
  「捨てたはずの初期データを復活させる手順」が、サンプルの中では生きたままです。サンプルは別プロジェクト向けの
  配布物で、本体と同期する方針かどうかがまだ決まっていないため、**[#20](https://github.com/PrimeBrains/moira/issues/20) として追跡**します
  （openness 機械照合: `gh issue view 20 --json state` → **`OPEN`**・2026-07-25 実行）。

そのほかに「できないことになったこと」はありません（deferred はこの 1 件のみ）。

**あわせて開示（実走 1 本の限界）**: 初回実走は**非障害の 1 件**（`moira#9`）のみで、
**障害側の経路（`/kiro-postmortem-add` への委譲）と横断集約（`reviews/`）は未実走**です。
台帳を持たない軽量 exit の issue も未実証で、そこでは `unknown` が増える見込みです。

### ③ 閉包判定

**PASS**（影響マップ全 20 行が resolved・deferred 0・**未マップ差分 ∅**・`doc-refine` ゲート PASS）。

---

## 機械決着の詳細（H5 で読む義務なし）

<details>
<summary>影響マップ 20 行の 3 値判定と証跡</summary>

| 行 ID | 波及先 | クラス | 状態 | 証跡 |
|---|---|---|---|---|
| R1 | `moira/plans/2026-07-25-change-analysis-dfd.md` | F | resolved | HA で **DFD v3 を人間承認**（2026-07-25）＋`doc-refine` ラウンド 3 **PASS**。v4 は指摘反映（設計変更なし） |
| R2 | `moira/DECISIONS-CATALOG.md` D-82〜D-86 | D | resolved | `doc-refine` ラウンド 3 PASS（独立採点者: 意図整合 ALIGNED・fork 被覆 OK）→ auto-agreed 経路で **`agreed`** |
| R3 / R20 | `.kiro/steering/moira-change-analysis.md` | F | resolved | 同ゲート PASS。規範として確定（A0 判定基準・入口フィルタ・16 項目・出所ラベル・トリガ・正直枠） |
| R4 | `.claude/skills/moira-change-analysis/` | F | resolved | 同ゲート PASS（SKILL.md／SKILL.ja.md／templates 3 本・`metadata.origin: custom`） |
| R5 | `.kiro/analysis/` | F | resolved | 同ゲート PASS（README・INDEX〔すり抜け検出ログを含む〕・entries/） |
| R6 | `.kiro/steering/moira-change-management.md` | F | resolved | P6 行に一次採取 2 欄＋末尾に接続節。同ゲート PASS |
| R7 | `moira/changes/README.md`＋`moira-change/templates/` | F | resolved | closure-report テンプレに採取 2 欄・様式表を追随。同ゲート PASS |
| R8 / R17 | `.claude/skills/kiro-postmortem-add/` | F | resolved | 死んだ配線 4 種を除去（`.kiro/specs` 依存 3・seed 自動投入・存在しない spec への同期義務・旧パス例）。`.kiro/specs` 参照 grep = 改訂記録のみ |
| R18 | `.claude/skills/kiro-postmortem-review/` | F | resolved | 両台帳集約・2 スキーマ受理・トリガ差し替え・`allowed-tools` 補完。同ゲート PASS |
| R19 | `.kiro/postmortem/defects.md` | F | resolved | ヘッダのみ改訂。**entry #0001 は byte 単位で不変**（`## Entries` 以降の sha256 = `d054aae…`・base と一致） |
| R9 | `.kiro/steering/structure.md` | F | resolved | `.kiro/postmortem/`・`.kiro/analysis/` の 2 行を追加 |
| R10 | `CLAUDE.md`・`.kiro/steering/moira-model.md` | F | resolved | 所有関係を 1 行索引（規範＋skill＋台帳＋「ゲートではない」） |
| R11 | `.kiro/steering/moira-verification.md` | F | resolved | 「変更時のゲート対応」に**計器ではない**ことを明記 |
| R12 | `moira/MODEL.md` | M | resolved | **変更なし照合**: diff 0（語彙衝突なし——本機構はプロセス側） |
| R13 | `moira/PROPERTIES.md` | P | resolved | **変更なし照合**: diff 0 |
| R14 | `.kiro/scenarios/`・`moira/frontend/e2e/specs/` | S | resolved | **変更なし照合**: diff 0＋HA 批准記録 ③ |
| R15 | `moira/backend/`・`moira/cli/`・`moira/frontend/` | C | resolved | **変更なし照合**: diff 0（抽出は表記ゆれのため regex 不可＝AI の意味読解。列挙は `gh`/`git`/`ls` で足りる） |
| R16 | 実走 1 本（`.kiro/analysis/entries/moira-9.md`） | F | resolved | 16 項目を出所ラベル付きで記入（`derived` 5・`inferred` 11・`captured` 0・`unknown` 0）。**新機構の出力を本 issue の閉包判定の証跡には使っていない**（自己検証禁止） |

</details>

<details>
<summary>未マップ差分検査</summary>

- base: `89252a8`（worktree 分岐点＝`origin/main`）／対象: `3aae775`（P5 開始時 HEAD・照合中の移動なし）
- changed: **34 パス**（`git diff --name-only 89252a8..HEAD`・rename 検出なし）
- mapped: 影響マップ R1〜R20 のパス集合（ディレクトリ行は末尾 `/` の前方一致で配下を被覆）
- **changed − mapped = ∅**（`moira/changes/**` は台帳自身のため規約どおり自己除外）

</details>

<details>
<summary>ゲート往復（doc-refine・3 ラウンド）</summary>

| ラウンド | 敵対レビュー | 事実検証 | 独立採点 |
|---|---|---|---|
| 1 | Critical 7・Important 13・Minor 4 | CORRECTED 6・CONFIRMED 多数 | **FAIL** |
| 2 | （修正検証） | — | **FAIL**（F1・F7 の未執行＋Important disposition 記録の不在） |
| 3 | （修正検証） | — | **PASS**（`SURVIVING_CRITICAL_OR_IMPORTANT: NONE`・意図整合 ALIGNED・fork 被覆 OK・`AWAITING_HB: NONE`） |

全指摘の disposition は `gate-round-records.md`。FORK 2 件は事実／批准済み意図で決着し **HB 発生なし**（`fork-batch.md`）。
**本環境は codex 非在**のため、外部ベンダーレビューの代替として独立 subagent を用いた（#16 と同型・正直開示）。

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

```
$ gh issue view 20 --repo PrimeBrains/moira --json number,state,title
{"number":20,"state":"OPEN","title":"todo-playground サンプルに旧版 postmortem skill 一式が残存（#19 で是正した死んだ配線を含む）"}
```

（影響マップの**行**としての deferred は 0。上記は `gate-round-records.md` の「追跡付き deferred」1 件——
独立採点者は本件を **Minor** と判定し、PASS の阻却事由にしていない。）

</details>

<details>
<summary>採点者が「PASS の根拠にしていない」と明示した 2 点（＝人間が担う確認）</summary>

1. **entry #0001 の byte 不変**——採点者は Bash 非所持のため sha256 を検証していない。**著者による機械確認**の結果は
   `d054aaedcce1674ac058c92c8fe3fb348286650f7e1ce40b96422c96a043dd3a`（base と HEAD で一致）。
2. **issue #20 の open 状態**——採点者は GitHub を照会できない。上記の生出力が証跡。

</details>

---

## 要因分析の一次採取（2 欄・P6 で記録）

本 issue 自身への自己適用（規範 `.kiro/steering/moira-change-analysis.md` §7）。

- **障害判定**: **非障害** — 根拠: 仕組みの新設（要求どおりの新機能）であり、意図した仕様から外れた状態が
  実在したわけではない。※ただし本フローの実行中に**既存機構の欠陥 8 件**（`.kiro/specs` 不在に依存した
  死んだ配線等）を発見し是正した——これらは**別事象**であり、要因分析の母集団では
  「クローズ済み変更のすり抜けが後から発覚した」型として扱える。
- **変更分類**: `process-improve`（開発プロセス側の仕組み改善。あわせて `bugfix` 成分＝既存機構の死んだ配線の是正を含む）

> **分析時の申し送り（自己帰責）**: `gate-round-records.md` 末尾に記録したとおり、
> **著者の「全部直した」という自己申告が 3 ラウンド連続で現物と食い違った**。仕組み帰責は
> 「`doc-refine` の往復に**修正後の残存 0 を著者が grep で示す証跡義務がない**」こと。
> 本 issue がキューに載った後の分析で `process / doc-refine` として扱う。
