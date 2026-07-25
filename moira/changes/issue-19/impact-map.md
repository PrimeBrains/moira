---
status: working-ledger
issue: 19
---

# 影響マップ — issue #19

> 非正典（`moira/changes/README.md`）。append-only——行の削除禁止。

## 前提調査（P2 の一次観測。設計選択の根拠）

### 観測 A: 16 項目の導出可能性（既存履歴の実地監査）　※本数の訂正は末尾「P2 訂正記録」参照（正: 13 本）

対象: `moira/changes/issue-{1,2,5,6,7,8,9,10,11,13,15,16,17,43}/`（＋旧リポ由来 3 本は下記 観測 C）と
対応する GitHub issue。各項目が既存の入力から**どこまで機械的・意味的に取り出せるか**を判定した。

| # | 項目 | 導出区分 | 根拠（実地観測） |
|---|---|---|---|
| 1 | 対象システム（backend/frontend/cli/adapter） | **導出可** | 影響マップの「波及先成果物（パス）」列から直接写像できる（例 #16: `moira/backend/`・`moira/cli/`）。ただし**プロセス側変更**（steering・skill・文書）が実在し〔#1/#5/#10/#43/本 #19〕、4 値では表せない——**`process` を足す**（正本 R13 は `other` を含む 6 ラベル。※訂正記録参照） |
| 2 | 事象（Given/When/Then・期待値/実際値） | **一部導出可＋AI 要約** | `request.md`「明確化した変更要求文」に症状・期待が散文である（例 #16「素の writeFileSync が torn write を許す」）。Given/When/Then の三段形と「期待値/実際値」の分離は**既存台帳にない形**——AI が散文から再構成する |
| 3 | 障害判定（障害／非障害） | **不在→AI 推論＋人間確認** | 既存台帳に該当欄なし。#16（潜在バグ）と #9（機能追加）は判定が割れるが、**判定を記録した場所がどこにもない** |
| 4 | 変更分類（要件変更/追加/リファクタ/バグFIX/テスト追加/運用変更/仕組み改善） | **不在→AI 推論** | 同上。`triage 理由` と要求文から推論可能だが、ラベル体系そのものが未定義（タクソノミー新設が要る） |
| 5 | 変更範囲（S/P/D/C） | **導出可** | 影響マップの「クラス」列（M/D/P/S/C/V/F）から直接。ただし issue 逐語の 4 値は既存 7 値の**部分集合**——語彙統一の裁定が要る（HA ②） |
| 6 | 発生原因サマリ（平易） | **AI 生成** | 平易文への翻訳は既存台帳の人間断面ビューと同型の作業。素材はある |
| 7 | 発生原因詳細（技術者向け） | **一部導出可** | `request.md`・`closure-report.md` 機械決着詳細に技術記述あり（例 #16 R1〜R6 の証跡列） |
| 8 | 根本要因（**特に SKILL・steering など仕組み上の問題**） | **不在→AI 推論が主。最重要かつ最も弱い** | 既存台帳は「何を直したか」を書くが「なぜその欠陥が仕込まれ・なぜ仕組みが防げなかったか」を書く欄を持たない。`fork-batch.md`／`gate-round-records.md` に敵対ラウンドの指摘は残るが、仕組み帰責の記述ではない |
| 9 | 同件調査対象 | **導出可（範囲指定として）** | 既存 issue 群＋既存 postmortem entries が母集団。範囲の明示は機構側で定義できる |
| 10 | 同件調査結果（有無） | **AI 検索** | 台帳の見出し構造は概ね揃うが**表記ゆれが実在**（例「人間が読む3点」/「人間が読む 3 点」、「① 3面最終文…」/「① 3 面の最終文…」）——**regex 抽出は不可、意味検索が要る**（DFD の設計制約） |
| 11 | 同件の対応状況（別 issue リンク） | **導出可** | closure-report の deferred 追跡 issue・派生 issue（例 #16→#17、#15→#16/#17）が実在し、リンクが記録されている |
| 12 | 再発防止策 | **不在→AI 生成＋人間批准** | 既存台帳に該当欄なし。postmortem の「次回からの対応策」と同型 |
| 13 | 検知すべき工程 | **不在→AI 推論。かつタクソノミー不足** | postmortem の検知工程タクソノミー（`code-review`/`unit-test`/`integration-test`/`e2e`/`manual-verification`/`production`/`user-report`）は **V モデル前提**で、本リポの実工程（P1 triage・P2 影響調査・HA・各ゲートの敵対ラウンド・独立採点・P5 閉包・codex レビュー・CI）を表す語がない——**工程軸の拡張が要る** |
| 14 | 実際に検知した工程 | **一部導出可** | `gate-round-records.md` は「どのラウンドで誰が何を指摘したか」を持つ（例 #16「M 面＝round2 で 1 Important」）——検知点の一次証跡として使える。ただし全 issue には存在しない（※訂正: 本リポ 13 本中 **8 本**。末尾「P2 訂正記録」） |
| 15 | なぜ然るべき工程で検知できなかったか | **不在→AI 推論** | 同上 |
| 16 | 検知するための対策 | **不在→AI 生成＋人間批准** | 同上 |

