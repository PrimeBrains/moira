---
status: working-ledger
issue: 7
---

# kiro-scenario ゲート ラウンド記録 — issue #7（P4）

対象: `.kiro/scenarios/units/schedule-rebaseline.md`（agreed・改稿 3 箇所）／
`.kiro/scenarios/units/requirements-spec-returned.md`（in-review・改稿 2 箇所）

- 事前批准記録: `moira/changes/issue-7/intent-ratification.md`（HA 2026-07-20）
- SOURCE_SET_CONFIRMED: HA ⑤（MODEL v21 §2.9/§2.10/§3・issue #7 本文・issue #2 台帳・
  scenarios README・現行 unit 文面）
- 敵対者構成: Claude doc-adversary（opus）1 体＋codex CLI 0.144.6（read-only）1 本（既定構成）

## Round 1

### 著者パッチ（先行改稿・批准済み意図の転写）

1. schedule-rebaseline §3 注記: `[MODEL.md:217]` 行番号アンカー → 「MODEL §3『確定の機構』」節参照（R2）
2. schedule-rebaseline §6 注記: 「完了済みの作業は再ベースラインを受け付けない」→ 意味的再ベースライン
   （不可・不変）と記録誤りの訂正（§2.10 で可・理由必須＋計器常設表示）の切り分け（R1）
3. schedule-rebaseline §7: 「施錠され引き直せない（MODEL §3 I4）」→「意味的な引き直しはできない
   （MODEL §2.9 I4）＋訂正は届くが黙っては行えない＝『完了済みは、黙っては変わらない』（v21 精密化）」（R1・R2）
4. requirements-spec-returned §1 脚注: 却下根拠の I4 引用に「v21 後も同じ——按分は意味的変更・訂正では
   救済されない」を付記（R3）
5. requirements-spec-returned §7: 却下記録に「v21 精密化の後も却下不変」の同期注記（R3）

§3 When/Then・§6 EARS 本文は両 unit とも不変。

### 敵対指摘（Claude doc-adversary）

- **A1 [Important]** requirements-spec-returned §1(L43)/§7(L411): 却下根拠リストの「完了施錠（I4）に抵触」は
  条項帰属が緩い——MODEL §2.8 は「I4 が施錠するのは凍結属性であって葉集合の所属ではない」（誤 decompose は
  I4 拒否でなく葉基底除外で EV 寄与が消える）。精密化した節に緩い帰属が併存。却下の結論は他根拠で存続。
- **A2 [Important]** 同箇所: 「R-E3（完了ノード再見積禁止）」は R-E3 の性格付けを誤る疑い——R-E3 は
  再見積の機構（latest-wins 再提案）であり、完了ノード再見積を拒むのは I4 側。→ 事実検証へ。
- **A3 [Important]** schedule-rebaseline §5 注記(L186・未改稿): 「R-U7＝[MODEL.md:260]」が誤アンカー
  （R-U7 実定義は L320 付近）。同注記は types.ts の `MODEL:232` を「260 へ直すべき」と誤った修正を処方
  （C6 タグ自体が誤りの疑い）。R2（file-wide アンカー是正義務）の監査漏れ。→ 事実検証＋FORK。
- **A4 [Suggestion]** schedule-rebaseline §7(L214): 「予算・スロットが施錠され」は I4 の「施錠対象は
  確定済みの次元のみ」caveat を落とす過剰単純化（実害小・境界注記）。
- **A5 [FYI]** schedule-rebaseline §5/§7#1 の「完了なら I4 拒否」（再ベースライン write 経路の記述）は
  訂正チャネル（§2.10）と別物ゆえ矛盾ではないが、cross-ref があると誤読予防になる。
- **A6 [FYI]** 両 unit の spec 参照（moira-core 7.3/7.4 等）は .kiro/specs 不在でリポ内検証不能
  （corpus 全体の出典到達性ギャップ——issue #5 系の話であり本 issue の欠陥ではない）。
- **FORK F1**: §5 誤アンカー（A3）を本 issue の R2 義務として今直すか（A: R2 の postcondition
  「MODEL 参照が v21 現行の実在箇所を指す」が file-wide に覆う）、別チケットへ defer するか（B）。
- **ESCALATE**: なし（MODEL §2.8/§2.9/§2.10 は相互整合）。

### 敵対指摘（codex 0.144.6 exec read-only・生出力: codex-r1-raw.txt 末尾・重大度写像表）

写像は**ベンダー自尺度をそのまま採用**（格下げなし）:

