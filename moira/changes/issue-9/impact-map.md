---
status: working-ledger
issue: 9
---

# 影響マップ — issue #9

base: `db609ba`（P1 宣言時）。閉包検査は worktree 実態 base=`6b0e45d`（後述の時点差開示・request.md 参照）。

<!-- 復元注記（正直開示）: 原影響マップ（10 行・D:1/S:1/C:6/F:2）は 2026-07-21 に作成・未コミットで失われた。
     行 ID の骨格（R1=D／R2=S／R3–R8=C／R9–R10=F）は P3 HA コメントの実行計画
     「R1(doc-refine)→R2(kiro-scenario→kiro-scenario-e2e)→R3〜R8(/kiro-impl)→R9/R10 スキップ」に忠実。
     C 級 6 行（R3–R8）の各行内訳は、実際に納品された実装成果物に接地して復元した（原文の task 分解は
     失われているため、成果物との対応で再構成）。クラス内訳 D:1/S:1/C:6/F:2 は当時コメント記載と一致。 -->

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/DECISIONS-CATALOG.md（D-81 新規） | D | 一覧「開始／終了」列に予測／基準線のどちらを主に出すかは 0→1 の射影規則の派生判断。D-76 の射影規則の派生として新規 Decision を要する | doc-refine | D-81 が `agreed` 昇格。判定文＝「3 択（予測／基準線／両方併記）から選ぶ・既定は生きた予測維持・基準線モードは未刻葉に予測代役を埋めない・詳細パネル/バー/EVM/進捗フィルタ判定はどのモードでも不変」 | doc-refine ゲート（adversary/fact-checker/gate-judge） | **resolved** | gate-round-records R1（Critical 4・Important 12 全 fix・fact-checker NO_OBJECTION・gate-judge PASS/ALIGNED）。DECISIONS-CATALOG L665-672 |
| R2 | .kiro/scenarios/units/schedule-leveled.md（§4 追記＋§6 EARS 7–15＋§7）／moira/frontend/e2e/specs/schedule-leveled.{spec,meta}.ts | S | 観測ふるまいに日付ソース切替が加わる。HA 境界裁定で既存 unit 追記（新規 unit ではない） | kiro-scenario → kiro-scenario-e2e | unit に日付ソース切替の断面が追記され `agreed` 維持（§6=15 EARS）。E2E は計器③カバレッジゲート PASS | kiro-scenario ゲート＋計器③ coverage-check.test.ts | **resolved** | gate-round-records R2-unit（Critical 5・Important 12 全 fix・C1 算術 7/3−3=6/30・gate-judge PASS/ALIGNED）＋R2-E2E（meta 15 EARS 全計上・green 7/11/12・deferred 12・coverage gate PASS・covered 13/20） |
| R3 | moira/frontend/src/surfaces/schedule/gantt-geometry.ts | C | 導出層に mode を持ち込む。`DateSourceMode`・`DEFAULT_DATE_SOURCE_MODE`・baseline 用フィールド・親行ロールアップ | /kiro-impl（+codex+CI） | `DateSourceMode` 型／`plannedStartBaseline`・`plannedEndBaseline`（frozenSlot−名目日数／frozenSlot・未凍結は null）／`baselineSpanOf`／`buildGanttModel` が baseline フィールドを子孫 min/max でロールアップ | tsc＋vitest（gantt-geometry.test.ts）＋decision-conformance（D-81） | **resolved** | tsc(src) clean・vitest 192/192・R3 実装差分（gantt-geometry.ts +76/-4） |
| R4 | moira/frontend/src/surfaces/schedule/ScheduleGantt.tsx | C | 表示層でモード別に列テキスト／ツールチップ／幅を出し分け | /kiro-impl（+codex+CI） | 予測／基準線／両方併記のモード別 startText/endText/tooltip。両方併記は「基準線 → 予測」2 値（同値は 1 値・片側空は '—'）。`DATE_COL_W`(42)/`DATE_COL_W_BOTH`(78)。バー描画・色分けは mode を読まない | tsc＋vitest（schedule-ui.test.tsx）＋decision-conformance | **resolved** | vitest 192/192・R4 実装差分（ScheduleGantt.tsx +95/-10・both 両側 null collapse 含む） |
| R5 | moira/frontend/src/surfaces/schedule/ScheduleTimeSurface.tsx | C | 状態・端末側記憶・トグル UI・prop 配線 | /kiro-impl（+codex+CI） | `DATE_SOURCE_KEY='moira.schedule.dateSource'`・`readDateSource`/`writeDateSource`（malformed/不能は既定 predicted へ）・3 択トグル UI（`date-source:*` aria-pressed）・`dateSource` を ScheduleGantt へ配線 | tsc＋vitest＋E2E（localStorage round-trip） | **resolved** | vitest 192/192・R5 実装差分（ScheduleTimeSurface.tsx +89/-12） |
| R6 | moira/frontend/src/surfaces/schedule/gantt-geometry.test.ts | C | 導出・ロールアップの単体回帰 | /kiro-impl（+codex+CI） | baseline フィールド・`baselineSpanOf`・親行ロールアップの単体テスト追加（既定 predicted 回帰なし含む） | vitest | **resolved** | vitest 56 tests pass（gantt-geometry.test.ts +146） |
| R7 | moira/frontend/src/surfaces/schedule/schedule-ui.test.tsx | C | レンダリング層のモード別ふるまい回帰（計器③ 補完の render 層） | /kiro-impl（+codex+CI） | 3 モードのセルテキスト・両方併記 edge・基準線モードの未刻葉 '—' 予測代役禁止（EARS 14 の合成行）を renderToStaticMarkup で網羅 | vitest | **resolved** | vitest 25 tests pass（schedule-ui.test.tsx +221/-2・baseline no-代役 弁別テスト＋fully-empty collapse 含む） |
| R8 | moira/frontend/e2e/specs/schedule-leveled.{spec,meta}.ts／gantt-date-source.spec.ts | C（E2E） | R2 で起こした xfail トリップワイヤを実装完了に伴い green 昇格＋operability 回帰 | /kiro-impl（+CI・Playwright） | schedule-leveled.spec.ts が状態非依存 EARS 7/11/12 を green（ratified plan の xfail→green 昇格）。gantt-date-source.spec.ts が値依存 EARS 8/9/10/13 を demo operability として回帰 | eslint＋tsc(e2e 一時 tsconfig)＋計器③ coverage-check＋e2e-scenario-checker | **resolved** | coverage gate PASS（schedule-leveled 3 green/0 xfail/12 deferred）・eslint clean・e2e tsc は新規 e2e 3 ファイル 0 error（既存 stages.ts の pre-existing 3 error はスコープ外） |
| R9 | moira/UI-DESIGN-BRIEF.md | F | ラベルペイン列の日付ソースに言及ありうるか | （HA 裁定でスキップ） | **追随不要**（現状ラベルペイン列に言及なし） | 文書 grep（該当記述なしを確認） | **resolved（no-change）** | HA ② F 級裁定「追随不要」。intent-ratification ② |
| R10 | moira/UI-ARCHITECTURE.md | F | 同上 | （HA 裁定でスキップ） | **追随不要**（現状ラベルペイン列に言及なし） | 文書 grep | **resolved（no-change）** | HA ② F 級裁定「追随不要」。intent-ratification ② |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 面 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R1 | D（設計判断） | 一覧の「開始／終了」列に**予測と基準線のどちらを主に見せるか**を利用者が 3 択（予測／基準線／両方併記）で選べるようにする、と決めた。既定は今まで通り「生きた予測」。基準線モードでも詳細パネル・バー・EVM・進捗判定は変えない。 | **resolved** |
| R2 | S（シナリオ） | 「担当割当後にスケジュールが並ぶ」シナリオに、**日付ソース切替の断面**を追記（新しいシナリオは作らない）。乖離のある状態では予測 7/5・基準線 7/3 のように列の値が変わって見える例を追加。 | **resolved** |

### 文書ゲート内で批准（HA 対象外）

（F 級 R9/R10 は「追随不要」裁定。文書変更なし。）

### 人間はレビューしない（codex＋CI に委譲）

| 行 ID | 波及先 | クラス |
|---|---|---|
| R3–R8 | frontend 実装・テスト・E2E | C（tsc/vitest/eslint/計器③/codex/Playwright に委譲） |

## 裁定事項（HA へ）

- **A: 影響マップ網羅の確認** — 波及先は上記 10 行（D:1/S:1/C:6/F:2）で全部か。
- **B: 境界裁定** — (i) S 行は既存 `schedule-leveled.md` 追記か新規 unit か。(ii) 既定モードは A/B/C のどれか。
  (iii) 実装モード数（3 択で行くか）。(iv) 永続化は localStorage のみか（URL クエリを含めるか）。
  (v) F 級 2 文書（UI-DESIGN-BRIEF／UI-ARCHITECTURE）の追随要否。
- **C: D 級意図批准** — D-81 の判定文（列の主表示は利用者選択・既定 predicted 維持・基準線は代役禁止・
  副作用ゼロ）を批准するか。D-76 の射影規則の派生として位置づけてよいか。
