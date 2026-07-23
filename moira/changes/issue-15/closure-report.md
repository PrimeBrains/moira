---
status: working-ledger
issue: 15
---

# 閉包レポート — issue #15

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ④/② の行） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R5 | M-翻訳 | モデル文書の実装状態メモ | ④R5: 「#15 で追跡中」メモを実装完了へ・ルール本文は一字も変えない・日英同期・追補形式 | moira/MODEL.md §7#20「(2026-07-23 追補: #15 実装工程完了)」（日 664 行・英 667 行。規範文の diff ゼロ＝numstat 2 2） | Y |
| R6 | D | 設計判断カタログ D-79 のメモ | ④R6: 「残余は #15 で追跡」メモを実装完了へ・判断一文不変・新旧 #15 読み分け保持・実装内容を一言 | moira/DECISIONS-CATALOG.md D-79 末尾「参照実装の実装状態（2026-07-23・issue #15 実装工程完了）」（判定文 654 行は逐語不変） | Y |
| R7 | D | 設計判断カタログ D-1 のメモ | ④R7: 「#15 を参照」メモの整合・判断一文不変・最小の追補 | moira/DECISIONS-CATALOG.md D-1 末尾「参照実装の実装状態の追補（2026-07-23）」（1 行・D-79 へ委譲・判断一文 30 行は逐語不変） | Y |
| R8 | P | プロパティ集 | ④R8: 新設なし・文面変更なし・witness が増えるだけ | 変更なし（diff 0 行・#15 言及 0 件。witness は backend correction.test.ts 38 件で拡張） | Y |
| R9 | S | 受け入れシナリオ | ②R9: #11 既定判断を踏襲し S 級新規は起こさない | 変更なし（新規 unit/spec なし。将来の訂正機能シナリオ整備時に一括——D-79 注記にも明記） | Y |

補足（fork 裁定 2 件——読む義務はないが対応表の意図欄を補完）: F1「取り消し（nullify）は入口検証の対象外」（§2.5 の読み・2026-07-23 裁定）は R5/R6 の最終文に反映済み。F2「patch/nullify 読み分けの §2.10 本文明文化は現状維持」（2026-07-23 裁定）により正典規範文は不変のまま。

### ② できないことになったこと（平易な差分）

なし（本フローに deferred 行はない）。

参考（スコープ外の新規追跡——deferred ではない）: イベントログ本体（events.json）の同時書き込み保護は本 issue の対象外として **#16** に切り出し済み（OPEN・機械照合済み）。

### ③ 閉包判定

**PASS**（全 10 行 resolved・deferred 0・未マップ差分 ∅）

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | moira/backend/src/fold.ts | resolved | 試行 fold pre-admission（patch 限定・record 単位）実装。独立レビュー 3 巡 PASS・codex 2 巡（fold 本体はクリーン）・backend 201/201 green（P5 直前実走）。コミット 7e77a72→386f609 |
| R2 | moira/backend/src/correction.test.ts | resolved | witness 38 件（3 例拒否・先行有効読み保持・④計上・全部 or 無・多重集合差分判別・nullify 余波可視化——弱化/revert で実際に落ちることを実証） |
| R3 | moira/cli/src/store.ts | resolved | fs advisory lock（rename 奪取・dead-pid 限定・トークン release・GC）。codex Critical 是正確認済み・残余窓はコード内正直開示 |
| R4 | moira/cli/src/correct.test.ts | resolved | 40 件 green（実子プロセス並行 append の実排他——lock 無効化で lost update 落ち実証） |
| R5 | moira/MODEL.md §7#20 | resolved | moira-model-update ゲート PASS（残存 C/I 0・意図整合 ALIGNED）。コミット 312f954 |
| R6 | moira/DECISIONS-CATALOG.md D-79 | resolved | doc-refine ゲート PASS（fact-check NO_OBJECTION・fork 被覆監査 OK）。コミット 6bb88c8 |
| R7 | moira/DECISIONS-CATALOG.md D-1 | resolved | 同上（最小追補・判断一文逐語不変） |
| R8 | moira/PROPERTIES.md | resolved | 変更なし照合（diff 0・#15 言及 0） |
| R9 | シナリオ/E2E | resolved | HA 裁定（S 級新規なし）＝批准記録が証跡 |
| R10 | frontend HealthSurface | resolved | 変更なし・typecheck クリーン・172/172 green（P5 実走）。GitHub CI（e2e 含む）は P6 push 後に実走——ローカル証跡は unit/typecheck まで（正直開示） |

ラウンド詳細は gate-round-records.md（C 面: 実装→独立レビュー R1〜R3→codex 2 巡→HB F1／M 面・D 面: 各ゲート R1 PASS）。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: 6b0e45dbb94be557727d2cde40866ca2dfe8f055（worktree 分岐点＝fresh origin/main）
- HEAD（P5 開始時点で固定): 6bb88c80a6a91d3b425ee908871bfd805ff991cb
- 未マップ差分: 空（changed 6 パス＝R1〜R7 の mapped パスに全一致。`moira/changes/**` は自己除外）
- 判定有効性: 照合中に非台帳パスの HEAD 移動なし（P5 中のコミットは台帳のみ・検査対象外）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

deferred 行なし。参考: スコープ外切り出しの #16 は `gh issue view 16 --json state` → OPEN（D ゲート fact-check で機械照合済み）。

</details>