- **X0 [Critical: なし]** codex 自身が git diff で §3/§6 本文の不変を確認（人間所有条項の侵害なし）。
- **X1 [Important]** requirements-spec-returned L43/L411: 「後付け decompose/按分が I4 に抵触」は v21 正典に
  不忠実——§2.8 は所属置換を正当な構造編集とし、完了合意済み葉の内部化で EV/PV 寄与が消えること・
  「I4 が施錠するのは凍結属性であって葉集合の所属ではない」ことを明文。§2.10 も re-decompose を補償経路として
  列挙。却下の実質は P5 信号破壊・単一ノード粒度・禁止された再見積の企図（Claude A1/A2 と同旨・収束）。
- **X2 [Important]** schedule-rebaseline L214: 「予算・スロットが施錠され」は I4 過大主張——施錠は確定済み
  次元のみ（Claude A4 と同一箇所。codex は Important・A4 は Suggestion → **Important として扱う**）。
- **X3 [Important]** schedule-rebaseline L53: 著者が節参照化した `[MODEL.md](../../moira/MODEL.md)` は相対
  深度誤りで `.kiro/moira/MODEL.md`（不存在）に解決——正しくは `../../../`。同注記の既存 spec リンクも同様に破れ。
- **X4/X5 [FYI]** v21 切り分け文言自体は正確（「訂正で再ベースライン可」への誤読なし）・R3 のスコープは
  批准どおり（in-review 維持・再批准なし）。

### 著者パッチ（R1 指摘反映・全件「修正」で塞ぐ——反証枠は不使用）

- A3/X3・F1: schedule-rebaseline の MODEL/参照実装リンク 4 箇所の相対深度を `../../../` へ是正。§5 注記の
  「R-U7＝260」を「R-U7＝MODEL §4.0」へ、types.ts への誤った修正処方（C6）を撤回注記へ差し替え。
- A4/X2: §7 に I4 の次元 caveat（予算=合意済みのみ・スロット=スケジュール済みのみ）を復元。
- A1/A2/X1: requirements-spec-returned §1/§7 の条項帰属を精密化——decompose は §2.8 の葉基底規律
  （3→0 化）・I4 が拒むのは按分に要る完了ノードの意味的再見積・R-E3 は未完了限定の機構・却下結論は不変。
  §7 の当時裁定記録は「（当時の裁定記録）」と標識して保存し、精密化を別文で付記（歴史の書き換えなし）。
- A5（FYI）: 対応不要と裁定（cross-ref は任意・非ブロッキング）。A6（FYI）: 旧 spec 到達性は issue #5 系。

### fork 被覆・deferred disposition

- **FORK F1（§5 誤アンカーを本 issue で直すか）**: 批准記録が覆う——impact-map R2 の批准済み postcondition
  「MODEL 参照が v21 現行の実在箇所を指す（行番号アンカーは節参照など安定参照へ是正）」（HA ② 裁定
  「含める——同根の事実ドリフト。行番号アンカーは節参照へ改める」2026-07-20）は file-wide の MODEL 参照
  是正を実質的に含意する。よって選択肢 A（今直す）で決着——採点者の被覆再検証対象。
- **X3 の残余**（R1 採点 FAIL を受けた切り分け直し・2026-07-20）:
  - **(i) 対象 unit 内**: schedule-rebaseline §3 注記・§7 の旧 spec 直リンク 4 箇所（L53×3・L205/L206/L210 の
    `../../.kiro/specs/moira-core|moira-schedule/requirements.md`——相対深度誤りかつ参照先が本リポ不存在
    〔R/D/T 旧リポ残置・#40 裁定〕）。**本 issue では触らず追跡付き deferred**——深度是正は参照先不存在ゆえ
    無意味であり、扱い（リンク撤去/来歴注記化/書式変更）は issue #5 の spec 参照裁定に依存するため。
    HA 批准の R2 は「MODEL 参照」の是正であり spec 直リンクの処置は批准範囲外（勝手に広げない）。
  - **(ii) 対象外**: schedule-leveled.md / schedule-reorder.md の同型相対深度誤り＋旧 spec 直リンクの恒久方針。
  - **追跡**: いずれも issue #8（スコープ明確化コメント https://github.com/PrimeBrains/moira/issues/8#issuecomment-5023575426 で (a)(b)(c) を明示列挙）。
    **openness 証跡（機械照合・添付）**: `gh issue view 8 --json number,state,assignees` →
    `{"number":8,"state":"OPEN","assignees":["pbnakao"]}`（2026-07-20 取得・scratchpad/issue8-openness.json 保存）。
    owner=pbnakao（=nakawodayo の GitHub login）・再評価条件 = issue #5 の spec 参照裁定後または
    次 kiro-scenario サイクル着手時。
  - **deferred 不可の歯止め判定**: 本 unit の目的（再ベースラインのふるまい固定）は spec リンクの到達性に
    依存しない（引用 ID・条文は本文に転記済み）——目的達成に必須の欠陥ではなく Critical 再分類は不要。

