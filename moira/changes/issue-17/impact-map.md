---
status: working-ledger
issue: 17
---

# 影響マップ — issue #17

> **前提**: 本 issue は #16 の P2 影響調査（HA 2026-07-24）で開示されたスコープ外残余
> （`.moira` の他ファイル群）の捕捉 issue。#16 で新設・汎用化した primitive を再利用する:
> `moira/backend/src/atomic-write.ts`（`atomicWriteFileSync`）と `moira/cli/src/store.ts` の
> パス汎用化済み advisory lock（`acquireLock(dataPath)`／`releaseLock(dataPath, token)`／
> `lockPathFor(dataPath)`）。したがって #17 は**新機構を作らず既存 primitive の適用**が主。
> 下表の「状態」は P2/P3 時点＝**未着手**で、P5 閉包時に resolved＋証跡へ更新する。
> R3・R4 の members/config 行は **HA 境界裁定待ち**（後述 A/B）。

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/backend/src/capacity-store.ts | C | capacity.json は CapacityStore が saveJson を所有——torn write 防止（アトミック置換）は saveJson の実装詳細（D-11）。#16 の event-store.ts と同型 | /kiro-impl＋敵対レビュー＋CI | `CapacityStore.saveJson` が `atomicWriteFileSync`（#16 R1）経由になり torn write を排除。出力バイト不変（現行の trailing-newline なし形式を保持） | R5 の witness＋backend CI green | resolved | closure-report.md 同行参照 |
| R2 | moira/cli/src/store.ts（dates/milestones/labels の atomic＋lock） | C | dates/milestones/labels は read-modify-write が MoiraRepo メソッド内で完結（appendDateEntries・appendMilestoneEntries・setNodeLabel/setActorLabel/setNodeLabels/setActorLabels）——#16 の appendEvents と同型に atomic＋lock 適用（D-11・#15 機構の同水準適用） | /kiro-impl＋敵対レビュー＋CI | (i) `appendDateEntries`／`appendMilestoneEntries` が `lockPathFor` 排他区間内で load→append→`atomicWriteFileSync` になる (ii) `writeLabels`（private）が `atomicWriteFileSync` 化し、`setNodeLabel`/`setActorLabel`/`setNodeLabels`/`setActorLabels` の load→mutate→write 全体が labels.json.lock の排他区間になる (iii) 出力バイト不変 | R4 の witness＋敵対レビュー＋CI green | resolved | closure-report.md 同行参照 |
| R3 | moira/cli/src/store.ts（capacity の lock＋members/config の RMW-into-repo） | C | capacity: `appendCapacity` の load→append→save に lock（RMW は MoiraRepo 内）。members/config は RMW が呼び出し側（commands.ts）にあるため保存だけのロックでは lost update を塞げない——**HA 裁定＝案 A 採択**（intent-ratification.md ②）: RMW を MoiraRepo へ移設（`upsertMember(member): boolean`／`updateConfig(patch): Config`）し lock で load→modify→save を包む | /kiro-impl＋敵対レビュー＋CI | `appendCapacity`／新 `upsertMember`／新 `updateConfig`／`saveMembers`（private 化 or 委譲）／`writeConfig` が atomic＋lock の排他区間になり capacity/members/config の lost update・torn write を排除 | R4 の witness＋敵対レビュー＋CI green | resolved（案A） | closure-report.md 同行参照 |
| R4 | moira/cli/src/store-write-safety.test.ts（#16 新設を拡張） | C | 残余ファイルの並行/耐久 witness 現状ゼロ | /kiro-impl＋敵対レビュー＋CI | (i) capacity/dates/milestones/labels（案 A なら members/config も）で **実子プロセス**が `<path>.lock` 保持中の並行書き込みで両更新が生存（lost update なし・#15/#16 R5 と同型の非空虚性——lock 無効化で落ちることを実証） (ii) 各書き込み後に `.tmp-`/`.lock` 残骸なし (iii) 案 A なら `upsertMember`（新規=push・既存=置換の boolean）／`updateConfig`（マージ）の正当性 witness | vitest 実行結果＋敵対レビュー | resolved | closure-report.md 同行参照 |
| R5 | moira/backend/src/capacity-store.test.ts（新規 or atomic witness 拡張） | C | capacity saveJson の耐久 witness 現状ゼロ（backend） | /kiro-impl＋敵対レビュー＋CI | capacity saveJson の出力バイトが現行と同一（golden）かつ `.tmp-` 残骸なし——#16 の event-store atomic witness と同型（旧素朴 writeFileSync では落ちる非空虚性） | vitest 実行結果＋敵対レビュー | resolved | closure-report.md 同行参照 |
| R6 | moira/cli/src/commands.ts（案 A 確定） | C | HA 裁定＝案 A: `cmdMemberAdd` は `repo.upsertMember(member)` の返り値で `~`/`+` を出力、`cmdConfigOrgCalendar` は `repo.updateConfig({ orgCalendar: { enabled } })` を使う（RMW を repo へ移設） | /kiro-impl＋敵対レビュー＋CI | コマンドの観測出力（`+`/`~` プレフィックス・成功文言）が現行と一字一句不変で、RMW が repo 内の排他区間へ移る。既存 cli テストが非回帰 | 既存 CI（cli）＋敵対レビュー | resolved（案A） | closure-report.md 同行参照 |
| R7 | moira/MODEL.md（§7#20 実装状態追補・日英 2 箇所） | M | #16 が §7#20 追補に残す「.moira 他ファイル群の torn write/lost update は issue #17 で追跡」の解消 | moira-model-update | 追補が実装完了後の状態へ日英同期で更新される（#17 追跡記述の解消追補）。**§2.10 の規範文・公理・不変条件・訂正計器規則は一切不変**。残余ゼロ（capacity/dates/milestones/labels は closure、members/config は採択案に応じ closure か明示 residual） | moira-model-update ゲート判定（敵対＋fact-check）＋独立採点者の意図整合検査 | resolved | closure-report.md 同行参照 |
| R8 | moira/DECISIONS-CATALOG.md（D-79 実装状態注記の #17 解消） | D | D-79 注記が #16 で残す「.moira 他ファイル残余の #17 追跡」の解消 | doc-refine | 注記が実装完了の記述へ同期される（判断一文・判定文・正直な開示欄は不変。D-80 の新旧番号読み分け注意は保持）。何が実装されたか（残余 6 ファイルのアトミック置換＋RMW 経路の advisory lock）を一言で記す | doc-refine ゲート決着＋意図整合検査 | resolved | closure-report.md 同行参照 |
| R9 | moira/DECISIONS-CATALOG.md（D-11 実装状態注記） | D | 永続化方式を所管する D-11（「永続化方式を決める責任は土台が持つ」）に、アトミック置換＋advisory lock が全 `.moira` 書き込み（#11 corrections・#16 events・#17 残余）へ均一適用された旨の実装状態注記を添える——本変更の正典上の本来の帰属先。**HA 裁定＝添える（採択）**（intent-ratification.md ②） | doc-refine | D-11 に日付つき実装状態注記が付き、判断一文・判定文は不変。#11/#16/#17 の均一適用を一言で記す | doc-refine ゲート決着＋意図整合検査 | resolved（追加確定） | closure-report.md 同行参照 |
| R10 | moira/PROPERTIES.md／.kiro/scenarios/units/・moira/frontend/e2e/specs/（P・S 確認のみ） | P/S | 書き込み耐久性（torn write/lost update 防止）は §2.10/公理/不変条件の対象外でプロパティ集の関心外。アトミック性・排他はユーザー可視ふるまい不変（同入力→同導出→同表示）。#15/#16 R9/R10 の HA 既定判断を踏襲 | （変更なしの確認）照合 worker＋HA 裁定 | (P) プロパティ集に差分ゼロ・#17 言及ゼロ (S) S 級新規なし（永続化耐久性の unit/spec は現状ゼロで妥当）——HA 裁定記録が証跡 | 照合確認の記録（閉包時）＋HA 批准記録 | resolved | closure-report.md 同行参照 |
| R11 | moira/cli/src/commands.ts（`cmdImportMembers`）＋moira/cli/src/xlsx/members-import.ts（`planMembersImport`）＋moira/cli/src/store.ts（新 `mergeRoster`／`upsertMembers`） | C | **P4 C ゲート再レビュー（敵対レビュー）で検出した第 2 の members RMW writer**——R3/R6 は members の RMW を `member add`（`cmdMemberAdd`）のみで数え、`import members`（`cmdImportMembers`）の名簿 RMW を見落としていた。実害: `planMembersImport` が `existing = repo.loadMembers()` を**ロック外**で読み、`cmdImportMembers` が `repo.saveMembers(plan.members)` で名簿を丸ごと上書きするため、同時進行の `member add` が黙って消える lost update。案 A（RMW を MoiraRepo へ移設し施錠）の射程として**同工程で是正**（append-only 台帳ゆえ R6 は改変せず本行で開示） | /kiro-impl＋敵対レビュー＋CI | (i) 名簿マージを純粋関数 `mergeRoster(existing, incoming)` へ一本化し、`planMembersImport` の dry-run プレビューと commit が同一ロジックを共有（プレビュー名簿と確定名簿が乖離不能） (ii) 新 `MoiraRepo.upsertMembers(incoming)` が members.json.lock 排他区間内で **fresh load→merge→atomic write** し merged 名簿を返す (iii) `cmdImportMembers` の commit が `repo.saveMembers(plan.members)`→`repo.upsertMembers(plan.incomingMembers)` へ（`plan` に `incomingMembers` を追加） (iv) 安全な呼び手のない dead な `saveMembers`（save-only-lock footgun）を除去 (v) 観測出力（dry-run 件数・commit サマリ）は一字不変 | R4 の import witness（`store-write-safety.test.ts`「upsertMembers (import members path) …BOTH survive」——実子プロセス並行；非空虚性は load-outside-lock バグ再導入で当該 witness のみ落ちることを実証）＋`upsertMembers` RMW セマンティクス witness＋敵対レビュー＋CI green | resolved（R11 是正済・再ゲート PASS） | closure-report.md 同行参照 |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R7 | モデル文書の実装状態メモ | メモ「.moira の他ファイル群にも同じ脆さがあり issue #17 で追跡」を、実装完了後に「実装済み」へ書き換える。**ルール本文（§2.10）は一字も変えない** | resolved |
| R8 | 設計判断カタログ D-79 のメモ | D-79 についている「.moira 他ファイル残余は #17 で追跡」メモを実装完了の記述へ更新する。判断の一文は変えない | resolved |
| R9 | 設計判断カタログ D-11 のメモ | 永続化方式を決める判断 D-11 に「壊れ書き防止（アトミック置換）と上書き喪失防止（排他ロック）が、.moira の全書き込み〔訂正 #11・イベント #16・残余ファイル #17〕へ均一に実装された」旨の実装状態メモを添えるか。判断の一文は変えない（**要否を HA で確認**） | resolved |
| R10 | プロパティ集／受け入れシナリオ | 新しい約束・シナリオは作らず、文面も変えない。書き込みの耐久性はプロパティ集・シナリオが語る関心の外側——前回 #15/#16 の判断を踏襲し**新規は起こさない** | resolved |

