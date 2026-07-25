---
name: kiro-postmortem-review
description: Aggregate entries across BOTH ledgers — .kiro/postmortem/defects.md (defects) and .kiro/analysis/entries/ (non-defect changes) — produce a 4-axis frequency report (要因分類 × 検知工程 × 対象システム × 根本要因分類, plus 変更分類) and clusters, extract Try candidates, and hand them off to /kiro-steering-custom for steering reflection. Invoke when the unanalyzed queue reaches 10, a month has passed since the last aggregation, when the same root-cause label crosses 2 unreviewed entries, or on user demand.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion, Skill
argument-hint: <scope filter, optional. e.g. "since:2026-07-01" or "system:backend">
metadata:
  origin: "custom"
---

# kiro-postmortem-review Skill

## 役割

**両台帳**——`.kiro/postmortem/defects.md`（障害）と `.kiro/analysis/entries/`（非障害の変更）——を読み込み、
4 軸 (要因分類 × 検知工程 × 対象システム × 根本要因分類。加えて変更分類) で集約分析し、Try 候補を抽出して
`/kiro-steering-custom` 経由で `.kiro/steering/*.md` に反映する skill。Check-Act フェーズを担当。

規範は [`.kiro/steering/moira-change-analysis.md`](../../../.kiro/steering/moira-change-analysis.md)（工程・項目定義・トリガ）。
**2026-07-25 改訂（issue #19）**: 集約対象を両台帳へ拡張・`Schema: v1|v2` の 2 様式受理・死んだ起動トリガーの差し替え。

## コアミッション

**ミッション**: 蓄積された**両台帳**の要因分析から、横展開可能な学習 (Try) を抽出し steering 化する。

**成功基準**:
- 全有効 entry が読み込まれる。**`Schema: v1`（旧 10 項目）entry を malformed にしない**——欠落項目は
  `unknown` として集計に載せる（2026-07-25・issue #19。**唯一の既存 entry が黙って集計から消える事故の防止**）
- 真に malformed な entry（H3 見出しやメタ行を欠く等）のみ ID 報告のうえスキップ
- 4 軸頻度集計 + クラスタリング + 同件 cross-reference の構造化レポートを生成
- Try 候補にソース entry IDs が併記され、ユーザーが verification できる
- 承認された Try は `/kiro-steering-custom` 経由でのみ steering 反映
- 反映成功時、ledger の `## Steering 反映ログ` に back-reference が append され、該当 entries の `Status:` が `steered` に更新
- 反映失敗 / 却下時、ledger entries の Status は保持され、Try は次回再評価可能

## 実行ステップ

### Step 1: コンテキスト収集

- `.kiro/postmortem/defects.md` を Read (障害台帳の全体)
- `.kiro/analysis/INDEX.md` と `.kiro/analysis/entries/*.md` を Read (**非障害台帳**)
- `.kiro/steering/moira-change-analysis.md` を Read (項目定義・出所ラベル・トリガの規範)
- `.claude/skills/kiro-postmortem-add/rules/taxonomy-reference.md` を Read (**有効ラベル定義の正本**)
- `.claude/skills/kiro-postmortem-review/templates/review-report.md` を Read (レポート出力テンプレ)
- `.claude/skills/kiro-postmortem-review/templates/steering-handoff.md` を Read (ハンドオフテンプレ)
- 引数で `scope filter` が渡されていれば抽出条件として保持 (例: `since:2026-07-01` / `system:backend`)

### Step 2: Ledger のパース

- **障害台帳**を section 単位でパース:
  - `## Entries` セクション内の各 entry を `### {ID}: {title}` の H3 で分離
  - 各 entry から `Status:` / `Entry ID:` / `Created:` / `Source:` メタ行（＋あれば `Key:` / `Schema:` /
    `Verdict:`）と項目本文を抽出
- **非障害台帳**をパース: `.kiro/analysis/entries/*.md` の frontmatter（`key` / `schema` / `status` /
  `verdict`）と 16 見出しの本文を抽出
