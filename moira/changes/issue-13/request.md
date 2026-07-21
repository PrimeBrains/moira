---
status: working-ledger
issue: 13
---

# 変更要求票 — issue #13

## 入口種別

issue直

## 明確化した変更要求文

`moira/cli/` の vitest テスト群が、開発者シェルに設定された `MOIRA_DIR` 環境変数を
継承して外部プロジェクトの実 log-home（`events.json`）を append/破壊しうる隔離漏れ
を、**多層防御**で恒久的に塞ぐ。

現状（origin/main 27ce37e 時点）:
- 症状として issue が名指しした 4 テストファイル（`commands-write-safety.test.ts`・
  `milestone.test.ts`・`dates.test.ts`・`adapter/drift/drift-golden.test.ts`）は
  commit `3fc5b23` で per-file の `beforeEach/beforeAll` に `delete process.env.MOIRA_DIR`
  を仕込む pattern で修理済み——issue 名指しの症状はもう再現しない。
- 追加で `home.test.ts`・`member-cli.test.ts`・`adapter/hooks.test.ts` は自前で
  同型の save/restore pattern を持ち、`xlsx/wbs-integration.test.ts` は全 `runCli`
  呼び出しで明示的に `--dir <tmp>` を渡している（resolver 優先順位 `--dir > MOIRA_DIR`
  ゆえ安全）。

残存リスク（＝本 issue が「多層防御」で塞ぎたい面）:
- **将来新設される test ファイル**が `runCli` を呼びつつ `--dir` も delete pattern も
  持たなければ、silent に同じ事故を再発する（現状は「著者の記憶」に依存）。
- リグレッションを止めるのは lint/レビューではなく**基盤側の env sanitization**
  でありたい——issue 本文の提案 #5「`vitest.config.ts` の `setupFiles` で
  `delete process.env.MOIRA_DIR` を強制」が最小変更で全 test file に効く。

具体的な変更:
1. `moira/cli/` の vitest 実行時に、テスト worker 起動直後に `MOIRA_DIR` を env から
   落とすグローバル setup を追加する（`setupFiles`）。テスト個別に MOIRA_DIR を
   意図的に**セット**する既存パス（`home.test.ts`・`hooks.test.ts` の resolver 検証・
   `member-cli.test.ts`）は、それぞれの `beforeEach/it` 内での明示的な代入をそのまま
   有効に保つ（`setupFiles` は起動時に一度だけ delete するのみで、以後の代入を禁じない）。
2. 陰性対照: 修正前の `MOIRA_DIR=<victim>` シェル下で failing していた再現を、
   修正後は新 test ファイル雛形（`runCli` を呼ぶが `--dir` も per-file delete も持たない
   最小 test）でも failing しないことを一度確認する。

**触らないもの（意図的スコープ外）**:
- `runCli` テストヘルパー本体の force override（issue 提案 #1）——現状の per-file
  pattern と `--dir` 明示のミックスで既に効いており、`setupFiles` を入れれば追加投資
  なしで最下層の防御が敷ける。ヘルパー改造は API 変更を伴い波及が大きい。
- CLI 本体側の safeguard（提案 #3・#4）——resolver の precedence は既存の設計判断
  （ADR-0003・`--dir > MOIRA_DIR > walk`）で意図的に決まっており、テスト隔離のために
  本体側にテスト実行検知（`VITEST` env 分岐）を混ぜるのは責務逆転。

原文: https://github.com/PrimeBrains/moira/issues/13

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL の公理・制約・語彙・既定・イベント意味論に触れない |
| D（設計判断級） | N | resolver precedence 等の既存判断は変更しない（テスト隔離の責務はテスト基盤側で完結） |
| P（プロパティ級） | N | 不変条件の新設・改訂なし |
| S（シナリオ級） | N | 観測ふるまい・EARS は変わらない（内部テスト隔離のみ） |
| **C（コード級）** | **Y** | 正典に触れない実装変更（テスト setup file 1 本の追加＋vitest.config.ts の 1 行追記） |
| V（検証基盤級） | 境界 | vitest.config.ts に触れるが、これは **CI 検知器の設定変更でなく**、テスト実行環境の env サニタイズ。**gate inventory は変わらない**（新規 lint/gate 追加なし・既存 CI job 構成不変）。よって V 級には該当しないと判定する——判定境界の説明は本行 |
| F（一般確定文書級） | N | 確定文書は変更しない |

## triage 判定

判定: フル工程
理由: 症状は per-file 修理で消えているが、issue が明示的に「多層防御（提案 #5）」を
要求しており、閉包の網（未マップ差分 ∅・意図整合）を通しておく価値がある。C 級のみ
のため人間タッチポイントは H5 の薄い承認のみ。

## base commit

27ce37e4093a08ec2566d42ac453307bbac420de
（worktree 分岐点＝fresh `origin/main`。`.claude/worktrees/issue-13` branch=`worktree-issue-13`。
以後の全差分検査は `27ce37e..HEAD`）
