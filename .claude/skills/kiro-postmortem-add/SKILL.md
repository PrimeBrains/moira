---
name: kiro-postmortem-add
description: Append a defect entry to .kiro/postmortem/defects.md with 16 mandatory fields (対象システム / 事象 / 障害判定 / 変更分類 / 変更範囲 / 発生原因サマリ / 発生原因詳細 / 根本要因 / 同件調査対象 / 同件調査結果 / 同件の対応状況 / 再発防止策 / 検知すべき工程 / 実際に検知した工程 / 検知できなかった理由 / 検知するための対策), each carrying a provenance label. Use when a change has been judged a defect and its root cause is clarified — either proactively by the AI, on user demand, or delegated from the change-analysis intake (moira-change-analysis A0).
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <one-line defect summary, optional>
metadata:
  origin: "custom"
---

# kiro-postmortem-add Skill

## Role

**障害**（不具合）1 件分を `.kiro/postmortem/defects.md` ledger に **16 項目埋めた構造化エントリ** として
追記する skill。Plan-Do フェーズを担当。AI が能動的に提案、ユーザーが任意で起動、または
要因分析フローの受付（`moira-change-analysis` A0）から**障害と判定された件が委譲**されてくる。

**非障害**は本 skill の対象外——`.kiro/analysis/` 側に記録される（振り分けは A0 が行う）。
規範は [`.kiro/steering/moira-change-analysis.md`](../../../.kiro/steering/moira-change-analysis.md)。

## Core Mission

**Mission**: 障害 1 件を漏れなく構造化記録し、後段の `/kiro-postmortem-review` が
（`.kiro/analysis/` の非障害 entry と**あわせて**）集約分析できる入力として ledger に蓄積する。

**Success Criteria**:

- 全 16 項目が**出所ラベル付き**で埋まった entry が ledger 末尾に append される
  （**根拠を示せない欄は `unknown` と記録する**——空欄・推測での穴埋めは禁止）
- 既存 ledger 内容が byte-for-byte 保持される (append-only)
- タクソノミー外ラベル入力時は同一操作の中で**正本**（`rules/taxonomy-reference.md`）＋ ledger ヘッダ要約を更新
- 完了後、`rules/trigger-detection.md` のトリガー条件を判定し、該当時は `/kiro-postmortem-review` 起動を 1 行で提案

## Execution Steps

### Step 1: Context Gather

- Read `.kiro/postmortem/defects.md` (既存 ledger があれば。存在しない場合は Step 2 で初期化)
- Read `.claude/skills/kiro-postmortem-add/rules/taxonomy-reference.md` (**タクソノミー定義の正本**・5 軸)
- Read `.claude/skills/kiro-postmortem-add/rules/trigger-detection.md` (review トリガー判定ロジック)
- Read `.kiro/steering/moira-change-analysis.md` (項目定義・出所ラベル・判定基準の規範)
- 委譲元（`moira-change-analysis` A0）から渡された証跡束があればそれを使う。無ければ会話文脈と
  `git diff --stat` / `git diff --name-only` から変更ファイルパスを把握する

### Step 2: Initial Ledger Creation (ledger 不在時のみ)

- Read `.claude/skills/kiro-postmortem-add/templates/ledger-header.md` をテンプレ展開し、
  その `## Entries` 節以降（雛形）を含めてそのまま `.kiro/postmortem/defects.md` として Write 新規作成
- **初期 seed の自動投入は行わない**（2026-07-25 改訂・issue #19）——空の `## Entries` 節で作る。
  破棄済みデータを復活させない・Entry ID を衝突させないため
- テンプレ内の相対リンクは **ledger の位置（`.kiro/postmortem/`）基準**で書かれている（そのまま展開してよい）

### Step 3: Draft 17 Fields

証跡束・会話文脈・git diff・変更ファイルパスから 16 項目のドラフト値を推論する。
**各項目に出所ラベルを付ける**——`derived`（履歴から写した・出典必須）／`inferred`（AI 推論・根拠必須）／
`captured`（変更管理フロー実行時の一次記録）／`unknown`（埋められない）。

