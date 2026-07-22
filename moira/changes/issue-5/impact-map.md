---
status: working-ledger
issue: 5
---

# 影響マップ — issue #5

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/README.md | F | grep hit L111-112 / L138（sdd-workshop clone・cd sdd-workshop/moira・「sdd-workshop 内で」） | doc-refine | セットアップ手順が本リポ（PrimeBrains/moira）チェックアウト前提に改稿されている（clone URL・cd 先・「〜内で」文言） | doc-refine ゲートの敵対＋事実検査＋人間 gate 判定＋grep 再確認 | pending | — |
| R2 | moira/GETTING-STARTED.md | F | grep hit L48/L52-53/L62-63（sdd-workshop clone・cd sdd-workshop・「CLI 本体は sdd-workshop チェックアウトに残り」・「sdd-workshop を git pull」） | doc-refine | インストール節（§2）が本リポ前提へ改稿。「CLI 本体は本リポチェックアウトに残る」旨と更新方法（本リポの `git pull`）が正しく書かれている | doc-refine ゲート＋grep 再確認 | pending | — |
| R3 | moira/cli/README.md | F | grep hit L4/L13（「CLI 本体は sdd-workshop チェックアウトに残り」・「sdd-workshop 内で」） | doc-refine | インストール節が本リポ前提へ改稿。CLI 本体の所在記述が本リポチェックアウトに整合 | doc-refine ゲート＋grep 再確認 | pending | — |
| R4 | .kiro/adr/0001-moira-cli-write-path.md | F | grep hit L31（「CLI 本体は sdd-workshop チェックアウトに残る（global CLI モデル）」）—ADR の来歴主義に配慮し、本文を機械置換せず**来歴注記**を付す方針（項目 2） | doc-refine | 当該 ADR に「起草時は sdd-workshop 前提だが issue #42 移管後は本リポ前提へ読み替える」旨の来歴注記が入っている（Context/Decision 本文の来歴改変はしない） | doc-refine ゲート＋grep 再確認 | pending | — |
| R5 | moira/cli/templates/claude/skills/moira-track/SKILL.md | F | grep hit L19/L26-27/L67/L192/L207（正本文言・github.com/PrimeBrains/sdd-workshop/blob/main/… 直リンク×3・「sdd-workshop 内 npm link」・「sdd-workshop `moira/cli` README」／なお L192 の「sdd-workshop/issues/5」URL は D-80「移管前 URL は本文の来歴として保持」に該当し**張り替え対象外**） | doc-refine | 正本パス表記が「本リポ moira/cli/templates/」へ、canonical 文書への外部リンクが本リポの blob/main URL へ、「sdd-workshop `moira/cli` README」文言が「本リポ `moira/cli/README.md`」へ張り替え（移管前 issue リンクは来歴保持） | doc-refine ゲート＋grep 再確認 | pending | — |
| R6 | moira/cli/templates/claude/skills/moira-track/reference.md | F | grep hit L3/L14-15/L56/L118（正本文言・「sdd-workshop checkout の `moira/backend` `moira/cli`」・ADR-0001 直リンク・「sdd-workshop/issues/5」・出典列見出し「sdd-workshop checkout」） | doc-refine | 上と同様に張り替え | doc-refine ゲート＋grep 再確認 | pending | — |
| R7 | moira/cli/templates/claude/skills/moira-track/provider-reference.cc-sdd.md | F | grep hit L3/L184（正本文言・new-feature-happy-path 直リンク） | doc-refine | 上と同様に張り替え | doc-refine ゲート＋grep 再確認 | pending | — |
| R8 | moira/cli/templates/kiro/steering/moira-track.md | F | grep hit L3（正本文言「sdd-workshop moira/cli/templates/」） | doc-refine | 正本表記の張り替え | doc-refine ゲート＋grep 再確認 | pending | — |
| R9 | moira/cli/templates/claude/hooks/moira-fire.mjs | F | grep hit L3（コメント「canonical source: sdd-workshop moira/cli/templates/」） | doc-refine | コメント張り替え（動作コード無変更） | doc-refine ゲート＋grep 再確認 | pending | — |
| R10 | moira/cli/templates/claude/hooks/moira-guard.mjs | F | grep hit L2（コメント「canonical source: sdd-workshop moira/cli/templates/」） | doc-refine | コメント張り替え（動作コード無変更） | doc-refine ゲート＋grep 再確認 | pending | — |
| R11 | moira/examples/todo-playground/.claude/skills/moira-track/ (SKILL.md / reference.md / provider-reference.md 一式) | C | R5–R7 の canonical テンプレート改稿の**配布コピー**（managed file・手編集不可）。`moira adapter install` の再実行で再生成 | `moira adapter install` 実行（手作業ではなく既存 CLI コマンド） | canonical テンプレートと文言完全一致（差分 0） | 再インストール後の `git diff` および grep 再確認 | pending | — |
| R12 | moira/examples/todo-playground/.claude/hooks/moira-fire.mjs / moira-guard.mjs | C | R9–R10 の配布コピー | `moira adapter install` 再実行 | canonical テンプレートと文言完全一致 | 同上 | pending | — |
| R13 | moira/examples/todo-playground/.kiro/steering/moira-track.md | C | R8 の配布コピー | `moira adapter install` 再実行 | canonical テンプレートと文言完全一致 | 同上 | pending | — |
| R14 | moira/PROTOTYPE-EVALUATION.md | F | grep hit L21-22（表内「sdd-workshop/sdd-dashboard/」「sdd-workshop/evm-studio/」パス記載）—項目 4 対応 | doc-refine | 該当パス行に**来歴注記**（実体は旧リポ `PrimeBrains/sdd-workshop` 残留である旨）が付されている（表本体の意味的正確性を保つ最小介入） | doc-refine ゲート＋grep 再確認 | pending | — |
| R15 | moira/UI-DESIGN-BRIEF.md | F | HA 裁定 2026-07-21: 介入する。プロトタイプ名（evm-studio / sdd-dashboard）の設計語彙参照であっても、実体は旧リポ残留である旨を PROTOTYPE-EVALUATION.md への交叉参照として最小限で明記 | doc-refine | 該当箇所に PROTOTYPE-EVALUATION.md への交叉参照ノートが 1〜2 行で追加されている | doc-refine ゲート＋grep 再確認 | pending | — |
| R16 | .kiro/steering/structure.md | F | HA 裁定 2026-07-21: 介入する。`moira/backend/` のみの列挙を現況（frontend / cli / examples / changes / plans 等）へ最小補筆 | doc-refine | 「正典ナレッジの所在」表 or 「コード組織」節が現況を反映（frontend / cli / examples が明示） | doc-refine ゲート＋grep 再確認 | pending | — |
| R17 | .kiro/steering/testing-conventions.md | F | HA 裁定 2026-07-21: 介入する。ただし現況で分離は成立しているため最小の再整理に留める | doc-refine | 汎用ルールと Moira 固有事例が明示的に分離／再確認されている | doc-refine ゲート＋grep 再確認 | pending | — |
| R18 | 読み替え方針の canonical 配置先（候補: `moira/README.md` 冒頭・新規 `moira/HISTORICAL-REFERENCES.md`・`.kiro/steering/moira-verification.md` 追記のいずれか） | **D**（配置先の 0→1 構造判断） | 項目 6: 「移管前文書中の `#N` は `PrimeBrains/sdd-workshop#N` を指す・機械置換しない」方針は移管記録（非正典 working-ledger）にのみ存在。canonical 化の配置先裁定を必要とする。境界不明瞭の既定ルート=D 起票（steering §3） | DECISIONS-CATALOG へ `proposed` 起票 → doc-refine（(a)責任・ドメイン意味を含むため HA 意図批准対象） | 配置先が HA で agreed になり、当該文書に読み替え方針が canonical に配置され、既存 `#N` 表現の機械置換禁止が明示されている | doc-refine ゲート＋DECISIONS-CATALOG 更新＋実配置文書の grep 再確認 | pending | — |
| R19 | moira/examples/todo-playground/.claude/skills/kiro-issue/SKILL.md | F | HA 裁定 2026-07-21: **削除**（demo からも撤去。demo README／demo-log には参照無しを grep で確認済み——本文修正は不要） | 直接削除（doc-refine 経由なし） | 当該ファイル削除済み | `git status` で削除確認・grep 再確認 | pending | — |
| R20 | moira/examples/todo-playground/.claude/skills/kiro-issue/SKILL.ja.md | F | R19 と同（削除） | 直接削除 | 当該ファイル削除済み | 同 R19 | pending | — |
| R21 | moira/examples/todo-playground/.claude/agents/sdd-issue-creator.md | F | HA 裁定 2026-07-21: **削除**（R19 の kiro-issue が dispatch する専用エージェント。同時撤去） | 直接削除 | 当該ファイル削除済み | 同 R19 | pending | — |
| R22 | moira/examples/todo-playground/README.md | F | **P4 再入（未マップ差分検出）2026-07-21**: R5–R10 バッチ実行後の grep で「sdd-workshop の中で」記述を発見（L17）。項目 1 セットアップ手順群と同じ規律で本リポ前提へ改稿 | doc-refine（R1–R4・R14–R17 バッチに合流） | セットアップ手順の「sdd-workshop の中で」文言が「本リポ（PrimeBrains/moira）の中で」等に張り替え | doc-refine ゲート＋grep 再確認 | pending | — |
| R23 | README.md（リポジトリルート・landing 文書） | F | **P4 再入 2026-07-21**: doc-adversary Important #1 で発見。L35「文書中に残る sdd-workshop 前提の記述は #5 で改稿予定です」が本 issue の完了想定断面で時制矛盾。HISTORICAL-REFERENCES.md への導線も欠落 | doc-refine（R1–R4・R14–R17 バッチに合流） | 「改稿予定」文言を「読み替え方針は HISTORICAL-REFERENCES.md」に置換し、canonical 到達導線を追加 | doc-refine ゲート＋grep 再確認 | pending | — |
| R24 | .claude/skills/moira-adapter-gen/SKILL.md | F | **P4 再入 2026-07-21**: doc-adversary Important #1 で発見。L23「本スキルは sdd-workshop 側の authoring ツール」・L142「sdd-workshop `moira/cli` README」——canonical 運用 skill に旧リポ前提が残存 | doc-refine（R1–R4・R14–R17 バッチに合流） | 「sdd-workshop 側」→「本リポ（`PrimeBrains/moira`）側」、「sdd-workshop `moira/cli` README」→「本リポの `moira/cli/README.md`」に張り替え | doc-refine ゲート＋grep 再確認 | pending | — |
| R25 | .claude/skills/moira-evm-digest/SKILL.ja.md | F | **P4 再入 2026-07-21**: doc-adversary Important #1 で発見。L41「`cd <sdd-workshop>/moira/backend ...`」——実ユーザーへの再ビルド指示に旧リポ名 placeholder が残存 | doc-refine（R1–R4・R14–R17 バッチに合流） | placeholder を「本リポの checkout」等に張り替え | doc-refine ゲート＋grep 再確認 | pending | — |
| R26 | moira/examples/todo-playground/.claude/.moira-adapter.json | C | **P4 再入 2026-07-21**: doc-fact-checker 主張 7 で発見。R11–R13 再インストールの副産物として自動更新される managed metadata（install 時刻・ハッシュ値）。実体の実質変更ではないが、mapped path として明示化しないと未マップ差分検査で偽陽性となる | `moira adapter install` の副産物（手作業なし） | 当該 metadata が canonical テンプレートと整合するハッシュ値へ自動更新済み | `moira adapter status` で intact 報告 | pending | — |

