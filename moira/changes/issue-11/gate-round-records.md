---
status: working-ledger
issue: 11
---

# ゲートラウンド記録 — issue #11 P4 ゲート 1（moira-model-update・R1）

## codex（独立ベンダー敵対者）生指摘全文（R1・2026-07-21）

呼び出し: `npx -y @openai/codex@latest exec --sandbox read-only`（read-only・パッチ権限なし）

I’ll inspect only the requested uncommitted diffs, then trace every affected claim against the surrounding model, naming, properties, and the cited implementation. I’ll treat ambiguity as a defect and won’t modify files.

The initial output was too large to audit reliably. I’m narrowing it to the exact changed hunks and the normative definitions they depend on, including implementation boundary behavior and the English mirror.

1. **Critical — `MODEL.md:224–226`, as-of replay is false for (③c) backdated events**

   > “過去時点の読みの再現(as-of T)は「`(ts,id)` ≤ T のイベント＋…」を採り…**T までに知られていた最善の読み**が得られる”

   A (③c) event’s `ts` is its claimed occurrence time, not its append/issuance time. Once a backdated event is added, every replay whose `T` is after the claimed `ts` includes it—even if the event was not appended until after `T`. The encoded issuance time used by the meter is not used by the replay predicate. Thus the replay rewrites what was “known by T,” directly contradicting the quoted guarantee.

   Counterexample: an event claims `ts = July 1`, is appended July 10, and `as-of T = July 5`. Replaying the current log includes the event because July 1 ≤ July 5, although nobody knew it on July 5. Correct reconstruction requires append/knowledge time or an immutable saved snapshot; the asserted single-`ts` reconstruction cannot provide it.

2. **Critical — `MODEL.md:222`, the “no bitemporal data model needed” conclusion no longer follows**

   > “発行時刻は追記機構の発行順識別子から観測する——イベント・訂正に第二の時刻フィールドは足さず、bitemporal 非導入は不変”

   > “時点再現に要る二つの時刻——知った時刻（訂正記録自身の ts）と起きたとされる時刻（訂正後のイベント ts）——は…既存構造に自然に在り”

   This only supplies two times for corrections. Form (③c) introduces the same two-time requirement for ordinary events, but an event has only its claimed `ts`; its issuance time exists only incidentally in some IDs or transient physical order. The text simultaneously makes event issuance normatively significant and denies that the model needs to represent it.

   Counterexample: two valid importers emit identical event records except that one uses `realStamper` IDs and the other UUIDs. The underlying occurrence and append times are identical, but only the first has an observable knowledge time. They cannot support the same meter or as-of replay.

3. **Critical — `MODEL.md:222`, the explicit non-counting escape contradicts the accounting discipline and gaming-resistance claim**

   > “発行時刻を観測できない記録形式では ③c は計数されない〔正直開示〕”

   > “いかなる提示も除外できない…消すのは不可”

   > “閾値・色分け等の裁量ノブは持たない”

   Choosing an ID format without decodable issuance time is an effective exclusion knob. A producer can make otherwise identical backdated writes invisible merely by using UUIDs, legacy IDs, or hand-authored IDs. Calling this an honest disclosure does not resolve the contradiction: the model promises that records cannot be excluded, then expressly excludes a class based on representation.

   Counterexample: append the same July 1 event on July 10 once with `m...-000001-abcd` and once with `550e8400-...`. The first rings ③c and the second does not.

4. **Important — `MODEL.md:222` and `NAMING.md:108`, “one day” is not defined precisely enough to be a fixed boundary**

   > “対象イベントの ts より 1 日を超えて後”

   > “日次の読み〔前営業日比 Δ 等〕の粒度に整合”

   The normative text does not say whether one day means exactly 86,400,000 milliseconds, a UTC calendar-day transition, a local calendar day, or a business day. The justification invokes both “same day” and “previous business day,” which are not equivalent to elapsed 24 hours. The reference implementation uses a fixed 24-hour duration for corrections, while report day bucketing uses UTC calendar dates.

   Counterexamples:

   - Tokyo 23:30 → next day 00:30 is a different local day but only one hour.
   - Friday 18:00 → Monday 09:00 is one business-day transition but 63 hours.
   - A DST calendar day can be 23 or 25 elapsed hours.
   - Exactly 24 hours is excluded by “more than,” while 24h + 1ms is included; that boundary should be stated explicitly.

