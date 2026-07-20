---
status: working-ledger
issue: 1
---

# doc-refine ゲート ラウンド記録 — issue #1

対象: 改稿一式（DECISIONS-CATALOG・decision-conformance SKILL.ja/SKILL/checker・moira-verification・
moira-change-management・moira-change SKILL.ja/impact-map テンプレ・moira/README——影響マップ R1〜R13）。
HA 批准済み計画により**一式を単一レビュー対象**として回す（doc-refine の「原則 1 対象ずつ」からの逸脱。
理由: 本変更の攻撃対象は目録↔検査器↔規範の相互整合そのものであり、分割すると攻撃が成立しない）。

**環境の正直開示**: 本セッションは引っ越し（sdd-workshop#42）直後で、専用 subagent type（doc-adversary /
doc-gate-judge / doc-fact-checker）が Agent ツールに未登録。代替として汎用エージェント（敵対者・採点者
= opus、事実検証 = sonnet）に**各定義ファイルを読ませて役割採用**させた（三者分離は主体分離として維持）。
codex はプラグイン runtime の既知不整合（sandbox 語彙 `read-only`→`readOnly`）で不通のため、**codex CLI
直接実行（npx @openai/codex@latest・0.144.6・read-only sandbox）**で代替した。

## Round 1（2026-07-20）

- 攻撃枠: Claude 敵対者 1 体（opus・G1-G4/D1-D6 全角）＋ codex 1 本（独立ベンダー・read-only）— 並列・相互不可視
- 反証枠の使用: **0 件**（全指摘を修正または HB 裁定で決着——反証で退けた指摘なし・再反論不要）

### codex 生指摘の重大度写像（順序保存・格下げなし）

| codex 自尺度 | 件数 | ゲート語彙 | 写像理由 |
|---|---|---|---|
| critical | 0 | Critical | — |
| major | 5 | Important | 順序対応（major=確定前に決着を要する欠陥） |
| minor | 3 | Suggestion | 順序対応。**ただし 3 件とも修正で塞いだ**（deferred 逃がしなし） |
| info | 2 | FYI | 肯定的確認（表面無傷・書き戻し禁止の徹底） |

codex 生指摘全文: 本台帳と同セッションの実行ログ（scratchpad/codex-review-r1.txt）より要旨を下表に転記。

### 指摘と decision（全件）

| # | 出所 | 重大度 | 指摘（要旨） | disposition |
|---|---|---|---|---|
| 1 | Claude F1 / codex#7 | **Critical** | moira-change SKILL.ja L146「逆引きヒット分」残存——P5 照合範囲が廃止機構を参照（同一ファイル内矛盾） | **修正済み**: 「意味突合で同定した関係判断分」へ |
| 2 | Claude F2 | Important | checker 検証源手順2: clause 同定が旧前提のまま（実装側だけ意味検索化の非対称） | **修正済み**: clause も判断文から意味的に同定・clause 不明は UNVERIFIABLE 理由にしない旨を明記 |
| 3 | Claude F3 / FORK | Important | D-78 の計器⑥割付が footprint 無しで⑥自身の規律に反する | **HB F-1 裁定（人間・2026-07-20）**: ⑦へ変更。目録・批准記録へ反映済み |
| 4 | Claude F4 / codex#1 | Important | 未生成の陰性対照試走記録を現在形で参照（3 箇所） | **修正済み**: 「記録は …配下に置く」の義務形へ（試走は実行計画 step3・確定前に実施） |
| 5 | Claude F5 | Important | 逆方向トレース（変更 path→判断）の足場の薄さが正直枠で丸められている | **修正済み**: 正直枠②へ逆方向固有の開示を追記＋影響マップ脚注に訂正を追記 |
| 6 | codex#2 | Important | `--include-untested` が状態表削除で実行不能（判定手続き欠落） | **修正済み**: 資産有無をその都度の意味検索で判定する操作的定義を追記 |
| 7 | codex#3 | Important | D-78 が proposed のまま（批准済み計画は同 run で agreed 化を要求） | **修正済み**: HB 裁定と併せ agreed へ（HA/HB 記録を人間承認の証跡として明記） |
| 8 | codex#4 | Important | steering L111（採点脚「未確定」）と skill（方向(A)確定）の矛盾 | **修正済み**: steering を方向(A)確定・実装後続へ |
| 9 | codex#5 | Important | D-78 判定文が判断より弱い（維持された対応表がすり抜ける）＋見落としリスクの平易開示欠落 | **修正済み**: 判定文を「表がよく手入れされていても破られている」形へ強化・代償文に見落とし危険と緩和策を追記 |
| 10 | codex#6 | Suggestion | .dependency-cruiser.cjs コメントが削除済み被覆マップを案内（9 ファイル外の取り残し） | **修正済み**＋影響マップ R13 追記（再入・HB F-2 で追認） |
| 11 | Claude F6 | Suggestion | 「残余面自体が消える」が過大に読める | **修正済み**: 「見落としに置き換わる」と対で明示 |
| 12 | Claude F7 | Suggestion | D-78 状態行の書式不揃い | **修正済み**: D-75〜77 と同書式へ |
| 13 | codex#8 / Claude F8 | Suggestion/FYI | moira-verification の目録在庫記述が D-72 で停止（陳腐化） | **修正済み**: L17・L25 を現況（D-78 まで）へ更新 |
| 14 | Claude F9 / codex#10 | FYI | 来歴文書・凍結例の旧語彙は対象外（批准済み扱いの確認） | 対応不要（批准・脚注どおり） |
| 15 | codex#9 | FYI（肯定） | 表面 77 件無傷を diff で機械確認 | 記録のみ |

