---
status: working-ledger
issue: 9
---

# ゲート往復記録 — issue #9

<!-- 復元注記: R1〜R2 の各ゲート往復は 2026-07-21 の issue #9 コメントを一次記録として 2026-07-24 に復元。
     R3〜R8（実装）と後続の xfail→green 昇格・後段敵対レビューは 2026-07-24 セッションの実施結果。
     非正典（working-ledger）。 -->

## R1 — doc-refine（D 級・D-81 起こし）

- **対象**: `moira/DECISIONS-CATALOG.md` に D-81 を新規追加。
- **結果**: **PASS（Round 1）**。
- **Critical 4 件（全 fix）**:
  - C1: 「委任済み日付」という新語彙の撤回（既存語彙で表現）。
  - C2: D-78 平易語規約の遵守（frozenSlot 等の内部語を判定文本文から排除）。
  - C3: D-76 引用の正確化。
  - C4: START 列が近似（基準完了日−名目日数）であることの明示。
- **Important 12 件**: 全件 disposition 済み（deferred なし）。
- **doc-fact-checker**: NO_OBJECTION（10 claims CONFIRMED）。
- **doc-gate-judge**: GATE PASS（INTENT_CONFORMANCE ALIGNED・FORK_COVERAGE OK）。
- **MODEL エスカレーション**: 不要（表示層判断・正典設計物に触れない）。
- **postcondition**: D-81 `agreed`（DECISIONS-CATALOG L665-672）。

## R2-unit — kiro-scenario（S 級・schedule-leveled.md 追記）

- **対象**: `.kiro/scenarios/units/schedule-leveled.md`（§4 新規サブセクション＋§6 EARS 7–15＋§7 決定注記）。
- **結果**: **PASS（Round 1）**。
- **Critical 5 件（全 fix）**:
  - C1: 算術修正 `7/3 − 3days = 6/30`（`addDaysIso` の `setUTCDate(0)` 月境界を独立再検証）。
  - C2: D-78 平易語——frozenSlot／D-76／D-77／D-73 等の内部語を §本文から撤去。
  - C3: 親行（非葉）ロールアップの EARS を追加。
  - C4: 第三状態の表現を「完了・未凍結葉」に修正。
  - C5: 副作用ゼロ WHILE を全 3 モードに適用。
- **Important 12 件 → 9 EARS に整理**。
- **doc-gate-judge**: PASS（算術を独立に再検証）。
- **MODEL エスカレーション**: 不要。
- **postcondition**: unit `agreed` 維持・§6=15 EARS（原 6＋issue #9 の 9）。

## R2-E2E — kiro-scenario-e2e（計器③ トリップワイヤ起こし）

- **対象**: `moira/frontend/e2e/specs/schedule-leveled.spec.ts`＋`schedule-leveled.meta.ts` を新規作成。
- **結果（当時）**: coverage gate **PASS**。meta 15 EARS 全計上・当時は **green 0／xfail 2（{7,12}）／deferred 13**。
- **部分閉包の開示（当時）**: unit は resolved、E2E は最小トリップワイヤに留めた。残余 2 件を明示：
  1. R3–R8 完了後に xfail {7,12}→green の昇格判定を行う。
  2. faithful な §4 固有値アサートに要る fixture パイプラインは follow-up issue へ（EARS 1-6,8-11,13-15 deferred→green は将来）。
- **批准計画の該当文（intent-ratification ⑤）**: 「R3〜R8 完了時に E2E xfail が予期せず pass → green 昇格の判定を行う。」

## R3–R8 — /kiro-impl（C 級・frontend 実装＋テスト）

- **結果**: **実装完了**（2026-07-24 セッションで残工程を完了）。
- **成果物**（impact-map R3–R8 と対応）:
  - R3 `gantt-geometry.ts`（+76/-4）: `DateSourceMode`／`DEFAULT_DATE_SOURCE_MODE`／`plannedStartBaseline`・`plannedEndBaseline`／`baselineSpanOf`／親行ロールアップ。
  - R4 `ScheduleGantt.tsx`（+95/-10）: モード別列テキスト／ツールチップ／`DATE_COL_W`(42)・`DATE_COL_W_BOTH`(78)／両方併記の 2 値合成（同値 1 値・片側空 '—'・両側空は単一 '—' に collapse）。
  - R5 `ScheduleTimeSurface.tsx`（+89/-12）: `DATE_SOURCE_KEY`／`readDateSource`・`writeDateSource`（try/catch・不正値は既定へ）／3 択トグル UI／prop 配線。
  - R6 `gantt-geometry.test.ts`（+146・56 tests）: 導出・ロールアップ・no-fallback データ層。
  - R7 `schedule-ui.test.tsx`（+221/-2・25 tests）: モード別セル・両方併記 edge・**baseline モード no-代役 弁別テスト**（後述）。
  - R8 E2E: `schedule-leveled.spec.ts`（3 green）＋`gantt-date-source.spec.ts`（値依存 operability）。