| Field | 推論方法 |
|---|---|
| 1. 対象システム | 変更ファイルパス → `backend`（`moira/backend/`）／`frontend`（`moira/frontend/src/...`）／`cli`（`moira/cli/`）／`adapter`／`process`（`.claude/skills/`・`.kiro/steering/`・確定文書） |
| 2. 事象 | Given/When/Then ＋ 期待値・実際値。症状の報告・witness テストの落ち方から起こす |
| 3. 障害判定 | 本 ledger は `障害` のみ（A0 の判定を転記し、根拠を添える） |
| 4. 変更分類 | 是正なら `bugfix`。仕組み側の是正なら `process-improve` 等 |
| 5. 変更範囲 | 影響マップ（`moira/changes/issue-N/impact-map.md`）のクラス列 M/D/P/S/C/V/F |
| 6. 発生原因サマリ | **専門用語なし**の平易文 1〜2 文 |
| 7. 発生原因詳細 | 技術者向け。出典パス（コード・台帳）を伴う |
| 8. 根本要因 | **仕組み帰責を必ず一度は問う**（SKILL / steering / テンプレート / 工程配線 / タクソノミー / 人間タッチポイント設計に穴がなかったか）＋根本要因分類・要因分類ラベル。**撤回条件タグの規律**: 「敵対ゲートで追跡付き deferred にした Important の実害化」なら `[deferred-important]`、「R/D/T 使い捨て方針下での維持 spec 不在／再生成物の不忠実」なら `[rdt-disposal]`、「変更管理フローで事前批准した意図と agreed 文面の乖離の実害化」なら `[intent-drift]` を本文に含める（各 steering の撤回条件トリガが grep で数えるため。該当しなければ付けない） |
| 9. 同件調査対象 | 走査した母集団を明示（既存 entry・`.kiro/analysis/entries/`・open issues）。**範囲を書かない「該当なし」は不可** |
| 10. 同件調査結果 | **両台帳**を意味検索し、同じ根本要因／要因分類を持つ過去 entry の ID・キーを列挙 |
| 11. 同件の対応状況 | 別 issue のキー＋リンク＋state（`gh issue view <N> --json state`） |
| 12. 再発防止策 | Try 候補（**出口を名指す**: steering / skill / テンプレート / 計器） |
| 13. 検知すべき工程 | V モデル軸（`impl-error` → `unit-test` 等）またはプロセス軸（波及漏れ → `p2-impact-survey` 等） |
| 14. 実際に検知した工程 | `moira/changes/issue-N/gate-round-records.md` の指摘ラウンドが一次証跡。無ければ会話文脈から |
| 15. 検知できなかった理由 | 13 ≠ 14 の差分から。13 = 14 なら「該当なし（同工程で検知）」 |
| 16. 検知するための対策 | 計器・ゲート・チェックリストのどれを足すか名指す |

### Step 4: User Confirmation Loop

> **委譲時の縮退（重要）**: `Source: analysis-intake`（要因分析フロー A0 からの委譲）の場合、
> 人間の確認対象は **HX の 4 群のみ**（障害判定・根本要因・再発防止策・検知対策）に縮退する——
> 残りは**表示のみ**で、確認を求めない（規範 `.kiro/steering/moira-change-analysis.md` §1 HX）。
> 直接起動（`Source: organic`）のときは従来どおり全フィールドを確認する。

- 各フィールドのドラフト値と**出所ラベル**をユーザーに提示
- ユーザーが確認 / 修正 / 拒否を選べる対話
- タクソノミー外ラベルを入力した場合:
  - 既存タクソノミーから類似候補を 3 つ提示
  - ユーザーが既存選択 or「同一操作の中でタクソノミー拡張」を選ぶ
  - 拡張を選んだ場合: **正本**（`rules/taxonomy-reference.md`）の該当節に新ラベル行を Edit で追加し、
    `.kiro/postmortem/defects.md` ヘッダの**要約**を必要に応じて追随させる
    （**2 ファイル**。2026-07-25 改訂・issue #19: 旧「3 ファイル同期」の 3 つ目
    `.kiro/specs/defect-pdca/requirements.md` は**対象ファイルが存在しない**ため削除した）

### Step 5: Validation & Append

- **必須 16 項目すべてが非空**であることを検証する。**`unknown` は有効な記入**（埋められないことの記録）であり、
  空欄は不可——1 つでも空なら append を拒否し、欠落フィールドを明示してユーザーに戻す (Step 4 ループ)