### 事実検証（第 2 巡・パッチ後の残主張）

なし（パッチはすべて第 1 巡 CONFIRMED/CORRECTED の内容に基づく——新規事実主張は R-U7 の §4.0 所属
のみで、grep により主コンテキストが確認済み〔MODEL.md:296-320〕）。

### 事実検証（doc-fact-checker・SOURCE_SET: OK）

1. CONFIRMED — R-U7 実定義は MODEL.md:320/321（§4.0 ユビキタス）。§5 注記の「R-U7＝[MODEL.md:260]」は誤り
   （L260 は §3 P7 対訳段落）。
2. CORRECTED — 「types.ts の `MODEL:232` は 260 を指すべき誤記」という旧注記（fact-check C6）自体が二重に誤り:
   (a) 現行 v21 の R-U7 は 320/321 で 260 ではない、(b) types.ts:3-4 の宣言により `MODEL:NNN` citation は
   **v14 断面**の行番号であり、現行版行番号との単純比較は版断面をまたいで成立しない。
3. CONFIRMED — R-E3（MODEL.md:360）は「意味的再見積の統治・未完了ノード限定」の機構であり、完了ノード
   再見積を拒む根拠条項は I4（R-E3 本文が §3/I4 へ委譲。fold.ts:179-190 は I4/R-E3 併記コメント）。
4. CONFIRMED — MODEL.md:179（§2.8）「完了済み・合意済みの葉に子を与える誤 decompose は…葉基底から外し
   EV_abs/PV への寄与を補償まで消す（I4 が施錠するのは凍結属性であって葉集合の所属ではない）」逐語一致。
5. CONFIRMED — .kiro/specs/ は不存在（moira-core/moira-schedule の requirements.md はリポ内検証不能・
   旧リポ残置＝CLAUDE.md 記載どおり）。
6. CONFIRMED — schedule-rebaseline 改稿後 §6/§7 の v21 文言は MODEL.md:186（§2.9 I4）と整合。
7. CONFIRMED — requirements-spec-returned 改稿後 §1/§7 の「按分は意味的変更・訂正では救済されない」は
   MODEL.md:186・224（§2.10 補償との区別）と整合。

### 採点（doc-gate-judge・R1）

**FAIL**（2026-07-20）。中核修正（A1/A2/X1・A3/X3-core・A4/X2）は全件「修正済み」で健全・
意図整合 ALIGNED・fork F1 被覆監査 OK・SOURCE_SET_CONFIRMED YES・相反なし・AWAITING-HB なし。
生存 = X3 残余の deferred が 2 点で不成立: (1) openness 証跡未添付（申告のみ）(2) 破れ spec リンクが
対象 unit 内（L53/205/206/210）に現存するのに「対象 unit 非該当」と誤分類。
→ 上記「fork 被覆・deferred disposition」を切り分け直し・証跡添付で是正済み（同日）。Round 2 へ。

## Round 2

### 敵対派遣（R1 パッチ後の最終ドラフトに対する再攻撃）

#### codex（生出力: codex-r2-raw.txt・写像＝自尺度採用・格下げなし）

- **Y1 [Important・新規]** requirements-spec-returned L43/L411: R1 パッチの新文言が「按分（3→2）には完了
  ノード側の再見積・再合意が**必要**で、それを I4 が拒む」と過大主張——decompose 後の旧完了ノードは葉で
  なくなり、見積・合意は**新子葉側**に置けるため I4 はそれ自体を禁じない。却下の実根拠は「確定済み粒度の
  遡及改変・部分EV（v16 却下）の密輸・P5 後退信号の消去」であり、I4 必然性の証明は §2.8–2.10/R-E3 から
  導出されない。2 箇所で反復。
- **Y2 [Suggestion・生存]** schedule-rebaseline L186: 「reason は再ベースラインで必須（R-U7＝…）」は
  スロット再ベースラインの reason 必須を R-U7 に直接帰属——正しくは MODEL §3 が「R-U7 **同型**の
  凍結属性の改訂（理由必須）」として確立（R-U7 自体は見積凍結値の規則）。
