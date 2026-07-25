# Taxonomy Reference

> **本ファイルがタクソノミー定義の唯一の正本（source of truth）である。**
> `kiro-postmortem-add` は entry 作成時のラベル提案に、`kiro-postmortem-review` は有効ラベル検証に、
> `moira-change-analysis`（変更要因分析フロー）は障害・非障害の両台帳の記入に、いずれも本ファイルを参照する。
>
> **`.kiro/postmortem/defects.md` ヘッダは要約＋本ファイルへのポインタであり、定義の正本ではない**
> （2026-07-25・issue #19。複数ファイルを同期義務で結ぶ形は「正本 1 つ」ではないため、正本を 1 ファイルに確定した）。
> ラベルを追加・削除・改名するときは、本ファイルを更新し、`defects.md` ヘッダの**要約**を必要に応じて追随させる。
>
> **軸は 5 つ**: 要因分類（What）／検知工程（Where）／対象システム／根本要因分類（Why）／変更分類。
> 規範は [`.kiro/steering/moira-change-analysis.md`](../../../../.kiro/steering/moira-change-analysis.md) §5。

---

## R3: 要因分類タクソノミー (成果物軸 / What)

「欠陥が宿る成果物」を分類する。検証層 (review / test) のすり抜けはここでは扱わず、R4 で表現する。

| Label | 定義 (判定基準) | 該当例 |
|---|---|---|
| `requirements-error` | 要件・シナリオ文書自体に誤り・抜け・矛盾・実装詳細の混入があり、その質に起因する。仕様の表現を直さない限り再発する。 | 受け入れシナリオ unit の EARS 節が実装の観測ふるまいと食い違う |
| `design-error` | 設計判断が誤っていた / 抜けていた / 整合していない。要件は正しいが設計でブレた。 | 責務境界が曖昧で 2 つのモジュールが同じ責務を持つ |
| `impl-error` | 要件・設計通りでなく、コード実装そのものが誤っている。仕様レビューでは捕まらず、コード本体の修正で解消する。 | 保存が素の `writeFileSync` で、書き込み中断時に壊れた JSON を残す（`moira#16`） |
| `env-config` | 環境設定 / 構成 (パス / 環境変数 / ファイル配置 / ランタイム版) の不整合で発生。コードはどの環境でも妥当でも、構成のズレで壊れる。 | エージェント定義の `tools: Bash` と実ハーネスのシェルが食い違い、実行手段ゼロになる（entry #0001） |
| `data-state-dep` | テスト間 / 環境間で状態 (ファイル / キャッシュ / レコード) が想定外に残存・変動して引き起こされる。 | 前テストの保存値が次テストの初期条件を変える |
| `tooling-fragility` | ライブラリ / ツールの仕様や挙動に依存した脆さ。ツールの正常動作の中で発生する。 | セレクタの部分一致が意図しない要素にも合致する |
| `external-dependency` | 外部サービス・パッケージの破壊的変更・バージョン非互換・障害に起因する。プロジェクト内のコードや構成は変えていないのに壊れる。 | 依存パッケージがランタイム新版と非互換になる |
| `other` | 上記いずれにも明確に分類できない。レビュー段階で分類可能であれば原則 `other` は避ける。 | (該当時に記録) |

---

## R4: 検知工程タクソノミー (検証層 / Where)

「どの工程で気付けたはず・気付いたか」を表現する。**V モデル軸**（テスト層）と**プロセス軸**（本リポの実工程）を
**併存**させる。要件作成・設計・実装そのものの成果物作成工程は含めない（それは R3 が表す）。

### V モデル軸

実装ミスは単体テスト・設計ミスは結合テスト・要件ミスは E2E（受入相当）で検知されるべきという原則を反映。

| Label | 定義 (検証層の責務) | 主に検知すべき成果物の誤り |
|---|---|---|
| `code-review` | コードレビュー（人間・codex による静的検証）。命名・定数値・分岐網羅・暗黙の前提・ハードコードの検知層。 | 自動テストで意図を表現しにくい事項 |
| `unit-test` | 関数・モジュール単体テスト。純粋関数の入出力契約・境界例・例外パスを保証する層。 | **実装ミス** (`impl-error`) |
| `integration-test` | 複数モジュール統合テスト。単体では通るが結合で壊れる挙動・境界の契約検証。 | **設計ミス** (`design-error`) / 環境境界の不整合 (`env-config` の一部) |
| `e2e` | アプリ全体を通したエンドツーエンドテスト（Playwright 等）。ユーザー操作経路を再現して初めて出る欠陥・要件レベルの不変則。 | **要件ミス** (`requirements-error`) / 表示と API の整合性 |
| `manual-verification` | 手動回帰確認・スモークテスト・目視。自動化されていないがゲートとして実施する検証層。 | 視覚的・体感的・ドメイン感性的な検証 |
| `production` | 運用中の検知（監視・ログ・アラート）。ユーザー報告は含まない。 | 性能劣化・想定外データパス・低頻度エッジケース |
| `user-report` | ユーザーから報告されて初めて発覚。すべての内製検証ゲートを通過してしまった最後の砦。 | (すべての層をすり抜けた状態) |