**要約（三分割）**: 導出可＝5 項目（1・5・9・11＋条件付き 14）／一部導出可＋AI 再構成＝4 項目（2・6・7・10）／
**既存入力に存在しない＝7 項目**（3・4・8・12・13・15・16）。
→ **「履歴から自動で全項目が埋まる」機構は成立しない。** 設計は (a) 導出、(b) AI 推論＋人間確認、
(c) フロー実行時の新規採取、の**三系統の明示的な混成**でなければならない（正直枠）。

### 観測 B: 既存 postmortem 機構との関係

`.kiro/postmortem/defects.md`（10 項目・entry 1 本のみ・`/kiro-postmortem-add`／`/kiro-postmortem-review`）は
**不具合 ledger** であり、空項目があれば append を拒否する。本 issue の 16 項目はその 10 項目の**近い上位集合**だが、
項目 3「障害判定（**非障害**を含む）」と項目 4「変更分類（要件追加・リファクタリング・テスト追加…）」の存在により、
**対象母集団が「不具合」から「全変更」へ広がる**——これは defects.md の定義（不具合 1 件ごと）とは両立しない。
一方、4 軸タクソノミー（要因分類・検知工程・発生機能・根本要因分類）は**そのまま再利用価値がある**。
→ 境界裁定の論点（HA ②）: 拡張か・独立機構か・タクソノミー共有か。

### 観測 C: issue 番号の名前空間（旧リポ由来）

