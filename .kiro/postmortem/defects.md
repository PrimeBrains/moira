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

Status: reviewed
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

> **0002〜0008 の共通開示（issue #21 初回バックフィル）**: 以下 7 件は要因分析フロー
> （`moira-change-analysis` A0）から委譲された**過去分の後知恵再構成**である。当時の一次採取
> （`captured`）は存在しないため、`derived`（履歴からの写し・出典付き）と `inferred`（AI 推論・
> 根拠付き）で構成される。HX 人間確認は規範どおり **4 群（障害判定・根本要因・再発防止策・
> 検知対策）に縮退**して実施し、2026-07-25 に全件承認された。

### 0002: 履歴移管後も確定文書に旧リポ（sdd-workshop）チェックアウト前提の記述と直リンクが残存

Status: reviewed
Entry ID: 0002
Key: moira#5
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`process`（`moira/README.md`・`moira/GETTING-STARTED.md`・`moira/cli/README.md`・`.kiro/adr/0001-moira-cli-write-path.md`・`.kiro/steering/structure.md`・`.kiro/steering/testing-conventions.md`・`.claude/skills/moira-adapter-gen/`・`.claude/skills/moira-evm-digest/`・`moira/PROTOTYPE-EVALUATION.md`・`moira/UI-DESIGN-BRIEF.md`）＋ `adapter`（`moira/cli/templates/claude/skills/moira-track/*`・`moira/cli/templates/kiro/steering/moira-track.md`・`moira/cli/templates/claude/hooks/moira-{fire,guard}.mjs` の配布テンプレート 6 本と `moira/examples/todo-playground/` の配布コピー）。出典: `moira/changes/issue-5/closure-report.md` R1–R26。

#### 2. 事象　`derived`
- **Given**: sdd-workshop#42 の filter-repo 移管により `PrimeBrains/moira` が独立リポとして分離済み（出典: `moira/changes/issue-5/request.md`「入口種別」節）
- **When**: 読者が本リポ単体を clone してセットアップ手順に従う／`moira adapter install` で他プロジェクトへ moira-track テンプレートを配布する
- **Then**: 手順が `git clone .../sdd-workshop` を指示し、配布物内の canonical URL が `github.com/PrimeBrains/sdd-workshop/blob/main/…` を指す
- **期待値**: 本リポ単体で読者が完結する（clone 先・ディレクトリ名・正本 URL がすべて `PrimeBrains/moira`）
- **実際値**: 確定文書 26 箇所に旧リポ前提の記述・直リンクが残存。うち moira-track 配布テンプレート 6 本は `moira adapter install` により**他プロジェクトへ複製される**ため露出が伝播する（出典: `moira/changes/issue-5/request.md` 項目 3「他プロジェクトへ配布されるため優先」）

#### 3. 障害判定　`inferred`
障害 — 根拠: 文書は「この手順で動く」「この URL が正本である」と読み手に**約束されたふるまい**を提示しており、移管後その約束は実在しなかった（clone 先が誤り・直リンクが旧リポを指す）。潜在（未発現）欠陥も障害に含めるという規範 §2 に従い障害と判定する。**境界事例**である——移管時の「ハイブリッド裁定」で文書改稿は後続 issue で行うと**事前に決めていた**ため「計画された段取り＝非障害」と読む立場も成り立つ。規範 §2「境界事例は障害側に倒し、理由を記録する」に従った。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`bugfix` — 媒体は文書（`doc-only` と読める）だが、目的は「約束と実在の食い違いの是正」である。本バックフィルでは**障害と判定した件は目的側（`bugfix`）を採る**という規則を全件に一律適用した（R15 が媒体軸と目的軸を混在させている——A5 集約へ機構課題として申し送り）。

#### 5. 変更範囲　`derived`
D（R18: D-80 読み替え方針の canonical 化）＋ F（R1–R17・R19–R26 の確定文書級）。出典: `moira/changes/issue-5/closure-report.md`「① 3面最終文 ↔ 批准済み意図の対応表」および F 級行の批准要約表。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
引っ越しで住所が変わったのに、案内板の一部が古い住所のままだった。しかもその案内板の一部は、コピーされて他の場所へ配られる種類のものだった。

#### 7. 発生原因詳細（技術者向け）　`derived`
filter-repo による履歴移管（sdd-workshop#42）はコミット履歴とファイル配置を移すが、**本文中の文字列（clone URL・ディレクトリ名・`github.com/PrimeBrains/sdd-workshop/blob/main/…` 形式の絶対リンク・「CLI 本体は sdd-workshop に残る」等の前提記述）は移さない**。移管操作自体は成功しており、残存したのは移管の副作用として発生した文書と現実の乖離である。`moira/changes/issue-5/request.md` は改稿対象を 7 項目に整理しており、そのうち項目 3（moira-track 配布テンプレート）は `moira adapter install` の配布経路に乗るため優先度高と明記されている。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: 移管という「同型の書き換えを全域へ掃く」性質の変更に対し、当時の変更管理フローは **P2 影響調査で同型パターンの全域 grep を義務づけていなかった**。`.kiro/steering/moira-change-management.md` P2 は「波及先の列挙」を求めるが、「1 箇所見つけたら同じ形を全域で数え、残存 0 を示す」ことまでは求めていない。加えて `moira adapter install` の**配布経路にあるファイル**を優先度付きで洗い出す観点も、影響マップのテンプレートに列を持っていなかった。
- **根本要因分類**: `context-loss`
- **要因分類**: `env-config`
- **詳細**: 移管作業者は「履歴とファイルが移れば移管は完了」という視野で作業し、本文中の環境前提（チェックアウト先・正本 URL）が構成情報であることを視野に入れなかった。知ろうとすれば `grep -r sdd-workshop` で即座に列挙できた（現に issue #5 の起票時には棚卸し済みリストとして提示されている）。**撤回条件タグは付さない**——本件は敵対ゲートで deferred にした Important の実害化ではなく、移管時のハイブリッド裁定による計画的な後続処理であり、deferred-important タグ（角括弧付き literal・grep 計数される形は意図的に書かない）の定義に当たらない。

#### 9. 同件調査対象　`derived`
走査した母集団: (a) `.kiro/postmortem/defects.md` の既存 entry（本バックフィル投入前は #0001 のみ）、(b) `.kiro/analysis/entries/` の非障害 entry 全件（`moira-9` ＋本バックフィルの `moira-1/2/6/7/10/19`）、(c) 本バックフィルで同時投入する障害 entry 6 件（#0003–#0008）、(d) `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 時点・OPEN は #3 #4 #20 #21）。

#### 10. 同件調査結果　`inferred`
- **#0007（moira#16）・#0008（moira#17）** — 「同型の保護／是正が必要な他所を視野に入れなかった」という `context-loss` のメカニズムが一致する。本件は文書の同型残存、#16/#17 はコードの同型露出であり、**媒体は違うが失敗の形は同一**。
- **moira#20（OPEN・未着手）** — 「todo-playground サンプルに旧版 postmortem skill 一式が残存」。**本件と同一メカニズムの現存例**（正本を更新したが配布コピー側の同型掃射が漏れた）。
- `moira#1`（非障害・`.kiro/analysis/entries/moira-1.md`）は移管後の正典整理という隣接文脈だが、根本要因は `design-error` 系で一致しない。

