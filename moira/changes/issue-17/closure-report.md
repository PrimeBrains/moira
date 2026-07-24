---
status: working-ledger
issue: 17
---

# 閉包レポート — issue #17

> **本フロー特有の開示（読み分け注意）**: (1) 本 issue は #16 の P2 で開示されたスコープ外残余
> （`.moira` 他ファイル群）の捕捉 issue で、#16 と**同一作業ツリー・同一セッション**で処理した。
> (2) 敵対レビューは本環境で **codex 非在**のため独立レビュー subagent で代替。(3) C/M/D 全成果は
> **作業ツリー上で未コミット**——単一コミット＋main 統合＋push＋クローズは **P6（H5 承認後）**に行う。
> (4) R11 は **P4 C ゲート再レビューで新たに検出**した第 2 の members RMW writer（`import members`）を
> append-only 台帳規律のもと同工程で是正した行（下記②の正直開示も参照）。

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表（人間レビュー3面＝M/D/P/S のみ）

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R7 | M | モデル文書の実装状態メモ | 「.moira 他ファイル群も #17 で追跡」を「実装済み」へ・**§2.10 の規範文/公理/不変条件/訂正計器規則は不変**・日英同期・版据え置き・#17 残余ゼロ | moira/MODEL.md §7#20「(2026-07-24 追補: issue #16/#17 実装工程完了)」（版 v22 据え置き・規範文 diff ゼロ） | Y |
| R8 | D | 設計判断カタログ D-79 のメモ | D-79 が残す「.moira 他ファイル残余は #17 で追跡」を実装完了へ・判断一文/判定文不変・実装内容を一言 | moira/DECISIONS-CATALOG.md D-79 の 2026-07-24 注記（残余 6 ファイルのアトミック置換＋RMW 経路 advisory lock を記載・判定文逐語不変） | Y |
| R9 | D | 設計判断カタログ D-11 のメモ | **HA 裁定＝添える（採択）**: 永続化方式 D-11 に「アトミック置換＋advisory lock が全 `.moira` 書き込み（#11/#16/#17）へ均一適用」の実装状態注記を添える・判断一文不変・**配置理由（アトミック置換=土台/D-11 内・advisory lock=CLI 並行制御/D-11 外）を明記** | moira/DECISIONS-CATALOG.md D-11 に初の 2026-07-24 実装状態注記（決めたこと/判定/仕分け不変・二機構の所有層の別を Option A の批准意図どおり明記） | Y |
| R10 | P/S | プロパティ集／受け入れシナリオ | 新設なし・文面変更なし・S 級新規なし（#15/#16 の既定判断を踏襲） | PROPERTIES.md 変更なし（diff 0・#17 言及 0）／新規 unit/spec なし（HA 批准記録が証跡） | Y |

### ② できないことになったこと（平易な差分）

なし（本 issue に deferred 行はない——**#17 残余ゼロ**＝対象 6 ファイルすべての torn write/lost update を是正）。

**別語義の残余（正直開示・deferred ではない）**: 以下は本工程で意図的に残した既知の限界で、いずれも参照実装内に開示済み・独立コード判定で「real かつ bounded」と確認:
- **advisory lock は best-effort**（rename 奪取・dead-pid 限定 steal・3-party interleaving の live-capture 残余窓）——#15 と同型に存続。
- **`init` の初回シード書き込み**（events/corrections/capacity/dates/milestones/members を `existsSync` ガード下の素の writeFileSync で create-once）は torn write 非保護——「均一適用」は RMW／保存経路に限る。create-once ゆえ低リスク（破れても空の新規ファイル）。
- **ハードキル時の `.tmp-` リーク**（temp 書き込みと rename の間で kill された場合のみ・一意名で再読込されない）。
- **`withLock` は非再入**——同一ロックの入れ子経路は無し（`cmdImportMembers` は members→labels→capacity を別パスで逐次施錠、コマンド→repo で同一ロック再入なし）と独立判定で確認。
- **敵対レビューのベンダー多様性**: codex 非在のため独立 subagent で代替（単一ベンダー観点）。
- **`import members` の 3 ファイル（members/labels/capacity）はファイル単位の個別施錠**であり全ファイル横断のトランザクションではない（本 issue のファイル単位 torn write/lost update スコープ外・既存挙動）。

### ③ 閉包判定