`moira/changes/issue-39/42/43` のうち **#39・#42 は旧リポ `PrimeBrains/sdd-workshop` の issue 番号**
（#42 は移管記録そのもの、#39 はフロー受け入れテスト。本リポの #39/#42 とは別物）。
→ 分析台帳のキーは **repo 修飾**（`moira#16` / `sdd-workshop#39`）が要る。無修飾だと番号衝突で
同件調査・リンクが黙って誤対応する。

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | `moira/plans/2026-07-25-change-analysis-dfd.md`（新規） | F | issue 本文の順序拘束「まず DFD をつくって承認を得てから実装」。先例 `moira/plans/2026-07-19-change-management-dfd.md`（変更管理 DFD の来歴文書）と同型 | HA（承認）＋`doc-refine`（確定） | 工程・データ・保管庫・人間タッチポイントを持つ DFD が人間承認を経て確定し、裁定記録を保持する | HA 批准記録＋doc-refine ゲート PASS（doc-gate-judge） | 未了 | — |
| R2 | `moira/DECISIONS-CATALOG.md`（新規判断 D-82 以降） | D | MODEL が本論点に沈黙（プロセス機構は Moira 製品の公理・語彙の外）＝steering §3 の「拡張」。0→1 の構造判断: 分析台帳の置き場・所有権／postmortem との境界と依存方向／導出不能項目の扱い／起動トリガの所在／issue キーの名前空間 | `doc-refine`（D 級・(a) 責任・帰結面ゆえ HA 意図批准つき） | 各判断が `proposed` → `agreed` になり、判定文が falsifiable | doc-refine ゲート PASS＋HA 意図批准との整合検査 | 未了 | — |
| R3 | `.kiro/steering/moira-change-analysis.md`（新規・規範）※名称は R1 で確定 | F | 変更管理フローの先例（規範＝steering／振り付け＝skill の分離。steering §7）に倣う。要否自体が R2 の判断対象 | `doc-refine` | 機構の規範（工程の in/out・項目定義・タクソノミー・トリガ・正直枠）が確定文書として存在する。**または R2 で「skill 単独所有」と裁定された場合は本行を「不要」で resolved** | doc-refine ゲート PASS | 未了 | — |
| R4 | `.claude/skills/{新 skill}/SKILL.md`・`SKILL.ja.md`・`templates/` | F | 実装形態＝skill（`moira-change`・`kiro-postmortem-*` と同型）。`metadata.origin: "custom"` 必須（CLAUDE.md「Skills Structure」） | `doc-refine` | 起動語・手順・出力様式・テンプレートが揃い、規範を複製せず参照する | doc-refine ゲート PASS | 未了 | — |
| R5 | 分析結果台帳の置き場＋その README（例 `.kiro/analysis/`）※パスは R2 で確定 | F | 16 項目の成果物の永続化先。`moira/changes/`（非正典・issue 単位）と `.kiro/postmortem/`（不具合 ledger）のいずれとも別物になりうる | `doc-refine` | 台帳の様式・正典性の位置づけ・キー規約（repo 修飾）が宣言され、雛形が存在する | doc-refine ゲート PASS | 未了 | — |
| R6 | `.kiro/steering/moira-change-management.md` | F | 観測 A の 7 項目が既存入力に不在。**フロー実行時に新規採取する**と裁定された場合、本 ratified 文書（§2 の工程 in/out・§7 台帳一式）の改訂が要る。同文書は「本文書自体の以後の改訂は本フローを通す」と自ら宣言——本フロー内なら規律適合 | `doc-refine` | 採取項目の追加が §2/§7 に反映される。**または「新規採取はしない（AI 推論＋人間確認で賄う）」と裁定された場合は「変更なし」照合で resolved** | doc-refine ゲート PASS／変更なし照合（diff 0） | 未了 | — |
| R7 | `moira/changes/README.md`＋`.claude/skills/moira-change/templates/*.md` | F | R6 と連動。採取項目を台帳様式（closure-report 等）に足すなら、テンプレートと台帳 README の様式表が追随する | `doc-refine` | 様式追加が反映される。または「変更なし」照合 | doc-refine ゲート PASS／変更なし照合 | 未了 | — |
| R8 | `.kiro/postmortem/defects.md`＋`.claude/skills/kiro-postmortem-add/`＋`kiro-postmortem-review/` | F | 観測 B の境界。相互参照（新機構→postmortem への昇格辺／タクソノミー single source of truth の所在）を明示しないと、2 つの要因分析機構が黙って併存し重複・食い違いを生む | `doc-refine` | 境界と依存方向が両側の文書に明記される（片側だけの宣言にしない）。または「変更なし」照合 | doc-refine ゲート PASS／変更なし照合 | 未了 | — |
| R9 | `.kiro/steering/structure.md` | F | 新ディレクトリ（R5）を作るならディレクトリ表に行が要る（現に `moira/changes/` の行が存在する） | `doc-refine` | 新ディレクトリが表に載る。または「変更なし」照合 | doc-refine ゲート PASS／変更なし照合 | 未了 | — |
| R10 | `CLAUDE.md`（本リポ節）・`.kiro/steering/moira-model.md` | F | CLAUDE.md は「どのゲートを使うかの対応関係は moira-model.md が所有」「変更管理フローは steering＋skill が所有」と所有関係を索引している。新機構の所有関係が索引されないと発見不能になる | `doc-refine` | 新機構の所有関係が 1 行で索引される。または「変更なし」照合 | doc-refine ゲート PASS／変更なし照合 | 未了 | — |
| R11 | `.kiro/steering/moira-verification.md` | F | §「変更時のゲート対応」表と計器構成の索引。新機構が計器群に**含まれない**（事後分析であって検証器ではない）ことの明示が要るか判断する | `doc-refine` | 位置づけが明記される。または「変更なし」照合 | doc-refine ゲート PASS／変更なし照合 | 未了 | — |
| R12 | `moira/MODEL.md` | M | 本機構はプロセス側であり Moira 製品の公理・制約・語彙・既定・イベント意味論に触れない見込み——**触れないことを照合で確認**する（黙って落とさない） | 変更なし照合（`moira-model-update` 起動は不要と判定した場合） | MODEL の diff が 0 であり、本機構が MODEL の語彙と衝突しない | 変更なし照合（diff 0＋語彙衝突の意味突合） | 未了 | — |
| R13 | `moira/PROPERTIES.md` | P | 不変条件の新設・改訂は見込みなし（#15 R8・#16 R9 と同型の「変更なし照合」） | 変更なし照合 | diff 0 | 変更なし照合 | 未了 | — |
| R14 | `.kiro/scenarios/units/`・`.kiro/scenarios/flows/`・`moira/frontend/e2e/specs/` | S | 本機構は Moira 製品の観測ふるまいではない（プロセス機構）ため S 級新規は起こさない見込み——#16 R10 と同型 | 変更なし照合（HA 裁定が証跡） | 新規 unit/spec なし・既存 unit への影響なし | HA 批准記録＋diff 0 | 未了 | — |
| R15 | `moira/backend/`・`moira/cli/`・`moira/frontend/` | C | 実装形態が「skill＋台帳」で閉じるならコード変更なし。集計・列挙を CLI で持つ設計（`moira report` 同型）を採るなら C 級が発生する——R2 で確定 | `/kiro-impl`＋CI（C 発生時のみ） | コード変更なし（＝diff 0）で resolved、または実装＋テスト green | 変更なし照合／CI＋独立レビュー | 未了 | — |
| R16 | 新機構の**実走 1 本**（ドッグフーディング。出力先は R5） | F | 観測 A の三分割（導出可／AI 推論／新規採取）が机上の主張に留まらないことの実証。#39 の受け入れテスト（ドライラン主体＋実走 1 本）と同型の正直枠 | 新機構自身を 1 件に適用（**ゲートではない**——本フローの検証器として使わない） | 直近クローズ issue 1 件について 16 項目が埋まり、**埋められなかった項目は「埋まらなかった」と記録される**（空欄の捏造をしない） | 生成物の目視＋doc-refine ゲート（R5 台帳の初回 entry として） | 未了 | — |