5. **Important — `MODEL.md:222`, (③a) does not define which pre-correction target value is compared**

   > “対象イベントの ts を現行の読みより過去へ動かす訂正”

   The paragraph later says ③a is evaluated against the reading “immediately before” the correction, but correction chains are latest-wins and only the final correction is applied by the reference implementation. The specification does not close how stamps are reconstructed for every appended correction when later corrections supersede earlier ones, especially after merging independently produced correction streams.

   Counterexample: target `ts=100`; correction C1 changes it to 200; C2 changes it to 150. Under sequential pre-application reading C2 is ③a. If only the per-target latest winner is applied against the base event, C2 moves 100→150 and is not ③a. The stamp depends on an unstated evaluation algorithm.

6. **Important — `MODEL.md:222`, “monotonic stamped counts” conflict with merge-order-independent replay unless stamps are persisted**

   > “いずれも記録ごとに評価されスタンプされる”

   > “①②③は追記されたスタンプ済み記録の計数ゆえ単調”

   Correction records’ declared structure is `{target id, assertion, reason, ts, actor}`; no stamp fields are included. If stamps are derived during replay, their values can change when an earlier `(ts,id)` correction arrives through a distributed-log merge. If they are permanently stamped at ingestion, that persisted fact is an additional field/tier absent from the declared structure and cannot be reconstructed from the canonical log.

   Counterexample: C2 is initially evaluated directly after the base event. Later, a merged C1 sorts before C2 and changes the pre-C2 target `ts`. C2’s ③a classification can flip. Derived classification is not immutable; ingestion-time classification is not deterministic from the merged log.

7. **Important — `MODEL.md:222`, the three forms do not actually characterize “records that produce a past-rewriting reading”**

   > “③遡及（過去を書き換える読みを生む記録——次のいずれか…)”

   The label overclaims both directions:

   - False positives: any correction issued after 24 hours is ③b even if it changes only a typo in `reason`/actor metadata and does not alter any past accounting or temporal reading.
   - False negatives: a backdated write appended 23h59m later can alter an already-issued report yet is excluded.
   - A correction can rewrite an old value without changing `ts` and be issued within 24 hours; it rewrites a prior reading but matches neither ③a nor ③b.
   - Nullifying a recent event can rewrite past EV/AC without moving its `ts`.

   The category is therefore a policy proxy based on age and timestamp direction, not an exhaustive definition of records that produce a past-rewriting reading.

8. **Important — `MODEL.md:222`, overlap counting is unspecified**

   > “次のいずれか: (③a)…(③b)…(③c)…”

   A correction may satisfy both ③a and ③b. The document calls ③ one count and says records are evaluated individually, but never explicitly states whether overlapping predicates contribute one unit or two. The “four categories” framing implies one unit per record, while the subcategory notation can be read as separately stamped forms.

   Counterexample: a correction issued ten days late moves its target `ts` five days backward. Its contribution to ③ is undefined without an explicit union/cardinality rule.

9. **Important — `PROPERTIES.md:29`, PR-DONE-LOCK’s agreed guarantee contradicts MODEL’s disclosed decompose path**

   > “黙って減る経路は存在しない”

   MODEL §2.8 and §7 item 19 explicitly say that giving a child to a completed agreed leaf removes it from the effective-leaf basis and erases its `EV_abs`/PV contribution until compensated; I4 locks frozen attributes, not leaf membership. That operation is an ordinary `decompose`, not a correction, and therefore can reduce displayed effective EV without ringing the correction meter.

   Counterexample: completed agreed leaf A contributes 5 MD. Append a legitimate decompose making A a parent. A leaves the leaf basis and its 5 MD contribution disappears, with no correction record. The newly promoted property’s plain-language statement is refuted by the canonical model.