### 境界裁定を要する論点（HA で確定）

| 論点 | 平易文 | 選択肢 | 推奨 |
|---|---|---|---|
| members/config の lost update | members.json（`member add`）と config.json（`config org-calendar`）は「読んで→書き換えて→保存」が**コマンド側**にあり、保存だけをロックしても同時追加が消える恐れ（lost update）は塞げない。どこまで直すか | **A**: 「読んで→書き換えて→保存」を MoiraRepo へ移設し（`upsertMember`／`updateConfig`）ロックで包む＝lost update も塞ぐ（issue item 1 の atomic に加え item 2 の精神を members/config へも及ぼす） / **B**: members/config は torn write だけ直し（atomic）、ロックは issue 本文 item 2 が名指しする capacity/dates/milestones/labels に限定。members/config の lost update は残余として正直開示（#18 起票 or 明示 deferred） | **A**——member add は実在の RMW で同時追加が消えうる。移設は小さく閉じた refactor（観測出力不変）で、残せば #18 を生むだけ。config は単一フィールド last-wins で低リスクだが同じ機構で均一化 |
| D-11 実装状態注記（R9）の要否 | 本変更の正典上の本来の帰属先は D-11（永続化方式）。D-79（音の鳴る訂正）は #15 の残余開示が歴史的に着地しただけ。D-11 にも実装状態注記を添えるか | 添える（推奨・連鎖の意味的帰属を正す） / D-79 のみ（連鎖は閉じるが帰属は corrections 寄りのまま） | 添える——読み手が D-11「永続化方式」を見たとき hardening 着地が分かる。低コスト（一注記） |
| S/E2E 級新規の要否（R10） | 書き込みのアトミック性・排他はユーザー可視ふるまいを変えない | 新規なし（#15/#16 踏襲） / 新規シナリオ起票 | 新規なし——ふるまい不変・永続化耐久性はシナリオ対象外（前 2 回の既定判断） |

