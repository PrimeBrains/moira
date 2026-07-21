---
status: working-ledger
issue: 6
---

# 変更要求票 — issue #6

## 入口種別

issue直

原文: https://github.com/PrimeBrains/moira/issues/6

## 明確化した変更要求文

MODEL v21（issue #2 で正典化した §2.10 普遍訂正原則）の参照実装・計器を、v21 §7#20 が本
issue（#6）を追跡先として名指しするとおり、既存の 4 イベント公理（第一層）を破らずに
**訂正層（第二層）＋訂正計器＋解除センチネル＋矛盾所属警告**として実装同期する。

具体的義務（issue 本文および MODEL §2.10・§2.8・§3 I4・§7#20 に依拠）:

1. **訂正記録型の導入**（backend/types.ts）: 追記専用・reason 必須・元イベント id 名指し・
   タイムスタンプ付き・第一層 4 イベント（transition/decompose/relate/cost）とは別カテゴリ。
   第 5 イベント型を足さない——「訂正はイベントの訂正記録であって新イベントではない」（§2.10）。
2. **cost/relate への任意 reason 欄**（§2.8）を型で表現。
3. **assignee/reviewer の解除センチネル**（§2.8）を型・fold の read 側で反映（unassigned 復帰の
   経路）。
4. **矛盾所属警告**（§2.8 R-U12 同型）を導出・警告述語として実装。
5. **訂正適用後ログの導出**（fold 前読み替え or 導出層合成——実装形態は実装の責務）。
   意味論一行原理: 「訂正適用後のログは、第一層の既存意味論（構造検証・(ts,id) latest-wins・
   導出・警告述語のすべて）でそのまま読み直される一つのログである」（§2.10）。検証を迂回する
   訂正は適用不能の可視エラー。
6. **derivations**: cancelled 誤記表明後の再計算規則（un-cancel 専用機構は作らない・状態機械は
   不変）。
7. **PBT/単体テスト改訂**: done-lock.pbt.test.ts の拒否メッセージ pin・events.test-d.ts の
   「4 型固定」は**維持**——訂正は第二層で第 5 型ではない。
8. **CLI**: 訂正の書き込み UX・backfill 拒否の恒久実装確認（wbs-import.ts は issue #37 で先取り
   済み）・裸の逆行遷移の拒否。
9. **frontend/report**: 訂正計器の常設 4 区分（総数・施錠対象・遡及・適用不能）＝
   warnings.ts/HealthSurface.tsx・report.ts の Δ 訂正跨ぎ表示・矛盾所属警告。

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL v21 は #2 で正典化済み。本 issue は正典に**触れない**参照実装同期であり、MODEL に矛盾・変更を持ち込まない |
| D（設計判断級） | 可能性あり | 実装形態の 0→1（訂正の適用は fold 前読み替えか導出層合成か、reason 欄の enum vs free-text 等）が MODEL 沈黙。§3 の既定ルート「境界不明瞭は D」に該当しうるが、実装内の設計選択で解消可なら doc-refine 純工学枝で吸収できる（HA で境界裁定） |
| P（プロパティ級） | 可能性あり | 「訂正適用後ログは既存意味論でそのまま読み直せる」意味論一行原理を保証する invariant を新 property として追加できる可能性。ただし v21 §7#20 は property 追加を明示義務化していない——PBT 改訂は既存 done-lock.pbt.test.ts の拒否メッセージ pin 維持レベル |
| S（シナリオ級） | N | シナリオ文言同期は v21 §7#20 で **別 issue（#7）** として分離。本 issue は参照実装のみ |
| C（コード級） | Y | 参照実装（backend/cli/frontend）・PBT/型テスト改訂が中核。issue 本文が「C 級 → /kiro-impl（worker=sonnet）＋codex レビュー＋CI」経路を明示 |
| V（検証基盤級） | N | 検知器そのものの変更ではない（既存 CI・calibration の走行のみ） |
| F（一般確定文書級） | N | 一般確定文書の改訂を含まない（DECISIONS-CATALOG の関係判断は v20/v21 挙動の移行注記に留まり、本実装完了で v21 挙動に切り替わる下流帰結） |

**主クラス: C**（+ D/P は HA 境界裁定で確定）

## triage 判定

判定: フル工程
理由: 中核公理（A2）の射程を触る v21 §2.10 の実装同期であり、既存 PBT・型固定の維持要件と型追加が並走する。issue 本文が「moira-change P4 の既存ゲート」経路を明示している

## base commit

df99c4896360d42dd969c7ce4df26f3d926fbcab
