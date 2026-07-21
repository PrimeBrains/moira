---
status: working-ledger
issue: 5
---

# 閉包レポート — issue #5

## 人間が読む3点（H5）

### ① 3面最終文 ↔ 批准済み意図の対応表

| 行 ID | 面 | 対象 | 批准済み意図（intent-ratification.md ④/③/②の行） | agreed 最終文 | 整合 |
|---|---|---|---|---|---|
| R18 | D | 移管前 `#N` 読み替え方針の canonical 化 | ④ D-80 意図批准（受け入れ基準 (a)〜(e)・却下方向 (x)(y)(z) 明示・HA 2026-07-21） | [`moira/DECISIONS-CATALOG.md#D-80`](../../DECISIONS-CATALOG.md)（agreed）＋[`moira/HISTORICAL-REFERENCES.md`](../../HISTORICAL-REFERENCES.md)（8 行本体）＋[`moira/README.md`](../../README.md) 導線注記 | Y |

**F 級行の批准要約**（HA 対象外・doc-refine ゲート内で決着済み・doc-gate-judge が意図整合検査 ALIGNED を独立確認済み）:

| 行 ID | 対象 | HA 大枠意図（②境界裁定・⑤実行計画） | 最終差分の要点 | 整合 |
|---|---|---|---|---|
| R1 | moira/README.md | 本リポ前提のセットアップ手順＋HISTORICAL-REFERENCES 導線＋pwd 復元コマンド（HB F1 反映） | clone URL → PrimeBrains/moira・cd 先修正・pwd 復元 `cd <clone>/moira`・冒頭注記追加 | Y |
| R2 | moira/GETTING-STARTED.md | 本リポ前提のインストール手順 | clone URL・cd 先・「CLI 本体は本リポチェックアウトに残る」文言 | Y |
| R3 | moira/cli/README.md | 本リポ前提の CLI 所在記述 | 「CLI 本体は本リポチェックアウトに残り」・「git 根から実行」精密化 | Y |
| R4 | .kiro/adr/0001-moira-cli-write-path.md | 本文を書き換えず来歴注記のみ | Decision 節末尾に来歴注記コメント追加（本文の来歴は保持） | Y |
| R5–R10 | moira-track 配布テンプレート 6 本 | 正本文言・canonical 文書 URL の張り替え（移管前 issue リンクは D-80 来歴保持で unchanged） | 正本表記→本リポ／ADR-0001/0002・scenarios/flows URL→本リポ／SKILL 内「sdd-workshop `moira/cli` README」→本リポ | Y |
| R11–R13 | playground 配布コピー | canonical との差分 0（`moira adapter install --force` で再生成） | 6 ファイル `diff` 空・`moira adapter status` intact | Y |
| R14 | moira/PROTOTYPE-EVALUATION.md | プロトタイプ実体の来歴注記 | 表内 sdd-dashboard/evm-studio 行に「実体は旧リポ残留」注記＋HISTORICAL-REFERENCES 参照 | Y |
| R15 | moira/UI-DESIGN-BRIEF.md | プロトタイプ名参照の交叉ノート | 冒頭に PROTOTYPE-EVALUATION.md 参照ノート 1 行追加 | Y |
| R16 | .kiro/steering/structure.md | 現況の全体像反映 | 「正典ナレッジの所在」表に frontend/cli/examples/changes/plans/HISTORICAL-REFERENCES 追加・「コード組織」節で cli/frontend の実体明示 | Y |
| R17 | .kiro/steering/testing-conventions.md | 汎用/固有の整理を最小に | 冒頭に汎用原則保持＋固有詳細は実テスト所有の宣言追加 | Y |
| R19–R21 | kiro-issue skill / sdd-issue-creator agent | 削除（HA 裁定） | 3 ファイル削除・demo 本文への参照は grep 不存在 | Y |
| R22 | moira/examples/todo-playground/README.md | 本リポ前提のセットアップ手順 | 「sdd-workshop の中で」→「本リポの中で」張り替え | Y |
| R23 | README.md（リポジトリルート） | 「改稿予定」→ HISTORICAL-REFERENCES 導線 | L35 の文言更新 | Y |
| R24 | .claude/skills/moira-adapter-gen/SKILL.md | 本リポ前提記述 | L23「sdd-workshop 側」→「本リポ側」・L142 セットアップ案内先の張り替え | Y |
| R25 | .claude/skills/moira-evm-digest/SKILL.ja.md | 本リポ前提の再ビルド案内 | L41 の `<sdd-workshop>` placeholder を「本リポの checkout」に張り替え | Y |
| R26 | moira/examples/todo-playground/.claude/.moira-adapter.json | 再インストールの副産物（メタデータ更新） | `moira adapter status` intact（全 managed file が canonical と一致） | Y |

### ② できないことになったこと（平易な差分）

**なし**（deferred 行 0 件・全 26 行を resolved で決着）。

### ③ 閉包判定

**PASS**

---

**H5 承認（2026-07-21）**: 承認済み。閉包サマリコメントを issue に投稿済み
（https://github.com/PrimeBrains/moira/issues/5#issuecomment-5030280705）。
**issue の close 操作は権限の都合でユーザー側の実行が必要**（`gh issue close 5 --repo PrimeBrains/moira --reason completed`）。

---

## 機械決着詳細（折り畳み・H5 で読む義務なし）

<details>
<summary>影響マップ各行の3値判定と証跡</summary>

