---
status: working-ledger
issue: 15
---

# 変更要求票 — issue #15

## 入口種別

issue直

（#11 ゲート 2〔codex レビュー是正〕で開示された残余の捕捉 issue として起票済みのものを受付）

## 明確化した変更要求文

1. **構造無効 3 例の pre-admission 化**: MODEL v22 §2.10「検証の迂回は不能」の列挙 4 例のうち、
   issue #11 で pre-admission 化済みの 2 例（foreign field・非人間 actor→agreed）に続き、残余 3 例——
   ①親を子孫へ動かす decompose 値訂正（木性/I2 循環）②負の amount への cost 訂正（A6）
   ③循環を作る relate 端点訂正（I2）——を `moira/backend/src/fold.ts` の pre-admission 検証
   （試行 fold または局所検証）へ追加する。これにより「適用不能な訂正は winner 登録に入らず、
   先行する有効な訂正が現行のまま残る」という正典の読みが 3 例にも成立する（現状は base switch の
   構造検証拒否に依存し「訂正適用後イベントが丸ごと拒否される」読みになっている——fold.ts に
   インライン正直開示済み）。各例に witness テストを付す。
2. **corrections.json の並行書き込み保護**: read-modify-write の lost update に対する保護を実装する。
   #11 では軽量スキーマ検証＋アトミック置換まで実施済みであり、残余は advisory lock 等の排他機構。
3. **正典の実装状態注記の同期**: #11 ゲート 3 で「#15 追跡」と注記された実装状態注記
   （DECISIONS-CATALOG D-1/D-79・MODEL §7#20 追補・fold.ts インライン開示）を、上記実装完了後の
   状態へ同期する。

原文: https://github.com/PrimeBrains/moira/issues/15

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | Y（注記同期のみ） | §2.10 の規範自体は変更しない（実装追随）。ただし MODEL §7#20 実装状態追補の「#15 追跡」注記の解消は MODEL 文面に触れる |
| D（設計判断級） | Y（要 P2 確認） | 並行書き込み保護の機構選定（advisory lock 等）と pre-admission の実現方式（試行 fold vs 局所検証）は MODEL 沈黙下の工学判断の可能性。既存 D-1/D-79 の注記更新も本面 |
| P（プロパティ級） | 要調査 | §2.10 関連の bound プロパティ（#11 で 3 件 agreed）への波及有無を P2 で確認 |
| S（シナリオ級） | 要調査 | 「先行有効な訂正が現行のまま残る」は観測ふるまい——関係 unit の有無を P2 で確認 |
| C（コード級） | Y | fold.ts pre-admission 3 例＋witness テスト、corrections.json 排他の実装本体 |
| V（検証基盤級） | N | 検知器そのものは変更しない |
| F（一般確定文書級） | N | 対象なし（P2 で反証されれば追記） |

## triage 判定

判定: フル工程
理由: issue 自身が再評価条件に「着手時点で moira-change フローを回す」を明記。実装 2 系に加え
正典実装状態注記（MODEL §7#20・D-1/D-79）への波及があり、軽量 exit の要件を満たさない。

## base commit

6b0e45dbb94be557727d2cde40866ca2dfe8f055

- worktree: .claude/worktrees/issue-15
- branch / 分岐点: worktree-issue-15（origin/main 6b0e45d から fresh 分岐）
