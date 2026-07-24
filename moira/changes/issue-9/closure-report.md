---
status: working-ledger
issue: 9
---

# 閉包レポート — issue #9

date: 2026-07-24。base: `6b0e45d`（worktree 実態）。判定: **閉包 PASS（H5 承認待ち）**。

<!-- 非正典（working-ledger）。P5 同期閉包の機械判定と、P6 の H5 承認に向けた人間向け 3 点を記す。 -->

---

## 人間が読む 3 点（H5）

### ① 3 面の最終文 ↔ 批准意図の対応

| 面 | 最終文（実装後の事実） | 批准意図（P3 HA）| 一致 |
|---|---|---|---|
| **D（設計判断）** | D-81 `agreed`：一覧「開始／終了」列の主表示を利用者が 3 択（予測／基準線／両方併記）で選ぶ。既定は生きた予測のまま。基準線モードは未凍結葉に予測を代役として埋めない。詳細パネル・バー・EVM・進捗フィルタ判定はどのモードでも不変。D-76 の射影規則の派生。 | ④ D 級意図批准どおり（判定文・D-76 派生の位置づけとも一致）。 | ✅ |
| **S（シナリオ）** | schedule-leveled.md §4 に日付ソース切替断面を追記（新規 unit にせず）。§6=15 EARS（原 6＋issue #9 の 9）。4 断面（baseline/predicted/both/reload-restore）＋副作用ゼロ WHILE を網羅。 | ②(i) 既存 unit 追記・③ When/Then 4 断面どおり。 | ✅ |
| **C（コード）** | 3 択トグル実装・既定 predicted 維持・localStorage(`moira.schedule.dateSource`) 永続・baseline 近似は表示層のみ（正典属性を作らない）・計算層（EVM/進捗/バー/Inspector/親ロールアップ）は `dateSource` を読まない。 | ②(ii)(iii)(iv) 既定 B・3 択・localStorage のみ（URL 除外）どおり。 | ✅ |

独立敵対レビュー（decision-conformance / e2e-conformance / correctness adversary）で
**DRIFT 0・DISCREPANCY 0・コード欠陥 0**。検出されたテスト非空虚性の MAJOR・表示 collapse の MINOR・
アサート対称性の NIT は**全件 fix・再検証済み**（gate-round-records「後段敵対レビュー」節）。

### ② できないことになったこと（スコープ外・deferred）

- **F 級 2 文書は追随しない**（②(v) 裁定）：`UI-DESIGN-BRIEF.md`／`UI-ARCHITECTURE.md` は現状ラベルペイン列の
  日付ソースに言及がないため無変更。
- **URL クエリでの日付ソース共有はしない**（②(iv)）：永続は端末側 localStorage のみ。
- **schedule-leveled の E2E は状態非依存節（EARS 7/11/12）のみ green**。値依存節（EARS 1-6,8-11,13-15）の
  **faithful な §4 固有値 E2E 回帰は deferred**——X/Y/太郎 の割当→平準化→凍結を再現する fixture パイプラインが
  issue #9 の表示層スコープ外のため。**follow-up issue 化を推奨**（issue #8 impact-map R7 と同型の受容済み可視ギャップ）。
  値依存節の実装自体は完成しており、browser operability は `gantt-date-source.spec.ts`、render/geometry は
  `schedule-ui.test.tsx`／`gantt-geometry.test.ts` が接地している（＝挙動は検証済み・欠けているのは
  シナリオ固有値での E2E アサートのみ）。
- **both モードの両側 null セルは単一 '—' 表示**に統一した（旧 '— → —' を collapse）。これは MINOR 修正であり
  データ表現の変更ではない（従来から空セルは dim 表示）。

### ③ 閉包判定

**3 値閉包：resolved 10／deferred 0／未了 0**（影響マップ 10 行すべて resolved）。
**未マップ差分：∅**（下記機械判定）。**閉包 PASS。**

follow-up（別 issue 化推奨）：schedule-leveled fixture パイプラインによる値依存 EARS の E2E 昇格。
これは本 issue の postcondition ではなく、明示 deferred の将来作業。

---

## 機械決着の詳細（監査用）

<details>
<summary>影響マップ 3 値判定・未マップ差分検査・deferred openness</summary>

### 影響マップ 3 値判定

