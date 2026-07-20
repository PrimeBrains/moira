---
status: working-ledger
issue: 1
---

# 影響マップ — issue #1

## 波及先一覧

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R1 | moira/DECISIONS-CATALOG.md | D | plan §8-6 の人間裁定（2026-07-19・正規化でなく裏面削除）を目録の正式判断として記録するか、および被覆マップ（計器割付）の存続形態（最小の表 or 派生ビュー化）は MODEL 沈黙下の 0→1 構造判断 | DECISIONS-CATALOG へ proposed 起票 → doc-refine（仕分け (a)——HA 批准済み意図で） | 「裏面削除・照合は AI 意味突合」の判断が目録に agreed で記録され（起票要否自体も HA 裁定に従う）、被覆マップの形態が HA 裁定どおりに確定している | doc-refine ゲート（独立採点者の意図整合検査＝HA 批准記録との突合） | 未了 | — |
| R2 | moira/DECISIONS-CATALOG.md | F | 裏面欄は D-1〜D-77 全 77 件に存在（規律節 L12 が裏面の存在理由を定義・L17 が被覆マップの役割分担を宣言・末尾 L708-727 に独立被覆マップ表）。削除対象そのもの | doc-refine | 全 77 エントリから〔裏面〕欄（計器資産子箇条書き含む）が消え、表面（場面・決めたこと・対案・外すと・判定文・仕分け・計器タグ）は全件無傷。規律節が新方式（正典は判断文・対応導出は照合時に AI が毎回行う）を記述。末尾被覆マップ表は R1 裁定の形に処置 | doc-refine PASS＋doc-fact-checker（表面 77 件無傷・裏面残存ゼロの機械確認） | 未了 | — |
| R3 | .claude/skills/decision-conformance/SKILL.ja.md | F | 裏面 ref 依存 7 箇所（L38 抽出手順・L43 断面読取・L44 照合不能条件・L48 入力契約・L52-53 DRIFTED 原因分岐・L78 実行契機）＋ステータス文言 L5/L20 | doc-refine | 照合対象特定が「判断文 → 実装への意味検索（AI 意味突合）」の手順として定義され、裏面 ref への依存記述ゼロ。DRIFTED 原因分岐・実行契機・照合不能条件が意味突合前提で再定義。ステータスは機構改訂を反映 | doc-refine PASS | 未了 | — |
| R4 | .claude/skills/decision-conformance/SKILL.md | F | 英語シェルの description・ステータス文言（L5/L14/L19）が旧方式を反映 | doc-refine（R3 と同一 run） | SKILL.ja.md と矛盾しない英語シェル（手順非複製の原則は維持） | doc-refine PASS | 未了 | — |
| R5 | .claude/agents/decision-conformance-checker.md | F | 裏面 ref 依存 5 箇所（L5 役割定義・L18 入力契約・L22 検証源第一手順・L39 原因分岐・L43 UNVERIFIABLE 基準） | doc-refine | 入力契約から裏面 ref が消え「判断文＋実装サーフェス」を受け取る形へ。検証源第一手順が「判断文を起点に意味検索で対応候補を同定してから現物を読む」へ。UNVERIFIABLE 基準が意味突合特有の不確実性（対応不発見・複数候補で一意に定まらない）を含む形へ拡張。負の照合の探索範囲確定も意味検索起点で再定義 | doc-refine PASS | 未了 | — |
| R6 | .kiro/steering/moira-verification.md | F | L25-26 裏面列定義・L29-30 裏面経由の運用記述・L111 計器⑥定義・L114 被覆規律 | doc-refine | 裏面・被覆マップ参照記述が改訂後の姿（裏面なし・R1 裁定の被覆形態・意味突合）と一致 | doc-refine PASS＋doc-fact-checker（影響マップ範囲） | 未了 | — |
| R7 | .kiro/steering/moira-change-management.md | F | §2 L89-90（P2 トレース機構「裏面 ref と計器被覆マップ」「変更 path → 裏面 ref の逆引き」）・§5 L168（逆引き実行定義＋「その issue の確定後に本記述を更新する」の予告）・L178（裏面 ref 逆引きの完全性＝正直枠②）・§7 L237 | doc-refine | P2 トレース機構と P5 検証器表の記述が意味突合方式へ更新され、L168 の予告が果たされ、正直枠②が新方式の限界記述（意味検索の網羅性は保証しない等）に置換 | doc-refine PASS | 未了 | — |
| R8 | .claude/skills/moira-change/SKILL.ja.md | F | L71-72 が steering §2 のトレース機構定義（裏面 ref・逆引き）を複製 | doc-refine（R7 と同一 run） | steering 改訂後の文と矛盾しない（複製箇所の同期） | doc-refine PASS | 未了 | — |
| R9 | .claude/skills/moira-change/templates/impact-map.template.md | F | L19 根拠列の説明が「DECISIONS-CATALOG 裏面 ref」をトレース機構として例示 | doc-refine（R7 と同一 run） | 根拠列の例示が改訂後のトレース機構と一致 | doc-refine PASS | 未了 | — |
| R10 | moira/README.md | F | L48「設計判断の目録(D-1〜)と裏面 ref・計器割付」 | doc-refine | 目録の説明文が改訂後の姿と一致 | doc-refine PASS | 未了 | — |
| R11 | （検証行為）改修後 checker の陰性対照試走 | V | 計器⑥は検知器そのもの——照合方式の置換に V 級の精神（自己検証禁止・陰性対照）を適用するかは境界裁定（request.md 仮判定 V 欄）。#39 受け入れテストの陰性対照と同型 | 自己検証禁止プロトコル（試走＋独立レビュー） | 新方式（意味突合）で (i) 旧試走実績 D-34/D-40 の再照合が ALIGNED、(ii) 既知違反（作業ツリー上の意図的ドリフト fixture）を DRIFTED として検知、の両方が実証される。checker 自身の PASS 宣言だけで閉じない | 試走記録（台帳）＋codex 独立レビュー | 未了 | — |
| R12 | moira/examples/todo-playground/.claude/agents/decision-conformance-checker.md | F（境界） | ルート checker 定義の複製が凍結例プレイグラウンド内に存在（掃引で検出）。凍結アーカイブは非同期が既定（#42 移管時の扱い）だが、放置すると新旧定義が同居する | doc-refine（同期する場合）／HA 裁定（非同期のままとする場合） | HA ②の裁定どおり: 非同期のまま（凍結例・現況を主張しない）か、複製も同期するか | HA 裁定記録（非同期の場合）／doc-refine PASS（同期の場合） | 未了 | — |