10. **Important — `PROPERTIES.md:55`, PR-CORRECTION-METER is promoted to agreed despite contradicting the model’s explicit exception**

   > “特定の訂正を…数から除いてよいことにはしない”

   > “4 区分の計数から要素を除外するオプションを実装が持たない”

   MODEL explicitly permits unobservable-issuance formats to be omitted from ③c. Even though (③c) concerns ordinary events rather than corrections, the property also claims the unified retroactive-write warning is counted in ③. Its no-exclusion statement is stronger than the model it purports to bind.

   Counterexample: a UUID-bearing backdated event is excluded from ③c by MODEL’s rule; PR-CORRECTION-METER says the implementation has no option/path to exclude meter elements.

11. **Important — `MODEL.md:662` Japanese and `MODEL.md:665` English mirror report mutually incompatible implementation states**

   Japanese item 20 says:

   > “backend core…は追跡 issue #6 で実装済み”

   The English mirror still says:

   > “the correction tier's IMPLEMENTATION is not yet started…reference implementation…tracked by issue #6”

   These are direct opposites. The same mirror also retains stale v21 claims such as no correction tier, no sentinels, and v20 behavior. A reader using the English canonical mirror receives the wrong implementation status and compatibility assumptions.

12. **Important — `MODEL.md:662` accurately admits the implementation does not implement the newly agreed property**

   > “それまでの間、参照実装の③は③b のみを計数し、report は旧 issue #36 警告と訂正計器行を並存表示する”

   Yet `PROPERTIES.md` says promotion rests on:

   > “PBT witness 完備”

   and marks PR-CORRECTION-METER agreed, including ③c integration and no double display. A PBT witness against the cited reference implementation cannot establish that property while the implementation admittedly counts only ③b and still double-displays. At best, the witness covers the old property or a model not represented by the current reference implementation.

13. **Important — `moira/cli/src/report.ts:245–247` does not implement the new one-day definition even for its existing (③c)-like detector**

   > `const idRetroactive = appendTs !== null && appendTs > e.ts;`

   This flags any positive delay, not delays exceeding 24 hours. The MODEL openly defers synchronization, but v22’s introduction says ③b “canonizes the reference implementation’s existing predicate” and frames the one-day rule as unified. The cited report implementation’s corresponding event predicate is not the same boundary.

   Counterexample: an event stamped at 10:00 but written with claimed `ts=09:59` is flagged by report’s issue-#36 detector, while v22 ③c excludes it.

14. **Suggestion — `NAMING.md:108` preserves a contradictory “bare backfill is rejected” gloss**

   > “裸の backfill（無警告の遡及記録）は書き込み層で拒否のまま”

   The same row defines (③c) as a “legitimate backdated event write” that the write layer does not reject. The distinction appears to be “observable and metered” versus “silent,” but “bare” and “legitimate” are not structurally defined. With undecodable IDs explicitly not counted, the model admits an event that is both accepted and silent, collapsing the stated distinction.

15. **Suggestion — terminology in the promoted property remains stale**

   `NAMING.md` renames category ③ from “遡及訂正” to “遡及,” but `PROPERTIES.md` still lists:

   > “4 区分（訂正総数・施錠対象への訂正・**遡及訂正**・適用不能訂正）”

   This narrows category ③ back to corrections and obscures that ordinary events now contribute to it. The property’s opening phrase “訂正の数え方” has the same mismatch.

16. **FYI — the headline property totals appear arithmetically consistent**

   The change promotes exactly three entries from proposed to agreed, moving `49 agreed + 6 proposed` to `52 agreed + 3 proposed`, with the total remaining 55. I found no count arithmetic defect in that specific update.


## moira-adversary（Claude・opus）R1 指摘要約（2026-07-21）