- **FYI（健全性確認）**: 新 MODEL/fold.ts リンクは正しく解決・I4 次元 caveat と v21 切り分けは §2.9–2.10 に
  正確・スコープ超過なし・§3/§6 ドリフトなし・issue #8 済みの旧 spec リンクは再報告せず。

#### Claude doc-adversary

- **Z1 [Important・新規]** schedule-rebaseline L188/L206: `[fold.ts:113-118]` は誤アンカー——実 113-118 は
  containment-cycle ガードで、`n.frozenSlot === null` ガードは **fold.ts:156-157**（コメント 153-155）。
  散文は正確で行番号のみ誤り。R1 は深度のみ是正し行番号を未検証で残した。issue #8 deferral 非該当
  （spec 直リンク集合に含まれない backend 参照）。
- **Z2 [Suggestion]** schedule-rebaseline L198: 「R-S7／R-S7 6.3」は書式崩れ（並列構造上「R-S7／
  moira-schedule 6.3」が正——同ファイル L53 の表記とも整合）。
- **FYI**: ①requirements-spec-returned §7 の保存された歴史行の「R-E3 に抵触」は不精密のまま残るが
  co-located の精密化文で訂正済み＝許容 ②§3(L79)↔§6(L400) の既知矛盾は issue #12 由来の先行条件で
  in-review 維持の理由そのもの（本 issue 不関与・§7 L414 に記録済み）③§1 脚注と §7 の近似重複は
  audience 分割（README）で許容。
- **FORK**: なし（F1 は R2 批准被覆で解決済み）。**ESCALATE**: なし。
- 粒度限界の開示: git diff 権限なし——§3/§6 不変は現物読解＋台帳整合で確認（R1 の codex X0 が diff 済み）。

### 著者パッチ（R2・全件「修正」で塞ぐ——反証枠は不使用）

- **Y1**: requirements-spec-returned §1/§7 の I4 必然性の過大主張を削除——「3→2 は新子葉への見積・合意・
  完了付与による確定済み粒度の遡及的な作り直し＝部分EV 密輸・P5 信号消去に帰着。I4 が拒むのは完了ノード
  自身の凍結見積の意味的な引き直し」へ再構成（却下結論は不変のまま）。
- **Z1**: fold.ts アンカー 2 箇所を 113-118 → **156-157** へ是正（著者 grep で現物確認:
  `fold.ts:156-157` が frozenSlot 初回凍結ガード・153-155 が load-bearing コメント）。
- **Y2**: §5 注記の reason 必須の帰属を「MODEL §3——R-U7 同型の凍結属性の改訂」へ（R-U7 は見積凍結値
  規則〔§4.0〕と併記）。
- **Z2**: L198 の「R-S7／R-S7 6.3」→「R-S7／moira-schedule 6.3」。
- FYI ①〜③: 対応不要と裁定（非ブロッキング。①は co-located 訂正で決着済み・②は in-review guardrail・
  ③は README の audience 分割どおり）。

### 採点（doc-gate-judge・R2）

**PASS（早期終了・2026-07-21）**。R2 新規 Critical=0・新規 Important（Y1/Z1）は同一ラウンド内で
現物検証済みの「修正済み」決着（Y1: 限定構文で I4 射程を画定し MODEL §2.8/§2.9/R-E3 と逐語整合・
却下結論不変。Z1: fold.ts:156-157 現物確認）。R1 FAIL 事由 2 点の是正を検証済み（X3 残余の切り分け＋
openness 証跡添付）。意図整合 ALIGNED・fork 被覆監査 OK・deferred（#8）4 要件充足・ベンダー写像
格下げなし・SOURCE_SET_CONFIRMED YES・相反/AWAITING-HB/ESCALATE なし・生存 Critical/Important なし。
**PASS の射程**: schedule-rebaseline の注記変更は auto-agreed 確定（agreed 維持）・requirements-spec-returned
は §3↔§6 の文書化済み矛盾（issue #12 由来・§7 記録済み）を理由に in-review 据え置き（昇格せず——
批准 R3 どおり）。採点者の Y1 再検証（PASS 防衛の逐語照合）は本記録の直前セクションに全文残る。

### 事実検証（R2）

新規事実主張は fold.ts 行番号のみ——敵対者の grep＋著者の独立 grep（156-157 で frozenSlot ガード・
113-118 は containment-cycle 拒否）で二重確認。残る CLAIMS_FOR_FACT_CHECK は旧 spec 主張
（リポ内検証不能・issue #8/#5 追跡——R1 の fact-check claim 5 で確定済み）と R1 非改稿箇所の
reachedImplemented（本 issue スコープ外）のみ。