**再入記録**:
- 2026-07-20 P4 ゲート実行中（doc-refine R1 敵対レビュー）の検出により R13 を追記（codex 指摘——対象 9 ファイル外の取り残し）。ミニ HA は HB（fork-batch F-2）に合流。

| 行 ID | 波及先成果物（パス） | クラス | 根拠 | 担当ゲート | 期待 postcondition | 検証器 | 状態 | 証跡 |
|---|---|---|---|---|---|---|---|---|
| R13 | moira/backend/.dependency-cruiser.cjs | C | 冒頭コメント L9 が削除済みの「DECISIONS-CATALOG 被覆マップ ①」を案内（doc-refine R1 codex 指摘 #6。P2 掃引は「変更不要」と誤判定していた） | codex レビュー＋CI（コメントのみの変更・挙動不変） | コメントが現行の割付正典（各エントリの計器タグ・D-78）を案内する | codex レビュー＋CI green | 未了 | — |

## 人間断面ビュー

### レビュー対象（シナリオ・プロパティ・設計判断の3面のみ）

| 行 ID | 波及先 | 平易文（何が変わるか） | 状態 |
|---|---|---|---|
| R1 | 設計判断の目録 | 目録の各判断に付いている「裏側の対応表」（この判断はどの規約条文・どの実装ファイルに対応するか、を手で書いた一覧）を**廃止**します。今後「この判断は守られているか」を確かめるときは、判断文そのものを手がかりに **AI がその都度、対応する実装を探し当てて照合**します。手で維持する対応表はズレていく（実装が動いても表は自動では直らない）ので、表を維持するのをやめて毎回導出に切り替える、という賭けです。代償は照合のたびの探索コスト。あわせて、「どの判断をどの検査器で見るか」の一覧表（被覆マップ）を今後も手で持つか、それも毎回導出にするかを決めます | 未了（HA 批准待ち） |

