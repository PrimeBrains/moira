---
status: working-ledger
issue: 16
---

# 影響マップ — issue #16

> **再構成の開示**: 本マップは GitHub issue コメント（P3/HA 2026-07-24 裁定要約「全 10 行——コード 6・
> 文書 2〔MODEL §7#20 追補・D-79 注記〕・確認のみ 2〔プロパティ集・シナリオ〕」）から再構成した。
> HA コメント中の R 番号（R5=MODEL/R6=D-79/R7=プロパティ）は #15 台帳の写しで略式のため、本台帳では
> クラス順（コード→文書→確認）に通し番号を振り直している（実質同一・台帳は非正典）。実装工程（P4）は
> 本セッションで実行するため、下表の「状態」は P2/P3 時点＝**未着手**で、P5 閉包時に resolved＋証跡へ更新する。

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/backend/src/atomic-write.ts（新規） | C | D-11（永続化方式は土台が所有）——アトミック置換は「保存のやり方」ゆえ土台（backend）に primitive を置く。#11 の corrections インライン temp→rename の一般化 | /kiro-impl＋敵対レビュー＋CI | `atomicWriteFileSync(path, data)` が `<path>.tmp-<pid>-<ts>-<rand>` へ書いて renameSync でアトミック置換し、rename 失敗時は temp を掃除して原例外を送出する。バイト列は呼び手の現行出力と一字一句同一（末尾改行の有無を含む） | R4 の witness＋tsc＋depcruise＋CI green | resolved | closure-report.md 同行参照 |
| R2 | moira/backend/src/event-store.ts | C | events.json は EventStore が saveJson を所有——torn write 防止（アトミック置換）は saveJson の実装詳細（D-11） | /kiro-impl＋敵対レビュー＋CI | `EventStore.saveJson` が `atomicWriteFileSync` 経由になり torn write を排除。出力バイト不変（現行の trailing-newline なし形式を保持）。読み手（ui-server の last-good ガード）は不変で温存 | R4 の witness＋backend CI green | resolved | closure-report.md 同行参照 |
| R3 | moira/cli/src/store.ts | C | D-11・#15 台帳 R3（corrections lock は D-11 範囲内の実装詳細）。events.json の read-modify-write の lost update 防止は #15 機構の同水準適用（②境界裁定 (a)） | /kiro-impl＋敵対レビュー＋CI | corrections 専用ロック機構を **パス汎用化**（`acquireCorrectionsLock`→`acquireLock(dataPath)`／`releaseCorrectionsLock`→`releaseLock(dataPath, token)`／`lockPathFor(dataPath)=<dataPath>.lock`）。`appendEvents` の load→append→save 全体が events.json.lock の排他区間になる。`appendCorrections` は共有アトミックヘルパ（R1）へ委譲（DRY・挙動不変）。lock 設計の全ての正直開示（rename 奪取・dead-pid 限定 stale・token release・.steal-* GC・honest residual）は汎用化後も保持 | R5・R6 の witness＋敵対レビュー＋CI green | resolved | closure-report.md 同行参照 |
| R4 | moira/backend/src/atomic-write.test.ts（新規）＋event-store.test.ts | C | 書き込み耐久性テスト現状ゼロ（backend） | /kiro-impl＋敵対レビュー＋CI | (i) 正常書き込み後に `.tmp-` 残骸なし (ii) rename 失敗経路で temp が掃除され原例外が伝播 (iii) saveJson の出力バイトが現行と同一（golden 比較）——各 witness が green かつ非空虚（旧素朴 writeFileSync では落ちる） | vitest 実行結果＋敵対レビュー | resolved | closure-report.md 同行参照 |
| R5 | moira/cli/src/store-write-safety.test.ts（新規） | C | 並行書き込みテスト現状ゼロ（events） | /kiro-impl＋敵対レビュー＋CI | (i) **実子プロセス**が events.json.lock を保持中の並行 appendEvents で両 record が生存（lost update なし・#15 R4 と同型の非空虚性——lock 無効化で lost update して落ちることを実証） (ii) 汎用化後も corrections lock が非回帰 (iii) appendEvents 後に `.tmp-`/`.lock` 残骸なし | vitest 実行結果＋敵対レビュー | resolved | closure-report.md 同行参照 |
| R6 | moira/cli/src/correct.test.ts | C | 汎用化（メソッド改名・共有ヘルパ委譲）の corrections 非回帰確認 | 既存 CI（cli） | corrections の lock/アトミック挙動が汎用化後も不変（40 件 green 維持）。テストが private 改名に依存していれば追随 | vitest 実行結果 | resolved | closure-report.md 同行参照 |
| R7 | moira/MODEL.md（§7#20 実装状態追補・日英 2 箇所） | M | §7#20 追補「イベントログ本体の同型書き込み保護はスコープ外——issue #16 で追跡」（日 664 行相当・英 667 行相当） | moira-model-update | 追補が実装完了後の状態へ日英同期で更新される（#16 追跡記述の解消追補）。スコープ外残余（.moira 他ファイルの torn write/lost update 露出）を **issue #17** として正直開示。**§2.10 の規範文・公理・不変条件・訂正計器規則は一切不変** | moira-model-update ゲート判定（敵対＋fact-check）＋独立採点者の意図整合検査 | resolved | closure-report.md 同行参照 |
| R8 | moira/DECISIONS-CATALOG.md（D-79 実装状態注記） | D | D-79 注記「イベントログ本体の同型保護はスコープ外・issue #16 で追跡」（658 行相当） | doc-refine | 注記が実装完了の記述へ同期される（判断一文・判定文・正直な開示欄は不変。D-80 の新旧番号読み分け注意は保持）。.moira 他ファイル残余の #17 追跡を追記 | doc-refine ゲート決着＋意図整合検査 | resolved | closure-report.md 同行参照 |
| R9 | moira/PROPERTIES.md | P | 書き込み耐久性（torn write/lost update 防止）は §2.10/公理/不変条件の対象外——プロパティ集は「導出の内的整合」の目録であり永続化 I/O 耐久性を語らない | （変更なしの確認）照合 worker | 新規プロパティ・文面変更が不要であることが確認される（#15 R8 と同型）。#16 言及ゼロのまま | 照合確認の記録（閉包時） | resolved | closure-report.md 同行参照 |
| R10 | .kiro/scenarios/units/・moira/frontend/e2e/specs/（S 級新規の要否） | S | events.json 書き込みのアトミック性・排他はユーザー可視のふるまいを変えない（同じ入力→同じ導出・同じ表示）。#15 R9 の HA 既定判断（訂正機能シナリオ整備は将来一括／永続化耐久性はシナリオ対象外） | HA 境界裁定（継続適用なら新規なし） | HA 裁定どおり: S 級新規は起こさない（永続化耐久性の unit/spec は現状ゼロで妥当——ふるまい不変）——裁定記録が証跡 | HA 批准記録（intent-ratification.md） | resolved | closure-report.md 同行参照 |

