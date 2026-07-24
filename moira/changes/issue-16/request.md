---
status: working-ledger
issue: 16
---

# 変更要求票 — issue #16

## 入口種別

issue直

（#15 の P2 影響調査〔HA 2026-07-22〕で開示されたスコープ外残余の捕捉 issue として起票済みのものを受付。
台帳: `moira/changes/issue-15/impact-map.md` スコープ外開示欄・`intent-ratification.md` ①補足/⑤欄）

> **再構成の開示（2026-07-24）**: 本 issue の P1 triage（2026-07-23）・P3/HA 前半集約セッション（2026-07-24）は
> GitHub issue コメントで実施・記録済みだが、当時の作業 worktree（`worktree-issue-16`）が撤去され台帳ファイルが
> 残っていなかったため、本 request.md / impact-map.md / intent-ratification.md は **GitHub コメントの裁定記録
> （人間が読む正典的要約——steering §6 が issue に残すことを義務づける面）から再構成した**。裁定内容は
> コメントに忠実（[P1 triage](https://github.com/PrimeBrains/moira/issues/16#issuecomment-5060016726)・
> [P3/HA](https://github.com/PrimeBrains/moira/issues/16#issuecomment-5064510592)）。台帳は非正典（steering §5・
> `moira/changes/README.md`）ゆえ再構成が正典性を損なわない。実装工程（P4 以降）は #17 と同一 worktree
> `issue-16-17`（base 同一 17c9da0）で継続する。

## 明確化した変更要求文

1. **events.json 書き込みのアトミック置換化**: `moira/backend/src/event-store.ts` の `EventStore.saveJson`
   は素の `writeFileSync`（temp-file→rename なし）で、書き込み中断（crash/kill -9）に対し **torn write**
   （部分/切り詰め JSON）を許す。corrections.json（#11 で実装済み）と同水準の **temp-file→rename の
   アトミック置換**へ是正する。
2. **events.json の並行書き込み保護**: `MoiraRepo.appendEvents` の load→append→save は read-modify-write
   であり、並行実行で **lost update**（後勝ちの save が先の append を黙って捨てる）を許す。#15 で
   corrections.json に導入した **fs advisory lock 機構**を events.json にも同水準適用する（②境界裁定で
   適用可否を確定）。
3. **正典の実装状態注記の同期**: MODEL §7#20 追補・DECISIONS-CATALOG D-79 注記に残る「イベントログ本体の
   同型書き込み保護はスコープ外——issue #16 で追跡」の記述を、上記実装完了後の状態へ同期する
   （**規範本文・判断一文は不変**——実装が正典に追いつくだけ）。

原文: https://github.com/PrimeBrains/moira/issues/16

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | Y（注記同期のみ） | §2.10 の規範自体は変更しない（実装追随）。MODEL §7#20 追補の「#16 で追跡」注記の解消は MODEL 文面に触れる |
| D（設計判断級） | Y（要 P2 確認） | 永続化方式（アトミック置換・advisory lock 適用）は既存 D-11（「永続化方式を決める責任は土台が持つ」）の範囲内か、新 D 起票要かを HA 境界裁定で確定。既存 D-79 の注記更新も本面 |
| P（プロパティ級） | 要調査 | §2.10 関連の bound プロパティへの波及有無を P2 で確認（想定: 書き込み耐久性はプロパティ集の対象外＝差分ゼロ） |
| S（シナリオ級） | 要調査 | events.json 書き込みのアトミック性はユーザー可視のふるまいを変えない——関係 unit の有無を P2 で確認 |
| C（コード級） | Y | event-store.ts の saveJson アトミック化・store.ts の lock 汎用化＋appendEvents 適用・witness テスト |
| V（検証基盤級） | N | 検知器そのものは変更しない |
| F（一般確定文書級） | N | 対象なし（P2 で反証されれば追記） |

## triage 判定

判定: フル工程
理由: 永続化層（events.json 書き込み）の並行性挙動を変えるコード級変更で、#15 と同型の文書追補
（DECISIONS-CATALOG/MODEL の実装状態注記）への波及可能性があり、本 issue 自身の再評価条件が
moira-change フロー起動を指定しているため（軽量 exit の要件を満たさない）。

## base commit

17c9da07f6a30a0947f5b5347012a9ae3a457ef1

- worktree: .claude/worktrees/issue-16（起票時記録・撤去済み）→ 実装工程は `issue-16-17` で継続（base 同一）
- branch / 分岐点: worktree-issue-16（origin/main 17c9da0 から fresh 分岐）——#17 と統合し issue-16-17 で継続