#### 11. 同件の対応状況　`derived`
- `moira#16` https://github.com/PrimeBrains/moira/issues/16 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#17` https://github.com/PrimeBrains/moira/issues/17 — CLOSED（同上）
- `moira#20` https://github.com/PrimeBrains/moira/issues/20 — **OPEN**（同上。本 entry の同型現存例として未解消）

#### 12. 再発防止策　`inferred`
**出口: `.claude/skills/moira-change/SKILL.ja.md` の P2 ＋ `.claude/skills/moira-change/templates/impact-map.template.md`。** 影響調査に「同型掃射」欄を必須化する——(a) 変更の同型パターンを 1 つ以上の grep 式として書き、(b) その全ヒットを影響マップの行に写像し、(c) 閉包時に残存 0 を機械証跡で示す。あわせて影響マップに「配布経路に乗るか（`moira adapter install` の managed file か）」の列を足し、配布物を優先行として扱う。

#### 13. 検知すべき工程　`inferred`
`p2-impact-survey` — 移管変更（sdd-workshop#42）の影響調査で「本文中の環境前提」を波及先として列挙すべきだった。

#### 14. 実際に検知した工程　`derived`
`post-close` — 移管 issue のクローズ後、別 issue（moira#5・2026-07-21 起票）として人間が棚卸しして発覚した（出典: issue #5 本文「改稿対象（棚卸し済み）」）。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
移管 issue（sdd-workshop#42）は**旧リポ側の変更**であり、本リポの変更管理フロー（`moira-change`）の母集団外で実施された。すなわち本件の影響調査工程はそもそも存在しなかった。加えて当時は「ハイブリッド裁定」により文書改稿を後続 issue へ回す方針が採られており、残存の**列挙**自体が後続 issue の作業として繰り延べられていた——列挙が繰り延べられた結果、残存の全体量は改稿着手時まで不明のままだった。

#### 16. 検知するための対策　`inferred`
**計器を足す**: CI に「リポ名の同型残存検査」を常設する——`grep -rn 'PrimeBrains/sdd-workshop' --include='*.md' --include='*.mjs'` のヒットが、`moira/HISTORICAL-REFERENCES.md` に登録された**意図的な来歴参照の許可リスト**の外に出たら fail させる。これは 12 のチェックリスト（人間の記憶に依存）を機械側で裏打ちする層であり、両方を置く。

---

### 0003: 受け入れシナリオ unit の相対リンク 23 本が解決不能（深度誤り 14・不存在先 9）

Status: reviewed
Entry ID: 0003
Key: moira#8
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`process / .kiro/scenarios/units`（`schedule-rebaseline.md`・`schedule-leveled.md`・`schedule-reorder.md`）。出典: `moira/changes/issue-8/closure-report.md` R1–R5。

#### 2. 事象　`derived`
- **Given**: `.kiro/scenarios/units/` 配下の agreed 受け入れシナリオ unit が、MODEL・参照実装・旧 spec を相対リンクで参照している
- **When**: 読者（人間・AI 双方）がそのリンクを辿る
- **Then**: `../../moira/…` は `.kiro/moira/…`（不存在）に解決される。`../../.kiro/specs/moira-core/requirements.md` 等は深度誤りに加え**参照先が本リポに存在しない**（R/D/T は sdd-workshop#40 裁定で旧リポ残置）
- **期待値**: agreed unit の事実参照リンクがすべて解決する
- **実際値**: 深度誤り 14 occurrence ＋ 旧 spec 直リンク 9 occurrence ＝ **計 23 本が解決不能**（出典: `moira/changes/issue-8/request.md`「速報: 深度誤り 14 occ・旧 spec 直リンク 9 occ」・closure-report R1–R5 の grep 実測）

#### 3. 障害判定　`inferred`
障害 — 根拠: agreed の受け入れシナリオ unit は「ここに根拠がある」と読み手に約束する参照を持つ。その参照が解決しない以上、約束されたふるまい（根拠へ到達できること）は実在しなかった。**ふるまい本体（When/Then・EARS・fixture）は無傷**であり被害は参照面に限局するが、規範 §2 の潜在欠陥条項に該当する。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`bugfix` — 媒体は文書だが目的は壊れた参照の是正。#0002 と同一規則（障害判定件は目的側を採る）。

#### 5. 変更範囲　`derived`
S（シナリオ級）。closure-report ①「面: S（シナリオ）。全 5 行」。E2E への波及なしを R7 で確認済み。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
資料の中の「ここを見よ」という案内が、実際には存在しない場所を指していた。しかも案内が正しいかを自動で確かめる仕組みがなかったので、書いた時点から誰も気づかなかった。

#### 7. 発生原因詳細（技術者向け）　`derived`
2 系統ある。(A) **深度誤り**: `.kiro/scenarios/units/` は root から 3 階層下にあるため root 直下の `moira/` を指すには `../../../` が要る。著者が `../../` と書いたため `.kiro/moira/` に解決された。(B) **不存在先**: 旧 spec（`.kiro/specs/moira-core|moira-schedule/requirements.md`）への直リンクは、深度を直しても参照先が本リポに存在しない——R/D/T は使い捨ての再生成物とする sdd-workshop#40 裁定により旧リポに残置されたため。(B) は深度是正では解決せず、参照書式そのものの恒久方針（リンク撤去＋条項名の平文引用）を要した。加えて issue 本文の見立て（「grep 11 箇所・rebaseline 分は #7 で是正済み」）と実態が食い違っており、**#7 が是正したのはアンカー形式であって相対パス深度ではなかった**ことが #8 の P2 で判明している（出典: `moira/changes/issue-8/request.md`「実態の再確認」節）。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: md の相対リンクが解決するかを**機械が確かめる層が存在しなかった**。CI（計器①〜④）はコード側の検査で構成され、確定文書・シナリオ unit のリンク健全性は検査対象外。`kiro-scenario` ゲートの敵対レビューも人間／AI の目視に依存し、リンク解決は攻撃角チェックリストに項目を持たなかった。
- **根本要因分類**: `verification-gap`
- **要因分類**: `requirements-error`
- **詳細**: 検証手段そのものが未整備だったため、著者の一度の書き間違いがそのまま agreed まで通過し、3 ファイル × 23 本まで積み上がった。**deferred-important タグは付さない**（角括弧付き literal は grep 計数されるため本文に書かない）——発生元は issue #7 のゲート内 codex 指摘（Important）を変更管理フローで deferred にしたものだが、その deferred は**追跡先 issue #8 として起票され直後に解消**しており、追跡機構は設計どおり働いた。deferred の実害化ではないため、撤回条件の計器を鳴らすのは誤りと判断した（この判断自体を A5 集約へ申し送る）。