**スコープ外の正直開示（本マップの行ではない）**: `.moira` の他ファイル群——capacity.json（backend CapacityStore.saveJson）・
dates.json・milestones.json・labels.json・members.json・config.json——はいずれも events.json と同型の torn write
（素の writeFileSync）を持ち、うち read-modify-write 経路（capacity/dates/milestones/labels/members add/config org-calendar）は
lost update も抱える。本 issue #16 の残作業リストは events.json のみを名指ししており本フローのスコープ外。②境界裁定 (c) の
とおり **issue #17** で追跡する（起票済み——intent-ratification.md ⑤欄参照）。

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R7 | モデル文書の実装状態メモ | メモ「イベントログ本体の同時書き込み保護は issue #16 で追跡中」を、実装完了後に「実装済み」へ書き換える。あわせて「.moira の他ファイル群にも同じ脆さがあり issue #17 で追跡」を正直に開示する。**ルール本文（§2.10 の訂正原理・公理・不変条件）は一字も変えない** | resolved |
| R8 | 設計判断カタログ D-79 のメモ | 判断「記録の間違いは音の鳴る訂正でいつでも直せる」についている「イベントログ本体の同型保護はスコープ外・#16 で追跡」メモを実装完了の記述へ更新し、.moira 他ファイル残余の #17 追跡を添える。判断の一文は変えない | resolved |
| R9 | プロパティ集 | 新しい約束は作らず、文面も変えない。書き込みの耐久性（壊れ書き・上書き喪失の防止）はプロパティ集が語る「導出の内的整合」の外側の関心事 | resolved |
| R10 | 受け入れシナリオ | events.json の書き込みがアトミック・排他になっても、ユーザーから見える結果（同じ操作→同じ予測・同じ表示）は変わらない。これを描く/変えるシナリオは不要——前回 #15 の判断（永続化耐久性はシナリオ対象外・訂正機能シナリオは将来一括）を踏襲し、**新しいシナリオは起こさない** | resolved |

### 文書ゲート内で批准（HA 対象外）

該当なし（F 級行なし）。

### 人間はレビューしない（敵対レビュー＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——ソースコード・
テストコード（C級）の機械決着行であり、敵対レビュー（本環境では codex 非在のため独立レビュー
subagent で代替）および CI（tsc・vitest・dependency-cruiser）に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R1 | moira/backend/src/atomic-write.ts（新規） | C |
| R2 | moira/backend/src/event-store.ts | C |
| R3 | moira/cli/src/store.ts | C |
| R4 | moira/backend/src/atomic-write.test.ts＋event-store.test.ts | C |
| R5 | moira/cli/src/store-write-safety.test.ts（新規） | C |
| R6 | moira/cli/src/correct.test.ts（非回帰確認） | C |

なお `moira/cli/src/ui-server.ts` は events.json の**読み手**（非アトミック書き込みを織り込んだ last-good
ガードを持つ並行リーダー）で、本変更で書き込みがアトミック化されても last-good ガードは温存する
（rename との読みレースは FS 依存で完全には消えないため防御の二重化として残す）——書き込み側 R2 の
証跡欄で「読み手不変」を確認する（新規行にしない）。