> **ガードレール（steering §0・skill ガードレール 1）**: R16 の新機構は本 issue の**成果物**であって、
> 本フローの**ゲートではない**。新機構の出力を本 issue の閉包判定の証跡に使わない（自己検証禁止と同趣旨）。

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R2 | 設計判断の目録 | **新しく決めること**: ①分析結果をどこに置き、誰が持つか ②「不具合の記録簿」（既存）と新機構の役割分担 ③履歴に書かれていない項目（障害かどうか・仕組み上の根本原因・検知工程など 7 項目）をどう埋めるか——推測で埋めるのか、これから記録を取るのか ④どういうときに分析を回すか ⑤旧リポジトリ由来の番号をどう区別するか | 未了 |
| R12 | Moira 本体のモデル | **変わらないことの確認**。本件は開発プロセス側の道具であり、Moira 製品そのものの決まりごと（何を数え、どう予測するか）には触れない | 未了 |
| R13 | 不変条件の集まり | **変わらない**（プロセス機構は不変条件の対象外） | 未了 |
| R14 | 受け入れシナリオ | **新しいシナリオは起こさない**（画面や CLI のふるまいが変わらないため） | 未了 |

### 文書ゲート内で批准（HA 対象外）

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R1 | `moira/plans/2026-07-25-change-analysis-dfd.md` | **例外: 本行のみ HA で人間承認**（issue 本文の明示指示）。文面の確定は doc-refine ゲート内 |
| R3 | `.kiro/steering/moira-change-analysis.md` | doc-refine ゲート内 |
| R4 | `.claude/skills/{新 skill}/` | doc-refine ゲート内 |
| R5 | 分析台帳の置き場＋README | doc-refine ゲート内 |
| R6 | `.kiro/steering/moira-change-management.md` | doc-refine ゲート内（改訂要否の裁定は HA） |
| R7 | `moira/changes/README.md`＋`moira-change/templates/` | doc-refine ゲート内 |
| R8 | `.kiro/postmortem/` 一式 | doc-refine ゲート内（境界の裁定は HA） |
| R9 | `.kiro/steering/structure.md` | doc-refine ゲート内 |
| R10 | `CLAUDE.md`・`.kiro/steering/moira-model.md` | doc-refine ゲート内 |
| R11 | `.kiro/steering/moira-verification.md` | doc-refine ゲート内 |
| R16 | 実走 1 本（初回 entry） | doc-refine ゲート内（R5 台帳の一部として） |

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R15 | `moira/backend/`・`moira/cli/`・`moira/frontend/` | C |

