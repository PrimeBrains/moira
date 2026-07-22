---
status: working-ledger
issue: 6
---

# 閉包レポート — issue #6

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

本 issue はシナリオ級（S）を含まない（S 級は別 issue #7 で分離済み）。3面のうち **P 級 3 行**の
み該当。M 級は #2 で正典化済み・本 issue は参照実装同期のため対象外。D 級は境界裁定 B5 のみで、
それも HA 統合裁定として ratified 済み（意図整合検査は不要）。

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ④ の行） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R11 | P | PR-DONE-LOCK 一文改訂（v21 訂正 carve-out） | ④ R11 行「完了施錠は維持したまま、記録誤りの訂正だけは計器の常設表示付きで通す」（受け入れ基準 (i)(ii)(iii)(iv) 全て） | [PROPERTIES.md L28 (v0.6・proposed)](../../PROPERTIES.md) — v21 訂正 carve-out 一文含む・訂正経由の変化は計器常設表示句込み | **yes**（意図と一文が字義通り整合。agreed 昇格は #11 で human ratify） |
| R12 | P | PR-EVENTS-ONLY 一文改訂（訂正層の適用後読み） | ④ R12 行「4 種イベント＋訂正層の追記の合成読みだけで状態が決まる」（受け入れ基準 (i)(ii)(iii)(iv) 全て） | [PROPERTIES.md L49 (v0.6・proposed)](../../PROPERTIES.md) — 「4 種類の追記イベント＋記録の訂正（追記専用の第二層）だけ」句・訂正はイベントを書き換えず「読み」を補正する句 | **yes**（意図と一文が字義通り整合。agreed 昇格は #11 で human ratify） |
| R13 | P | PR-CORRECTION-METER ★ 新規起票（4 区分・裁量ノブなし） | ④ R13 行「訂正の数え方に裁量ノブを持たせない——4 区分（総数・施錠対象・遡及・適用不能）は常設・計数除外なし」（受け入れ基準 (i)(ii)(iii)(iv) 全て） | [PROPERTIES.md v0.6・PR-CORRECTION-METER 行](../../PROPERTIES.md) — 4 区分の常設・「計数から除いてよいことにはしない」句・issue #36 遡及警告を③遡及に統合方針明示 | **yes**（意図と一文が字義通り整合。agreed 昇格は #11 で human ratify） |

### ② できないことになったこと（平易な差分）

- 今の機能では **CLI から訂正記録を発行する対話操作**（`moira correct <event-id> --reason ... --patch ...` 系）はできない〔追跡 #11〕
- 今の性質批准では **「完了作業の出来高は音の鳴る訂正でのみ動く」の agreed 昇格**は human ratify 待ち〔追跡 #11・PR-DONE-LOCK〕
- 今の性質批准では **「状態は 4 イベント＋訂正層の合成読みだけで決まる」の agreed 昇格**は human ratify 待ち〔追跡 #11・PR-EVENTS-ONLY〕
- 今の性質批准では **「訂正計器 4 区分の裁量ノブなし」の agreed 昇格**は human ratify 待ち〔追跡 #11・PR-CORRECTION-METER〕

（backend/frontend/CLI の実装レベルの機能——訂正型・fold 合成読み・計器 4 区分表示・矛盾所属警告・
D-1/D-79 の実装状態注記等——は本 issue 内で実装完了。上記 4 件だけが「できない」または「性質批准
待ち」として残る。追跡 issue #11 は OPEN で機械照合済み。）

### ③ 閉包判定

**PASS**

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