### プロセス軸（変更管理フローの実工程・2026-07-25 追加）

`.kiro/steering/moira-change-management.md` の工程に対応する。V モデル軸では表せない検知点を表す。

| Label | 定義 |
|---|---|
| `p1-triage` | 変更管理フロー P1 受付・triage（クラス誤判定・軽量 exit の誤りはここで検知すべき） |
| `p2-impact-survey` | P2 影響調査（**波及先の列挙漏れ**はここで検知すべき） |
| `ha-ratification` | HA 前半集約セッション（意図・境界・前提の誤りはここ） |
| `gate-adversary` | 各ゲートの敵対レビュー・ラウンド（`doc-adversary`／`moira-adversary`／codex） |
| `gate-judge` | 独立採点・独立照合（`doc-gate-judge`／`moira-gate-judge`／`decision-conformance`／`e2e-scenario-checker`） |
| `p5-closure` | P5 同期閉包確認（未マップ差分・deferred 要件の不備） |
| `ci` | CI（計器①②③④） |
| `post-close` | クローズ後の発覚（全工程をすり抜けた状態。V モデル軸の `user-report` に相当） |

### Verification Gap の解釈ルール (R4.5)

- `検知した工程` と `検知すべき工程` のギャップは「すり抜けた検証層／工程」と解釈する。
- 例: `検知した工程 = post-close` かつ `検知すべき工程 = p2-impact-survey` は「影響調査がすり抜けた」を意味する。
- **このギャップは要因分析フローの入口フィルタそのものである**——ギャップがない（両者が等しい）事象は
  「工程が設計どおり働いた」ことを意味し、母集団に入れない（`.kiro/steering/moira-change-analysis.md` §2.1・D-84）。
- 要因分類（R3）には `review-miss` や `test-gap` のような検証層ラベルを置かない。これらは本ギャップで表現する。

---

## R13: 対象システム タクソノミー

「どこで発生したか」を分類する。**2026-07-25 改訂（issue #19）**: 旧版は `.kiro/specs/moira-*` の feature 名を
出所としていたが、**R/D/T の使い捨て化（issue #40）により `.kiro/specs` は存在しない**——出所を実在する
**対象システム**へ差し替えた。

| Label | 定義 |
|---|---|
| `backend` | `moira/backend/`——土台（型・fold・EVM 計算・永続化 primitive）。 |
| `frontend` | `moira/frontend/`——UI サーフェス（ガント・ポートフォリオ・Inspector 等）と E2E。 |
| `cli` | `moira/cli/`——コマンド群・書き込み経路・並行制御。 |
| `adapter` | プロジェクト別アダプタ・provider 設定・multi-repo 設置（`moira adapter install` 系）。 |
| `process` | 開発プロセス側——`.claude/skills/`・`.claude/agents/`・`.kiro/steering/`・確定文書（`moira/MODEL.md`・`moira/DECISIONS-CATALOG.md` 等）・台帳・テンプレート。**プロセスだけを変える変更が実在するため独立ラベルを持つ。** |
| `other` | 上記いずれにも該当しない / 未定義領域。 |

### サブスコープ表記

1 ラベルを参照し、任意で `/` 区切りの自由テキスト sub-scope を続けてよい:

- `backend / event-store`
- `frontend / surfaces/schedule`
- `process / kiro-postmortem-add`

---

## R14: 根本要因分類タクソノミー (Why 軸 / Mechanism of Failure)

「なぜそのミスが起きたか」のメカニズムを分類する。要因分類 (What 軸 / R3) と組み合わせて記述する。
両軸は直交し、(要因分類 × 根本要因分類) のいかなる組み合わせも有効。