## P2 追記（HA 第 1 ラウンド裁定によるスコープ拡大・2026-07-25）

**契機**: HA Q1 の裁定で、ユーザーが (i)「障害／非障害を最初に振り分ける**受付**が要る」(ii)「**既存の障害フローも
正しいか自信がないので DFD に起こして改めて考えたい**」と指示した。これにより **R8 の射程が「境界の相互参照注記」から
「既存障害フローの現況分析＋配線の是正」へ拡大**する。append-only 規律に従い R8 は残し、拡大分を新行として追記する。

**追加の一次観測（既存障害フローの現況監査。証拠は DFD §3.2）**: F1 入口が変更管理フローと未接続（entry は
2026-07-05 の 1 件のみ・以後 15 issue で 0 件）／F2 `.kiro/specs` 不在に依存した死んだ配線 3 つ（4 トリガ中 2 つが
構造的に不発）／F3 破棄済み seed を skill が復活させる／F4 存在しない spec への同期義務／F5 検知工程タクソノミーが
V モデル前提で実工程を表せない／F6 旧プロダクトのパス例／F7 review が一度も完走していない（反映ログが空）／
F8 障害判定そのものが記録されない。

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R17 | `.claude/skills/kiro-postmortem-add/`（`SKILL.md`・`SKILL.ja.md`・`rules/taxonomy-reference.md`・`rules/trigger-detection.md`・`templates/`） | F | DFD §3.2 F2/F3/F4/F5/F6 の是正（B-b〜B-f・B-h）と、A0 受付からの委譲辺の受け口化（B-a）。**R8 のスコープ拡大分** | `doc-refine` | 死んだ配線（`.kiro/specs` 依存 3 箇所・seed 投入・旧パス例）が除去され、項目 10→17・プロセス軸タクソノミーが反映され、日英 2 ファイルが同期する | doc-refine ゲート PASS（doc-gate-judge）＋`.kiro/specs` への参照が 0 件であることの grep 照合 | 未了 | — |
| R18 | `.claude/skills/kiro-postmortem-review/`（`SKILL.md`・`SKILL.ja.md`・`templates/`） | F | DFD §3.2 F2/F7 の是正（B-b）＋集約が**両台帳をまたぐ**ことの反映（DFD §1・§4 A6） | `doc-refine` | 廃止トリガ（`spec-completion`／`new-spec-init`）が消え、共通トリガ（§7）に差し替わり、集約対象が両台帳になる | doc-refine ゲート PASS＋`.kiro/specs` 参照 0 件の grep 照合 | 未了 | — |
| R19 | `.kiro/postmortem/defects.md`（ヘッダ・スキーマ・タクソノミー定義） | F | 項目 10→17（B-g）・発生機能タクソノミーの出所差し替え（B-c）・検知工程プロセス軸の追加（B-f）・出所ラベルの導入。**既存 entry #0001 は as-is 保持（遡及書き換え禁止）** | `doc-refine` | スキーマとタクソノミーが C 系と共通化され、既存 entry #0001 の本文が **byte 単位で不変**である | doc-refine ゲート PASS＋entry #0001 の diff 0 照合 | 未了 | — |
| R20 | `.kiro/steering/moira-change-analysis.md`（新規・A0 受付の判定基準を含む） | F | §2 A0 の判定基準（障害／非障害の定義・境界事例は障害側に倒す・判定の記録義務）は**規範**であり、skill の振り付けではなく steering が所有する（`moira-change` と同型）。**R3 の内容を確定させる行** | `doc-refine` | A0 の判定基準・項目定義・タクソノミー所在・トリガ・正直枠が規範として確定する | doc-refine ゲート PASS | 未了 | — |