全 13 件＋FORK 1 件（生レポートは会話ログ。要点のみ転記）:
A1 Critical: 「発行順識別子」「bitemporal 非導入は不変」は stamp.ts の壁時計 id 埋込＋report.ts の発行時刻復号比較で反証（実質 bitemporal）。
A2 Critical: ③c の壁時計依存は再生決定性（PR-EVENTS-ONLY・§2.10 中核規則・arbitraries.ts の Date.now 禁止）と構造的に非両立。「観測不能→計数されない」は開示でなく矛盾。
A3 Critical: ③c を「発行識別子観測のみ」で正典化すると旧 #36 検出器の signal-2（物理順走査）を落とす被覆回帰。
A4 Important: ③b の operand（訂正自身の ts）が「適用直前の読み」基準と不整合・訂正 ts 偽装で③を黙って回避可能。
A5 Critical: PROPERTIES 一文の「遡及訂正」列挙が改称後の実体を誤標識・文内不整合・同期漏れ。
A6 Important: 版ヘッダ「②③スタンプ規則不変」は③c 新基準の導入と矛盾。
A7 Important: as-of T（主張 ts 窓）と③c の happen-vs-write 乖離が未整合。
A8 Important: agreed 昇格の witness は③b のみ被覆——③a/③c 部分は空虚。
A9 Important: 「1 日」の正当化（前営業日粒度）と実装境界（壁時計 24h）が非整合。
A10 Important: §6 に v21→v22 エントリ未追記（凍結時着地要）。
A11 Important: ③a「現行の読み」vs「適用直前の読み」の語揺れ・対象単位 latest-wins との矛盾。
A12 FYI: ③c が後に③b で直されると 1 状況 2 カウント。
A13 FYI: ドラフト内の「残存 Critical/Important = 0」先行断言。
FORK: ③を単一合算カウントにするか二系共表示にするか（B5「同じ計器」の意味——人間の意図）→ HB F1。

## moira-fact-checker（sonnet）R1 結果（2026-07-21）

claim1〜4・6・8: CONFIRMED（fold.ts:35/285・report.ts 二重ブロック・stamp.ts・PBT witness と CI 配線・v0.7 件数 55=52+3・NAMING 一致）。
claim5（#6 実装コミット）: UNVERIFIABLE（当該 subagent の実行環境に git 実行手段なし）→ **著者補完証跡**: 主コンテキストが `git log origin/main` で確認済み——8ed59d5「issue #6 訂正層（第二層）・訂正計器・解除センチネル・訂正 carve-out」ほか（cffdd8b・8d9ae9a・feeecff・27ce37e が origin/main 上に存在）。
claim7: CORRECTED——§7#20 の英文ミラーが v21 の「実装未着手」のまま（codex #11 と同一指摘）→ 修正済み。

## codex 重大度写像表（R1）

ベンダー自尺度をそのまま採用（格下げ 0 件）: #1〜#3 Critical・#4〜#13 Important・#14〜#15 Suggestion・#16 FYI。

## R1 決着表（著者パッチ後）

