---
status: working-ledger
issue: 2
---

# 閉包レポート — issue #2

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ④ の行） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R1-1 | M-翻訳 | 訂正の大原則 (a)〜(e) | R1-1（5 要素が構造要件・削除/書き換え禁止） | MODEL v21 §2.10 冒頭（普遍訂正原則 (a)〜(e)） | Y |
| R1-2 | M-翻訳 | コスト誤入力の訂正 | R1-2（負値相殺なし・事実/記録の射程明文化） | MODEL v21 A6 射程注記＋§2.8 cost 行＋§7#19(a) | Y |
| R1-3 | M-翻訳 | 完了済みの訂正（音が鳴る） | R1-3（訂正不可でなくなる・理由必須＋常設表示・無音変更は不可） | MODEL v21 I4「施錠と訂正の区別」＋§3 同期（「完了済みは、黙っては変わらない」） | Y |
| R1-4 | M-翻訳 | 誤キャンセルの復活 | R1-4（un-cancel 機構なし・記録訂正で表現・裸の逆行は拒否側） | MODEL v21 §2.5 注記＋§2.10(ii) 誤記表明＋§7#19(b) | Y |
| R1-5 | M-翻訳 | 訂正の置き場所=第二層 | R1-5（4 型不変・R-U14 同型第二層。HA で第二層を選択） | MODEL v21 §2.10「表現形」＋§5「訂正に第 5 イベントは不要」 | Y |
| R1-6 | M-翻訳 | ごまかし防止の計器 | R1-6（警告と同格の会計・裁量ノブなし） | MODEL v21 §2.10「訂正計器」（常設 4 区分・閾値/色分けなし）＋§2.1 会計規律 | Y |
| R1-7 | M-翻訳 | 歴史の読み直し | R1-7（現在の射影のみ・保存済みレポート不変・backfill 拒否恒久化・bitemporal 導入せず） | MODEL v21 §2.10「歴史の読み直し」＋「backfill 拒否の恒久裁定」 | Y |
| R1-8 | M-翻訳 | 訂正の連鎖 | R1-8（同一の元イベント単位の latest-wins・全履歴保存・supersede 型新機構なし） | MODEL v21 §2.10「連鎖規則」（対象イベント単位・全体置換） | Y |
| R1-9 | M-翻訳 | 付随整備 | R1-9（cost/relate reason 欄・解除センチネル・所属矛盾警告の正典裁定。実装は後続） | MODEL v21 §2.8（reason 三態注記・解除センチネル・矛盾所属警告）＋§7#16(c)/#18(d)/#19(d) | Y |
| R4 | P | bound プロパティ再批准 | R4（影響一文の整合・意味が変わる行は proposed 再降格・移行注記） | PROPERTIES v0.5（PR-DONE-LOCK・PR-EVENTS-ONLY 改訂＋再降格・他は字義どおり真のまま無改訂・被覆表同期） | Y |
| R11 | S | schedule-rebaseline 注記文言 | HA ⑤（deferred 承認）＋F1 とは独立 | （本サイクルでは改稿せず——追跡 #7） | Y（deferred） |
| R12 | S | requirements-spec-returned 前提記述 | HA ⑤（deferred 承認） | （同上——追跡 #7） | Y（deferred） |

HB 裁定 1 件（F1: 日付も訂正可＋遡及訂正の専用計器区分）は fork-batch.md に記録され、§2.10「ts の訂正」「訂正計器③」として反映済み（採点者の fork 被覆監査 OK）。

### ② できないことになったこと（平易な差分）

- 今の機能では、**訂正はまだ実際には使えない**——コスト誤入力の修正・誤キャンセルの復活・日付の訂正・担当/レビュー担当の解除・親の奪い合い警告・訂正計器の表示は、正典（ルールブック）が先に確定した状態であり、道具側の対応はこれから〔追跡 #6〕。それまで道具は従来どおり（完了済みの見積り直しは全部拒否・訂正手段なし）。
- 確定済み受け入れシナリオ 2 件の注記文言（「完了分は再ベースライン不可（施錠）」等）は旧い言い回しのまま残る——ふるまい本体は無傷で、文言の同期は後続〔追跡 #7〕。

### ③ 閉包判定

