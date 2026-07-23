---
status: working-ledger
issue: 15
---

# ゲートラウンド決着記録 — issue #15

## C 面ゲート（R1〜R4・R10 / 実装＋独立レビュー＋codex＋CI）

### 実装（コミット 7e77a72）

- 著者: sonnet worker（/kiro-impl 相当・worker=sonnet は HA ⑤批准どおり）
- 内容: 試行 fold 方式の pre-admission（エラー多重集合差分・record 単位全部 or 無）＋
  fs advisory lock（wx 生成・有界リトライ・stale 奪取）＋witness 6 件＋lock テスト 4 件。
  backend 199 / CLI 348 green。

### 独立レビュー R1（kiro-review 規律・著者≠レビュワー・2026-07-23）

- verdict: REJECTED（Critical 0・Important 4・Minor 4）
- I-1: nullify への gate 2 適用が批准列挙外・MODEL §2.5 と緊張（実走で拒否を確認）
  → **genuine fork F1 として fork-batch.md へ**（即時割込みせずバッチ化）
- I-2: 多重集合差分の判別 witness 不在（件数比較への弱化で全テスト通過）→ 是正指示
- I-3: release pid ガード両分岐が未テスト（単一プロセス seam で検証可能と実証）→ 是正指示
- I-4: 奪取の steal 対 steal 窓のコメントが楽観的 → 是正指示
- 攻撃角 8 面（preState 基線・多重集合差分・全部 or 無・既存挙動不変・nullify・lock・
  テスト非空虚性・+1 fold 上限）はいずれも検証済み・中核は健全

### codex 独立レビュー R1（npx CLI・read-only・2026-07-23）

- fold.ts: FYI クリーン（winner/preState 進行・計器・record 単位に欠陥なし）
- store.ts Critical: stale 奪取が所有権安全でない（unlink が判定時ファイルと同一の保証なし
  ——steal 対 steal で二重クリティカルセクション→lost update）
- Important 3: 生存 pid でも 30s で奪取可能（heartbeat なし）／release の TOCTOU（pid-only）／
  逐次テストでは排他を witness できない・stale-by-age テストが生存 pid 奪取を是認
- Minor 2: rename 失敗時 tmp 残存／nullify 拒否 witness 欠如（→F1 と同根・裁定待ち扱い）

### 是正（コミット df6aecc）

- 奪取を atomic rename 方式へ（勝者のみ我有化・敗者 ENOENT 再競合・捕獲後に内容再検証）
- stale 判定を dead pid（ESRCH）限定へ（生存 pid は mtime 経過でも奪わない・mtime は
  内容不能時 fallback のみ）・枯渇時 CliError にパス＋保持 pid・rename 失敗時 tmp 掃除
- I-2 witness（-5→-3 patch・件数比較弱化で落ちることを実証）・I-3 両分岐テスト・
  実排他 witness（実子プロセス保持中の並行 append・lock 無効化で lost update して落ちることを実証）
- backend 200 / CLI 353 green

### 是正確認 R2（両レビュワー・2026-07-23）

- 独立レビュワー: **PASS**——I-2/I-3/I-4＋codex Critical すべて CONFIRMED-FIXED
  （弱化検証の机上トレース裏付きで非空虚性確認）。新規 Critical/Important なし（FYI 4:
  dead-pid 限定の可用性トレードオフ・.steal-* 孤児・実排他テストのデスケジュール flake 余地・
  spawn 失敗時 unhandled rejection edge）
- codex: 是正 6 項目中 4 CONFIRMED-FIXED・1 PARTIAL（≥3 者交錯の奪取残余——コード内
  開示済み・best-effort 契約内として受容）・1 NOT-FIXED（release の pid-only 照合）＋
  新規 Minor（.steal-* 恒久残置）→ 追加是正指示

### HB fork 裁定（F1・2026-07-23）

- 裁定: **(a) nullify は gate 2 の対象外**（§2.5「誤記表明後の残存列」教義——取り消しは適用し、
  余波の不整合は可視の導出結果として残す）。fork-batch.md 参照。

### F1 反映＋残余是正（コミット 386f609）