| 指摘 | 決着 |
|---|---|
| A1 / codex#2 (Critical) | 修正——③c を観測層の検知へ再設計（HB F1=B）。「発行順識別子から観測・bitemporal 非導入は不変」の過剰主張を撤回し「正典構造に第二時刻フィールドを足さない（観測層の実装観測は矛盾しない）」へ是正 |
| A2 / codex#3 (Critical) | 修正——③c は再生決定性・as-of に不参加の観測層検知と明記。会計保証（単調・除外不可）は訂正系①②③④＋検知できた③c に限定。観測可能性を落とす回避経路は検知器の限界として明示開示 |
| A3 (Critical) | 修正——検知信号を複数形（発行識別子の復号・到着順の乱れ 等）で正典化・単一観測方法に固定しない |
| A5 / codex#15 | 修正——二系設計（HB F1=B）により「遡及訂正」は③訂正系の名として正確。PROPERTIES v0.7 変更点 3 に対応を明記（一文は HA 批准どおり据え置き） |
| A4 (Important) | 修正——③b の operand 明示＋訂正 ts 偽装の固有回避経路を明示開示（観測層の検知対象・一般 hedge に埋没させない） |
| A6 (Important) | 修正——版ヘッダを書き換え（「スタンプ規則不変」の主張を撤去） |
| A7 / codex#1 (Critical) | 修正——「歴史の読み直し」に正直開示: as-of の「知られていた最善」は訂正について・イベントは主張 ts 窓で③c 混入があり得る・可視化は③c の担い |
| A8 / codex#12 (Important) | 修正——HB F2（★維持・実装完了時解除）＋witness 被覆③b のみを PROPERTIES v0.7 変更点で明示開示 |
| A9 / codex#4 (Important) | 修正——「1 日」＝経過 24 時間超（ちょうど 24h 含まず・暦/営業日/TZ 非依存）に統一・「前営業日粒度に整合」の正当化を撤去 |
| A10 (Important) | 確定ステップで着地（§6 追記は手順上ゲート PASS 後——判定時に採点者へ明示） |
| A11 / codex#5 (Important) | 修正——「同一対象の先行する現行勝者まで適用した読み・訂正の (ts,id) 順で決定的」と明確化 |
| codex#6 (Important) | 修正——スタンプ＝保存フィールドでなく (ts,id) 順再生から決定的に再導出される評価・マージ時の再評価と単調の限定を正直開示 |
| codex#7 (Important) | 修正——「生みうる」へ hedge＋列挙は完全特徴づけを主張しない旨明記＋境界内書き換えは Δ 開示責務が引き受ける |
| codex#8 (Important) | 修正——1 記録 1 カウント・系ごと計数を明記 |
| codex#9 (Important) | **反証は再反論で UNSOUND 判定→撤回**（再反論敵対者: 一文と固定/FREE 列が R-U8 経由で名指すのは集約 EV_abs であり、§7#19(c) が経路の存在を明言・「矛盾時は MODEL が勝つ」で一文敗者）。**修正で決着**——HB F3 裁定 A: 一文を「そのノード自身の凍結額」へ限定し集計寄与の残余を一文内で正直開示（改稿文面を HB で批准・固定/FREE 列も同期） |
| codex#10 (Important) | 修正——F1=B により会計保証の係り先を訂正系と明確化（PROPERTIES v0.7 変更点 3） |
| codex#11 / fact-check claim7 (Important) | 修正——§7#20 英文ミラーを全面書き換え |
| codex#13 (Important) | 修正——§7#20 に「旧 #36 検出器の境界を v22 の 1 日規則へ整合させる」を実装工程の義務として明記 |
| codex#14 (Suggestion) | 修正——裸の backfill の定義（実績日付 < lifecycle 最終 ts）を③c 文中と NAMING に明記 |
| A12・A13・codex#16 (FYI) | 非ブロッキング・記録のみ |
| FORK（③の数え方） | HB F1 ユーザー裁定: B（二系共表示）採用 2026-07-21 |
| ★解除タイミング（HA 批准からの逸脱候補） | HB F2 ユーザー裁定: 実装完了時に解除 2026-07-21 |


## R1 追補（2026-07-21〜22）

- 反証の再反論: codex#9 への著者反証 1 件を別敵対者へ差し戻し（K=1/3）→ **UNSOUND 判定**（Critical 4・Important 2・Suggestion 1 の kill-points）。著者は反証を撤回し修正へ切替（自己の過去主張の撤回として記録）。
- HB F3: PR-DONE-LOCK 一文の締め直し（批准済み文面の修正）をユーザー裁定 A で決着——改稿文面そのものを HB で批准。
- 再反論敵対者の付随 fork（done-lock 約束の強度 A=narrow/B=専用計器新設）は F3 と同一論点であり F3 裁定 A に吸収。


## R1 採点（moira-gate-judge）: FAIL（2026-07-22）

- 生存 Critical 1 件: A5——PROPERTIES.md PR-CORRECTION-METER 一文の 4 区分列挙が旧称「遡及訂正」のまま（MODEL/NAMING は「遡及」へ改称済み）・同一文内で「③遡及」と併用の文内不整合。著者の「意味の変更なし」注記は再反論を経ていない反証として不健全（生存扱い）。
- その他: 3 Critical 系統・Important 全件は修正確認済み・FORKS 全ルーティング済み・deferred 0・写像監査 OK・意図整合 ALIGNED・fork 被覆監査 OK。

