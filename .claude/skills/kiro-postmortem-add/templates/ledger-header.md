# 不具合要因分析 Ledger

> AI 駆動の開発作業で発生した**障害**（不具合）1 件ごとに 16 項目を記録する **追記型 Markdown ledger**。
> `/kiro-postmortem-add` で append、`/kiro-postmortem-review` で集約分析。
> 抽出された Try は `/kiro-steering-custom` 経由で `.kiro/steering/*.md` に反映する PDCA 基盤。
>
> **非障害**（要件追加・リファクタリング・仕組み改善など）の要因分析は
> [`.kiro/analysis/`](../analysis/README.md) 側に記録される。振り分けは要因分析フローの受付（A0）が行い、
> **判定と根拠は各 entry の項目 3 に必ず残る**。
>
> **規範の正典**: [`.kiro/steering/moira-change-analysis.md`](../steering/moira-change-analysis.md)（工程・項目定義・
> 判定基準・トリガ）／**skill**: `/kiro-postmortem-add`・`/kiro-postmortem-review`（振り付け）。
> **タクソノミー定義の正本**: [`.claude/skills/kiro-postmortem-add/rules/taxonomy-reference.md`](../../.claude/skills/kiro-postmortem-add/rules/taxonomy-reference.md)
> ——**本ヘッダのタクソノミー節は要約であり、定義の正本ではない**（食い違えば正本が勝つ）。

---

## PDCA 運用ガイド

本 ledger は Plan → Do → Check → Act のサイクルで運用する。

| Phase | Skill / 操作 | 起動者 | タイミング |
|---|---|---|---|
| **Plan** | `/kiro-postmortem-add` 起動 | AI (能動提案) または ユーザー／要因分析フローの受付から委譲 | 障害と判定された時点 |
| **Do** | 16 項目を対話補完して ledger に append | ユーザー (AI ドラフト提案) | Plan に続けて即時 |
| **Check** | `/kiro-postmortem-review` 起動 | ユーザー (主体)、AI は提案者 | 後述のトリガー条件のいずれか |
| **Act** | 抽出された Try を `/kiro-steering-custom` で steering 化 | ユーザー (AI 補助) | Check の結果として |

### Check の起動トリガー

**ID の正は `.kiro/steering/moira-change-analysis.md` §6**。判定ロジックは
`.claude/skills/kiro-postmortem-add/rules/trigger-detection.md`。以下は**要約**（食い違えば steering が勝つ）:

| ID | Trigger | 検出契機 |
|---|---|---|
| (a) | `queue-threshold` | 未分析キューが 10 件以上（キューは保存せず算出） |
| (b) | `cluster-threshold` | 未レビュー entry で同じ `根本要因分類` または `要因分類` が 2 件以上 |
| (c) | `periodic` | 前回の横断集約から 1 か月経過（集約が一度も無いときは発火しない） |
| (d) | `post-close` | `moira-change` P6 クローズ（分析は走らせない——クローズ自体が母集団入り） |
| (e) | `escaped-defect` | すり抜けギャップのある欠陥の検出——`.kiro/analysis/INDEX.md` の「すり抜け検出ログ」に記録（起動提案はしない） |
| (f) | `user-explicit` | ユーザーが明示的に振り返りを要求（常時許容） |

AI は (a) / (b) / (c) を検出時に 1 行で提案する。**AI は ユーザー確認なしで `/kiro-postmortem-review` を起動しない。**

---

## Entry スキーマ

**現行は `Schema: v2`（16 項目）。** 各項目には**出所ラベル**（`derived` / `inferred` / `captured` / `unknown`）を
必ず付ける。**根拠を示せない欄は `unknown` と記録し、空欄・推測での穴埋めを禁じる。**

| # | 項目 | 形式 |
|---|---|---|
| 1 | 対象システム | **正本 R13 のラベル**（`rules/taxonomy-reference.md`）から。複数可＋任意サブスコープ |
| 2 | 事象 | Given / When / Then ＋ 期待値・実際値 |
| 3 | 障害判定 | `障害`（本 ledger は障害のみ）＋根拠 |
| 4 | 変更分類 | 変更分類タクソノミーから 1 ラベル |
| 5 | 変更範囲 | M/D/P/S/C/V/F（影響マップのクラス列） |
| 6 | 発生原因サマリ | 専門用語なしの平易文 1〜2 文 |
| 7 | 発生原因詳細 | 技術者向け・出典パス付き |
| 8 | 根本要因 | **仕組み帰責を必ず一度は問う**＋根本要因分類・要因分類ラベル＋詳細 |
| 9 | 同件調査対象 | 走査した母集団の明示（範囲を書かない「該当なし」は不可） |
| 10 | 同件調査結果 | 有無＋該当 ID／キー |
| 11 | 同件の対応状況 | 別 issue のキー＋リンク＋state |
| 12 | 再発防止策 | Try 候補（出口を名指す） |
| 13 | 検知すべき工程 | 検知工程タクソノミーから 1 ラベル |
| 14 | 実際に検知した工程 | 同上 |
| 15 | なぜ然るべき工程で検知できなかったか | 13 ≠ 14 なら非空 |
| 16 | 検知するための対策 | 計器・ゲート・チェックリストのどれを足すか名指す |

