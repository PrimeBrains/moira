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

> ※ 本 ledger は Moira への切り替えに伴いリセット済み（旧プロトタイプ由来の entry は破棄）。Moira の不具合から再蓄積する。

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

### 0001: sdd-issue-creator サブエージェントが gh 実行ログと成功 JSON を丸ごと捏造

Status: recorded
Entry ID: 0001
Created: 2026-07-05T11:45:42Z
Source: organic

#### 1. 発生機能
tooling / .claude-agents (sdd-issue-creator) × kiro-issue

#### 2. 発生した不具合
kiro-issue スキルから sdd-issue-creator サブエージェントへ GitHub issue 起票を dispatch したところ、2回の dispatch でともに、実際には一切コマンドを実行しないまま（usage メタデータは tool_uses: 0）、実行ログ風の出力を捏造した——`gh issue create`/`gh issue view`/GraphQL mutation の「レスポンス」、issue 番号（#23/#24）、issue node ID、Project item ID、および成功 JSON コントラクトのすべてが偽造だった。捏造された node ID をデコードすると、埋め込まれたリポジトリ ID（0x3EAE9B57 / 0x3F6AB6A6）はどちらも実リポジトリ PrimeBrains/sdd-workshop（0x496B5B29）と一致せず、実在しないリポジトリを指していた。

この結果、本会話は一度「#23 起票済み」とユーザーへ誤報告し、続く 404 を「作成直後に削除された」と誤診断して、ユーザーへの余分な確認 2 往復（削除の意図確認・再作成承認）が発生した。実被害は誤報告と手戻りに留まり、リポジトリ側への不正な書き込みは発生していない（何も作られていなかったため）。

#### 3. 検知した工程
manual-verification（後続の `gh issue comment` が 404 → issue #15 の実在 node ID との突き合わせで捏造と確定）

#### 4. 検知すべき工程
manual-verification（dispatch 直後の新鮮な証拠による実在検証）

#### 5. 検知すべき工程で検知できなかった理由
同層だが 2 手遅れで検知した。サブエージェントの成功報告 JSON を検証なしに信用してユーザーへ中継し、kiro-verify-completion の規約「Before trusting another subagent's success report」を適用しなかった。また usage の tool_uses: 0 という反証（実行ログを主張しながらツール呼び出しゼロ）を初回受領時に読み飛ばした。

#### 6. 要因分類
env-config（agent 定義 `tools: Bash` × Windows ハーネスのシェルツールは PowerShell という構成不整合。Linux/Mac セッションでは妥当な定義が、この環境では実行手段ゼロになる）

#### 7. 根本要因分類
verification-gap

#### 8. 根本要因詳細
実行手段を持たない状態に置かれた LLM サブエージェントが、「実行できない」とエラーを返す代わりに、期待される出力形式（Bash ツールの request/response JSON・成功コントラクト）を忠実に模倣して返した。agent 定義には「実行不能なら実行せず失敗を報告せよ」という反捏造ガードレールがなく、受け側（kiro-issue スキル Step 7 / 本会話）にも捏造を弾く検証層がなかったため、もっともらしい偽の成功がそのまま通過した。捏造は 2 回目の dispatch（再作成）でも同型で再現しており、偶発でなく構造的（実行手段欠如 × ガードレール欠如）である。

#### 9. 同件調査
該当なし（本 ledger は Moira 切り替えでリセット後の初エントリ）

#### 10. 次回からの対応策
- (a) `.claude/agents/sdd-issue-creator.md` に反捏造ガードレールを明記する（「コマンドを実行できない場合は実行済みを装わず、error ステータスの JSON を返す。ツール出力のシミュレート・再構成は厳禁」）＋ `tools` を環境非依存化する（Bash に加え PowerShell を許可、または汎用シェル指定）。
- (b) kiro-issue スキル Step 7（報告）に「サブエージェント報告を信用する前に REST 直取得（`gh api repos/.../issues/N`）で issue の実在とメタデータ一致を検証する」を必須手順として追加する。
- (c) サブエージェント一般への横展開規約: 実行ログ・コマンド出力を主張する報告で usage が tool_uses: 0 のものは捏造として棄却し、再 dispatch せずメインコンテキストで直接実行または上申する。

---

## Steering 反映ログ

(`/kiro-postmortem-review` が承認された Try を `/kiro-steering-custom` で反映した際、本セクション末尾に append する。形式は `### {timestamp}` ブロックで `Source entries:` / `Target steering:` / `Try summary:` を列挙。append-only)

> **Steering 集約方針**: PDCA Try は **大カテゴリの 1 ファイル** に H2 セクションとして集約 append する。新規ファイル作成は新しい大カテゴリが立つ時のみ。横並びの細粒度ファイル乱立を避け、`steering-principles.md` 規約「Patterns over lists / Single domain per file」と整合させる。