### CLAIMS_FOR_FACT_CHECK と機械検証

1. 「⑥の一覧はタグから導出できる」——著者が機械走査で検証: タグ由来⑥集合 = {D-10,11,14,15,16,23,26,27,32,34,35,39,40,41,47,49,54,55,56,57,66,67,68,71,74,77}（26 件）＝旧被覆マップ表⑥行と**完全一致**（D-78 は HB 裁定で⑦のため⑥集合に不参加）。fact-checker が独立再検証。
2. 「2026-06-27 サンプル試走（D-34/D-40 ALIGNED）」の一次記録は削除済み旧表のみ→出典は git 履歴（fact-checker が到達性確認）。
3. 影響マップ脚注「④来歴副情報は残存」——訂正済み（稼働状況は git 履歴のみ由来）。

### 事実検証（doc-fact-checker 役・sonnet）

8 主張中 7 件 **CONFIRMED**（被覆一致〔タグ由来⑥集合 26 件＝旧表⑥行と完全一致・D-78 は⑦〕・試走来歴の git 到達性・
表面 77 件無傷〔削除 102 行の全分類〕・D-1〜78 欠番なし・残存参照ゼロ・4 文書の相互整合・日付/issue 整合）。
1 件 **CORRECTED**: moira-verification.md L17/L25 の在庫記述が D-78 を proposed 側に含めたまま（HB 裁定前の状態を
記述していた）→ **著者修正済み**（D-75〜D-78 agreed へ・L25 に「2026-07-20 批准・agreed」明示）。

### FORK ルーティング

- F-1（D-78 タグ⑥/⑦）: 批准記録が覆わない genuine fork → HB でユーザー裁定（⑦）。**即時割込みでなくバッチ提示**・平易文で説明後に裁定。
- F-2（R13 再入）: ミニ HA として HB で追認。

### 採点（doc-gate-judge 役・opus・Round 1）

**GATE: PASS**（2026-07-20）。全 15 disposition を現物確認（Critical 1 は修正で不在確認・Important 8 全件同一ラウンド内修正・
反証 0・deferred 0）・相反なし・SOURCE_SET_CONFIRMED（HA ⑤＋fact-checker CORRECTED の著者修正確認）・FORK 全ルーティング
（F-1 被覆監査: 著者は自己裁定せずユーザー裁定⑦を取得＝健全）・codex 写像監査 OK（理由なき格下げなし）・意図整合検査
ALIGNED（却下方向の遵守含む。R11 試走未実施は実行計画 step3 配置ゆえ正当）。停止規則（新規 Critical=0＋新規 Important
全件 disposition）により Round 1 で早期終了。環境開示（役割エミュレーション・codex CLI 直実行）は主体分離維持と判断のうえ受容。