#### 9. 同件調査対象　`derived`
#0002 の項目 9 と同一母集団（(a) 既存 postmortem entry、(b) `.kiro/analysis/entries/` 全件、(c) 本バックフィル同時投入の障害 6 件、(d) `gh issue list --state all` 2026-07-25 時点）。

#### 10. 同件調査結果　`inferred`
- **#0006（moira#15）** — `verification-gap` が一致。あちらは「§2.10 の 4 例中 3 例に検証がなかった」、本件は「リンク解決に検証がなかった」。**規範が列挙した対象に対し検証が部分的にしか敷かれていなかった**という同型。
- **#0001（sdd-issue-creator の捏造）** — `verification-gap` が一致（サブエージェント報告を検証する層がなかった）。
- `moira#7`（非障害・`.kiro/analysis/entries/moira-7.md`）は本件と同一チェーン（#7 のゲート指摘が #8 の起点）だが、#7 自身は計画された文言同期であり非障害と判定済み。

#### 11. 同件の対応状況　`derived`
- `moira#15` https://github.com/PrimeBrains/moira/issues/15 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#7` https://github.com/PrimeBrains/moira/issues/7 — CLOSED（同上）
- entry #0001 は本 ledger 内（`Status: recorded`・issue に紐づかない）

#### 12. 再発防止策　`inferred`
**出口: CI（新規 job）。** リポジトリ内 md の相対リンクを解決し、未解決を fail させる検査を常設する。対象は `.kiro/scenarios/units/`・`moira/`・`.kiro/steering/`・`.claude/skills/`。意図的に残す来歴リンク（D-80 の移管前 `#N` 参照など）は許可リストで除外する。**人間のチェックリストではなく機械で塞ぐ**——本件は「著者の記憶」に依存した結果 23 本まで積み上がった類型だから。

#### 13. 検知すべき工程　`inferred`
`ci` — リンク解決は完全に機械判定可能であり、agreed 昇格前の CI で止めるべきだった。

#### 14. 実際に検知した工程　`derived`
`gate-adversary` — issue #7 の kiro-scenario ゲート内 codex 独立レビューで Important として検出（出典: issue #8 本文「発生元: issue #7 ゲート内 codex 指摘（Important）」）。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
CI にリンク解決の検査器が存在しなかったため、機械が見る機会そのものが無かった。結果として検出は敵対レビューという人間／AI の目視層まで下流化し、しかもそこで得られた件数（11 箇所）は**実測より少なく**、正確な件数は #8 の P2 影響調査でようやく確定した（深度 14・旧 spec 9）。目視層は「見つける」ことはできても「数え切る」ことはできなかった。

#### 16. 検知するための対策　`inferred`
**計器を足す**（12 と同一）: md 相対リンク解決の CI 検査。加えて `kiro-scenario` の agreed 昇格チェックに「参照リンクの解決を機械で確認した証跡」を要求する行を足し、CI が落ちていない状態を昇格の前提にする。

---

### 0004: 訂正計器③「遡及」の意味が正典・批准済み意図・実装の三者でずれたまま実装が進行

Status: reviewed
Entry ID: 0004
Key: moira#11
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`process`（`moira/MODEL.md` §2.10 (d)・`moira/PROPERTIES.md`・`moira/DECISIONS-CATALOG.md` D-1/D-79）＋ `cli`（`moira correct` コマンド・corrections.json 永続化層）＋ `backend`（訂正計器の計数）。出典: `moira/changes/issue-11/impact-map.md` R1–R21・`closure-report.md` R1–R5/R6–R14/R15–R16。

#### 2. 事象　`derived`
- **Given**: MODEL v21 §2.10 の訂正計器は区分③を「遡及」として定義し、HA 裁定 B5（旧リポ `sdd-workshop#36` 由来）は「遡及書き込み警告を訂正計器③retro に統合する」と批准済み
- **When**: ③retro が何を数えるかを、正典・批准済み意図・参照実装のそれぞれに問う
- **Then**: 三者が異なる述語を返す — 正典「対象の日時を過去に動かす訂正」／批准済み意図「過去日付へのイベント追記でも同じ計器を鳴らす」／実装「対象より 1 日超あとに出された訂正」
- **期待値**: 計器の計数意味が正典・意図・実装で一致する
- **実際値**: **三者がずれている**（出典: `moira/changes/issue-11/impact-map.md` R1 の記述「(1)…(2)…——三者がずれている」）。HA 境界裁定 B-1 はこのずれを「既に実在する正典↔実装ドリフト」と認定し、表示統合だけの C 級縮退を却下して M 級（正典改訂）を採用した（出典: `intent-ratification.md` B-1 行・2026-07-21）

#### 3. 障害判定　`inferred`
障害 — 根拠: 正典は計器の定義を読み手に約束する。その定義と実装の数える対象が食い違っていた以上、約束されたふるまいは実在しなかった。HA B-1 が「③述語の正典↔実装ドリフトが**既に実在**し、後日 decision-conformance が DRIFTED を出し得る」と明記しており、AI の後知恵ではなく**当時の一次記録が欠陥として認定している**。**境界事例**である——本 issue の主たる作業量は #6 閉包時に deferred 化された残工程 3 件（CLI 訂正 UX・bound プロパティ昇格・B5 配線）の消化であり、issue 全体としては計画された前進（非障害）と読む立場も成り立つ。規範 §2 に従い障害側に倒した。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`req-add` — issue 全体としては #6 の残工程消化（CLI コマンド新設・プロパティ 3 件の agreed 昇格）が主であり、既定を維持したまま機能を足す変更。三者ずれの是正はその内部に含まれる。**一 entry 一判定では「欠陥の是正」と「計画された追加」が混在する変更を表現できない**——この機構課題を A5 集約へ申し送る。

#### 5. 変更範囲　`derived`
M（正典 §2.10 (d) の③定義文）・P（PROPERTIES v0.7・3 件 agreed 昇格）・D（DECISIONS-CATALOG D-1/D-79 注記）・C（CLI 実装 R6–R14・R19–R21）。出典: `moira/changes/issue-11/closure-report.md` 対応表および機械決着詳細。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
「この警告は何を数えるのか」について、正式な文書・会議で決めたこと・実際に動いているプログラムが、それぞれ違うことを言っていた。決めたことを文書と実装の両方へ配線し切る手順がなかった。

