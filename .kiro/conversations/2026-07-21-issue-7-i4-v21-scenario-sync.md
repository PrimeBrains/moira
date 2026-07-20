---
created_at: 2026-07-21T00:00:00Z
title: issue #7 — I4 v21 精密化「完了済みは黙っては変わらない」への受け入れシナリオ文言同期（schedule-rebaseline・requirements-spec-returned）
bindings:
  - { kind: scenario, id: "units/schedule-rebaseline" }
  - { kind: scenario, id: "units/requirements-spec-returned" }
source: claude-code-session
---

## 要約

- 論点: MODEL v21（issue #2）で I4 完了施錠が「完了済みは変わらない」→「完了済みは、黙っては
  変わらない」（意味的再ベースライン不可は不変・記録誤りの訂正は §2.10 で可能かつ計器で音が鳴る）へ
  精密化されたことに伴い、agreed unit（schedule-rebaseline）と in-review unit
  （requirements-spec-returned）に残る旧 I4 意味論の断定・前提記述をどう同期するか
  （issue #2 影響マップ R11/R12 の追跡付き deferred の追跡先＝issue #7）。
- 選択肢:
  - A. 文言同期のみ（ふるまい §3/§6 は無傷・境界注記レベル）＋同根の参照ドリフト（MODEL 行番号
    アンカー）のついで是正
  - B. 文言同期に加えて requirements-spec-returned の agreed 再批准まで吸収
  - C. 参照リンク是正は別 issue に分離
- 決定: A（HA 前半集約セッション 2026-07-20 批准——R2 のリンク是正を「含める」・R3 は「文言同期
  のみ」で in-review 維持）。kiro-scenario ゲート（doc-adversary＋codex 独立ベンダー＋
  doc-fact-checker＋doc-gate-judge・2 ラウンド）を通し、R2 採点 PASS（早期終了・2026-07-21）で確定。
  schedule-rebaseline は **agreed 維持のまま注記改稿を auto-agreed 確定**（本会話ログが README
  「agreed 以降の変更は会話ログに理由を残す」の記録）。requirements-spec-returned は in-review
  据え置き（§3↔§6 の文書化済み矛盾＝issue #12 由来の再批准 hold は本 issue のスコープ外）。
- 理由: ふるまい本体（When/Then・EARS）は v21 でも無傷であり、変わるのは境界注記の正確性のみ。
  正典が先に確定（issue #2）しているため、シナリオ側は転記の精密性だけが争点——独立敵対者×2 ベンダー
  ＋事実検証で条項帰属（I4/R-E3/§2.8）とアンカーの正確性を突合した。

### 覆った判断

- 旧注記の fact-check C6（「types.ts の `MODEL:232` は R-U7 定義行=260 を指すべき誤記」）を**撤回**——
  260 は現行 R-U7 の定義行ではなく（実際は §4.0・L320/321）、types.ts の `MODEL:NNN` は v14 断面の
  行番号 citation（types.ts 冒頭宣言）ゆえ版断面をまたぐ行番号比較自体が不成立。
- R1 パッチの「按分（3→2）には完了ノードの再見積が必要で I4 が拒む」という必然性主張を R2 で**撤回**——
  decompose 後は新子葉側に見積・合意を置けるため I4 必然性は導出されない。却下の実根拠は「確定済み
  粒度の遡及的な作り直し＝部分EV（v16 却下）の密輸・P5 後退信号の消去」であり、I4 が拒むのは完了
  ノード自身の凍結見積の意味的な引き直し（限定構文で画定）。
- fold.ts の frozenSlot ガードのアンカー「113-118」を **156-157 へ訂正**（113-118 は containment-cycle
  拒否——誤アンカーのままだと下流実装者が誤った箇所を編集する）。

## 生ログ(該当範囲)

- **あなた**: https://github.com/PrimeBrains/moira/issues/7 を対応して。（続けて）#5-#7全部対応して
- **Claude**: issue #7 を moira-change フローで受け付け（P1 フル工程・base 8eb1b6f）、P2 影響調査で
  R1〜R4 の 4 行を列挙（対象 2 unit・同根のアンカードリフト・E2E 波及なしの負の確認）。HA で
  ①マップ確認 ②R2 スコープ採否 ③R3 の in-review 維持 ④実行計画＋一次資料セットを一括で諮った。
- **あなた**: （HA 裁定）これで全部／R2 含める（推奨どおり）／文言同期のみ（推奨どおり）／承認。
- **Claude**: kiro-scenario ゲートを起動。R1: 批准済み意図を 2 unit へ転写→doc-adversary（opus）＋
  codex（read-only）並列攻撃→Important 6 論点（条項帰属の緩さ・I4 次元 caveat 脱落・リンク相対深度
  誤り・§5 誤アンカーと誤った修正処方）→全件修正・スコープ外リンク破れは issue #8 起票で deferred→
  採点 FAIL（deferred の openness 証跡未添付＋対象 unit 内 spec リンクの誤分類）→是正。R2: 再攻撃で
  Y1（I4 必然性の過大主張・新規）と Z1（fold.ts アンカー誤り・新規）→同一ラウンド内で修正→採点
  PASS（早期終了）。§3 When/Then・§6 EARS は全ラウンドで不変（codex が git diff で確認）。