- **検証**: `npm run check`（tsc(src) + eslint + vitest **192/192**）PASS。`npm run e2e:coverage` PASS。

## xfail→green 昇格の判定（R2-E2E 残余①の決着）

- 批准計画どおり、R3–R8 実装完了に伴い E2E xfail を再判定。
- **状態非依存な UI 機構節**（EARS 7 トグル存在・11 既定 predicted・12 localStorage 往復）は
  demo boot で忠実・非空虚に回帰できるため **xfail {7,12} → green に昇格し、同族の 11 も green** とした
  （schedule-leveled: **3 green / 0 xfail / 12 deferred**、covered 12→13/20、schedule-leveled は可視ギャップ一覧から離脱）。
- **値依存節**（EARS 8/9/10/13/14/15）は §4 固有値の忠実アサートに fixture を要するため **deferred 維持**。
  browser operability は `gantt-date-source.spec.ts`、render/geometry は `schedule-ui.test.tsx`／`gantt-geometry.test.ts` が接地。
- **残余②（fixture パイプライン）**: follow-up として deferred 継続（closure-report で明示）。

## 後段敵対レビュー（2026-07-24・実装後の計器④/⑤/⑥ 相当）

実装完了後、独立サブエージェント 3 者で敵対検証を実施：

| レビュア | 対象 | 結果 |
|---|---|---|
| decision-conformance-checker | D-81（4 条件＋localStorage＋both edge）／D-76 整合 | **DRIFT 0 / UNVERIFIABLE 0**——全 ALIGNED。負の照合（Inspector/pv.ts/divergence/バー/親ロールアップが `dateSource` を読まない）も確認。 |
| e2e-scenario-checker | schedule-leveled.{spec,meta}.ts ↔ unit §6 | **DISCREPANCY 0**——green 3 件非空虚・deferred 12 件正当・freestanding companion 適法。 |
| code correctness adversary | 実装 7 攻撃角 | 角 1–6 **欠陥なし**（baseline 算術・no-fallback・ロールアップ・localStorage・表示層隔離・2 値併記）。角 7 で **MAJOR 1・MINOR 1・NIT 1**。 |

### 敵対レビュー指摘の決着（全件 fix）

- **MAJOR（テスト非空虚性）**: EARS 14「no 予測代役」の見出しテストが `hotfix`（baseline/predicted 両 null）を使い
  fallback 退行を弁別できなかった。→ **baseline=null かつ predicted=present の合成行を dateSource=baseline で描画し
  両列 '—'・予測値の非漏出をアサートする弁別テストを追加**（schedule-ui.test.tsx）。
  `plannedStartBaseline ?? plannedStart` 型の退行を注入→当該テストが `expected '1/3' to be '—'` で落ちることを確認し
  revert（非空虚性を実証）。meta EARS 14 の注記も実カバレッジに合わせて precise 化。
- **MINOR（表示 collapse）**: both モードで両側 null のスロットが `'— → —'` になっていた。→ `combinedDateText` で
  両側 null は単一 '—' に collapse（単一値モードの空セルと整合）。both-mode edge テストに fully-empty 行を追加。
- **NIT（アサート対称性）**: baseline 開始列に end 列相当の `.not.toBe(predicted)` ガードが無かった。→ 対称ガードを追加。
- **再検証**: 修正後 `npm run check` **192/192** PASS・coverage gate PASS・eslint clean・tsc(src) clean。

**deferred（gate 内で未了のまま残すもの）**: なし（全指摘 fix）。
**follow-up（別 issue）**: schedule-leveled fixture パイプライン（EARS 1-6,8-11,13-15 の E2E 昇格）。