**既存行への影響（削除せず注記）**:

- **R6**（`.kiro/steering/moira-change-management.md`）: 「変更なし照合」の可能性は消え、**変更あり**が確定した
  （DFD §8 の一次採取 2 欄＝障害判定・変更分類を P6 に追加するため）。
- **R7**（`moira/changes/README.md`＋`moira-change/templates/`）: 同上——`closure-report.template.md` に 2 欄追加が確定。
- **R8**（`.kiro/postmortem/` 一式）: 射程を R17〜R19 へ分割。R8 自体は「両側に境界と依存方向を明記する」面を担う。

## P2 追記 2（HA 承認後の確定・2026-07-25）——mapped パスの確定と採番

**HA 承認**（DFD v3＋フォルダ構成＋実行計画）を受け、P5 の未マップ差分検査で使う **mapped パス集合**を確定する
（ディレクトリ行は末尾 `/` 付きのパス区切り前方一致で配下を被覆——steering §5 の定義）。

| 行 ID | 確定パス（P5 の mapped 集合） | 備考 |
|---|---|---|
| R1 | `moira/plans/2026-07-25-change-analysis-dfd.md` | 本 DFD |
| R2 | `moira/DECISIONS-CATALOG.md` | **採番は D-82 以降**（現行最大は D-81・実地確認）。**キー修飾（旧 D-e）は新判断を起こさず、既存 D-80（`agreed`）の本台帳への適用として扱う**——D-80 は「本文は書き換えない」と定めているため、既存文書の `#N` を遡及修飾しない |
| R3/R20 | `.kiro/steering/moira-change-analysis.md` | 規範（新規） |
| R4 | `.claude/skills/moira-change-analysis/` | 新 skill 一式（SKILL.md・SKILL.ja.md・templates/） |
| R5 | `.kiro/analysis/` | 分析台帳（README.md・INDEX.md・entries/・reviews/） |
| R6 | `.kiro/steering/moira-change-management.md` | P6 に一次採取 2 欄 |
| R7 | `moira/changes/README.md`／`.claude/skills/moira-change/` | closure-report テンプレ＋様式表。**`moira/changes/**` は P5 で自己除外されるため、README の変更は検査対象外**（steering §5） |
| R8/R17 | `.claude/skills/kiro-postmortem-add/` | **削除される `templates/seed-entries.md` も changed に出る**——本ディレクトリ行で被覆される |
| R18 | `.claude/skills/kiro-postmortem-review/` | |
| R19 | `.kiro/postmortem/defects.md` | |
| R9 | `.kiro/steering/structure.md` | 新ディレクトリの記載 |
| R10 | `CLAUDE.md`／`.kiro/steering/moira-model.md` | 索引追随 |
| R11 | `.kiro/steering/moira-verification.md` | 位置づけ（計器ではない）の明記 |
| R12〜R15 | `moira/MODEL.md`／`moira/PROPERTIES.md`／`.kiro/scenarios/`／`moira/backend/`・`moira/cli/`・`moira/frontend/` | いずれも**変更なし照合**（diff 0 を証跡とする） |
| R16 | `.kiro/analysis/entries/` 配下の実走 1 本 | R5 のディレクトリ行で被覆 |

**追加の設計事項（HA 承認後に P2 が拾った作り込み防止・DFD §3.3 に B-i〜B-k として反映済み）**:

- **B-i**（F4′ 対策・**Critical**）: 16 項目化で既存 entry #0001 が `/kiro-postmortem-review` の malformed 判定に
  かかり、**唯一の既存 entry が集計から黙って消える**。パーサを 2 スキーマ受理（`Schema: v1|v2`・欠落は `unknown`
  として集計に載せる）にして防ぐ。
- **B-j**: タクソノミー正本を `rules/taxonomy-reference.md` の 1 ファイルに確定し、`defects.md` ヘッダは要約＋
  ポインタへ降格（「single source of truth と称して 2 ファイル同期」という F4 と同型の矛盾を残さない）。
- **B-k**: 撤回条件の literal タグ（`[deferred-important]`／`[rdt-disposal]`／`[intent-drift]`）を項目 8 へ明示継承。
  **他機構の撤回条件が grep で数える計器**であり、書き換えで落とすと別機構の計器が黙って死ぬ。
- **F2/F3/F4 の出典訂正**: 既存 postmortem 2 skill は `SKILL.md` と `SKILL.ja.md` の**並行翻訳**であり
  （`moira-change` のような「英語版は convention shell」宣言を持たない）、死んだ配線は**両ファイルに存在する**。
  是正は両方に施す。

## P2 訂正記録（doc-refine ラウンド 1・2026-07-25）——append-only ゆえ行は消さず、ここで訂正する

独立の事実検証（`doc-fact-checker`）と敵対レビュー（`doc-adversary`）が、本マップの**前提調査に事実誤りを
検出**した。行の削除はせず、以下に正値と出典を記録する（本ファイルの上部記述は誤ったまま残る——
訂正はここが正）。

| 誤 | 正 | 出典 |
|---|---|---|
| 「16 項目」（当初「17 項目」と記載。全文書へ波及していた） | **16 項目** | issue #19 本文の箇条書きは実測 16 件。当初 request.md が「13〜16 は 1 群」と数えて 17 に膨らませたのが発生源。※本ファイル上部の「16 項目」表記は訂正反映済み |
| 「既存履歴 15 本」「クローズ済み issue 15 本」「15 本中 7 本」 | **本リポのクローズ済み issue は 13 本**（#1・#2・#5・#6・#7・#8・#9・#10・#11・#13・#15・#16・#17）。`gate-round-records.md` を持つのは**本リポ 8 本**（#1・#2・#7・#8・#9・#10・#11・#15） | `gh issue list --repo PrimeBrains/moira --state closed`／`ls moira/changes/*/gate-round-records.md` |
| 観測 A の対象に `issue-43` を含めていた／観測 C を「#39・#42 が旧リポ」と書いていた | **`issue-39`・`issue-42`・`issue-43` の 3 本すべてが旧リポ（`sdd-workshop`）由来** | `moira/changes/issue-43/request.md` の原文リンクが `https://github.com/PrimeBrains/sdd-workshop/issues/43` |
| F1 の証拠として「#16 の `gate-round-records.md`」を挙げていた | **#16 に `gate-round-records.md` は存在しない**。実出典は `moira/changes/issue-16/closure-report.md`（指摘件数の記述自体は正しい） | `ls moira/changes/issue-16/` |
| 「本リポの同番号と衝突する」 | **衝突しうる**（本リポの最大 issue 番号は現在 #19 のため実衝突は未発生） | `gh issue list --state all` |

**この訂正が設計に与える影響**: なし——7 項目が既存入力に存在しないという**中核の観測は無傷**
（実地の grep で再確認済み）。誤っていたのは母数と本数であり、三系統（導出／推論／採取）の設計根拠は変わらない。

**波及先一覧への影響**: 行の追加・削除なし（R1〜R20 のまま）。

## スコープ外（本 issue では扱わない・開示）

- **過去の全数分析**（本リポ 13 本）: 本 issue の成果物は「仕組み」であり、全履歴への適用は実走 1 本（R16）を除き
  行わない。全数適用は仕組み確定後の運用（必要なら別 issue）。
- **自動起動（cron 等）**: 「定期的に」の実現手段として外部スケジューラを配線することは含めない
  （トリガの規約定義までが本 issue。R2 ④で裁定）。