## R2 パッチ（A5 是正・2026-07-22）

- PROPERTIES.md の一文列挙を「遡及訂正」→「遡及」へ一語同期。**被覆主張**: この変更は HB 裁定 F1 の文言「③は一つの『遡及』警告面の下に訂正系(③a/③b・会計層)と追記系(③c・観測層)を系ごとに計数して共表示する」（fork-batch.md 裁定記録）が区分名「遡及」と二系構成を明示裁定しており、一文の列挙をその批准済み区分名へ同期することを実質的に決めている——著者の新たな意味判断を含まない派生同期（採点者の被覆再検証対象）。
- 変更点 3 を「据え置き」から「一語同期」へ書き換え（自己の過去主張の撤回として記録）。


## codex（独立ベンダー敵対者）R2 生指摘全文（2026-07-22）

呼び出し: `npx -y @openai/codex@latest exec --sandbox read-only`

1. **C-R2-1 — Important — `MODEL.md:219`, re-derived stamps still contradict the claimed monotone counts**

   > “スタンプは専用の保存フィールドではなく…決定的に再導出される評価”  
   > “分割ログのマージで先行訂正が後から現れれば…評価も変わりうる”  
   > “①②③の単調は同一ログ状態の時系列についての主張”

   A count derived from evaluations that may change after a merge is not monotone under append/merge—the operational history this append-only model is meant to support. “同一ログ状態の時系列” does not rescue the claim: a fixed log state has no sequence of append-induced states over which monotonicity can be tested. If it means replay prefixes of the final log, late merges explicitly violate that premise.

   Counterexample: C2 initially qualifies as ③a and contributes 1. A subsequently merged C1 sorts before C2 and moves the target so that C2 no longer moves it backward. Re-derivation changes C2’s stamp to false and the displayed ③ correction count falls from 1 to 0. The same applies to ② if an earlier merged correction changes whether the target was locked immediately before the later correction.

2. **C-R2-2 — Important — `NAMING.md:104`, the naming definition incorrectly describes observation-layer ③c as stamped, monotone accounting**

   > “①②③はスタンプ済み記録の単調計数、④のみ現在状態の述語。提示から除外不可”

   Under MODEL v22, ③ is not one homogeneous stamped accounting count. Its write system ③c is explicitly an observation-layer detector, is not replay-derived, has incomplete coverage, and can be absent when issuance time is unobservable. The NAMING row therefore preserves the old single-form semantics precisely where the new design requires two systems.

   It also conflicts with the “no single summed number” rule: saying undifferentiated “③” is a monotone stamped-record count erases the correction/write-system split. At most, this sentence can be true of ③’s correction-system component, subject to C-R2-1.

3. **C-R2-3 — Important — `PROPERTIES.md:53`, PR-CORRECTION-METER remains stronger than MODEL’s observability escape**

   > “4 区分…は常に見える形で数え”  
   > “4 区分の計数から要素を除外するオプションを実装が持たない”  
   > “遡及書き込み警告は③遡及に統合”

   MODEL says:

   > “発行時刻を観測できない記録媒体では③cは検知できず、媒体の観測可能性を落として③cを逃れる経路は残る”

   Selecting or admitting a medium/identifier format with no observable issuance time narrows the detector’s effective mouth, whether or not it is exposed as a UI setting. The property’s fixed column quantifies over “要素” without restricting it to detected elements, while the MODEL guarantee applies only to “検知できた③c.” The v0.7 changelog tries to supply that restriction in commentary, but the binding property itself does not contain it.

   Counterexample: two semantically identical events are appended 10 days late, one with a decodable issuance identifier and one using an opaque UUID. The former is counted; the latter is absent from ③. That falsifies “4区分…常に…数え” and the fixed-column no-exclusion guarantee as written.