#### 7. 発生原因詳細（技術者向け）　`derived`
HA 裁定 B5（旧リポ `sdd-workshop#36`）は「訂正跨ぎと遡及書き込みは同じ計器を鳴らす」というドメイン意味を批准したが、その批准は **agreed 文面（MODEL §2.10 (d) の③定義文）へ反映されないまま**次工程へ進んだ。一方で参照実装は独自に「対象より 1 日超あと」という時間閾値述語を採用していた。結果、正典の定義文（対象日時を過去へ動かす訂正）・批准意図（イベント追記も含む）・実装述語（1 日超）の三者が並存した。issue #11 の HA B-1 はこれを M 級と裁定し、MODEL v22 §2.10 で「一つの警告面の下の二系（訂正系＝会計層／追記系＝観測層の検知）」＋「1 日＝経過 24h 超の固定境界」＋検知の被覆限界の正直開示、という形で一本化した（出典: `closure-report.md` R1 行）。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: HA（前半集約セッション）の裁定が**正典文面への反映義務を伴わない形で記録される**ことを許していた。`.kiro/steering/moira-change-management.md` の HA は「意図・境界・前提を批准する」工程だが、批准した意図がどの agreed 文面のどの行に着地するかを行として残し、閉包で照合する配線が当時なかった（#11 以降の閉包レポートが持つ「3面最終文 ↔ 批准済み意図の対応表」がまさにこの穴を塞ぐ器である）。
- **根本要因分類**: `spec-impl-mismatch`
- **要因分類**: `design-error`
- **詳細**: `[intent-drift]` — 変更管理フローで事前批准した意図（B5「訂正跨ぎと遡及書き込みは同じ計器を鳴らす」）と agreed 文面（MODEL §2.10 (d) の③定義文）の乖離が実害化した事例である。乖離は批准の時点で発生し、実装が第三の述語を採ったことで三者ずれへ拡大した。撤回条件タグの定義に正面から該当するため literal タグを付す。

#### 9. 同件調査対象　`derived`
#0002 の項目 9 と同一母集団。

#### 10. 同件調査結果　`inferred`
- `moira#6`（非障害・`.kiro/analysis/entries/moira-6.md`）— 本件の直接の前段（#6 閉包時に deferred 化された残工程が #11）。ただし #6 自身の根本要因は「分類対象たる失敗が無い」ため一致しない。
- **#0003（moira#8）** — 「批准／指摘から成果物への配線が人手に委ねられていた」という点は隣接するが、あちらの根本要因は `verification-gap` であり本件の `spec-impl-mismatch` とは一致しない。
- 本 ledger・`.kiro/analysis/entries/` を通じて `spec-impl-mismatch` を根本要因とする entry は**本件のみ**（`moira#7` は要因分類側で `spec-impl-mismatch` を持つが根本要因は `requirements-error`）。

#### 11. 同件の対応状況　`derived`
- `moira#6` https://github.com/PrimeBrains/moira/issues/6 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#8` https://github.com/PrimeBrains/moira/issues/8 — CLOSED（同上）

#### 12. 再発防止策　`inferred`
**出口: `.kiro/steering/moira-change-management.md` §3/§5 ＋ `.claude/skills/moira-change/templates/closure-report.template.md`。** HA の裁定を「行」として記録することを必須化する——各裁定に (a) 着地先の面（M/D/P/S）と成果物パス、(b) 反映済みか否かの二択、を持たせ、P5 閉包で全行が反映済みであることを照合する。#11 以降の閉包レポートは既にこの対応表を持つため、**規範側へ昇格して恒久化する**のが本 Try の実体である。

#### 13. 検知すべき工程　`inferred`
`ha-ratification` — 批准の時点で「この意図はどの文面のどの行に着地するか」を問えば、正典文面が未追随であることはその場で見える。

#### 14. 実際に検知した工程　`derived`
`p2-impact-survey` — issue #11 の影響調査で発覚（出典: `moira/changes/issue-11/impact-map.md` R1「三者がずれている」）。B5 批准から #11 の P2 まで、issue にして数本ぶんの遅れがある。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
HA が「意図を批准する」工程として設計されており、「批准した意図の着地先を指定し、その反映を追跡する」工程としては設計されていなかった。批准記録は自然文の裁定として残り、どの agreed 文面に効くかは次工程の担当者の読解に委ねられた。加えて実装側の述語（1 日超）は正典を参照せず独自に定まったため、正典と実装のどちらから見ても「相手がずれている」ことに気づく契機が無かった。

#### 16. 検知するための対策　`inferred`
**計器を足す**: 計器⑥（`decision-conformance`）の照合対象に「HA 批准記録 ↔ agreed 文面」の軸を加える——現状の計器⑥は「設計判断 ↔ 実装」を見るが、その手前の「批准 ↔ 正典文面」は誰も見ていない。あわせて 12 のチェックリスト（閉包の対応表）を規範化し、機械側（計器⑥）と手続き側（P5 照合）の二層で塞ぐ。

---

### 0005: cli の単体テストが開発者シェルの MOIRA_DIR を継承し、実運用中の events.json を破壊した

Status: reviewed
Entry ID: 0005
Key: moira#13
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`cli / test-infra`（`moira/cli/vitest.config.ts`・`moira/cli/src/test-setup.ts`）。出典: `moira/changes/issue-13/closure-report.md` R1/R2。

#### 2. 事象　`derived`
- **Given**: 開発者のシェルに `MOIRA_DIR` が設定され、実運用中のプロジェクトの log-home を指している
- **When**: `moira/cli/` で `npm test`（vitest）を走らせる。テスト内の `runCli(['add', …])` は `--dir <tmpdir>` を明示していない
- **Then**: log-home 解決フォールバックが `MOIRA_DIR` を掴み、テストが**実 log-home に append する**
- **期待値**: テストは tmpdir に閉じ、外部の実データに一切触れない
- **実際値**: 本番 `events.json` に `moira add a` 等の decompose イベントが多数混入し、末尾が並行書き込みで JSON 構造ごと破損（`]    ]\n  }\n]` の閉じ括弧崩れ）。`moira show` が `Unexpected non-whitespace character after JSON at position …` で読めなくなり、派生ファイル（capacity.json / dates.json / labels.json）も再計算不能になった（出典: issue #13 本文「事象」節）

#### 3. 障害判定　`inferred`
障害 — 根拠: テストは「実データに触れない」ことを暗黙に約束する成果物であり、その約束は実在しなかった。しかも**実害が発生済み**（実運用データの破壊）であり、潜在段階ですらない。境界事例ではない。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`bugfix` — テスト隔離という約束から外れた状態の是正。

#### 5. 変更範囲　`derived`
C（コード級のみ）。V 級は境界だが `moira/changes/issue-13/request.md`「候補クラス」表で「gate inventory は変わらない」として非該当と判定済み。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
テストを走らせると、本来なら使い捨ての作業場所で動くはずが、開発者の設定次第で本物のデータ置き場に書き込んでしまった。しかも複数のテストが同時に書いたため、そのデータが壊れた。