| 行 ID | 波及先 | 状態 | 証跡 |
|---|---|---|---|
| R1 | moira/README.md | resolved | doc-gate-judge PASS（意図整合検査 ALIGNED）＋grep で残存 sdd-workshop は意図的来歴注記のみ＋HB F1 反映確認 |
| R2 | moira/GETTING-STARTED.md | resolved | 同上＋grep で sdd-workshop 依存記述 0 |
| R3 | moira/cli/README.md | resolved | 同上＋pwd 記述精密化（doc-adversary Suggestion #11 解消） |
| R4 | .kiro/adr/0001-moira-cli-write-path.md | resolved | 同上＋来歴注記が本文を書き換えていないことを確認 |
| R5 | moira/cli/templates/claude/skills/moira-track/SKILL.md | resolved | doc-gate-judge PASS＋fact-checker 主張 3a/3b/3c CONFIRMED（URL 到達性）＋来歴保持箇所（issues/5）明示 |
| R6 | moira/cli/templates/claude/skills/moira-track/reference.md | resolved | 同上 |
| R7 | moira/cli/templates/claude/skills/moira-track/provider-reference.cc-sdd.md | resolved | 同上 |
| R8 | moira/cli/templates/kiro/steering/moira-track.md | resolved | doc-gate-judge PASS |
| R9 | moira/cli/templates/claude/hooks/moira-fire.mjs | resolved | 同上（コメント張り替え・動作コード無変更） |
| R10 | moira/cli/templates/claude/hooks/moira-guard.mjs | resolved | 同上 |
| R11 | moira/examples/todo-playground/.claude/skills/moira-track/ 一式 | resolved | fact-checker 主張 6 CONFIRMED（3 ファイル `diff` 空）＋`moira adapter status` intact |
| R12 | moira/examples/todo-playground/.claude/hooks/moira-{fire,guard}.mjs | resolved | 同上（2 ファイル `diff` 空） |
| R13 | moira/examples/todo-playground/.kiro/steering/moira-track.md | resolved | 同上（1 ファイル `diff` 空） |
| R14 | moira/PROTOTYPE-EVALUATION.md | resolved | doc-gate-judge PASS＋来歴注記＋HISTORICAL-REFERENCES 参照 |
| R15 | moira/UI-DESIGN-BRIEF.md | resolved | 同上＋交叉参照ノート追加 |
| R16 | .kiro/steering/structure.md | resolved | 同上＋現況反映確認（frontend/cli/examples/changes/plans 全列挙） |
| R17 | .kiro/steering/testing-conventions.md | resolved | 同上＋冒頭に汎用/固有分離の明示 |
| R18 | 読み替え方針の canonical 配置先（HISTORICAL-REFERENCES.md） | resolved | doc-gate-judge PASS（受け入れ基準 (a)〜(e) 全項独立検証済み・却下方向 (x)(y)(z) 侵害なし）＋D-80 state=agreed＋fact-checker 主張 1/2 CONFIRMED |
| R19 | moira/examples/todo-playground/.claude/skills/kiro-issue/SKILL.md | resolved | fact-checker 主張 5a CONFIRMED（ls 不存在＋`git status` deleted） |
| R20 | moira/examples/todo-playground/.claude/skills/kiro-issue/SKILL.ja.md | resolved | 同上 |
| R21 | moira/examples/todo-playground/.claude/agents/sdd-issue-creator.md | resolved | fact-checker 主張 5b CONFIRMED |
| R22 | moira/examples/todo-playground/README.md | resolved | doc-gate-judge PASS＋grep で sdd-workshop 依存記述 0（本文修正部） |
| R23 | README.md（リポジトリルート） | resolved | 同上＋HISTORICAL-REFERENCES 導線追加 |
| R24 | .claude/skills/moira-adapter-gen/SKILL.md | resolved | 同上＋2 箇所張り替え |
| R25 | .claude/skills/moira-evm-digest/SKILL.ja.md | resolved | 同上＋placeholder 張り替え |
| R26 | moira/examples/todo-playground/.claude/.moira-adapter.json | resolved | `moira adapter status`（2026-07-21T03:19:24Z 再インストール・全 managed file intact） |

**判定サマリ**: resolved 26 / deferred 0 / 未了 0（**全 26 行を resolved で決着**）。

</details>

<details>
<summary>未マップ差分検査結果</summary>

- base commit: `8eb1b6f975f98b79612afecaa47873a5cec1dc83`（request.md 記載の受付時点 commit）
- HEAD（P5 開始時点で固定）: `fed1500b3763be4b7a4d0a4beccb132a493d6f2c`（本 issue の P4 成果物コミット）
- 未マップ差分（changed − mapped）: **∅（空）**
- 過剰マッピング（mapped − changed）: **∅（空）**——影響マップ R1–R26 と changed set が完全 bijection
- 判定有効性: 照合開始から終了まで HEAD 固定・作業ツリー clean を確認済み

**比較の操作的定義**（steering §5 の適用）:
- `changed` = `git diff --name-only 8eb1b6f..fed1500` のリポジトリルート相対パス集合（rename 検出未使用・削除ファイル含む）
- `mapped` = 影響マップ「波及先成果物」列（R1–R26）のパス集合。ディレクトリ指定行（R11 等）は末尾 `/` 前方一致でその配下を被覆
- `moira/changes/**` は台帳自身のため正規化後に除外（steering §5 自己言及回避）

</details>

<details>
<summary>deferred 行の後続 issue openness（機械照合証跡）</summary>

deferred 行 0 件のため N/A。

</details>
