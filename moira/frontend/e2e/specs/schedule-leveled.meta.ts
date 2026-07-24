import { type SpecMeta } from '../spec-meta';

// units/schedule-leveled — §6 has 15 EARS clauses. Six original (1–6: leveling +
// frozenSlot) plus nine appended by issue #9 (7–15: the label-pane 日付ソース toggle
// introduced in §4's new subsection, ratified D-81 / unit §7 2026-07-21).
//
// GREEN here = only the fixture-INDEPENDENT UI-mechanic clauses the issue #9 slice
// now implements and that hold for ANY Gantt render (toggle present / default
// predicted / localStorage round-trip). These are the exact clauses the ratified
// P4-R2 E2E plan staged as xfail tripwires ({7,12}); with R3–R8 implemented they
// are promoted xfail→green (+11, the same demo-boot family).
//
// DEFERRED = everything whose FAITHFUL scenario-regression needs a fixture that
// issue #9 does not build (display-only scope):
//   · 1–6 need the leveling/freeze mutation pipeline (X/Y/太郎 → assign → →ready).
//   · 8/9/10/13/14/15 are implemented and demo-operability-regressed elsewhere
//     (gantt-date-source.spec.ts at the browser layer; schedule-ui.test.tsx /
//     gantt-geometry.test.ts at the render/geometry layer), but asserting the §4
//     scenario's OWN values (X baseline-start 6/30 · Y 6/30→7/3 · divergence
//     7/3→7/5) faithfully needs the schedule-leveled fixture — deferred, not green.
// This matches issue #8 impact-map R7: the three schedule units are documented,
// accepted uncovered soft gaps; here we cover the toggle's state-independent
// clauses and leave the value-dependent regression as an enumerable follow-up.
export const SPEC_META: SpecMeta = {
  scenarioUnit: 'units/schedule-leveled',
  surfaces: ['schedule-time'],
  clauses: [
    {
      ears: 1,
      mode: 'deferred',
      note: '平準化の逐次導出。X/Y を同一担当(太郎)に割当→平準化を再現する fixture pipeline(scenario-fixtures 拡張)が未整備ゆえ deferred(issue #9 は表示層スコープ・issue #8 impact-map R7 で schedule 系 3 unit は受容済み可視ギャップ)。',
    },
    {
      ears: 2,
      mode: 'deferred',
      note: '同日二重積み回避(容量平準化)。EARS 1 と同じ leveling fixture を要するため deferred。',
    },
    {
      ears: 3,
      mode: 'deferred',
      note: '時間軸並置の一覧表示。leveling fixture を要するため deferred(render 層のバー配置は schedule-ui.test.tsx が接地)。',
    },
    {
      ears: 4,
      mode: 'deferred',
      note: '初回スケジュール載せ時の frozenSlot 凍結・以降不上書き。→ready 遷移を駆動する mutation fixture(fold.ts 凍結パス)が未整備ゆえ deferred。',
    },
    {
      ears: 5,
      mode: 'deferred',
      note: '未割当作業は「未割当バックログ」に別表示。fixture 要(EARS 1 と同じ)ゆえ deferred。',
    },
    {
      ears: 6,
      mode: 'deferred',
      note: '未割当作業の基準完了日を捏造しない(未凍結のまま正直表示)。負の観測対象で fixture 要ゆえ deferred。',
    },
    { ears: 7, mode: 'green' }, // ヘッダに 3 択トグル(予測/基準線/両方併記)を提供 — 状態非依存・demo boot で検証
    {
      ears: 8,
      mode: 'deferred',
      note: '基準線モードの開始=基準完了日−名目日数・終了=基準完了日・予測は当該列に出さない。モード切替 UI と分岐は実装済みで gantt-date-source.spec.ts が demo boot で基準線終了列=凍結スロット verbatim を回帰。ただし本 §4 固有値(X 基準開始 6/30・Y 6/30→7/3)の忠実アサートは schedule-leveled fixture を要するため scenario-regression としては deferred。',
    },
    {
      ears: 9,
      mode: 'deferred',
      note: '予測モードの開始/終了は生きた予測(基準はフォールバック)。demo operability は gantt-date-source.spec.ts が回帰。固有値の忠実アサートは fixture 要ゆえ deferred。',
    },
    {
      ears: 10,
      mode: 'deferred',
      note: '両方併記モードの「基準線 → 予測」2 値並記(同一日は 1 値・片側空は \'—\')。列幅拡張と \'→\' 併記は gantt-date-source.spec.ts が demo boot で回帰。§4 固有値(Y 6/30→7/3・7/3→7/5)の忠実アサートは fixture 要ゆえ deferred。',
    },
    { ears: 11, mode: 'green' }, // 初回既定=予測(現行挙動維持) — 状態非依存・demo boot で検証
    { ears: 12, mode: 'green' }, // 選択を端末側に永続し reload で復元 — 状態非依存・実ブラウザ round-trip で検証
    {
      ears: 13,
      mode: 'deferred',
      note: 'どのモードでも Inspector 2 値・バー色分け/稲妻線・進捗フィルタ判定・EVM・親行ロールアップ不変。バー描画と EVM の不変は gantt-date-source.spec.ts が demo boot で回帰。ただし本 EARS は Inspector・進捗フィルタ・親行ロールアップまで含む複合不変条件で、全観点の忠実回帰には fixture が要るため deferred(render 層は schedule-ui.test.tsx が網羅)。',
    },
    {
      ears: 14,
      mode: 'deferred',
      note: '基準線モードで基準未刻の葉は開始/終了とも \'—\'・予測を代役に埋めない。demo boot には「未凍結かつ予測あり」の弁別ケースが出ない(hotfix/reset は両モード \'—\'で fallback 有無を弁別不能)ため、render 層 schedule-ui.test.tsx の baseline モード専用合成行(plannedStartBaseline/EndBaseline=null かつ plannedStart/End=present を dateSource=baseline で描画→両列 \'—\'・予測値の漏れなしをアサート)で網羅——`?? plannedStart` 型のフォールバック退行を捕捉する。E2E scenario 化は fixture 要ゆえ deferred。',
    },
    {
      ears: 15,
      mode: 'deferred',
      note: '基準線モードでも進捗フィルタ(遅延中/順調)の判定基準は生きた予測と基準完了日の乖離のまま(表示値と別)。fixture 上での遅延/順調弁別が要るため deferred(判定ロジックは gantt-geometry.test.ts が網羅)。',
    },
  ],
};