#### 7. 発生原因詳細（技術者向け）　`derived`
log-home の解決優先順位は ADR-0003 で `--dir > MOIRA_DIR > walk` と定められている。テストヘルパ `runCli` は `--dir` を強制せず、テストファイル側の記憶（`beforeEach` での `delete process.env.MOIRA_DIR` または `--dir <tmp>` の明示）に依存していた。issue が名指しした 4 ファイル（`commands-write-safety.test.ts`・`milestone.test.ts`・`dates.test.ts`・`adapter/drift/drift-golden.test.ts`）は commit `3fc5b23` で per-file の delete パターンにより修理されたが、**その修理は「将来新設される test ファイル」を守らない**（出典: `moira/changes/issue-13/request.md`「残存リスク」節）。#13 は `vitest.config.ts` の `setupFiles` で worker 起動直後に `MOIRA_DIR` を落とす基盤側 sanitization を入れ、最下層の防御を敷いた。破壊が JSON 構造レベルまで進んだのは、複数テストの並行 append が当時アトミック置換も排他も持っていなかったため（#16 で是正）。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: `.kiro/steering/testing-conventions.md` が「テストは環境変数を継承しない」という規律を明文で持たなかった。規律が無いため、テスト著者は各自のパターン（`--dir` 明示 / per-file delete / 無防備）を選ぶことができ、無防備が黙って通った。さらに**隔離が破れていることを検知する陰性対照テストが常設されていなかった**——破れは「壊れて初めて分かる」状態だった。
- **根本要因分類**: `state-management-gap`
- **要因分類**: `data-state-dep`
- **詳細**: 環境変数というプロセス外の状態がテスト間・環境間で持ち込まれるパターンを、テスト基盤の設計時に想定していなかった。開発者ごとにシェル設定が異なるため、CI では緑・特定の開発者環境でのみ破壊が起きるという再現性の低い形をとり、規律の欠如が長く露見しなかった。

#### 9. 同件調査対象　`derived`
#0002 の項目 9 と同一母集団。

#### 10. 同件調査結果　`inferred`
- **#0007（moira#16）・#0008（moira#17）** — `state-management-gap` が根本要因として一致（あちらは並行実行の read-modify-write が後勝ちになる想定漏れ、本件は環境状態の継承の想定漏れ）。**本件の破壊の一部（JSON 構造崩れ）は #16 が塞いだ欠陥そのものが顕在化したものであり、因果でも接続する。**
- `moira#10`（非障害・`.kiro/analysis/entries/moira-10.md`）— 並行セッションの worktree 混線という「状態の隔離が規範化されていなかった」同型。あちらは非障害（当時の規範が隔離を約束していなかった）と判定済みだが、**メカニズムは同一**。
- `moira#20`（OPEN）は媒体が異なり一致しない。

#### 11. 同件の対応状況　`derived`
- `moira#16` https://github.com/PrimeBrains/moira/issues/16 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#17` https://github.com/PrimeBrains/moira/issues/17 — CLOSED（同上）
- `moira#10` https://github.com/PrimeBrains/moira/issues/10 — CLOSED（同上・非障害として `.kiro/analysis/entries/moira-10.md` に記録）

#### 12. 再発防止策　`inferred`
**出口: `.kiro/steering/testing-conventions.md` ＋ CI。** (a) 規約に「テストは実行環境の env を継承しない——`MOIRA_DIR` 等の解決に効く変数は setup 層で必ず落とす」を明文化する。(b) **隔離破れの陰性対照を CI に常設する**——`MOIRA_DIR=<canary>` を設定した状態でテストスイートを走らせ、canary 配下に `.moira/` が生成されたら fail させるジョブを置く。#13 は陰性対照を bidirectional witness として**一度だけ**実施し（closure-report R3）その後 canary ファイルを削除しているため、現状の防御は再び「設定が残っていること」への信頼に依存している。

#### 13. 検知すべき工程　`inferred`
`ci` — 隔離破れは機械判定可能であり、陰性対照ジョブが常設されていれば新規テスト追加のたびに検知できる。

#### 14. 実際に検知した工程　`derived`
`user-report` — 開発者が実運用中のプロジェクトで `moira show` の失敗として発見し、issue #13 として報告した（出典: issue #13 本文「事象」節の症状記述）。R4 の定義どおり、すべての内製検証ゲートを通過してしまった最後の砦での検知にあたる。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
CI は `MOIRA_DIR` が未設定の環境で走るため、隔離破れが**構造的に発現しない**。破れは「その変数が設定された開発者のシェル」でのみ発現し、その環境で走る検証はゲートとして存在しなかった。すなわち検証層のカバレッジと故障条件が直交しており、下流のどの工程でも捕まらないまま実データ破壊まで到達した。

#### 16. 検知するための対策　`inferred`
**計器を足す**（12 (b) と同一）: CI に env 汚染下の陰性対照ジョブを常設する。チェックリストではなく機械で塞ぐ——本件は「著者の記憶」に依存した結果、per-file 修理をすり抜ける将来ファイルという残存リスクを生んだ類型だから。

---

### 0006: 正典 §2.10 が列挙する適用不能 4 例のうち 3 例が未検証、かつ corrections.json が並行書き込み無保護

Status: reviewed
Entry ID: 0006
Key: moira#15
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`backend / fold`（`moira/backend/src/fold.ts`・`correction.test.ts`）＋ `cli / store`（`moira/cli/src/store.ts`・`correct.test.ts`）＋ `process`（`moira/MODEL.md` §7#20・`moira/DECISIONS-CATALOG.md` D-1/D-79）。出典: `moira/changes/issue-15/closure-report.md` R1–R10。

#### 2. 事象　`derived`
- **Given**: MODEL v22 §2.10「検証の迂回は不能」が適用不能な訂正の例を 4 つ列挙し、「適用不能な訂正は winner 登録に入らず、先行する有効な訂正が現行のまま残る」と約束している
- **When**: 残り 3 例——①親を子孫へ動かす decompose 値訂正（木性/I2 循環）②負の amount への cost 訂正（A6）③循環を作る relate 端点訂正（I2）——を投入する。並行して 2 つのプロセスが corrections.json へ訂正を追記する
- **Then**: 3 例は pre-admission 検証を通らず base switch の構造検証拒否に落ちるため「訂正適用後イベントが**丸ごと拒否される**」読みになる。corrections.json の read-modify-write は後勝ちで先の追記を黙って捨てる
- **期待値**: 4 例すべてで先行有効読みが残り、並行追記で訂正が失われない
- **実際値**: **4 例中 3 例が正典の読みと厳密には一致しない**（`fold.ts` にインラインで正直開示済み）＋ corrections.json は lost update 無保護（出典: issue #15 本文「背景」・`moira/changes/issue-15/request.md` 項目 1/2）

#### 3. 障害判定　`inferred`
障害 — 根拠: 正典が明示的に列挙した 4 例に対し、実装が 1 例しか約束を満たしていなかった。約束されたふるまいが実在しない状態であり、コード内に正直開示されていたとはいえ欠陥は実在した。境界事例ではない。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`bugfix` — 正典の読みから外れた実装状態の是正。

#### 5. 変更範囲　`derived`
C（R1–R4・R10）・M（R5: MODEL §7#20 追補）・D（R6/R7: D-79/D-1 注記）・P（R8: 差分ゼロ確認）・S（R9: 新規なし確認）。出典: `moira/changes/issue-15/closure-report.md` 影響マップ表。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
ルールブックが「こういう無効な訂正が 4 種類ある」と書いていたのに、実際のプログラムはそのうち 1 種類しか正しく扱えていなかった。残り 3 種類は、無効な訂正 1 つのせいで正しい記録まで巻き添えで捨てる動きになっていた。

