---
status: working-ledger
issue: 16
---

# 閉包レポート — issue #16

> **本フロー特有の開示（読み分け注意）**: (1) 本 issue の台帳（request/impact-map/intent-ratification）は
> GitHub の P3/HA 記録から**再構成**した（impact-map 冒頭の再構成開示を参照）。(2) 敵対レビューは本環境で
> **codex 非在**のため独立レビュー subagent（moira/doc 各 adversary＋独立 general-purpose）で代替した
> （impact-map「人間はレビューしない」節の明記どおり）。(3) 本フロー（#16/#17 は同一作業）の C/M/D 全成果は
> **作業ツリー上で未コミット**であり、単一コミット＋main への統合＋push＋クローズは **P6（H5 承認後）**に行う。

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表（人間レビュー3面＝M/D/P/S のみ）

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R7 | M | モデル文書の実装状態メモ | 「イベントログ本体の同時書き込み保護は #16 で追跡中」を「実装済み」へ・**§2.10 の規範文/公理/不変条件/訂正計器規則は一字も変えない**・日英同期・追補形式・版据え置き | moira/MODEL.md §7#20「(2026-07-24 追補: issue #16/#17 実装工程完了)」（日 664 行・英 667 行。版 v22 据え置き・規範文 diff ゼロ） | Y |
| R8 | D | 設計判断カタログ D-79 のメモ | 「イベントログ本体の同型保護はスコープ外・#16 で追跡」の前方参照を解消し実装完了へ・判断一文/判定文不変・D-80 新旧番号読み分け保持 | moira/DECISIONS-CATALOG.md D-79 末尾「参照実装の実装状態（2026-07-24・issue #16/#17 実装工程完了）」（判定文逐語不変） | Y |
| R9 | P | プロパティ集 | 新設なし・文面変更なし（書き込み耐久性はプロパティ集の関心外＝#15 R8 と同型） | moira/PROPERTIES.md 変更なし（diff 0 行・#16 言及 0 件） | Y |
| R10 | S | 受け入れシナリオ | #15 の HA 既定判断を踏襲し S 級新規は起こさない（永続化耐久性はシナリオ対象外・ふるまい不変） | 新規 unit/spec なし（HA 批准記録が証跡） | Y |

### ② できないことになったこと（平易な差分）

なし（本 issue に deferred 行はない——全 10 行 resolved）。

参考（スコープ外の派生開示——deferred ではない）: #16 の P2 で開示した「`.moira` 他ファイル群の torn write/lost update」は
本フローと**同一セッション**で **#17** として捕捉・是正済み（#17 閉包レポート参照）。

### ③ 閉包判定