- 各項目に**出所ラベルが付いている**ことを検証する（欠けていれば同じく差し戻し）
- 検証通過したら:
  - 既存 ledger から最大 Entry ID を抽出 → 次 ID を算出
  - `templates/entry-template.md` をテンプレ展開（17 フィールド ＋ メタ: `Key`・`Schema: v2`・`Verdict: 障害`）
  - `Status: recorded`、`Source:` は `organic`（通常追記）または `analysis-intake`（A0 からの委譲）
  - `Created:` に現在の ISO 8601 UTC タイムスタンプ
  - `.kiro/postmortem/defects.md` の `## Entries` セクション末尾に Edit で append（既存内容を保持）
  - **非障害の entry をここに書かない**（`.kiro/analysis/` 側の責務）
- Append 前に ledger ファイルの mtime を Read で再確認し、Step 1 の Read から変化していたら
  concurrent write 疑いとしてユーザーに通知

### Step 6: Post-Append Trigger Detection

`rules/trigger-detection.md` のロジックに従い、`/kiro-postmortem-review` 起動を提案すべきかを判定:

1. 未分析キューが 10 件以上? → `queue-threshold`
2. `recorded` status の entry で同じ `根本要因分類` または `要因分類` が 2 件以上? → `cluster-threshold`
3. 前回の横断集約から 1 か月経過? → `periodic`

該当時は 1 行で提案:

```
/kiro-postmortem-review を起動しますか？ 未分析 X 件・該当トリガー: {triggers}
```

未該当 or `user-explicit` のみは提案不要。**AI はユーザー確認なしに起動しない。**

### Step 7: Output

ユーザーに以下を報告: `appended` / `cancelled` / `error` の status ／ Entry ID ／ ledger path ／
**出所ラベルの内訳（`unknown` の欄は全列挙）** ／ (該当時) review トリガー提案。

## Critical Constraints

- **Append-only**: 既存 ledger 内容を byte-for-byte 保持
- **All-or-nothing**: 必須 16 項目すべてが非空になるまで append しない（`unknown` は非空として扱う）
- **捏造禁止**: 根拠を示せない欄は `unknown`。**空欄を埋めるための推測を書かない**
- **遡及書き換え禁止**: 既存 entry（`Schema: v1` = 旧 10 項目）を新様式へ書き換えない
- **Partial-write 禁止**: ユーザーが mid-flow で却下したら何も書き込まない
- **Steering へ直接書き込み禁止**: 本 skill は `.kiro/steering/` を一切変更しない
  （steering 書き込みは `/kiro-postmortem-review` 経由 ＋ `/kiro-steering-custom`）
- **他 skill / settings.json 不変**: `.claude/skills/kiro-*/`（本 skill 自身以外）と `.claude/settings.json` を変更しない
- **非障害を書かない**: 障害以外は `.kiro/analysis/` 側（`moira-change-analysis`）の責務
- **UTF-8 保持**: 日本語テキストを正規化せずに保持
- **FS エラー時の write 中止**: ledger が読めない場合 write しない
- **In-progress draft 復帰**: 前回中断ドラフトの取扱いをユーザーに確認

## Output Description

```
Status: appended | cancelled | error
Entry ID: 0002
Key: moira#16
Ledger: .kiro/postmortem/defects.md
Provenance: derived 6 / inferred 9 / captured 1 / unknown 0
Unknown fields: (なし)
(以下、該当時のみ)
Review Trigger Proposal: /kiro-postmortem-review を起動しますか？ 未分析 11 件・該当トリガー: queue-threshold
```

## Safety & Fallback

- **Concurrent write 検知**: append 直前に ledger mtime を再 Read で確認、Step 1 から変化していれば resolve を求める
- **FS エラー**: ledger が読み取り不可の場合、エラー表面化して write 中止
- **Malformed ledger 検知**: `## Entries` セクションが見つからない場合、append 位置を特定できないため write 中止して報告
- **Hand-edit 後の整合性**: Entry ID が単調増加でない場合、最大 ID + 1 を採用（決定論性は維持）
- **タクソノミー外ラベルでのキャンセル**: 既存ラベル選択も拡張も拒否したら、append しないで cancelled で終了

## Notes

- 本 skill は対話的に動作し、自動化は意図しない（ユーザー確認なしで append しない）
- `rules/taxonomy-reference.md` が**タクソノミーの正本**。ledger ヘッダの節は要約であり、
  食い違えば正本が勝つ（2026-07-25・issue #19）
- 本 skill 自身に起因する不具合は `process / kiro-postmortem-add` サブスコープで記録される（dogfooding）