- **2 スキーマ受理（最重要）**:
  - `Schema: v2` → 16 項目（現行様式）
  - `Schema: v1` **または schema 指定を持たない既存 entry** → **旧 10 項目様式とみなす**。
    **判定は大小文字非依存**——障害台帳は本文メタ行 `Schema: v2`、非障害台帳は frontmatter `schema: v2` と
    表記が異なるため、`schema`／`Schema` のどちらでも同じに読む（非障害 entry を v1 と誤判定しない）。
    新様式の項目に対応がないものは **`unknown` として集計に載せる**——**v1 を malformed にしない**
  - 旧 10 項目 → 新項目への対応: 発生機能→対象システム（**旧ラベルは対象システムに写らないため `unknown`**）／
    発生した不具合→事象／検知した工程→14／検知すべき工程→13／検知できなかった理由→15／
    要因分類・根本要因分類・根本要因詳細→8／同件調査→10／次回からの対応策→12。
    **障害判定は `障害`**（本台帳の定義上）、変更分類・変更範囲・発生原因サマリ／詳細・同件調査対象・
    同件の対応状況・検知対策は **`unknown`**
- Malformed 判定（**真に壊れているものだけ**）:
  - H3 見出しが無い／メタ行（`Status:` / `Entry ID:`）が欠落 → malformed
  - 本文が空 → malformed
  - **項目数が 17 に満たないことは malformed の理由にしない**
- Malformed entry の ID をリスト化、レポート Summary に記載してスキップ
- Scope filter 適用 (該当する場合):
  - `since:DATE` → `Created` / `analyzed-at` が DATE 以降のもののみ
  - `system:LABEL` → `対象システム` が LABEL (サブスコープ含む先頭一致) のもののみ

### Step 3: 頻度集計

4 軸の頻度を集計:

- **R3 要因分類**: ラベル毎の count + percentage
- **R4 検知工程ギャップ**: `(検知すべき工程, 検知した工程)` のペア毎に count + 「すり抜けた検証層／工程」解釈
  （V モデル軸とプロセス軸の両方を含む）
- **R13 対象システム**: `backend` / `frontend` / `cli` / `adapter` / `process` / `other`
  (サブスコープは無視して親ラベルで集計) の count + percentage
- **R14 根本要因分類**: ラベル毎の count + percentage
- **R15 変更分類**: ラベル毎の count + percentage（**障害・非障害の別も併記**）

Status 別 breakdown も併せて算出 (`recorded` / `reviewed` / `steered`、非障害は
`drafted` / `ratified` / `aggregated`)。

**出所の健全性**も集計する（`derived` / `inferred` / `captured` / `unknown` の割合と、
**`unknown` が集中している項目**）——特定項目への `unknown` の集中は「その情報を採取していない」という
**仕組みの穴の兆候**であり、Try の材料になる。

### Step 4: クラスタリング

- **By 根本要因分類**: 同 R14 ラベルを共有する有効 entry の ID リスト
- **By 対象システム**: 同 R13 ラベル (親ラベル) を共有する有効 entry の ID リスト
- **Cross-reference**: `同件調査結果` / `同件の対応状況` で他 entry・issue を参照しているもの
  (entry ID・キー同士のグラフ) を構築

### Step 5: Try 候補の抽出

Try 候補抽出ロジック:

1. 各 `根本要因分類` クラスタについて:
   - Cluster size >= 2 (同根本要因が 2 件以上)、または最新 entry が `recorded` status のもの
   - そのクラスタ内の各 entry の `再発防止策 (項目 12)`（v1 entry は `次回からの対応策 (項目 10)`）を読み、
     共通項を抽出してマージ
   - 1 つの Try に集約 (例: 3 件の `assumption-error` が異なる対応策を提案していても、メタ原則として「自明と判断したら検証手段を整備する」のような共通項を抽出)
2. 各 Try に以下を付与:
   - Source entry IDs (該当クラスタの全 entry)
   - Proposed steering target ファイル名 (命名規約は `templates/steering-handoff.md` の Filename Naming Convention 参照)
   - Try Content (steering ファイルに書き込まれる本文の draft)
   - Rationale (motivating evidence、各 entry の根本要因詳細と Try 抜粋)