**PASS**（全 10 行 resolved・deferred 0・未マップ差分 ∅・全ゲート PASS）

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | クラス | 状態 | 証跡 |
|---|---|---|---|---|
| R1 | moira/backend/src/atomic-write.ts（新規） | C | resolved | `atomicWriteFileSync` を同一ディレクトリの一意 temp（`.tmp-<pid>-<ts>-<rand>`）→`renameSync` でアトミック置換・失敗時 temp 掃除＋原例外再送出。バイト列は呼び手出力と一字一句同一。code C-gate PASS＋`atomic-write.test.ts` witness。barrel export は backend index.ts に追加（読み手 CLI が `moira-backend` 経由で参照） |
| R2 | moira/backend/src/event-store.ts | C | resolved | `EventStore.saveJson` が `atomicWriteFileSync` 経由に。出力バイト不変（trailing-newline なし維持・golden 一致）。読み手 ui-server.ts は last-good ガードを温存（コメントのみ更新——書き込みアトミック化を反映しつつ init シード等の非アトミック源への二重防御として保持）。backend store-atomic-wiring witness＋code C-gate PASS |
| R3 | moira/cli/src/store.ts | C | resolved | corrections 専用ロックを**パス汎用化**（`acquireLock(dataPath)`/`releaseLock(dataPath, token)`/`withLock(dataPath, fn)`）。`appendEvents` の load→append→save 全体が events.json.lock 排他区間。`appendCorrections` は共有ヘルパへ委譲（挙動不変）。lock の全正直開示（rename 奪取・dead-pid 限定 steal・token release・.steal-* GC・honest residual）は汎用化後も保持。code C-gate 独立判定: 全 8 RMW 経路が施錠区間内・save-only lock なし |
| R4 | moira/backend/src/atomic-write.test.ts（新規）＋event-store.test.ts（新規） | C | resolved | (i) 正常書き込み後 `.tmp-` 残骸なし (ii) rename 失敗経路で temp 掃除＋原例外伝播 (iii) saveJson 出力バイト golden 一致——各 witness 非空虚（旧素朴 writeFileSync では落ちる）。backend 214/214 green |
| R5 | moira/cli/src/store-write-safety.test.ts（新規） | C | resolved | **実子プロセス**が events.json.lock 保持中の並行 appendEvents で両 record 生存（lost update なし・lock 無効化で落ちる非空虚性を実証）。events 経路含む全 8 経路 8 it。CLI 11/11（当ファイル単体実走） |
| R6 | moira/cli/src/correct.test.ts | C | resolved | corrections の lock/アトミック挙動が汎用化後も非回帰（改名追随含む）。CLI 全体 369 passed+2 skipped green |
| R7 | moira/MODEL.md §7#20（日英） | M | resolved | moira-model-update M-gate **PASS**（moira-gate-judge 独立採点: 残存 Critical 0・Important 全件 disposition・版 v22 据え置き・規範文 diff ゼロを独立確認） |
| R8 | moira/DECISIONS-CATALOG.md D-79 | D | resolved | doc-refine D-gate **PASS**（doc-gate-judge 独立採点: 残存 Critical 0・witness/init 開示の数値を実コードで確認・判定文逐語不変・D-80 保持） |
| R9 | moira/PROPERTIES.md | P | resolved | 変更なし照合（diff 0・#16 言及 0） |
| R10 | .kiro/scenarios/units/・frontend/e2e/specs/ | S | resolved | HA 裁定（S 級新規なし・ふるまい不変）＝批准記録が証跡 |

ゲート敵対ラウンド: C 面＝実装→独立レビュー（round1: 0 Critical, 2 Important→修正; round2: 0 Critical）→code C-gate judge PASS。M 面＝round2 で 1 Important（乖離不能 witness）→修正→moira-gate-judge PASS。D 面＝round2 で 1 Critical（乖離不能）＋Important（D-11 note）→修正→doc-gate-judge PASS。3 採点者とも同一 Minor（store.ts mergeRoster docstring の絶対表現）を非拘束で指摘→同旨に調整済み（コメントのみ・非挙動・CLI 再 green 確認）。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: `67ec0ff6b73979036de903827ae1f55703ba4323`（worktree 分岐点＝origin/main との merge-base）
- HEAD: `67ec0ff`（**本フロー全成果は未コミット**——検査対象は `git diff 67ec0ff` の作業ツリー変更＋未追跡ファイル）
- #16 が触れる mapped パス: atomic-write.ts / atomic-write.test.ts / event-store.ts / event-store.test.ts / store.ts / store-write-safety.test.ts / correct.test.ts / MODEL.md / DECISIONS-CATALOG.md / ui-server.ts（R2 読み手・コメントのみ）＋ ancillary（backend index.ts barrel export・backend store-atomic-wiring.test.ts torn-write 配線 witness）
- 未マップ差分: **空**（changed − mapped − ledger = ∅。#16/#17 は同一作業ツリーゆえ全変更を #16＋#17 の mapped 行に写像済み。`moira/changes/**` は自己除外）
- 判定有効性: 照合中に非台帳パスの HEAD 移動なし（未コミットのまま固定）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

deferred 行なし。派生 #17 は本フロー同一セッションで是正済み（別 issue として並行クローズ）。

</details>