## 人間断面ビュー

> **注記**: レビュー対象は「シナリオ・プロパティ・設計判断」の 3 面のみ（steering §6・moira-change-management §6）。
> 本 issue は主に F 級（一般確定文書）で構成されるため、F 級行は「文書ゲート内で批准（HA 対象外・doc-refine 内で決着）」節に集約する。
> HA が実質的に判断する行は D 級の R18・および F 級のうち射程裁定を要する R15/R16/R17/R19（=既定を採るか介入するか）に限定される。

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R18 | 読み替え方針の canonical 配置先 | 「本リポの古い文書に出てくる `#N` はぜんぶ旧リポ（sdd-workshop）の issue 番号を指す」というルールを、これから読む人に findable な確定文書のどこかに書く。**どの文書に書くか**を今決める（候補: `moira/README.md` の冒頭に短い注記／新しく `moira/HISTORICAL-REFERENCES.md` を作る／`.kiro/steering/moira-verification.md` に追記のいずれか）。既存の `#N` 記述は書き換えない（来歴主義） | pending |

### 文書ゲート内で批准（HA 対象外・doc-refine 内で決着）

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R1 | moira/README.md | doc-refine ゲート内 |
| R2 | moira/GETTING-STARTED.md | doc-refine ゲート内 |
| R3 | moira/cli/README.md | doc-refine ゲート内 |
| R4 | .kiro/adr/0001-moira-cli-write-path.md | doc-refine ゲート内 |
| R5 | moira/cli/templates/claude/skills/moira-track/SKILL.md | doc-refine ゲート内 |
| R6 | moira/cli/templates/claude/skills/moira-track/reference.md | doc-refine ゲート内 |
| R7 | moira/cli/templates/claude/skills/moira-track/provider-reference.cc-sdd.md | doc-refine ゲート内 |
| R8 | moira/cli/templates/kiro/steering/moira-track.md | doc-refine ゲート内 |
| R9 | moira/cli/templates/claude/hooks/moira-fire.mjs | doc-refine ゲート内 |
| R10 | moira/cli/templates/claude/hooks/moira-guard.mjs | doc-refine ゲート内 |
| R14 | moira/PROTOTYPE-EVALUATION.md | doc-refine ゲート内 |
| R15 | moira/UI-DESIGN-BRIEF.md | doc-refine ゲート内（HA 裁定: 介入） |
| R16 | .kiro/steering/structure.md | doc-refine ゲート内（HA 裁定: 介入） |
| R17 | .kiro/steering/testing-conventions.md | doc-refine ゲート内（HA 裁定: 介入） |
| R19 | moira/examples/todo-playground/.claude/skills/kiro-issue/SKILL.md | HA 裁定: 削除 |
| R20 | moira/examples/todo-playground/.claude/skills/kiro-issue/SKILL.ja.md | HA 裁定: 削除 |
| R21 | moira/examples/todo-playground/.claude/agents/sdd-issue-creator.md | HA 裁定: 削除 |
| R22 | moira/examples/todo-playground/README.md | doc-refine ゲート内（P4 再入・R1–R4・R14–R17 バッチに合流） |
| R23 | README.md（リポジトリルート） | doc-refine ゲート内（P4 再入） |
| R24 | .claude/skills/moira-adapter-gen/SKILL.md | doc-refine ゲート内（P4 再入） |
| R25 | .claude/skills/moira-evm-digest/SKILL.ja.md | doc-refine ゲート内（P4 再入） |

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——`moira adapter install`
の再実行による managed file の再生成であり、canonical テンプレート（R5–R10）と文言一致することを
`git diff` と grep で機械照合する（差分 0 が期待 postcondition）。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R11 | moira/examples/todo-playground/.claude/skills/moira-track/ (SKILL.md / reference.md / provider-reference.md) | C |
| R12 | moira/examples/todo-playground/.claude/hooks/moira-fire.mjs / moira-guard.mjs | C |
| R13 | moira/examples/todo-playground/.kiro/steering/moira-track.md | C |
| R26 | moira/examples/todo-playground/.claude/.moira-adapter.json | C |