**PASS**（全 11 行 resolved・deferred 0・未マップ差分 ∅・全ゲート PASS）

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | クラス | 状態 | 証跡 |
|---|---|---|---|---|
| R1 | moira/backend/src/capacity-store.ts | C | resolved | `CapacityStore.saveJson` が `atomicWriteFileSync`（#16 R1）経由に。出力バイト不変（trailing-newline なし維持）。backend store-atomic-wiring witness＋capacity-store.test.ts golden＋code C-gate PASS |
| R2 | moira/cli/src/store.ts（dates/milestones/labels） | C | resolved | `appendDateEntries`/`appendMilestoneEntries` が lock 排他区間内で load→append→`atomicWriteFileSync`。`writeLabels`（private）アトミック化＋`setNodeLabel` 等の load→mutate→write 全体が labels.json.lock 排他区間。出力バイト不変。CLI store-atomic-wiring witness（5 直書き経路の反転検知）＋code C-gate PASS |
| R3 | moira/cli/src/store.ts（capacity lock・members/config RMW 移設） | C | resolved | **HA 裁定案A**: `appendCapacity`/`upsertMember`/`updateConfig` が atomic＋lock 排他区間。members/config の RMW をコマンド側から MoiraRepo へ移設（save-only lock では塞げない lost update を排除）。code C-gate 独立判定で全経路施錠区間内を確認 |
| R4 | moira/cli/src/store-write-safety.test.ts（#16 新設を拡張） | C | resolved | capacity/dates/milestones/labels/members×2/config で実子プロセス並行の両更新生存（lost update なし・lock 無効化で落ちる非空虚性）。各書き込み後 `.tmp-`/`.lock` 残骸なし。`upsertMember`（boolean）/`updateConfig`（マージ）正当性 witness |
| R5 | moira/backend/src/capacity-store.test.ts | C | resolved | capacity saveJson 出力バイト golden 一致＋`.tmp-` 残骸なし（旧素朴 writeFileSync では落ちる非空虚性）。backend 214/214 green |
| R6 | moira/cli/src/commands.ts（案A） | C | resolved | `cmdMemberAdd`→`repo.upsertMember` 返り値で `+`/`~` 出力、`cmdConfigOrgCalendar`→`repo.updateConfig`（RMW 移設）。観測出力一字不変・既存 cli テスト非回帰 |
| R7 | moira/MODEL.md §7#20（日英） | M | resolved | moira-model-update M-gate **PASS**（moira-gate-judge 独立採点）。#17 追跡記述解消・残余ゼロ明記 |
| R8 | moira/DECISIONS-CATALOG.md D-79 | D | resolved | doc-refine D-gate **PASS**（doc-gate-judge 独立採点）。残余 6 ファイル是正を一言記載・判定文逐語不変 |
| R9 | moira/DECISIONS-CATALOG.md D-11 | D | resolved | 同 D-gate **PASS**。初の実装状態注記・二機構の所有層の別を Option A 批准意図どおり明記（アトミック置換=土台/D-11 内・advisory lock=CLI/D-11 外）。誤 "browser-safe/pure" 主張除去（atomic-write.ts は node:fs 依存を独立確認）・決めたこと/判定/仕分け不変 |
| R10 | moira/PROPERTIES.md／シナリオ・E2E | P/S | resolved | (P) diff 0・#17 言及 0 (S) HA 裁定 S 級新規なし＝批准記録が証跡 |
| R11 | commands.ts（`cmdImportMembers`）＋members-import.ts（`planMembersImport`）＋store.ts（`mergeRoster`/`upsertMembers`） | C | resolved | **P4 C ゲート再レビューで検出**の第 2 members RMW writer（`import members` の名簿 RMW が `loadMembers` をロック外で読み `saveMembers` で全上書き＝lost update）を是正: 名簿マージを純粋関数 `mergeRoster` へ一本化（プレビューと commit が同一ロジック共有・非競合時バイト一致/競合時は commit がロック内 fresh load で正当に相違）・新 `upsertMembers` が members.json.lock 内で fresh load→merge→atomic write・dead な `saveMembers` 除去。import witness（`store-write-safety.test.ts`「upsertMembers (import members path)…BOTH survive」）＋CLI/backend store-atomic-wiring witness＋code C-gate PASS |

ゲート敵対ラウンド: C 面＝実装→独立レビュー（round1 で R11 の import lost-update を Critical 検出→同工程是正; round2: 0 Critical/0 Important）→code C-gate judge PASS。M/D 面＝round2 の 1 Critical（乖離不能）＋Important（witness split・D-11 note）を修正→moira-gate-judge／doc-gate-judge とも PASS。3 採点者が同一 Minor（mergeRoster docstring）を非拘束指摘→同旨調整（コメントのみ・CLI 再 green）。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: `67ec0ff6b73979036de903827ae1f55703ba4323`（worktree 分岐点＝origin/main との merge-base）
- HEAD: `67ec0ff`（**本フロー全成果は未コミット**——検査対象は `git diff 67ec0ff` の作業ツリー変更＋未追跡ファイル）
- 作業ツリー全変更（12 tracked＋6 未追跡ソース/テスト＋2 台帳ディレクトリ）を #16＋#17 の mapped 行および ancillary（backend index.ts barrel export・両 store-atomic-wiring.test.ts torn-write 配線 witness・store.test.ts 新メソッド単体被覆・ui-server.ts コメントのみ）へ全写像
- 未マップ差分: **空**（changed − mapped − ledger = ∅。`moira/changes/**` は自己除外）
- 判定有効性: 照合中に非台帳パスの HEAD 移動なし（未コミットのまま固定）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

deferred 行なし。#17 残余ゼロ（対象 6 ファイル全着地）。②に列挙した「別語義の残余」は後続 issue 化を要さない既知の bounded な限界（参照実装内に正直開示）。

</details>
