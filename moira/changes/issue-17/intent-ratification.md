---
status: working-ledger
issue: 17
---

# 意図批准記録 — issue #17（HA 前半集約セッション）

（2026-07-24 HA 実施——全項目批准。#17 は新規 issue〔コメントゼロ〕のため本セッションが実 HA。
#16 の HA と連続する同一 worktree `issue-16-17` の統合セッションで実施。裁定は本ファイルに記録し
P6 で issue #17 コメントへ要約する。）

## ① 影響マップ確認

- 確認: yes（2026-07-24）——「はねる先はこれで全部」を確認（全 10 行——コード 6〔R1-R6〕・文書 3
  〔R7=MODEL §7#20・R8=D-79・R9=D-11〕・確認のみ 1〔R10=プロパティ集/シナリオとも変更なし〕）
- 指摘・追加された波及先: なし
- 前提: #16 の primitive（`atomic-write.ts` の `atomicWriteFileSync`・store.ts のパス汎用化 lock）を
  再利用——#17 は新機構を作らず既存 primitive の適用が主

## ② 境界裁定

| 論点 | 裁定 | 日付 |
|---|---|---|
| **members/config の lost update（争点①）** | **案 A 採択**——members.json/config.json の read-modify-write を MoiraRepo へ移設（`upsertMember(member): boolean`／`updateConfig(patch): Config`）し advisory lock で load→modify→save 全体を排他区間にする。observable 出力（`+`/`~` プレフィックス・成功文言）は一字不変。理由: member add は実在の RMW で同時追加が消えうる（lost update）；保存だけのロックでは塞げない；残せば #18 を生むだけの小さく閉じた refactor。config は単一フィールド last-wins で低リスクだが同一機構で均一化。issue 本文 item 2 は lock を capacity/dates/milestones/labels に限定していたが、item 1（atomic）が members/config を含む以上、lost update も同水準で塞ぐのが D-11 の精神に忠実——**issue の literal を超えるが正典（D-11）の意図に沿う拡張**として批准 | 2026-07-24 |
| **D-11 実装状態注記の要否（争点②・R9）** | **添える（採択）**——D-11「永続化方式を決める責任は土台が持つ」に、アトミック置換＋advisory lock が .moira 全書き込み〔訂正 #11・イベント #16・残余 6 ファイル #17〕へ均一適用された旨の日付つき実装状態注記を添える。判断一文・判定文は不変。理由: 本変更の正典上の本来の帰属先は D-11（D-79 は #15 残余開示の歴史的着地点）；読み手が D-11 を見て hardening 着地を辿れる；低コスト | 2026-07-24 |
| **S/E2E 級新規の要否（R10）** | **新規なし（#15/#16 踏襲）**——書き込みのアトミック性・排他はユーザー可視ふるまい不変（同入力→同導出→同表示）。永続化耐久性はシナリオ対象外という #15 R9/#16 R10 の既定判断を継続適用 | 2026-07-24 |
| **残余の扱い** | 案 A 採択により **#17 完了後の .moira 書き込みレース残余はゼロ**（capacity/dates/milestones/labels/members/config すべて atomic＋lock）。3 者レース（lock 奪取窓）の honest residual は #15 と同型で機構固有・別問題として温存（新規 issue 不要——#15 台帳で既開示） | 2026-07-24 |

## ③ S 級 When/Then の発案

該当なし（R10 裁定＝新規シナリオなし・既存 unit の変更もなし）。

## ④ 意図批准（M/D/P 対象行）

| 行 ID | 対象クラス | 何を決めるか | 受け入れ基準 | 却下したい方向 | 批准 | 日付 |
|---|---|---|---|---|---|---|
| R7 | M | MODEL §7#20 追補の「.moira 他ファイル群の torn write/lost update は issue #17 で追跡」を実装完了後の状態へ書き換える | (1) §2.10 の規範文・公理・不変条件・訂正計器規則は一字も変えない (2) 日英 2 箇所が同期 (3) 既存追補と同形式（日付つき） (4) #17 追跡記述を解消し残余ゼロを記す（案 A により members/config も closure） | 規範本文の変更・新ルール追加・追跡記述の黙った削除 | yes | 2026-07-24 |
| R8 | D | DECISIONS-CATALOG D-79 注記の「.moira 他ファイル残余は #17 で追跡」を実装完了の記述へ更新する | (1) 判断一文・判定文・正直な開示欄は不変 (2) D-80 の新旧番号読み分け注意は保持 (3) 何が実装されたか（残余 6 ファイルのアトミック置換＋RMW 経路の advisory lock）を一言で記す | 判断一文の書き換え・#17 参照の黙った削除 | yes | 2026-07-24 |
| R9 | D | DECISIONS-CATALOG D-11 に実装状態注記を添える（争点②採択） | (1) 判断一文・判定文は不変 (2) #11/#16/#17 の均一適用を一言で記す (3) 日付つき | 判断一文の書き換え・過度な実装詳細の混入 | yes | 2026-07-24 |
| R10 | P | プロパティは新設せず文面も変えない——書き込み耐久性はプロパティ集の対象外という「変更不要」を確定 | (1) プロパティ集に差分ゼロ (2) #17 言及ゼロ | 今回のついでの新プロパティ起案 | yes | 2026-07-24 |

## ⑤ 実行計画承認＋一次資料セット確定

- 実行計画（経路列・依存順）:
  1. **C 面**（R1→R2→R3→R6→R4・R5）→ `/kiro-impl`（本環境では codex 非在のため独立敵対レビュー
     subagent で代替）＋CI。実装方式（受け入れ基準）: (i) capacity-store.ts saveJson を #16 の
     `atomicWriteFileSync` 経由へ (ii) store.ts の dates/milestones/labels/capacity を lock＋atomic 化
     （RMW は MoiraRepo 内で完結） (iii) **案 A**: members/config の RMW を MoiraRepo へ移設
     （`upsertMember`／`updateConfig`）し lock＋atomic で包む；commands.ts は repo メソッド呼び出しへ差し替え
     （observable 出力不変） (iv) witness テスト拡張
  2. **M 面**（R7）→ `moira-model-update`（§7#20 の #17 追跡記述解消・日英同期）
  3. **D 面**（R8・R9）→ `doc-refine`（D-79 注記の #17 解消＋D-11 実装状態注記追加）
  4. **P 確認**（R10）→ 照合 worker で「差分ゼロ」を確認（P5 内）
  5. P5 同期閉包 → P6 クローズ
  - **依存順の注記**: M/D 行は規範変更ではなく実装状態の追補——実装が完了して初めて真になる記述ゆえ
    実依存は C→注記（#11・#15・#16 と同型）
- 一次資料セット: moira/MODEL.md（v22・§2.10・§7#20）／moira/DECISIONS-CATALOG.md（D-11・D-79・D-80）／
  moira/PROPERTIES.md（v0.7）／issue #17 本文／#16 実装確定コミット（primitive の着地点）。
  背景（非正典・根拠にしない）: moira/changes/issue-11/・issue-15/・issue-16/ 台帳
- 統合実行の承認: yes（2026-07-24）——issue-16-17 worktree・#17 の base=#16 実装確定コミット・
  単一 P6 で両 issue クローズ
- 承認: yes（2026-07-24）

## issue コメントへの要約

- P6 で issue #17 へ HA 裁定要約を投稿予定（本セッションが実 HA のため）
