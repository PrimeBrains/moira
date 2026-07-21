---
status: working-ledger
issue: 8
---

# 変更要求票 — issue #8

## 入口種別

issue直

<!-- 発生元は issue #7 の kiro-scenario ゲート（codex 独立レビュー）内で検出された Important
     指摘（変更管理フロー deferred）。ただし本 issue #8 として人間が独立に起票済みのため入口は「issue直」。 -->

## 明確化した変更要求文

`.kiro/scenarios/units/` 配下の受け入れシナリオ unit（agreed/in-review 含む）に残る**参照リンクの
破れ**を棚卸しし、次の 3 群を是正する。base は #7 コミット後（`8a93f57`）。

- **(A) 相対パス深度誤り（`../../moira/…` → `../../../moira/…`）**: `units/` 配下のファイルから
  `../../moira/…` は `.kiro/moira/…`（不存在）に解決される。正しい深度は `../../../moira/…`
  （リポジトリルート直下の `moira/`）。参照先（MODEL.md・backend/frontend の参照実装ファイル）は
  正しい深度に**実在する**ため、深度訂正で解決する。
- **(B) 旧 spec 直リンク（`../../.kiro/specs/moira-core|moira-schedule/requirements.md`）**:
  深度誤りに加え、**参照先が本リポに不存在**（`.kiro/specs/` は空——R/D/T アーカイブは sdd-workshop#40
  裁定で旧リポ残置）。深度訂正だけでは「深度は正しいが依然リンク切れ」になるため、**参照書式そのものの
  恒久方針**（リンク撤去して clause 名の平文引用に落とす／来歴注記化 等）を要する。方針は issue #5 の
  spec 参照裁定（D-80・`HISTORICAL-REFERENCES.md`・#40「使い捨て R/D/T のリンク整合は追わない」）と
  束ねて決める。
- **(C) 上記 (A)(B) を 3 ファイル横断で uniform に適用**: schedule-rebaseline.md /
  schedule-leveled.md / schedule-reorder.md（＋調査で他 unit に同型があれば追加）。

**ふるまい本体（When/Then）・EARS・§2/§5 fixture は無変更**——参照注記・事実引用リンクの是正に限る
（#7 と同型の S 級文言同期）。

### 実態の再確認（issue 記載との差分・P2 で精緻化）

- issue 本文は「grep 11 箇所・schedule-rebaseline 分（4 箇所）は #7 R2 で是正済み」とするが、**#7 が是正
  したのは行番号→節/clause の"アンカー形式"であって"相対パス深度"ではない**。#7 コミット後（`8a93f57`）
  時点でも rebaseline には `../../moira/…` 深度誤りが 5 occurrence（L53/186×2/188/206）残る。したがって
  rebaseline の MODEL/参照実装リンクの**深度**是正も #8 が担う（issue コメント (a) が #7 帰属と見なした
  想定と実コミットのズレ——本 issue で吸収）。
- 正確な occurrence 数は P2 影響マップで確定（速報: 深度誤り 14 occ・旧 spec 直リンク 9 occ）。

原文: https://github.com/PrimeBrains/moira/issues/8

## 候補クラス（仮判定）

| クラス | 該当 | 根拠 |
|---|---|---|
| M（MODEL・正典設計物級） | N | MODEL の公理・制約・語彙・既定・イベント意味論に触れない。参照**リンク**の是正のみ。 |
| D（設計判断級） | 保留 | (B) の「旧 spec 直リンクの恒久参照書式」は 0→1 の政策要素を含むが、既存政策（#40 使い捨て・D-80 来歴主義・moira-verification「アーカイブは当時の射影」）が既に統治しており、新 0→1 判断ではなく**既存政策の適用**の可能性が高い。境界裁定を HA へ。 |
| P（プロパティ級） | N | 不変条件に触れない。 |
| S（シナリオ級） | **Y（主）** | 対象は agreed/in-review の受け入れシナリオ unit。観測ふるまいの外的妥当性を支える事実参照の是正＝既存 unit の文言同期。経路は `kiro-scenario`（既存 unit 改稿ルート）。 |
| C（コード級） | N | 参照実装コードは触らない（リンク**先**であって編集対象でない）。 |
| V（検証基盤級） | N | 検知器（CI・coverage-check 等）を変更しない。 |
| F（一般確定文書級） | N | 対象は S 面の scenario unit。一般確定文書ではない。 |

## triage 判定

判定: フル工程
理由: 対象が agreed/in-review の受け入れシナリオ unit（確定/準確定の S 面成果物）であり、(B) は
参照書式の恒久方針裁定を含むため軽量ルートでは捌けない。#7（同型 S 級文言同期）もフル工程で流した先例に従う。

## base commit

8a93f57 <!-- issue #7 P4→P6 コミット後。#6 の未コミット backend 実装は worktree 隔離で本 issue の差分に混じらない。 -->