### 文書ゲート内で批准（HA 対象外）

| 行 ID | 波及先 | 批准の所在 |
|---|---|---|
| R2 | moira/DECISIONS-CATALOG.md（裏面欄削除・規律節改稿） | doc-refine ゲート内 |
| R3 | .claude/skills/decision-conformance/SKILL.ja.md | doc-refine ゲート内 |
| R4 | .claude/skills/decision-conformance/SKILL.md | doc-refine ゲート内 |
| R5 | .claude/agents/decision-conformance-checker.md | doc-refine ゲート内 |
| R6 | .kiro/steering/moira-verification.md | doc-refine ゲート内 |
| R7 | .kiro/steering/moira-change-management.md | doc-refine ゲート内 |
| R8 | .claude/skills/moira-change/SKILL.ja.md | doc-refine ゲート内 |
| R9 | .claude/skills/moira-change/templates/impact-map.template.md | doc-refine ゲート内 |
| R10 | moira/README.md | doc-refine ゲート内 |
| R12 | 凍結例内の checker 複製 | HA ②境界裁定（非同期の既定を確認）→ 同期する場合のみ doc-refine |

### 人間はレビューしない（codex＋CI に委譲）

以下は本フローの人間タッチポイント（HA・HB・H5）でのレビュー対象**ではない**——ソースコード・
テストコード（C級）・検証基盤（V級）等の機械決着行であり、codex レビューおよび CI
（計器①②③④）に委譲する。

| 行 ID | 波及先 | クラス |
|---|---|---|
| R11 | 改修後 checker の陰性対照試走（試走記録＋codex 独立レビューで決着。義務を課すか自体は HA ②境界裁定） | V |

## 調査の脚注（来歴・非対象の把握）

- 誤検出として除外: `.claude/skills/moira-adapter-gen/SKILL.md` L118 の「裏面」（設定レンダリング文脈の別用法）
- 来歴文書（改稿しない）: `moira/plans/2026-07-19-change-management-dfd.md`（§8-6 が本 issue の裁定原典）・`moira/plans/2026-07-02-mvp-completion-plan.md`・`moira/changes/issue-39/`・`issue-43/`・`issue-42/`
- 変更不要と判定: `moira/MODEL.md` L443・`moira/DECISIONS.md` L253（clause→property 被覆の別軸）・`moira/backend/.dependency-cruiser.cjs` L9・`moira/backend/src/pbt/done-lock.pbt.test.ts` L16（D-N 名指しコメントは意味突合の足場として残る）・`CLAUDE.md`・ルート `README.md`・`.kiro/scenarios/units/*`（D-69 定型句）・`.kiro/adr/0003`/`0005`（D 番号参照のみ）
- 裏面削除で失われる情報（HA への正直開示）: ①判断↔clause ID 対応（77 件）②判断↔実装パス対応（大半）③計器割付の理由説明（29 件）④来歴副情報（コミットハッシュ・ADR 番号・計器資産の稼働状況 18 件）。①②は照合時に AI が毎回導出（本 issue の賭けの本体）、③は導出可能な説明、④は git 履歴・ADR・テストコード内の D-N 名指しコメントに残存
- 【訂正 2026-07-20・doc-refine R1 敵対指摘】④のうち「計器資産の稼働状況」（緑/RED 等）は D-N コメントに残らないものがあり、出典は git 履歴のみ——「導出可能」の主張を「git 履歴から到達可能」に弱める。また逆方向（変更 path→判断）のトレース足場はテスト未整備の proposed 判断で薄い（steering 正直枠②に開示を追記済み）