| 行 | クラス | 状態 |
|---|---|---|
| R1 | D | resolved（D-81 agreed・conformance ALIGNED） |
| R2 | S | resolved（unit agreed・E2E coverage gate PASS） |
| R3 | C | resolved（gantt-geometry.ts・tsc/vitest PASS） |
| R4 | C | resolved（ScheduleGantt.tsx・vitest PASS） |
| R5 | C | resolved（ScheduleTimeSurface.tsx・vitest/E2E PASS） |
| R6 | C | resolved（gantt-geometry.test.ts 56 tests） |
| R7 | C | resolved（schedule-ui.test.tsx 25 tests） |
| R8 | C | resolved（E2E 3 green・coverage gate PASS） |
| R9 | F | resolved（no-change・追随不要裁定） |
| R10 | F | resolved（no-change・追随不要裁定） |

resolved 10 / deferred 0 / 未了 0。

### 未マップ差分検査

`git diff --numstat 6b0e45d -- . ':(exclude)moira/changes/**'` = 10 ファイル・+1000/-30。
全ファイルが影響マップの行に対応（未マップ差分 ∅）：

| ファイル | +/- | 対応行 |
|---|---|---|
| .kiro/scenarios/units/schedule-leveled.md | +71/-1 | R2 |
| moira/DECISIONS-CATALOG.md | +10/-1 | R1 |
| moira/frontend/e2e/specs/gantt-date-source.spec.ts | +139/-0 | R8 |
| moira/frontend/e2e/specs/schedule-leveled.meta.ts | +92/-0 | R8 |
| moira/frontend/e2e/specs/schedule-leveled.spec.ts | +61/-0 | R8 |
| moira/frontend/src/surfaces/schedule/ScheduleGantt.tsx | +95/-10 | R4 |
| moira/frontend/src/surfaces/schedule/ScheduleTimeSurface.tsx | +89/-12 | R5 |
| moira/frontend/src/surfaces/schedule/gantt-geometry.test.ts | +146/-0 | R6 |
| moira/frontend/src/surfaces/schedule/gantt-geometry.ts | +76/-4 | R3 |
| moira/frontend/src/surfaces/schedule/schedule-ui.test.tsx | +221/-2 | R7 |

（`moira/changes/issue-9/**` は非正典 working-ledger のため自己除外。）

### 検証器の最終状態

- `npm run check`（tsc src + eslint + vitest）: **192/192 PASS**。
- `npm run e2e:coverage`（計器③）: **PASS**（schedule-leveled 3 green/0 xfail/12 deferred・covered 13/20）。
- e2e 型検査（一時 tsconfig）: 新規 e2e 3 ファイル 0 error（既存 `stages.ts` の pre-existing 3 error はスコープ外）。

### deferred openness

deferred（gate 内で未了のまま残す指摘）: **なし**。
follow-up（別 issue 化）: schedule-leveled fixture パイプライン（値依存 EARS の E2E 昇格）。閉包の妨げにならない。

</details>

---

## 開示事項

1. **base の時点差（db609ba → 6b0e45d）**: P1 では base=`db609ba` を宣言したが、その後 worktree が origin/main を
   取り込み（merge `6b0e45d`）、現行 base は `6b0e45d`。P5 の未マップ差分検査は worktree 実態の `6b0e45d` で実施。
   `db609ba..6b0e45d` は origin/main 側の無関係変更（#7/#11 等）で、本 issue の成果物差分には混じらない
   （`git diff 6b0e45d` ＋ `moira/changes/**` 自己除外で照合済み）。
2. **台帳 4 点の復元来歴**: request/impact-map/intent-ratification/gate-round-records は 2026-07-21 に作成後
   未コミットで失われ、2026-07-24 に issue #9 公開コメント（P1〜R2 E2E＋handoff の全 6 コメント）を一次記録として
   復元した。数式・値・裁定は当時コメントに忠実。C 級 6 行の内訳は実際の納品成果物に接地して再構成。
3. **後段レビュー修正（2026-07-24）**: 実装完了後の独立敵対レビューで検出した MAJOR（baseline no-代役 テストの
   非空虚性欠落）・MINOR（both 両側 null の '— → —'）・NIT（アサート非対称）を全件修正し、退行注入で
   MAJOR 修正の非空虚性を実証（`expected '1/3' to be '—'` で fail→revert）。src の挙動仕様は D-81 の範囲内。
4. **follow-up 推奨**: schedule-leveled fixture パイプライン（X/Y/太郎 割当→平準化→凍結）を別 issue で立て、
   値依存 EARS（1-6,8-11,13-15）の E2E を deferred→green に昇格する。

---

## P6 に向けて（H5 承認が必要）

以下は**外向き・不可逆**につき、人間の明示承認（H5）を得てから実行する：

1. ローカルコミット（issue-9 ブランチ）。
2. 承認後、**SSH remote へ push**（HTTPS は社内 proxy でブロック——push 手順メモ参照）。
3. issue #9 をクローズ（本レポートを要約して投稿）。

**承認なしに push／close は行わない。**
