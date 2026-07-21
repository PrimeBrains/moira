---
status: working-ledger
issue: 11
---

# 変更要求票 — issue #11

## 入口種別

issue直（#6 閉包 PASS 時に deferred 化された残工程の捕捉 issue——deferred の再評価条件「いずれかに着手した時点で moira-change フローを回す」の発動）

## 明確化した変更要求文

issue #6（MODEL v21 §2.10 普遍訂正原則の参照実装同期）の閉包時に deferred とされた残作業 3 件を、本 issue の実装サイクルで解消する:

1. **CLI 訂正書き込み UX**: 対話的 CLI コマンド `moira correct <event-id>` を設計・実装する。
   - patch 形: `moira correct <event-id> --reason "..." --patch amount=2`（複数フィールド指定・型変換を含む arg parse）
   - nullify 形: `moira correct <event-id> --reason "..." --nullify`（誤 cancel 回復を含む）
   - reason 必須の入力検証・確認プロンプト（destructive/locked target 警告）
   - `moira/cli` 側に corrections.json 永続化層を追加（backend 型 `Correction` は #6 で用意済み）
2. **bound プロパティ 3 件の agreed 昇格**: PROPERTIES.md v0.6 で proposed の PR-DONE-LOCK（v21 訂正 carve-out を含む一文）・PR-EVENTS-ONLY（訂正層の適用後読みを含む一文）・PR-CORRECTION-METER ★（v21 §2.10 (d) 新規）を、人間の一文レビュー（HA 意図批准）を経て agreed に昇格する。PBT witness は #6 で完備済み——★impl-pending の解除を伴う。
3. **HA B5 統合の完全配線**: 裁定「issue #36 遡及書き込み警告を訂正計器③retro に統合」の完全配線。③retro のセマンティクスを「correction の retroactive OR 遡及イベント書き込み」に拡張し、report 上の二重表示（既存 retroactive セクション＋correction meter 行）を統合、テキスト表現から一方を撤去する UX を決める。

原文: https://github.com/PrimeBrains/moira/issues/11

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL v21 §2.10 は確定済み。本 issue はその参照実装同期の残工程であり、正典への矛盾・変更は含まない（③retro 拡張が §2.10 (d) の計器定義文に触れる場合のみ M 昇格——P2 で判定） |
| D（設計判断級） | Y（候補） | 残作業 3（二重表示の統合・一方撤去の UX 決定）と残作業 1 の確認プロンプト設計は、MODEL が沈黙する 0→1 判断の可能性——境界裁定は HA へ |
| P（プロパティ級） | Y | 残作業 2: proposed→agreed の一文批准 3 件（サブルート①一文——HA 意図批准） |
| S（シナリオ級） | N（仮） | 既存シナリオ unit への波及有無は P2 で確認 |
| C（コード級） | Y | 残作業 1（CLI コマンド実装＋永続化層）・残作業 3 の配線実装 |
| V（検証基盤級） | N | 検知器そのものの変更は含まない（想定） |
| F（一般確定文書級） | N（仮） | PROPERTIES.md の状態遷移は P 級で扱う。その他確定文書への波及は P2 で確認 |

## triage 判定

判定: フル工程
理由: #6 閉包時 deferred 3 件の解消であり、issue 本文の再評価条件が本フロー実施（P1〜P6）を明記。C 級実装＋P 級一文批准＋D 候補（UX 判断）に跨る。

## base commit

edb6be7d13eef48bfb82e09f73f659ec122beef5

- worktree: .claude/worktrees/issue-11
- branch / 分岐点: worktree-issue-11（origin/main edb6be7 から fresh 分岐・2026-07-21）
