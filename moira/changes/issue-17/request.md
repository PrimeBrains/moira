---
status: working-ledger
issue: 17
---

# 変更要求票 — issue #17

## 入口種別

issue直

（#16 の P2 影響調査〔HA 2026-07-24〕で開示されたスコープ外残余の捕捉 issue として起票済みのものを受付。
台帳: `moira/changes/issue-16/impact-map.md` スコープ外開示欄・`intent-ratification.md` ①補足/⑤欄）

## 明確化した変更要求文

1. **`.moira` 残余ファイル群の書き込みアトミック置換化**: 以下はいずれも素の `writeFileSync` 直書きで
   torn write（書き込み中断による不正 JSON 化）を許す——corrections.json（#11）・events.json（#16）と
   同水準の **temp-file→rename アトミック置換**へ是正する:
   - capacity.json（`appendCapacity` → backend `CapacityStore.saveJson` 直書き）
   - dates.json（`appendDateEntries` 直書き）
   - milestones.json（`appendMilestoneEntries` 直書き）
   - labels.json（`writeLabels` 直書き）
   - members.json（`saveMembers` 直書き）
   - config.json（`writeConfig` 直書き）
2. **read-modify-write 経路への並行書き込み保護（lost update 防止）**: #15/#16 で導入した fs advisory
   lock 機構（パス汎用化済み）を read-modify-write 経路へ適用する。issue 本文が明記する **capacity/dates/
   milestones/labels** は load→modify→save が MoiraRepo メソッド内で完結するため直ちに適用可能。
   **members/config** は read-modify-write が呼び出し側（`cmdMemberAdd`／`cmdConfigOrgCalendar`）にあり、
   保存だけをロックしても lost update を塞げない——RMW を MoiraRepo へ移すか否かを HA 境界裁定で確定する。
3. **正典の実装状態注記の同期**: #16 の文書ゲートが MODEL §7#20 追補・DECISIONS-CATALOG D-79 注記に残す
   「.moira 他ファイルの torn write/lost update は issue #17 で追跡」の記述を、上記実装完了後の状態へ
   同期する（**規範本文・判断一文は不変**）。永続化方式を所管する D-11 に実装状態注記を添えるか否かも
   HA で確認する。

原文: https://github.com/PrimeBrains/moira/issues/17

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | Y（注記同期のみ） | 規範は変更しない（実装追随）。MODEL §7#20 追補の「#17 で追跡」注記の解消は MODEL 文面に触れる |
| D（設計判断級） | Y（要 P2 確認） | 永続化方式（アトミック置換・advisory lock 適用）は既存 D-11 の範囲内の実装詳細（#15/#16 で確定した境界を踏襲）。D-79 注記解消＋D-11 実装状態注記が本面。members/config の RMW-into-repo 可否も境界裁定 |
| P（プロパティ級） | 要調査 | 書き込み耐久性はプロパティ集の対象外（想定: 差分ゼロ）——P2 で確認 |
| S（シナリオ級） | 要調査 | 書き込みのアトミック性・排他はユーザー可視ふるまい不変（想定: S 級新規なし）——P2 で確認 |
| C（コード級） | Y | capacity-store.ts の saveJson アトミック化・store.ts の残余 6 ファイルへの atomic＋lock 適用・members/config の RMW-into-repo・witness テスト |
| V（検証基盤級） | N | 検知器そのものは変更しない |
| F（一般確定文書級） | N | 対象なし（P2 で反証されれば追記） |

## triage 判定

判定: フル工程
理由: 永続化層（.moira 残余 6 ファイル書き込み）の並行性・耐久性挙動を変えるコード級変更で、#15/#16 と
同型の文書追補（MODEL §7#20・D-79・D-11 の実装状態注記）への波及があり、本 issue 自身の再評価条件が
moira-change フロー起動を指定しているため（軽量 exit の要件を満たさない）。

## base commit

<!-- #16 の実装確定コミット（events.json 保護＋lock 汎用化＋atomic ヘルパの着地点）を base とし、
     #17 の diff(base..HEAD) 閉包照合が #17 分の作業だけを見るようにする。実 SHA は #16 コミット後に確定。 -->
（#16 実装確定コミット——P4 C 面コミット後に確定。issue-16-17 worktree・base 起点 17c9da0）

- worktree: .claude/worktrees/issue-16-17（#16 と統合。両 issue を同一 worktree で連続処理）
- branch / 分岐点: issue-16-17（origin/main 17c9da0 から fresh 分岐）——#17 の base は #16 実装確定コミット