| Label | 定義 (発生メカニズム) | 該当例 |
|---|---|---|
| `assumption-error` | 「自明」「不要」「変わらない」などの前提誤認・暗黙仮定が外れた結果。検証せず判断を省略した。 | 表示の主従は 1 つで足りると前提し、別の運用モードを想定に入れなかった（`moira#9`） |
| `knowledge-gap` | 仕様 / ライブラリ / フレームワーク / ドメインへの理解不足が直接の原因。学べば防げる。 | ライブラリの仕様上の制約を知らなかった |
| `context-loss` | 周辺情報・過去の決定・関連箇所を見落とした（知ろうとすれば知れたが、視野に入れなかった）。 | 同型の保護が必要な他ファイル群を視野に入れなかった |
| `verification-gap` | そもそも検証手段 (テスト / 自動チェック / レビュー観点) を整備していなかった結果、ミスが通過した。 | サブエージェントの成功報告を検証する層がなかった（entry #0001） |
| `pattern-misapplication` | 別ドメイン / 別文脈で正しいパターンを、現文脈に誤って流用した。 | 別単位系のスケール変換をそのまま持ち込んだ |
| `spec-impl-mismatch` | 仕様文と実装意図がズレている（仕様も実装も独立には妥当だが、互いを参照したときに食い違う）。 | 要件文に実装詳細を埋め込んで二重管理になった |
| `tooling-trap` | ツール / ライブラリの既知の落とし穴・直感に反する仕様にハマる。 | セレクタの部分一致仕様 |
| `state-management-gap` | テスト間 / セッション間 / 環境間で状態が残存・変動するパターンを設計時に想定していなかった。 | 並行実行で read-modify-write が後勝ちになる |
| `boundary-violation` | 責務境界を越えた変更を行った結果、別領域に副作用が出る。 | (該当時に記録) |
| `process-skip` | 必要なレビュー / テスト / 検証 / 段階確認の工程を省略した判断（時間制約 / 楽観バイアス）。 | 変更後に関連テスト全体を流さずに進めた |
| `other` | 上記いずれにも明確に分類できないメカニズム。 | (該当時に記録) |

---

## R15: 変更分類タクソノミー (2026-07-25 新設・issue #19)

「その変更は何をする変更だったか」を分類する。**障害・非障害の双方に付与する**——本軸があることで、
母集団が不具合に限らない（要因分析フローの対象は全変更）ことが表現される。

| Label | 定義 |
|---|---|
| `req-change` | 既存要件の変更（既定挙動が変わる）。 |
| `req-add` | 要件の追加（既定を維持したまま選択肢・機能を足す）。 |
| `refactor` | 外部から観測されるふるまいを変えない内部構造の改善。 |
| `bugfix` | 仕様から外れた状態の是正。 |
| `test-add` | テスト・witness の追加（プロダクト挙動は不変）。 |
| `ops-change` | 運用手順・設定・環境の変更。 |
| `process-improve` | 開発プロセス側（skill・steering・工程配線・テンプレート）の改善。 |
| `doc-only` | 文書のみの変更（規範・説明の追随を含む）。 |
| `other` | 上記いずれにも該当しない。 |

---

## (What × Why) Quick Reference Map

要因分類 (R3) と根本要因分類 (R14) の **よく合わさる組み合わせ** ＋ 検知すべき検証層 (R4) の早見表。
本表は厳格な制約ではなく、ドラフト提案時の補助。

| 要因分類 (What) | よく合わさる 根本要因分類 (Why) | 検知すべき検証層 (R4) |
|---|---|---|
| `impl-error` | `assumption-error` / `pattern-misapplication` / `process-skip` | `unit-test` (実装ミスは単体テストで) |
| `design-error` | `knowledge-gap` / `context-loss` / `boundary-violation` | `integration-test` (設計ミスは結合テストで) |
| `requirements-error` | `spec-impl-mismatch` / `assumption-error` | `e2e` (要件ミスは受入テスト / E2E で) |
| `env-config` | `context-loss` / `state-management-gap` | `integration-test` (環境境界の不整合) |
| `data-state-dep` | `state-management-gap` | `integration-test` / `e2e` |
| `tooling-fragility` | `tooling-trap` / `knowledge-gap` | `e2e` (ツールの落とし穴は実動作で) |
| `external-dependency` | `knowledge-gap` / `tooling-trap` | `integration-test` / `e2e` |

**プロセス側の欠陥の早見**（2026-07-25 追加）: 波及先の列挙漏れは `p2-impact-survey`、
前提・境界の誤りは `ha-ratification`、確定文書の内部矛盾は `gate-adversary`／`gate-judge`、
閉包要件の不備は `p5-closure` が「検知すべき工程」の第一候補になる。