- fold.ts: 試行 fold を patch 限定に・§2.5/§2.10 読み分けコメント
- correction.test.ts: nullify 余波可視化 witness（一様ゲート revert で落ちることを実証）
- store.ts: release を pid＋取得毎トークン照合へ・.steal-* dead-pid 限定 GC
- backend 201 / CLI 355 green
- 受容済み残余（正直開示・コード内コメントに記載）: ≥3 者交錯の奪取窓・release TOCTOU
  （通常運転での現実トリガなし・pid 再利用のみ理論残余）・live-capture 分岐は reasoned-not-tested

### 最終確認 R3（独立レビュワー）

- verdict: **PASS——C ゲートを閉じてよい**（2026-07-23）
- ①F1 裁定への意図整合 CONFIRMED（nullify の局所チェックスキップは型で正当——CorrectionNullify に patch フィールドなし）
- ②witness 非空虚性 CONFIRMED（両版実走比較で裁定前後の挙動反転を確認）
- ③トークン化・GC に新規 Critical/Important なし（GC と進行中 steal のレースまで敵対的に検査——無害と確認）
- ④backend 201/201・CLI 353+2 skip・tsc 両クリーン（レビュワー実走）
- 新規指摘は FYI 2 件のみ（GC コメントの表現・live-capture 孤児の設計どおり残置）

### C ゲート完了時検査（2026-07-23）

- changed（base 6b0e45d..HEAD・moira/changes/ 自己除外後）: fold.ts・correction.test.ts・store.ts・correct.test.ts の 4 パス
- mapped（R1〜R4）との差 = ∅——P2 差し戻しなし

## M 面ゲート（R5 / moira-model-update・MODEL §7#20 実装状態追補）

### ドラフト（未コミット・日英 2 段落のみ）

- 著者: 主コンテキスト。§7#20 に「(2026-07-23 追補: #15 実装工程完了)」を日英同形式で追記。
  規範文（§2.10 等）は不変（git diff --numstat = 2 2・単一 hunk）。

### ラウンド 1（敵対 Claude 1＋codex 1・fact-check・2026-07-23）

- moira-adversary（V1〜V6）: Critical 0・**Important 1**（追補「3 例」が §2.10 列挙 4 例と
  未和解——第 4 例〔非人間 actor→agreed〕の扱いを読者が判定できない完全性ギャップ）・
  Suggestion 1（「常に適用」の絶対性 vs 幽霊 nullify）・FYI 1（§2.10 単読時の表層語彙緊張）・
  **FORK F-A**（patch/nullify 読み分けの将来 §2.10 明文化 vs §7 開示のみ）
- codex（独立ベンダー・写像: 自尺度 Important→Important・格下げなし）: Critical 0・
  **Important 1**（D-1/D-79 同期主張の時制——カタログ現物は未同期のため完了形は不一致。
  対処案 (b) 予定表現へ弱める）・FYI 5（実装照合一致・nullify 整合・lock 記述正確・
  日英同期・diff 範囲 2 行のみ）。生ログ: scratchpad/codex-review-attempt1.log
- moira-fact-checker: claim 1/3/5/7 CONFIRMED・claim 2/4 の green と claim 8 の diff 範囲は
  ワーカーのツール制約で UNVERIFIABLE → **著者が新鮮証拠で解消**（backend 201/201・
  CLI 353+2 skip を本セッションで実走・git diff --numstat 2 2 を実走記録）・claim 6 は
  時制確認要請（codex Important と同根）

### パッチ（著者・同ラウンド内）

- Important（敵対者）: 「第 4 例は #11 で入口検証済み・列挙 4 例すべてが patch 訂正の
  入口検証で覆われる」を日英に明記 → 修正済み
- Important（codex）: D-1/D-79 同期文を予定表現（「後続の文書ゲートが引き受ける」/
  "owned by a SUBSEQUENT document gate"）へ弱め → 修正済み
- Suggestion: 「常に適用され」→「入口検証では拒否されず(幽霊訂正の可視ギャップ扱いは
  従前どおり)」へ日英とも修正済み

### HB fork 裁定（F2・2026-07-23）

- FORK F-A → fork-batch.md F2 として HB へ。裁定: **(B) 現状維持**（§7#20 開示のみ・
  将来の訂正機能シナリオ整備時に再訪）。追加作業なし。