4. **C-R2-4 — Important — `MODEL.md:219`, “no knob narrows the detector’s mouth” is incompatible with the admitted implementation-controlled observability escape**

   > “媒体の観測可能性を落として③cを逃れる経路は残る”  
   > “id 規律は書き込み層=実装の責務”  
   > “検知の口を狭める設定ノブは持たない”

   The text distinguishes a “setting knob” from implementation policy, but the resulting guarantee is not falsifiable at the user-visible boundary. An implementation can accept opaque IDs, disable arrival-order evidence, or choose a medium that exposes no issuance time; each decision narrows detector coverage exactly like a knob.

   If “knob” means only a runtime UI preference, the claim is narrowly true but misleading and insufficient to support the advertised gaming resistance. If it includes implementation configuration or accepted record formats, it is false.

5. **C-R2-5 — Important — `PROPERTIES.md:123`, the coverage table retains the broad PR-DONE-LOCK claim removed by F3**

   > “PR-DONE-LOCK（完了 EV_abs 不変）が bind”

   The revised property deliberately protects only:

   > “そのノード自身の凍結 EV_abs 額”

   and explicitly frees:

   > “完了ノードの集計への寄与”

   The coverage row collapses that distinction back to unqualified “completed EV_abs invariant.” Depending on whether `EV_abs` is read as the displayed aggregate/effective-leaf contribution, it is false under §7#19(c).

   Counterexample: give a completed agreed leaf a child. Its own frozen amount remains unchanged, but its effective-leaf EV contribution disappears. The narrowed property survives; the coverage-table gloss “完了 EV_abs 不変” does not. This is a stale post-F3 reference.

6. **C-R2-6 — Important — `PROPERTIES.md:319–322`, the v0.7 changelog directly contradicts itself about what was ratified**

   Item 1 says:

   > “一文は v0.5/v0.6 起票の文面のまま（HA 一文批准）”

   Item 4 says:

   > “PR-DONE-LOCK の一文を締めて昇格”  
   > “守る対象を『そのノード自身の凍結額』へ限定し…改稿文面を…批准”

   Both cannot be true. PR-DONE-LOCK materially changed after v0.5: the broad “黙って減る経路は存在しない” guarantee was narrowed and a rollup-contribution escape added. Item 1 consequently misstates both the provenance and the object of ratification.

7. **C-R2-7 — Important — `MODEL.md:7–8`, the header says the accounting discipline is unchanged although category ③ is no longer wholly accounting-derived**

   Japanese:

   > “4 区分構造・会計規律・裁量ノブ禁止は不変”

   English:

   > “The four-category structure, accounting discipline and no-knobs principle are unchanged.”

   But v22 moves ③c outside the accounting derivation, replay determinism, and as-of reconstruction, and limits the no-removal guarantee to detected ③c instances. That is a material qualification of the old four-category accounting discipline, not an unchanged discipline over all four categories.

   The detailed paragraph eventually narrows the guarantee, but the header summary does not. A reader relying on the version synopsis receives a stronger, homogeneous-four-category guarantee than §2.10 actually supplies.

8. **C-R2-8 — Suggestion — `NAMING.md:112`, the draft prematurely records its own Round-2 outcome**

   > “独立敵対ゲート PASS”  
   > “残存 Critical/Important = 0 のゲートを通過”

   The current file is the uncommitted draft being submitted to that gate, and the round ledger says this is Round 2. The statement is therefore unsupported at review time. It also becomes false if any finding above is accepted. The same premature assertion appears in the MODEL header (“Zero surviving Critical/Important per an independent judge”).
tokens used


## moira-adversary（Claude・opus）R2 指摘要約（2026-07-22）

B1 Important(blocking): as-of「T 後に追記された訂正は効かない」が訂正 ts 自己申告・マージ反例で自己矛盾（§219 のマージ caveat が §221 に欠落）。→ FORK: A=hedge（マージ越し enforce を主張しない正直開示）/ B=訂正への追記時刻フィールド（bitemporal-lite）。
B2 Important: R1 パッチ産の「訂正系①②③④」語衝突・③c の二重参照。／B3 Important(blocking): A5 一語同期が拘束一文の無除外主張を観測層③c へ拡幅——MODEL の被覆限界開示と矛盾・「矛盾時は MODEL が勝つ」で一文敗者（修正が note にのみ着地し規範一文に未着地）。／B4 Important: 被覆表 I4/R-S1 行の blanket「完了 EV_abs 不変」が F3 narrowing 未同期。／B5 Important: §5 bitemporal ノブ行の包括断定が③c 開示と非整合。／B6 Important: L214「ts 訂正は③に常設表示」過剰主張（同日・将来方向の反例）。／B7 Suggestion: ヘッダ「③b は既存述語の正典化」要検証。／B8 Suggestion: 「設定ノブ」と実装規律の境界定義。／B9・B10 FYI。