### 文書ゲート内で批准（HA 対象外）

該当なし（F 級行なし）。

### 人間はレビューしない（敵対レビュー＋CI に委譲）

以下は C 級の機械決着行——敵対レビュー（本環境では codex 非在のため独立レビュー subagent で代替）
および CI（tsc・vitest・dependency-cruiser）に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R1 | moira/backend/src/capacity-store.ts | C |
| R2 | moira/cli/src/store.ts（dates/milestones/labels） | C |
| R3 | moira/cli/src/store.ts（capacity lock・members/config RMW-into-repo） | C |
| R4 | moira/cli/src/store-write-safety.test.ts（拡張） | C |
| R5 | moira/backend/src/capacity-store.test.ts | C |
| R6 | moira/cli/src/commands.ts（案 A のみ） | C |
| R11 | moira/cli/src/commands.ts（`cmdImportMembers`）＋members-import.ts＋store.ts（`mergeRoster`／`upsertMembers`） | C |

## 追補ログ（append-only）

- **2026-07-24（P4 C ゲート再レビュー）**: R11 を追加。R3/R6 が members の RMW writer として
  `member add`（`cmdMemberAdd`）のみを捕捉し、`import members`（`cmdImportMembers`）の名簿
  read-modify-write（`planMembersImport` のロック外 `loadMembers` ＋ `saveMembers` 全体上書き）
  を P2 で見落としていた。敵対レビューが lost update として指摘（Critical）→ 案 A の射程として
  同工程で是正（`mergeRoster` 一本化・`upsertMembers` へ RMW 移設・`saveMembers` 除去）。
  台帳は append-only ゆえ R3/R6 は改変せず本行と本ログで開示する。MODEL §7#20・D-79 の
  メソッド列挙と witness 一覧も同工程で `upsertMembers`／`store-atomic-wiring.test.ts` を反映。