判定は影響マップの**行 ID 単位**。全 22 行（当初 18 行＋P5 で追記 4 行）。

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | moira/backend/src/types.ts | resolved | commit cbfdeb8: Correction/EventPatch/CorrectionMeterCounts 型追加・assignee/reviewer null センチネル・cost/relate reason 欄追加・tsc 0 errors・events.test-d.ts 4 型固定 pass |
| R2 | moira/backend/src/fold.ts | resolved | commit cbfdeb8: fold(events, corrections?)・applyCorrections 実装・latest-wins 合成読み・foreign field/非存在 target の適用不能検出・ts patch の re-sort・182 backend tests pass |
| R3 | moira/backend/src/derivations/ | resolved | commit cbfdeb8: CorrectionMeterCounts を fold 出力に集約・DerivedState.correctionMeter 公開・cancelled 誤記表明→再計算対応（correction.test.ts §2.10 (i)） |
| R4 | moira/backend/src/pbt/done-lock.pbt.test.ts | resolved | commit cbfdeb8: naked 逆行拒否 pin 維持＋v21 carve-out 3 件（completion nullify・agreement patch・PR-CORRECTION-METER 「計数除外オプションなし」型上反例） |
| R5 | moira/backend/src/decisions/events.test-d.ts | resolved | commit cbfdeb8: 4 型固定を維持（Correction は Event union と分離）・test:types 5 pass |
| R6 | moira/cli/src/xlsx/wbs-import.ts | resolved | commit db609ba: 完了ノード再合意スキップ／cost 再発行スキップのコメントを v21 §2.10 訂正チャネル参照へ更新（挙動不変） |
| R7 | moira/cli/src/（訂正の書き込み UX） | deferred | 後続 #11（OPEN 機械照合 2026-07-21）・owner nakawodayo・再評価: 対話 CLI 設計着手時に moira-change フロー起動 |
| R8 | moira/frontend/src/moira/warnings.ts | resolved | commit a1242bd: 3 段実装（backend types.ts の claimedParentByActor・fold.ts の human actor 追跡・frontend R-U12-parent 警告述語）・warnings.test.ts 新規 4 件 pass |
| R9 | moira/frontend/src/surfaces/health/HealthSurface.tsx | resolved | commit a1242bd: zone 3 訂正計器 4 区分 Card 追加・SummaryStat 4 件・tone 分岐・「計数除外なし」説明文明示・frontend 172 tests pass |
| R10 | moira/cli/src/report.ts | resolved | commit a1242bd: ReportOptions.corrections?・ReportJson.correctionMeter・renderReport の訂正記録行追加・CLI 302 tests pass。HA B5 完全統合は #11 で follow-up |
| R11 | moira/PROPERTIES.md（PR-DONE-LOCK） | deferred | 後続 #11（OPEN 機械照合 2026-07-21）・owner nakawodayo・再評価: R7 完了後の bound プロパティ同一 run 再批准で決着 |
| R12 | moira/PROPERTIES.md（PR-EVENTS-ONLY） | deferred | 後続 #11（OPEN 機械照合 2026-07-21）・owner nakawodayo・再評価: R7 完了後の bound プロパティ同一 run 再批准で決着 |
| R13 | moira/PROPERTIES.md（PR-CORRECTION-METER 新規） | deferred | 後続 #11（OPEN 機械照合 2026-07-21）・owner nakawodayo・再評価: R7 完了後の bound プロパティ同一 run 再批准で決着 |
| R14 | moira/DECISIONS-CATALOG.md（D-79 状態注記） | resolved | commit db609ba: 「参照実装の実装状態（2026-07-21・backend core 実装済み・commit cbfdeb8）」注記追加 |
| R15 | moira/DECISIONS-CATALOG.md（D-1 移行注記解消） | resolved | commit db609ba: D-1 に「実装状態」注記追加・「参照実装は追跡 issue #6 完了まで従来挙動」の記述を実装済みに更新 |
| R16 | moira/DECISIONS-CATALOG.md（D-60/D-62） | resolved | 既存の v21 確定注記＋backend 解除センチネル実装で参照実装が揃った（追加注記不要）。correction.test.ts の 3 件解除センチネルテストで担保 |
| R17 | moira/frontend/src/（訂正関連の型・ロジック連動） | resolved | commit db609ba: backend-runtime.d.ts の DeriveOptions/fold 宣言に corrections? 追加・person-overlap.test.ts の correctionMeter 追加・frontend tsc 0 errors |
| R18 | moira/backend/tests/（訂正層単体テスト新規） | resolved | commit cbfdeb8: correction.test.ts 新規 19 件（§2.10 (a)〜(i)・§2.8 解除センチネル 3 件） |
| R19 | moira/frontend/src/moira/warnings.test.ts | resolved | 未マップ差分検出時に追記。commit a1242bd の 4 件 pass。R8 の非空虚性・追認 clear・agent 除外・単独 silent を witness |
| R20 | moira/frontend/src/surfaces/portfolio/person-overlap.test.ts | resolved | 未マップ差分検出時に追記。commit db609ba/a1242bd で ProjectedState の新型必須フィールドを追加（挙動不変・tsc pass） |
| R21 | moira/cli/src/{commands-write-safety,dates,milestone,adapter/drift/drift-golden}.test.ts | resolved | 未マップ差分検出時に追記。commit 7ccdfd3 で 4 ファイル修正（MOIRA_DIR isolation）・CLI 271 pass + 31 fail → **302 pass**（pre-existing bug の場での修理） |
| R22 | .kiro/scenarios/units/{requirements-spec-returned,schedule-rebaseline}.md | resolved | 本 issue の commits（feeecff/cbfdeb8/db609ba/7ccdfd3/a1242bd）は触っていない。commit 8a93f57（別 issue #7・閉包 PASS 済み）が touch。issue #7 の closure-report が担保・本 issue の未マップとしては扱わない |