## R2 決着表（著者パッチ後・2026-07-22）

| 指摘 | 決着 |
|---|---|
| B1 / EN 同文 (Important) | 修正——§221(JP/EN) に「同一ログの追記履歴についての主張・マージ越しの enforce は主張しない」の正直開示を追加。**FORK は選択肢 A（hedge）で決着＝批准記録被覆**: 選択肢 B（訂正への追記時刻フィールド）は v21 正典裁定「bitemporal データモデルは導入しない」（§5 調整ノブ・§2.10 歴史の読み直し）を覆す M 変更であり、本 issue の批准意図（M-R1 は③定義の一本化に限定・受け入れ基準 1「4 区分構造…不変」）の射程外——記録が実質的に A を決めている（採点者の被覆再検証対象） |
| B2 / C-R2-2 (Important) | 修正——「会計層の計数(①②④と③の訂正系)＋検知できた③c(追記系)」へ語を統一（MODEL 本文・EN・NAMING 注記） |
| B3 / C-R2-3 (Important) | 修正——拘束一文の統合句に検知開示句を追加（「検知できたものは除外できない・被覆限界は正典の開示に従う」）・判定文列に「③の追記系は検知できたものについて」を明記。**被覆主張**: HB F1 裁定文言「追記系(③c・観測層)…検知の被覆限界(観測できない媒体では捕まえられない)を正直に開示する」（fork-batch.md F1）が本開示句を実質的に決めている（採点者の被覆再検証対象） |
| B4 / C-R2-5 (Important) | 修正——被覆表 I4 行・R-S1 行の blanket を「そのノード自身の凍結額の不変〔集計寄与は所属再編で動きうる——§7#19(c)〕」へ同期 |
| B5 (Important) | 修正——§5 bitemporal ノブ行を「訂正について」へ射程明確化（v22 で明記） |
| B6 (Important) | 修正——L214(JP/EN) を「過去へ動かす・1 日超後着の場合は③に常設表示・境界内/将来方向は Δ 開示責務が引き受ける」へ是正 |
| C-R2-1 (Important) | 修正——単調性を「①は無条件・②③訂正系は単一ログの追記履歴に限る（マージ時は再評価で減りうる）」へ限定（JP/EN/NAMING） |
| C-R2-4 (Important) | 修正——「設定ノブを持たない」＝「観測可能な記録を数えない・見せない設定が存在しない」と定義し、媒体選択の実装規律を射程外と明記（JP/EN） |
| C-R2-6 (Important) | 修正——変更点 1 の批准来歴を 3 プロパティ別に正記（自己矛盾解消） |
| C-R2-7 / B10 (Important/FYI) | 修正——版ヘッダ(JP/EN) の「会計規律不変」を係り先明示に是正・「昇格(再批准)」へ表記統一 |
| B7 (Suggestion) | 証跡提示——③b の fold 述語は fact-checker R1 claim1 で CONFIRMED（fold.ts:35 RETROACTIVE_THRESHOLD_MS=24h・fold.ts:284-285 `winner.ts - ev.ts > THRESHOLD`＝経過 24h 超・strict）。report 検出器（イベント側・任意正遅延）は③c 側の話であり、§7#20 が「1 日規則へ整合させる」を実装義務として明記済み（ヘッダ主張は③b＝fold 述語について正確） |
| B8 (Suggestion) | 修正——C-R2-4 と同一パッチ（境界の一文定義） |
| B9 / C-R2-8 / A13 系 (FYI/Suggestion) | 記録のみ——PASS 先行記載・NAMING note は確定コミット時にのみ着地する draft（v21 と同 pattern） |