各エントリは以下のメタデータも保持する:

- `Status:` (`recorded` / `reviewed` / `steered`)
- `Entry ID:` (zero-padded 4-digit int, e.g. `0001`)
- `Key:` (repo 修飾の変更キー e.g. `moira#16`。無修飾の `#N` を書かない)
- `Schema:` (`v1` = 旧 10 項目／`v2` = 現行 16 項目)
- `Created:` (ISO 8601 timestamp)
- `Source:` (`organic` / `analysis-intake`)
- `Verdict:` (`障害`)

> **既存 entry の遡及書き換えは禁止。** `Schema:` を持たない既存 entry は **v1 とみなす**。
> 読み取り側（`/kiro-postmortem-review`）は **v1 / v2 の両方を受理**し、**v1 を malformed として
> 集計から落とさない**——欠落項目は `unknown` として数える。

---

## Status 状態遷移

| Status | 意味 | 遷移先 |
|---|---|---|
| `recorded` | `/kiro-postmortem-add` で記録された直後・未レビュー | `reviewed` or `steered` |
| `reviewed` | `/kiro-postmortem-review` で Try 抽出されたが steering 反映されなかった (却下 or 不要判定) | `steered` (後続の review で再評価された場合) |
| `steered` | Try が `/kiro-steering-custom` 経由で steering に反映済み | (終端) |

状態は各エントリの H3 タイトル直下の `Status:` 行で表現。`/kiro-postmortem-review` のみが `Edit` で書き換える。

---

## タクソノミー（要約・**定義の正本は `rules/taxonomy-reference.md`**）

| 軸 | 正本の節 |
|---|---|
| **要因分類**（What・欠陥が宿る成果物） | R3 |
| **検知工程**（Where・V モデル軸＋プロセス軸） | R4 |
| **対象システム** | R13 |
| **根本要因分類**（Why・失敗メカニズム） | R14 |
| **変更分類** | R15 |

**ラベルの値集合は本ヘッダに列挙しない**——列挙すれば正本の複製になり、同期義務が復活するため
（2026-07-25・issue #19）。値は正本 `rules/taxonomy-reference.md` を参照する。

**Verification Gap の解釈**: `検知した工程 ≠ 検知すべき工程` の差が「すり抜けた検証層／工程」を示す。
このギャップは要因分析フローの**入口フィルタ**でもある——等しい事象は**欠陥検出を独立の投入契機にしない**
（母集団そのものを間引く規則ではない。クローズした変更は全件が分析対象）。

要因分類 (What) と根本要因分類 (Why) は **直交軸**。任意の組み合わせが有効。
(What × Why) の早見表とラベル該当例は `rules/taxonomy-reference.md` を参照。

---

## タクソノミーの拡張ポリシー

タクソノミー外のラベルを記録したい場合、`/kiro-postmortem-add` が以下フローで対応する:

1. 既存タクソノミーを候補として提示
2. 既存ラベルを選ぶ or「同一操作の中で正本に新ラベルを追加」を選ぶ
3. 拡張時は **`rules/taxonomy-reference.md`（正本）を更新**する。本ヘッダと
   `templates/ledger-header.md` の**要約**は、正本を参照するだけの記述に留めてあるため、
   ラベル追加のたびの追随は不要（軸そのものを増減したときだけ直す）
   （2026-07-25 改訂・issue #19: 旧「3 ファイル同期」規律のうち `.kiro/specs/defect-pdca/requirements.md` は
   **対象ファイルが存在しない**ため削除した）

---

## Entries

（ここに `/kiro-postmortem-add` が entry を append する。**初期 seed の自動投入は行わない**——
2026-07-25 改訂・issue #19: ledger 不在時は本ヘッダのみの空 ledger を作る。
記入例が要るときは `templates/entry-template.md` を参照する。）

---

## Steering 反映ログ

(`/kiro-postmortem-review` が承認された Try を `/kiro-steering-custom` で反映した際、本セクション末尾に append する。
形式は `### {timestamp}` ブロックで `Source entries:` / `Target steering:` / `Try summary:` を列挙。append-only)

> **Steering 集約方針**: PDCA Try は **大カテゴリの 1 ファイル** に H2 セクションとして集約 append する。
> 新規ファイル作成は新しい大カテゴリが立つ時のみ。横並びの細粒度ファイル乱立を避ける。