**PASS**

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | moira/MODEL.md | resolved | moira-gate-judge PASS（残存 C/I=0・意図整合 ALIGNED）＋確定 20a639e＋doc-fact-checker CONFIRMED(1-3) |
| R2 | moira/NAMING.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(4-5) |
| R3 | moira/DECISIONS.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(6) |
| R4 | moira/PROPERTIES.md | resolved | 20a639e＋HA R4 批准＋doc-fact-checker CONFIRMED(10-13) |
| R5 | moira/DECISIONS-CATALOG.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(7-9) |
| R6 | .kiro/steering/moira-model.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(14) |
| R7 | .kiro/steering/moira-naming.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(15) |
| R8 | moira/README.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(16) |
| R9 | moira/validation-scenarios.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(17) |
| R10 | moira/PROPERTIES-RELEVANCE-REVIEW.md | resolved | 20a639e＋doc-fact-checker CONFIRMED(18) |
| R11 | .kiro/scenarios/units/schedule-rebaseline.md | deferred | #7 OPEN（機械照合）・owner nakawodayo・再評価条件: 次 kiro-scenario サイクル |
| R12 | .kiro/scenarios/units/requirements-spec-returned.md | deferred | 同上 |
| R13 | moira/backend/ | deferred | #6 OPEN（機械照合）・owner nakawodayo・再評価条件: 次実装サイクル・当該パス差分なし |
| R14 | moira/cli/ | deferred | 同上 |
| R15 | moira/frontend/ | deferred | 同上 |

doc-fact-checker 最終判定: NO_OBJECTION（20 主張全件 CONFIRMED・CORRECTED 0 件）。留意: issue #33/#5 参照は旧リポ（PrimeBrains/sdd-workshop）のもので v20 来歴の先例と整合（矛盾でない）。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: c7a14ce618f02a6fd98cdf776beb80a2374b7f7c（request.md 記載の受付時点 commit）
- HEAD（P5 開始時点で固定）: 3856b347f3b91877c8676b04276705e99a344528
- changed（`git diff --name-only base..HEAD`・`moira/changes/**` を正規化後に自己除外・rename 検出なし）: `.kiro/steering/moira-model.md`・`.kiro/steering/moira-naming.md`・`moira/DECISIONS-CATALOG.md`・`moira/DECISIONS.md`・`moira/MODEL.md`・`moira/NAMING.md`・`moira/PROPERTIES-RELEVANCE-REVIEW.md`・`moira/PROPERTIES.md`・`moira/README.md`・`moira/validation-scenarios.md`（10 件）
- mapped: R1〜R10 の 10 パスと 1:1 一致。**未マップ差分: 空（changed − mapped = ∅）**
- 判定有効性: 照合開始〜終了まで非台帳パスの HEAD 移動なし（判定後のコミットは `moira/changes/**` の台帳のみ＝自己除外対象。判定後に非台帳差分が base..HEAD へ追加されていないことをクローズ直前に再確認する）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

| 行 ID | deferred 行 | 後続 issue | owner | 再評価条件 | openness 照合 |
|---|---|---|---|---|---|
| R11 | .kiro/scenarios/units/schedule-rebaseline.md | #7 | nakawodayo | v21 確定後の次 kiro-scenario サイクル | `gh issue view 7 --json state` → OPEN（2026-07-20） |
| R12 | .kiro/scenarios/units/requirements-spec-returned.md | #7 | nakawodayo | 同上 | 同上 |
| R13 | moira/backend/ | #6 | nakawodayo | v21 確定後の次実装サイクル | `gh issue view 6 --json state` → OPEN（2026-07-20） |
| R14 | moira/cli/ | #6 | nakawodayo | 同上 | 同上 |
| R15 | moira/frontend/ | #6 | nakawodayo | 同上 | 同上 |

</details>

<details>
<summary>P5 の限界（正直枠・steering §5）</summary>

本判定が担保するのは「影響マップに載った行＋未マップ差分ゼロ」であり、P2 の調査自体の網羅性ではない。steering §5 の未整備義務（境界モデル検査の未実装・意味突合の網羅性・再生成 R/D/T の忠実性）は本レポートでも「担保」と主張しない。後日発覚した漏れは新 issue として再入する。

</details>