### Step 6: Summary とバグ別 Walkthrough の提示

まず Summary (counts, status breakdown, malformed, 4 軸 frequency, clusters) を **簡潔に** 提示。次に **バグ 1 件ずつ** 以下のフォーマットで要因分析を説明し、各 Try に対する verdict をその場で求める:

```
# Bug #{ID}: {title}

## 何が起きた
(1-2 段落の本質的記述、技術詳細は ledger 参照)

## 要因分析の 4 軸読み
(対象システム / 要因分類 / 検知工程ペア / 根本要因 を表形式で。変更分類と障害判定も添える)

## 根本要因の本質
(なぜそのメカニズムが発動したか、1-2 段落)

## 抽出される Try
(Rule + 提案 steering ファイル名)

## 判定
(AskUserQuestion で approved / rejected / pending)
```

ユーザーが N 件のバグについて 1 件ずつ判定する。**この段階では ledger も steering も書き換えない** (Step 8 でまとめて反映)。

### Step 7: Verdict 収集 (skip — Step 6 で同時収集)

Step 6 のバグ別 walkthrough の中で verdict が収集されるため、独立した Step 7 は不要。

### Step 8: バッチハンドオフ (全 verdict 集約後に一括反映)

全バグの verdict が出揃ったら、以下を **まとめて 1 回で実施**:

1. **Approved Tries の hand-off (順次・大カテゴリへ集約)**:
   - **集約方針**: PDCA Try は **大カテゴリの 1 ファイル** に H2 セクションとして append する。新規ファイル作成は新しい大カテゴリが立つ時のみ
   - 主な大カテゴリ steering ファイル例:
     - `testing-conventions.md` ← assumption-error / verification-gap / preventing-false-pass / integration-test 等のテスト戦略系
     - `structure.md` ← Single Source of Truth / boundary 設計 / ファイル配置原則 等の構造系
     - `tooling-traps.md` (将来) ← ライブラリ / ツール固有の落とし穴
   - 各 Approved Try について:
     1. Try のカテゴリを判定 (既存大カテゴリ or 新規)
     2. 既存カテゴリなら該当ファイルに H2 セクション (`## {Try title}`) を **append**
     3. 新規カテゴリなら `/kiro-steering-custom` で新ファイル作成 (慎重に判断、横並びの細粒度ファイル乱立を避ける)
   - steering ファイルは **必要十分に簡潔** に保つ (Rule + Evidence 短文中心、各セクション 20-40 行目安)
   - `/kiro-steering-custom` の成功 / 失敗を記録

2. **Ledger 一括更新 (1 トランザクション相当。**両台帳**が対象——非障害 entry は frontmatter の
   `status` を更新する)**:
   - **非障害 entry（`.kiro/analysis/entries/`）の状態語彙は別系統**: `drafted` → `ratified` → **`aggregated`**。
     集約に載せた時点で frontmatter の `status` を `aggregated` にする。**`steered`／`reviewed` を書かない**
     （障害側の語彙。Try の steering 化は `## Steering 反映ログ` が一元記録する）
   - Approved + steering 化成功: 該当 entry の `Status:` → `steered`、`## Steering 反映ログ` に back-reference を append
   - Approved + steering 化失敗: Status 変更せず (`recorded` 保持)、Try は次回再提示
   - Rejected: 該当 entry の `Status:` → `reviewed`
   - Pending: Status 変更せず (`recorded` 保持)

3. **`## Steering 反映ログ` の append フォーマット**:

```markdown
### {{TIMESTAMP_ISO_8601}}

- Source entries: {{SOURCE_ENTRY_IDS}}
- Target steering: {{TARGET_STEERING_PATH}}
- Try summary: {{TRY_SUMMARY}}
- Handoff result: success
```

複数 Try を同セッションで反映した場合、各 Try ごとに 1 ブロックずつ append (時系列順)。

### Step 9: 最終レポート

集約結果を `.kiro/analysis/reviews/<YYYY-MM-DD>.md` に保存する
（様式: `.claude/skills/moira-change-analysis/templates/aggregate-report.template.md`）。
そのうえでユーザーに以下サマリーを 1 回で提示:

```
✅ Steered entries: #..., #... → .kiro/steering/{...}.md, ...
↩️ Reviewed (rejected) entries: #...
⏸ Pending entries: #...
❌ Failed handoff: #... (再評価可能)
```

## 重要な制約

- **Read-mostly**: ledger entry 本体（項目本文）は本 skill から変更しない (R6.5)。
  **既存 entry の遡及書き換えもしない**（v1 を v2 へ移し替えない）
- **Status と `## Steering 反映ログ` のみ Edit**: ledger 内で書き換える対象はこの 2 種類だけ
- **Batch reflection**: バグごとに個別 verdict を集めるが、ledger / steering への書き込みは **全 verdict が出揃ってから 1 回でまとめて反映** する (途中で書き込まない)
- **Steering ファイルは必要十分に短く**: Rule + Evidence 短文を中心に 20-40 行目安。詳細記述は ledger entry に残し、steering 側で重複させない
- **`.kiro/steering/` への直接書き込み禁止**: 必ず `/kiro-steering-custom` 経由 (R6.6, R7.1)
- **Back-reference は append-only**: `## Steering 反映ログ` の既存エントリは編集しない (R7.4)
- **失敗 Try は ledger 保持**: 反映失敗 / 却下時に entry status は `recorded` のまま、Try は次回再提示可能 (R7.3)
- **他 skill / settings.json 不変**: `.claude/skills/`（本 skill 自身以外）と `.claude/settings.json` を変更しない
- **UTF-8 保持** (R10.4)
- **Malformed entry handling**: ID を report に記載してスキップ、他 entry の処理は継続 (R10.1)。
  **ただし `Schema: v1`（項目数が少ないこと）を malformed の理由にしない**——欠落は `unknown` として集計に載せる
- **FS エラー時の write 中止**: ledger が読めない場合 write しない (R10.5)

## 出力の説明

最終出力:

```
Status: completed | cancelled | error
Ledger snapshot:
  Total entries: N
  Valid entries: M
  Malformed (skipped): [ID list]
  Status breakdown: recorded=R, reviewed=V, steered=S

Frequency report:
  (4 軸テーブル: 詳細は templates/review-report.md 展開結果)

Clusters:
  By 根本要因分類: ...
  By 発生機能: ...
  Cross-ref: ...

Try Candidates:
  Try 1: {{SUMMARY}} (sources: #..., verdict: approved/rejected/pending)
  Try 2: ...
  ...

Steering Reflections:
  - Source entries: ... → Target: ... (success/failed)
  - ...
```

## 安全性とフォールバック

- **Ledger 不在**: `.kiro/postmortem/defects.md` が存在しない場合、エラー表面化して終了 (skill としては「まず `/kiro-postmortem-add` を起動して ledger を初期化してください」とユーザーに指示)
- **全 entry が malformed**: 有効 entry 0 件で集計対象がない場合、Summary のみ出力して終了
- **Hand-off skill 不在 / 不可用**: `/kiro-steering-custom` がエラーで起動できない場合、Try 候補だけ生成してユーザーに後日の手動反映を提案
- **同時起動**: 本 skill は read-mostly なので同時実行による race condition は起こりにくいが、Step 9 の Status Edit 前に ledger の mtime を再確認し、変化があればユーザーに resolve を求める
- **Scope filter 無効値**: 不正な scope filter (`since:invalid` 等) が渡されたら無視して全件対象で続行 + 警告メッセージ

## 注記

- 本 skill は対話的に動作し、自動化を意図しない。Try 抽出後の steering 化は必ずユーザー確認を経る
- `templates/steering-handoff.md` で構造化された Try は、ユーザーが `/kiro-steering-custom` の対話入力としてそのまま貼り付けて利用できる形式
- ledger が小規模 (N < 10) なうちは Try 抽出が "ノイズ" になる可能性。最低 cluster size (現状 2) は内部閾値として固定だが、運用後に調整余地あり
- 本 skill 自身に起因する不具合は `process / kiro-postmortem-review` サブスコープで `/kiro-postmortem-add` に
  記録される (dogfooding)