#### 7. 発生原因詳細（技術者向け）　`derived`
issue #6 で §2.10 の参照実装同期を行った際、pre-admission 検証（`fold.ts`）に落とし込まれたのは foreign field と非人間 actor→agreed の 2 例で、構造無効の 3 例は base switch（fold の構造検証）の拒否に依存させた。base switch の拒否は「訂正適用後のイベントを丸ごと拒否する」意味論であり、正典が約束する「不正な訂正だけが winner 登録に入らず、先行する有効な訂正は現行のまま残る」とは異なる。この差は `fold.ts` にインラインコメントとして開示されていたが、**開示は是正ではない**——4 例中 3 例の未被覆は #15 の実装まで残った。corrections.json 側は #11 で軽量スキーマ検証＋アトミック置換まで実施済みで、advisory lock による排他は残余として持ち越されていた。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: 正典が**列挙**した対象（4 例）に対し、実装／witness の被覆が**全数であることを確かめる工程**が無かった。計器⑥（`decision-conformance`）は設計判断と実装を照合するが、「正典の列挙 n 件に対し witness が n 件あるか」という被覆勘定は誰の職務でもない。加えて「コード内に正直開示する」という文化が、開示された未被覆を**追跡義務のある deferred へ昇格させる配線を持たなかった**ため、開示がそのまま残置に転化した。
- **根本要因分類**: `verification-gap`
- **要因分類**: `impl-error`
- **詳細**: 検証手段（3 例に対する witness テストと pre-admission 経路）を整備しないまま #6 を閉じたため、未被覆は #11 のゲートで codex に指摘されるまで残った。「開示済み＝了解済み」と扱う運用が、被覆勘定の不在を覆い隠していた。

#### 9. 同件調査対象　`derived`
#0002 の項目 9 と同一母集団。

#### 10. 同件調査結果　`inferred`
- **#0003（moira#8）** — `verification-gap` が一致。**規範が列挙した対象に検証が部分的にしか敷かれていなかった**という同型（あちらは参照リンク、本件は §2.10 の 4 例）。
- **#0007（moira#16）・#0008（moira#17）** — 本件の corrections.json 保護から直接派生した連鎖（#15 → #16 → #17）。あちらの根本要因は `context-loss` であり本件とは異なるが、**「同型の保護が必要な対象を全数で数えていない」という上位の失敗形は共通**。
- **#0001** — `verification-gap` が一致（検証層の不在）。

#### 11. 同件の対応状況　`derived`
- `moira#8` https://github.com/PrimeBrains/moira/issues/8 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#16` https://github.com/PrimeBrains/moira/issues/16 — CLOSED（同上）
- `moira#17` https://github.com/PrimeBrains/moira/issues/17 — CLOSED（同上）

#### 12. 再発防止策　`inferred`
**出口: `.claude/skills/moira-change/SKILL.ja.md` の P2 ＋ `.claude/skills/moira-change/templates/impact-map.template.md`（#0002 の Try と同一の器）。** 正典が列挙した対象に触れる変更では、**列挙 n 件を影響マップの n 行へ展開する**ことを必須化し、閉包で「n 行すべて resolved」を照合する。これは #0002 の「同型掃射」と同じ器であり、対象がコードか文書かの違いにすぎない。

#### 13. 検知すべき工程　`inferred`
`p5-closure` — issue #6 の閉包時に「§2.10 の列挙 4 例に対し実装／witness が 4 件あるか」を照合していれば、そこで未被覆 3 件が可視化できた。

#### 14. 実際に検知した工程　`derived`
`gate-adversary` — issue #11 のゲート 2（codex レビュー是正）で残余として開示され、#15 として起票された（出典: issue #15 本文「issue #11 ゲート 2（codex レビュー是正）で開示された残余の捕捉 issue」）。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
#6 の P5 閉包は「影響マップに載った行＋未マップ差分ゼロ」を照合する設計であり、**影響マップに載らなかった対象は照合の視野に入らない**。§2.10 の 4 例は影響マップに 1 行としてしか現れなかったため、その内側の被覆勘定（4 分の 1）は閉包の網目を素通りした。開示コメントは `fold.ts` に書かれていたが、閉包はソース内コメントを読む工程を持たない。

#### 16. 検知するための対策　`inferred`
**計器を足す**: 計器⑥（`decision-conformance`）に「正典の列挙 ↔ witness の被覆勘定」の照合軸を加える——正典が n 例を列挙する箇所を意味検索で同定し、対応する witness が n 件あるかを数えて UNVERIFIABLE ではなく DRIFTED を返せるようにする。あわせて 12 のチェックリスト（P2 での n 行展開）を置き、機械と手続きの二層で塞ぐ。

---

### 0007: events.json の書き込みが素の writeFileSync で torn write と lost update の両方に露出

Status: reviewed
Entry ID: 0007
Key: moira#16
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`backend / event-store`（`moira/backend/src/event-store.ts`・新規 `atomic-write.ts`）＋ `cli / store`（`moira/cli/src/store.ts` の lock 汎用化・`appendEvents`）＋ `process`（`moira/MODEL.md` §7#20・`moira/DECISIONS-CATALOG.md` D-79）。出典: `moira/changes/issue-16/closure-report.md` R1–R10。

#### 2. 事象　`derived`
- **Given**: `EventStore.saveJson` が temp-file→rename を経ない素の `writeFileSync` で events.json を保存し、`MoiraRepo.appendEvents` の load→append→save が排他なしの read-modify-write である
- **When**: 書き込み中にプロセスが中断される（crash / kill -9）／2 つのプロセスが並行して append する
- **Then**: 前者は部分・切り詰めの不正 JSON（**torn write**）を残す。後者は後勝ちの save が先の append を黙って捨てる（**lost update**）
- **期待値**: corrections.json（#11 で実装済み）と同水準のアトミック置換と排他がイベントログ本体にも効く
- **実際値**: **corrections.json より脆弱**——アトミック置換すら持たない（出典: issue #16 本文「背景」・`moira/changes/issue-16/request.md` 項目 1/2）

#### 3. 障害判定　`inferred`
障害 — 根拠: イベントログは Moira の一次記録であり、「追記だけで状態が決まる」（PR-EVENTS-ONLY）という agreed プロパティの土台にあたる。その耐久性・排他が保証されていない状態は、約束されたふるまいが実在しないことにほかならない。R3 タクソノミー正本が `impl-error` の該当例として本件を名指ししている（`rules/taxonomy-reference.md` R3 表）。境界事例ではない。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`bugfix` — 耐久性・排他の欠落という仕様外状態の是正。

