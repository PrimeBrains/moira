---
status: working-ledger
issue: 5
---

# 意図批准記録 — issue #5（HA 前半集約セッション）

> **状態**: 確定（2026-07-21 HA 一括批准）。

## ① 影響マップ確認

- 提示対象: [`impact-map.md`](./impact-map.md) の「人間断面ビュー」節
- 確認: **YES**（2026-07-21）
- 指摘・追加された波及先: なし

## ② 境界裁定

| 行 ID | 争点（平易文） | 裁定 | 日付 |
|---|---|---|---|
| R15 | UI-DESIGN-BRIEF.md に来歴注記を入れるか | **介入する**（本 issue で最小の来歴注記を追加。プロトタイプ名〔evm-studio / sdd-dashboard〕への設計語彙参照であっても、実体は旧リポ残留である旨を PROTOTYPE-EVALUATION.md への交叉参照として最小限で明記） | 2026-07-21 |
| R16 | structure.md の全体像更新を本 issue で扱うか | **介入する**（本 issue で最小補筆。`moira/backend/` のみの列挙を現況〔frontend / cli / examples / changes / plans 等〕へ拡張） | 2026-07-21 |
| R17 | testing-conventions.md の汎用/固有の整理は本 issue で扱うか | **介入する**（本 issue で追追記。ただし現況で分離は成立しているため、最小の再整理に留める） | 2026-07-21 |
| R18 | 旧 issue 番号読み替え方針の canonical 配置先 | **新規 `moira/HISTORICAL-REFERENCES.md`**（独立文書として明確・将来「引っ越し以外の来歴事項」も集約可能）。DECISIONS-CATALOG へ `proposed` 起票 → agreed → 当該新規文書に canonical 反映。既存 `#N` 表現の機械置換は明示禁止。移管記録 `moira/changes/issue-42/migration-record.md`「issue 読み替え表」節への参照を張る | 2026-07-21 |
| R19–R21 | kiro-issue skill と sdd-issue-creator agent（playground demo 内）の存廃 | **削除**（skill/agent を playground から除去。demo README／demo-log 内での参照は grep で不存在を確認済み——本文修正は不要） | 2026-07-21 |

## ③ S 級 When/Then の発案

該当なし（S 級行は影響マップに存在しない）。

## ④ 意図批准（D/M/P 対象行）

| 行 ID | 対象クラス | 何を決めるか | 受け入れ基準 | 却下したい方向 | 批准 | 日付 |
|---|---|---|---|---|---|---|
| R18 | **D** | 「移管前文書中の `#N` は `PrimeBrains/sdd-workshop#N` を指す・機械置換禁止」の**読み替え方針を canonical に配置する**判断。配置先は新規 `moira/HISTORICAL-REFERENCES.md` | (a) `moira/HISTORICAL-REFERENCES.md` が新規作成され、方針が短く書かれている（1〜2 段落／10 行程度目安）／(b) 「機械置換禁止」「本文自体は書き換えない（来歴主義）」が明示されている／(c) 移管記録 `moira/changes/issue-42/migration-record.md`「issue 読み替え表」節への参照が張られている／(d) DECISIONS-CATALOG に `proposed` 起票→ agreed への昇格が済んでいる／(e) 少なくとも `moira/README.md`「関連文書」節から新規文書への到達導線が張られている | (x) 既存 `#N` 表記の一括置換（来歴破壊）／(y) 配置先を非正典（working-ledger）に閉じ込める／(z) 配置先を複数文書に分散させ SoT を作らない | **YES** | 2026-07-21 |

**注記**: R1–R10・R14–R17・R19–R21 は F 級のため、per-row の per-意図批准は要求されない
（doc-refine ゲート内で決着、または削除実行）。HA が意図として批准するのは「本リポ前提の
セットアップ手順・本リポの blob/main への URL 張り替え・managed file の canonical 表記更新・
プロトタイプ来歴注記の追加・structure/testing-conventions の最小追随・kiro-issue 削除」という
**大枠の方向**のみで、これは②境界裁定と⑤実行計画で兼ねる。

## ⑤ 実行計画承認＋一次資料セット確定

### 実行計画（経路列・依存順）

1. **R18（D）** — DECISIONS-CATALOG に `proposed` 起票 → doc-refine → agreed → 新規
   `moira/HISTORICAL-REFERENCES.md` を作成し canonical 反映。あわせて `moira/README.md`
   「関連文書」節（あるいは相当節）に新規文書への導線を追加
2. **R5–R10（F, 配布テンプレート）** — doc-refine を 1 バッチで（moira-track 関連の 6 ファイルを
   1 セッションで通す）
3. **R1–R4・R14–R17（F, canonical ドキュメント）** — doc-refine を 1 バッチで（README /
   GETTING-STARTED / cli-README / ADR-0001 / PROTOTYPE-EVALUATION / UI-DESIGN-BRIEF /
   structure.md / testing-conventions.md を 1 セッションで通す）
4. **R19–R21（削除）** — playground の `.claude/skills/kiro-issue/` ディレクトリと
   `.claude/agents/sdd-issue-creator.md` を削除（doc-refine 経由ではなく直接削除。削除の結果は
   P5 の未マップ差分検査で mapped path に含まれることで担保）
5. **R11–R13（C, managed file 再生成）** — canonical テンプレート（R5–R10）確定後に
   playground 上で `moira adapter install`（適切なオプションで）を再実行し、`git diff` で
   完全一致を確認

### 一次資料セット（SOURCE_SET_CONFIRMED — P4 doc-refine ゲートに渡す）

- 事実裁定:
  - `moira/changes/issue-42/migration-record.md`（移管記録・issue 読み替え表節）
  - 本 issue #5 本文（棚卸し済み 7 項目）
  - 本影響マップ `moira/changes/issue-5/impact-map.md`
- 語彙・命名: `moira/NAMING.md`・`.kiro/steering/moira-naming.md`
- モデル参照（ADR-0001 改稿時の背景保持のため）: `moira/MODEL.md`（該当章のみ）
- 変更管理規範: `.kiro/steering/moira-change-management.md`

**除外理由の明示**（「本文自体は書き換えない」対象）: (1) 非正典 working-ledger
（`moira/changes/**`）／(2) 歴史的 demo 記録（`moira/examples/todo-playground/demo-log*.md`）／
(3) 過去 plan（`moira/plans/**`）／(4) postmortem（`.kiro/postmortem/defects.md`）／
(5) test fixture として `sdd-workshop` URL を持つ `moira/cli/src/adapter/hooks.test.ts:259-260`
（URL は到達可能性を要さないテキストデータ）／(6) MODEL 本文の来歴引用（`moira/MODEL.md:222,226`
「sdd-workshop#37 の暫定導入を恒久化」等——イベントの来歴として保持）。

- 承認: **YES**（2026-07-21）

## issue コメントへの要約

- issue コメント: https://github.com/PrimeBrains/moira/issues/5#issuecomment-5029748729
