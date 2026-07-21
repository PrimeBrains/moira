# 来歴参照メモ — 本リポの確定文書を読むときの読み替え方針

> **目的**: 本リポ（`PrimeBrains/moira`）に残る**移管前文書**中の `#N` 表記の読み替え方針を
> canonical に置く（設計判断: [`DECISIONS-CATALOG.md`](./DECISIONS-CATALOG.md) D-80）。

## 旧 issue 番号（`#N`）の読み替え

**本リポに残る移管前文書中の `#N` は `PrimeBrains/sdd-workshop#N` を指す。** 本リポで新規起票された
issue（`#1`・`#2`・`#5` 等）とは**別物**として読む（一部は transfer 済みだが番号は一致しない）。
**機械置換は行わない**（来歴主義。本文自体は書き換えない——当時のコミット時点の意味を保持する）。

対応表と補足（transfer 済み issue の対応・移管日付・除外パス等）は移管記録
[`moira/changes/issue-42/migration-record.md`](./changes/issue-42/migration-record.md)「issue 読み替え表」節
（非正典・参考情報）が保持する。frontmatter に `status: working-ledger` と `issue: N` の
組み合わせがあるファイルの `issue: N` は本リポの issue 番号を指す（例外）。