#### 5. 変更範囲　`derived`
C（R1–R6）・M（R7: MODEL §7#20 追補）・D（R8: D-79 注記）・P（R9: 差分ゼロ確認）・S（R10: 新規なし確認）。出典: `moira/changes/issue-16/closure-report.md` 影響マップ表（クラス列）。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
一番大事な記録帳への書き込みが、途中で止まると帳簿が壊れる方式のままだった。しかも 2 人が同時に書くと、片方の書き込みが黙って消えた。同じ問題を別のファイルでは既に直していたのに、この本体だけ見落としていた。

#### 7. 発生原因詳細（技術者向け）　`derived`
#11 で corrections.json にアトミック置換を、#15 で advisory lock を導入した際、**保護の対象は corrections.json に限定されていた**。events.json は `moira/backend/src/event-store.ts` の `saveJson` で素の `writeFileSync` を呼び続けており、temp-file→rename を持たないため書き込み中断で torn write を許す。また `MoiraRepo.appendEvents` の load→append→save は排他区間を持たず、並行実行で lost update を許す。#16 は `atomicWriteFileSync`（同一ディレクトリの一意 temp → `renameSync`・失敗時 temp 掃除＋原例外再送出）を新設し、lock をパス汎用化（`acquireLock(dataPath)`/`withLock(dataPath, fn)`）して `appendEvents` 全体を events.json.lock の排他区間に入れた（出典: `closure-report.md` R1–R3）。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: #11／#15 の影響調査が「corrections.json を保護する」という**課題の記述をそのまま作業範囲として採用**し、「同じ書き込み方式を持つファイルは他に何があるか」を機械的に数える工程を持たなかった。`grep -rn 'writeFileSync' moira/` は当時も実行可能であり、実行すれば events.json 経路は即座に見えた。P2 影響調査のテンプレートに「同型パターンの全域走査」欄が無かったことが直接の帰責先。
- **根本要因分類**: `context-loss`
- **要因分類**: `impl-error`
- **詳細**: 周辺の同型箇所を「知ろうとすれば知れたが、視野に入れなかった」典型。しかもこの見落としは**連鎖している**——#15 で corrections.json のみ、#16 で events.json のみ、#17 で残余 6 ファイル、と 3 回に分けて同じ形の欠陥を追いかけており、各回の視野が「直前の issue が名指しした対象」に固定されていた。

#### 9. 同件調査対象　`derived`
#0002 の項目 9 と同一母集団。

#### 10. 同件調査結果　`inferred`
- **#0008（moira#17）** — 完全に同型（同一メカニズム・同一セッションで並行処理）。本件の P2 で開示されたスコープ外残余が #17 として捕捉された。
- **#0006（moira#15）** — 本連鎖の起点。根本要因ラベルは `verification-gap` だが、上位の失敗形（保護対象を全数で数えていない）は共通。
- **#0002（moira#5）** — `context-loss` が一致。「同型の他所を視野に入れなかった」という点で媒体（文書 vs コード）を越えて同型。
- **#0005（moira#13）** — 本件が塞いだ lost update／torn write が、#13 の実データ破壊（JSON 構造崩れ）として顕在化していた。因果でも接続する。

#### 11. 同件の対応状況　`derived`
- `moira#17` https://github.com/PrimeBrains/moira/issues/17 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#15` https://github.com/PrimeBrains/moira/issues/15 — CLOSED（同上）
- `moira#5` https://github.com/PrimeBrains/moira/issues/5 — CLOSED（同上）
- `moira#13` https://github.com/PrimeBrains/moira/issues/13 — CLOSED（同上）

#### 12. 再発防止策　`inferred`
**二段構え。(a) 出口: `moira/backend/.dependency-cruiser.cjs` または ESLint ルール ＋ CI。** `fs.writeFileSync` の直接呼び出しを `moira/backend/src/atomic-write.ts` 以外で**静的に禁止**し、違反を CI で fail させる（既知の例外——`init` の create-once シード——は許可リストで明示する）。これにより「同型が他にあるか」を人間が数える必要が消える。**(b) 出口: `.claude/skills/moira-change/SKILL.ja.md` の P2**（#0002・#0006 と同一の器）: 同型掃射の必須化。

#### 13. 検知すべき工程　`inferred`
`p2-impact-survey` — #15 の影響調査で「同じ書き込み方式を持つファイル」を波及先として列挙すべきだった。

#### 14. 実際に検知した工程　`derived`
`p2-impact-survey` — ただし**#15 の P2 ではなく #16 の起点となった #15 の P2 開示**として、issue にして 1 本ぶん遅れて検知された（出典: issue #16 本文「issue #15 の P2 影響調査（HA 2026-07-22）で開示されたスコープ外残余の捕捉 issue」）。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
13 と 14 のラベルは同一（`p2-impact-survey`）だが、**同一工程ではない**——検知したのは #15 の P2、検知すべきだったのは #11 の P2（corrections.json にアトミック置換を入れた時点）である。R4 のプロセス軸は「どの工程か」は表せても「**どの issue のその工程か**」を表せないため、この 1 本ぶんの遅れがラベル上は「ギャップなし」に見えてしまう。これは検知工程タクソノミーの表現力不足であり、A5 集約へ機構課題として申し送る。実質のギャップは「影響調査が課題文の名指し対象に視野を固定し、同型の全域走査を行わなかった」ことにある。

#### 16. 検知するための対策　`inferred`
**計器を足す**（12 (a) と同一）: `writeFileSync` 直呼びの静的禁止ルールを CI に置く。人間の影響調査に頼らず、同型の新規混入をコミット時点で止める。

---

### 0008: .moira 残余 6 ファイルが同型の torn write／lost update に露出（うち 1 経路はゲート再レビューで初めて発覚）

Status: reviewed
Entry ID: 0008
Key: moira#17
Schema: v2
Created: 2026-07-25T15:23:51Z
Source: analysis-intake
Verdict: 障害

#### 1. 対象システム　`derived`
`backend / capacity-store`（`moira/backend/src/capacity-store.ts`）＋ `cli / store`（`moira/cli/src/store.ts`・`commands.ts`・`members-import.ts`）＋ `process`（`moira/MODEL.md` §7#20・`moira/DECISIONS-CATALOG.md` D-79/D-11）。出典: `moira/changes/issue-17/closure-report.md` R1–R11。

#### 2. 事象　`derived`
- **Given**: #16 で events.json を保護した後も、`.moira` 配下の残余 6 ファイル（capacity.json / dates.json / milestones.json / labels.json / members.json / config.json）が素の `writeFileSync` 直書きのままである
- **When**: 書き込み中断が起きる／並行して read-modify-write が走る
- **Then**: 6 ファイルすべてで torn write。capacity/dates/milestones/labels は MoiraRepo 内 RMW ゆえ lost update、members/config は RMW が呼び出し側（`cmdMemberAdd`／`cmdConfigOrgCalendar`）にあるため**保存だけをロックしても塞げない**
- **期待値**: corrections.json（#11）・events.json（#16）と同水準の保護が `.moira` 全体へ均一適用される
- **実際値**: 6 ファイル露出。さらに **P4 の C ゲート再レビューで第 2 の members RMW writer（`import members` の `loadMembers` ロック外読み → `saveMembers` 全上書き）が新たに Critical として検出**された（出典: `moira/changes/issue-17/closure-report.md` 冒頭開示 (4)・R11 行）