**集計**: 全 22 行 · resolved 18 行 · deferred 4 行 · 未了 0 行

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: `df99c4896360d42dd969c7ce4df26f3d926fbcab`（request.md 記載の受付時点 commit）
- HEAD（P5 開始時点で固定）: `a1242bd388259a35a921cccb276b88055e10bc1b`
- 未マップ差分: **∅**（`git diff --name-only df99c48..a1242bd` の全 28 パスは、`moira/changes/**` の自己除外 6 パスを除いた 22 パスすべてが影響マップ R1〜R22 に mapped。R19〜R22 は P5 検出時に append-only で追記）
- 判定有効性: 照合開始から本レポート生成完了まで HEAD 不動（`a1242bd`）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

| 行 ID | deferred 行 | 後続 issue | owner | 再評価条件 | openness 照合 |
|---|---|---|---|---|---|
| R7 | CLI 訂正書き込み UX | #11 | nakawodayo | 対話 CLI 設計着手 | `gh issue view 11 --json state` → `{"state":"OPEN"}`（2026-07-21 照合） |
| R11 | PR-DONE-LOCK agreed 昇格 | #11 | nakawodayo | R7 完了後の bound プロパティ再批准 | 同上 |
| R12 | PR-EVENTS-ONLY agreed 昇格 | #11 | nakawodayo | R7 完了後の bound プロパティ再批准 | 同上 |
| R13 | PR-CORRECTION-METER agreed 昇格 | #11 | nakawodayo | R7 完了後の bound プロパティ再批准 | 同上 |

**全 4 件の後続 issue は #11・OPEN 機械照合済み**。
</details>

<details>
<summary>テスト実績</summary>

- backend: **182 pass**（旧 160 + 新 22: correction.test.ts 19 + done-lock v21 carve-out 3）
- frontend: **172 pass**（旧 168 + 新 4: R-U12-parent 4 件）
- cli: **302 pass** + 2 skipped（旧 271 pass + 31 fail・MOIRA_DIR isolation 修正後）
- type-only tests: **5 pass**（Event['kind'] 4 型固定維持——訂正は第二層で第 5 型ではない）
- tsc: **0 errors**（backend/frontend/cli 全て）

**総計: 656 tests green + 2 skipped**（skip は既存の意図的なもの）
</details>