#### 3. 障害判定　`inferred`
障害 — 根拠: #16 と同一の理由。永続化の耐久性・排他が約束の水準に達していなかった。加えて R11（`import members`）は**列挙作業を経てなお漏れた**経路であり、欠陥の実在は独立レビューが Critical として確認している。境界事例ではない。HX（2026-07-25）で承認済み。

#### 4. 変更分類　`inferred`
`bugfix` — #0007 と同一。

#### 5. 変更範囲　`derived`
C（R1–R6・R11）・M（R7）・D（R8: D-79／R9: D-11 の初の実装状態注記）・P/S（R10: 差分ゼロ確認）。出典: `moira/changes/issue-17/closure-report.md` 影響マップ表（クラス列）。

#### 6. 発生原因サマリ（専門用語なし）　`inferred`
同じ壊れ方をする書き込みが、まだ 6 つのファイルに残っていた。しかも「6 つある」と数え上げた後でさえ、名簿の取り込み処理という 7 つ目の経路を見落としており、それは後のレビューでようやく見つかった。

#### 7. 発生原因詳細（技術者向け）　`derived`
#16 が `atomicWriteFileSync` とパス汎用化した advisory lock を用意したため、#17 の作業自体は既存機構の適用だった。設計上の判断を要したのは members/config で、RMW がコマンド側にあるため保存だけの施錠では lost update を塞げない——HA 境界裁定「案A」で RMW を `MoiraRepo` へ移設した（`repo.upsertMember`／`repo.updateConfig`）。**そのうえで**、P4 の C ゲート再レビューが第 2 の members RMW writer を検出した: `cmdImportMembers` が `loadMembers` をロック外で読み `saveMembers` で全上書きしており、`upsertMember` を施錠しても import 経路から lost update が入る。是正は名簿マージを純粋関数 `mergeRoster` へ一本化し、新 `upsertMembers` が members.json.lock 内で fresh load→merge→atomic write を行う形（出典: `closure-report.md` R11 行）。

#### 8. 根本要因　`inferred`
- **仕組み帰責**: #0007 と同じく P2 の同型掃射の不在。ただし本件はそれに加えて、より鋭い証拠を持つ——**issue 本文が対象 6 ファイルを明示的に列挙していたにもかかわらず、7 つ目の経路（`import members`）が漏れた**。すなわち「列挙を人間／AI が行う」という工程設計そのものが、ファイル単位の列挙から書き込み**経路**単位の列挙へ落とすところで漏れを許す。工程を足すだけでは防げず、静的解析のような機械的全数走査が要る。
- **根本要因分類**: `context-loss`
- **要因分類**: `impl-error`
- **詳細**: 対象をファイル名で数えたため、同一ファイルに複数の writer がある可能性が視野から落ちた。R11 が独立レビューで捕まったことは、敵対ゲートが最後の砦として機能した証拠であると同時に、**その手前の全工程（P2 列挙・HA 裁定・実装）が同一の盲点を共有していた**証拠でもある。

#### 9. 同件調査対象　`derived`
#0002 の項目 9 と同一母集団。

#### 10. 同件調査結果　`inferred`
- **#0007（moira#16）** — 完全に同型（同一メカニズム・同一作業ツリー・同一セッション）。
- **#0006（moira#15）** — 本連鎖の起点。
- **#0002（moira#5）** — `context-loss` が一致（文書側の同型残存）。**`moira#20`（OPEN）も同一クラスタの現存例**。
- **#0005（moira#13）** — `state-management-gap` 系の隣接（並行書き込みによる破壊）。

#### 11. 同件の対応状況　`derived`
- `moira#16` https://github.com/PrimeBrains/moira/issues/16 — CLOSED（`gh issue list --state all` 2026-07-25 照合）
- `moira#15` https://github.com/PrimeBrains/moira/issues/15 — CLOSED（同上）
- `moira#5` https://github.com/PrimeBrains/moira/issues/5 — CLOSED（同上）
- `moira#20` https://github.com/PrimeBrains/moira/issues/20 — **OPEN**（同型クラスタの未解消例）

#### 12. 再発防止策　`inferred`
**出口: `moira/backend/.dependency-cruiser.cjs` / ESLint ＋ CI（#0007 の (a) と同一）。** 本件が示すのは「人間の列挙は経路単位では漏れる」ことであり、**工程やチェックリストの追加では塞げない**。`writeFileSync` 直呼びの静的禁止に加え、`load*` → `save*` の間にロック取得が無い経路を検出する lint ルールがあればなお良い（実装難度は高い——最低限、直呼び禁止を先に置く）。

#### 13. 検知すべき工程　`inferred`
`p2-impact-survey` — 対象を**書き込み経路**単位で列挙していれば `import members` は P2 で見えた。

#### 14. 実際に検知した工程　`derived`
`gate-adversary` — 6 ファイル分は #16 の P2 開示（1 issue ぶん遅れ）で、7 つ目の `import members` 経路は **P4 の C ゲート再レビューが Critical として検出**した（出典: `closure-report.md` 冒頭開示 (4)・ゲート敵対ラウンド節「round1 で R11 の import lost-update を Critical 検出→同工程是正」）。

#### 15. なぜ然るべき工程で検知できなかったか　`inferred`
P2 の列挙がファイル名を単位としたため、同一ファイルに複数 writer が存在する可能性が視野に入らなかった。**列挙という作業形式そのものの限界**であり、担当者の注意不足に帰責できない——issue 本文・request.md・impact-map の 3 箇所で 6 ファイルが明示列挙されており、注意は十分に払われていた。#0007 の項目 15 と同じく、R4 が「どの issue のその工程か」を表せないため、6 ファイル分の 1 issue ぶんの遅れはラベル上見えない。

#### 16. 検知するための対策　`inferred`
**計器を足す**（12 と同一）: `writeFileSync` 直呼びの静的禁止を CI に置く。**本件は「工程を足すだけでは防げないことの直接証拠」**であり、対策を人間のチェックリストに寄せてはならない——列挙・裁定・実装の 3 工程すべてが同一の盲点を共有した以上、独立した機械の目が要る。

---

## Steering 反映ログ

(`/kiro-postmortem-review` が承認された Try を `/kiro-steering-custom` で反映した際、本セクション末尾に append する。形式は `### {timestamp}` ブロックで `Source entries:` / `Target steering:` / `Try summary:` を列挙。append-only)

> **Steering 集約方針**: PDCA Try は **大カテゴリの 1 ファイル** に H2 セクションとして集約 append する。新規ファイル作成は新しい大カテゴリが立つ時のみ。横並びの細粒度ファイル乱立を避け、`steering-principles.md` 規約「Patterns over lists / Single domain per file」と整合させる。
