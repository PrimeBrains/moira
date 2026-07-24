---
id: units/schedule-leveled
title: 担当割当後にスケジュールが導出され、同一担当者の予定が時間軸上に並ぶ
status: agreed
language: ja
actor: 開発者
surfaces: [schedule-time]
precondition: Feature X の要件定義が太郎に割当済み・スケジュール載り済みで、Feature Y の要件定義は見積合意済みだが未割当
postcondition: Feature Y の要件定義が太郎に割当され、スケジュール上で X の後に配置され、予定完了日が凍結される
touches_specs:
  - moira-schedule
  - moira-core
  - moira-surface-schedule
touches_requirements:
  - "moira-schedule: 1.1, 1.2, 1.3, 1.5, 5.1, 9.1, 12.1, 12.2"
  - "moira-core: 3.1, 5.1, 6.1, 6.2, 6.3, 7.3"
  - "moira-surface-schedule: 2.2, 3.1, 15.2"
---

# 担当割当後にスケジュールが導出され、同一担当者の予定が時間軸上に並ぶ

> 読み方：開発者は §1〜§4 を見れば妥当性を判断できます。内部表現の正しさは moira 専門家エージェントが確認します。

## 1. このユニットで確かめること

同じ担当者（太郎）に複数の作業が割り当てられたとき、太郎の1日の稼働可能時間を超えて同日に詰め込まれず、先に入っている作業の後に新しい作業が配置されること。開発者がスケジュール画面を見て「今日は別の作業がある」と気づけること。そしてスケジュールに載った作業の予定完了日が、最初に確定する時点（着手準備が整う →ready）でベースラインとして凍結されること（担当が付いて予測に載ること自体と、その予測完了日を基準として凍結することは別の契機＝§3 注）。

## 2. 前提（Given）

別々のフィーチャー X と Y があり、どちらも要件定義の葉ノードを持つ。X の要件定義は既に太郎に割当済みで、スケジュールに載り始めている。Y の要件定義は見積合意済みだが、まだ誰にも割り当てられていない。

| ノード | 見積状態 | 見積値 | 担当 | lifecycle | 予定完了日 |
|---|---|---|---|---|---|
| X/要件定義 | agreed | 3人日 | 太郎 | ready | 2026-07-03（凍結済み） |
| Y/要件定義 | agreed | 3人日 | なし | pending | —（未スケジュール） |

スケジュール・カバレッジ：X/要件定義のみスケジュール済み。Y/要件定義は未割当バックログに表示。

太郎の日次容量：1.0人日/日（既定）。今日は 2026-07-01（X の作業が今日から入っている）。

<small>※ 順序について：X（ノード ID 例 `X/req`）と Y（`Y/req`）は同じ太郎の容量を奪い合うため、平準化で**同日に二重に積まれず逐次化**される（本ユニットの主眼）。X が先（7/1〜7/3）・Y が後（7/4〜7/6）になるのは、X が既に今日から入っている前提に加え、平準化のクリティカルパスが同点（ともに 3 日・後続なし）のとき tie-break が nodeId 昇順（`X/req` < `Y/req`）だから（[leveler.ts:104](../../../moira/backend/src/leveler.ts)）。確かめたいのは「同じ人の2作業は同日に重ならず順に並ぶ」点であって、どちらが先かの厳密規則ではない（依存辺は無い）。</small>

## 3. ふるまい（When / Then）

```
When  Feature Y の見積合意と担当割当（太郎）が完了した。
      太郎は既に別の Feature X の要件定義を今日進める予定が入っている。
Then  スケジュール画面で、太郎の予定として X と Y の作業が時間軸上に並ぶ。
And   太郎の今日は X の要件定義で埋まっているため、Y の要件定義は X の後に配置される
      （太郎の1日の稼働可能時間を超えて同日に詰め込まれない）。
And   開発者はスケジュールを見て「今日は X を進める日だから、Y の要件定義は今日始められない」
      と気づける。
And   Y の要件定義が初めてスケジュールに載った時点で、予定完了日がベースラインとして凍結される。
```

<small>注：「スケジュール画面」は schedule-time サーフェスのガントチャート（UI-DESIGN-BRIEF §3）。「稼働可能時間」は日次容量 c(i,d)、既定 1.0人日/日（MODEL A4/R-U11）。**「スケジュールに載る」と「凍結」は契機が別**：Y は担当が付いた時点（e060）で平準化に入り予測完了日を持つ（leveler は assignee の有無で判定し lifecycle に依らない）。一方ベースライン・スロットの**凍結**は、どのスケジューリングを「初回」とみなすかの選択（P0）に従い本ユニットでは →ready（e061）で行う（MODEL §3②／「どれが初回かは schedule が判定」＝moira-core 7.3）。ゆえに §4 の「割当直後」断面では Y は予測を持つが frozenSlot=null（載ってはいるが未凍結）。最終行（frozenSlot 凍結）は boundary として追加（ユーザー承認済み）。割当の write は `moira-estimate-propose`（⚠未実装）パス内の割当ステップが担い（ユニット assign-spec-provisional と同じ遷移）、→ready 遷移で frozenSlot を記録する。**日付は容量 1.0人日/日・全日稼働の例示**（週末・休暇など c=0 の暦の穴はスケジュール gap になるが本ユニットでは簡略化）。ノード ID・ts 値はユニット内ローカルの例示（他ユニットの同名 ID と同一実体を指さない）。</small>

## 4. 画面の変化（Before → After）

採用表現は **schedule-time のガントチャート＋作業詳細（Inspector）** 中心。

### schedule-time ガントチャート

採用表現は実装 `ScheduleGantt.tsx` に接地：各葉が1行で、**破線＝凍結PMB帯（基準完了日）／実線＝生きた予測（EAC）バー**を重ねて描き、両者の乖離を色で示す。本ユニットは初回スケジュール載せゆえ **基準帯＝予測バーが一致（計画通り・乖離なし）**。縦の「┊基準日」は asOf（7/1）。

<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:13px;width:100%">
  <tr style="background:#374151;color:#fff">
    <td style="padding:6px 10px;width:190px">📅 schedule-time（Before — Y 未割当）</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/1┊</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/2</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/3</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/4</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/5</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/6</td>
  </tr>
  <tr style="background:#fef3c7">
    <td colspan="7" style="padding:4px 10px;font-size:11px;color:#92400e">⚠ 未割当バックログ: Y/要件定義（3人日・担当なし → スケジュール未載り）</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">X/要件定義 <span style="background:#dbeafe;border-radius:4px;padding:1px 6px">👤 太郎</span></td>
    <td colspan="3" style="padding:6px 10px;border:1px solid #cbd5e1;text-align:center"><span style="background:#3b82f6;color:#fff;border:1px dashed #1e3a8a;border-radius:4px;padding:2px 8px;font-size:11px">基準=予測 3人日</span></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
  </tr>
</table>

<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:13px;width:100%;margin-top:10px">
  <tr style="background:#374151;color:#fff">
    <td style="padding:6px 10px;width:190px">📅 schedule-time（After — Y 割当・→ready）</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/1┊</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/2</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/3</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/4</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/5</td>
    <td style="padding:6px 10px;text-align:center;width:54px">7/6</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">X/要件定義 <span style="background:#dbeafe;border-radius:4px;padding:1px 6px">👤 太郎</span></td>
    <td colspan="3" style="padding:6px 10px;border:1px solid #cbd5e1;text-align:center"><span style="background:#3b82f6;color:#fff;border:1px dashed #1e3a8a;border-radius:4px;padding:2px 8px;font-size:11px">基準=予測 3人日</span></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">Y/要件定義 <span style="background:#dbeafe;border-radius:4px;padding:1px 6px">👤 太郎</span></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;background:#f1f5f9"></td>
    <td colspan="3" style="padding:6px 10px;border:1px solid #cbd5e1;text-align:center"><span style="background:#8b5cf6;color:#fff;border:1px dashed #4c1d95;border-radius:4px;padding:2px 8px;font-size:11px">基準=予測 3人日（新規）</span></td>
  </tr>
</table>

<small>凡例（`ScheduleGantt.tsx` 凡例に対応）：破線帯＝凍結PMB slot（基準完了日）／実線バー＝生きた予測（EAC）／橙＝遅れ（予測>凍結）／緑＝先行（予測<凍結）。本ユニットは初回スケジュール載せで乖離なしゆえ両者が一致（一本に重なって見える）。実装は各葉を1行で帯とバーを重ね描きし、担当はラベル列にアバター表示する（バー内に文字ラベルは焼かない）。</small>

### 作業詳細（Inspector）— Y/要件定義をクリック

<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:13px;width:360px;margin-top:10px">
  <tr style="background:#1e3a8a;color:#fff"><td colspan="2" style="padding:6px 10px">🔍 Inspector — Y/要件定義（割当直後）</td></tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b;width:180px">lifecycle</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1"><span style="background:#e2e8f0;border-radius:4px;padding:1px 6px">pending</span></td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">担当</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1"><span style="background:#dbeafe;border-radius:4px;padding:1px 6px">👤 太郎</span></td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">見積</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1"><span style="background:#bbf7d0;border-radius:4px;padding:1px 6px">agreed</span> 3人日</td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">基準完了日（ベースライン）</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#dc2626">—（未凍結）</td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">予測完了日（生きた予測）</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1">2026-07-06</td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">PV 計画価値</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#dc2626">0（未スケジュール → PV 不算入）</td>
  </tr>
</table>

<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:13px;width:360px;margin-top:10px">
  <tr style="background:#1e3a8a;color:#fff"><td colspan="2" style="padding:6px 10px">🔍 Inspector — Y/要件定義（→ready 後・frozenSlot 凍結）</td></tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b;width:180px">lifecycle</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1"><span style="background:#bbf7d0;border-radius:4px;padding:1px 6px">ready</span></td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">担当</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1"><span style="background:#dbeafe;border-radius:4px;padding:1px 6px">👤 太郎</span></td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">見積</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1"><span style="background:#bbf7d0;border-radius:4px;padding:1px 6px">agreed</span> 3人日</td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">基準完了日（ベースライン）</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#16a34a"><b>2026-07-06（凍結済み）</b></td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">予測完了日（生きた予測）</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1">2026-07-06</td>
  </tr>
  <tr>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#64748b">PV 計画価値</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;color:#dc2626">0（基準完了日 7/6 が今日 7/1 より後 → まだ PV 未算入。frozenSlot ≤ asOf に到達した時点で 3人日が PV へ算入）</td>
  </tr>
</table>

<small>注：frozenSlot の**凍結（記録）**と PV への**算入**は別条件。凍結は「初回スケジュール載せ」で起き、PV 算入は「frozenSlot ≤ asOf（基準完了日が今日以前）」で起きる（参照実装 `pv.ts`：`if (n.frozenSlot <= asOf) sum += n.frozenBudget`、`Inspector.tsx` の `scheduledByNow`/`taskPv`）。本ユニットの asOf=7/1・frozenSlot=7/6 では未到達ゆえ PV=0。したがって割当直後・→ready 後とも PV は 0 のままで、→ready で変わるのは「frozenSlot が null→7/6 に凍結された」ことのみ。</small>

### ラベルペイン列の日付ソース切替(新規・issue #9)

スケジュール画面のヘッダに**「日付ソース」トグル(3 択・新規)**が並ぶ——**予測**(既定・現行挙動)／**基準線**(凍結された基準完了日と、その近似の基準開始日だけを見せる)／**両方併記**(基準線と予測の 2 値を並記)。選択は端末側の記憶に残り、リロード後も復元される。**切替は表示層のラベルペイン列だけ**に効き、詳細パネル・バー描画・進捗フィルタ・EVM 表示・親(非葉)行のロールアップはいずれも変わらない——本モード切替の対象は schedule-time サーフェスのラベルペイン列のみで、他サーフェス(CLI 出力・レポート・マイルストーン画面・複数案件並置画面)は対象外。

**本ユニット After 状態でのラベルペイン列(新規)**——本ユニットは予測完了日と基準完了日が一致するケース(乖離なし)だが、**開始日側だけは 1 日ずれる**ことに注意：予測モードの開始は「実際に手が動く最初の日」(担当者の稼働可能日を消費し始める日)、基準線モードの開始は「基準完了日から名目日数を引いた月境界越え計算」——ゆえに X(基準完了日 7/3・名目 3 日)は予測開始 7/1 に対し基準開始は「7/3 − 3 日」＝**6/30**(月境界越え)、Y(基準完了日 7/6・名目 3 日)は予測開始 7/4 に対し基準開始は **7/3**：

<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:13px;width:100%;margin-top:10px">
  <tr style="background:#374151;color:#fff">
    <td style="padding:6px 10px;width:210px">📅 ラベルペイン列(新規・After 状態)</td>
    <td style="padding:6px 10px;text-align:center;width:130px">開始(予測モード)</td>
    <td style="padding:6px 10px;text-align:center;width:130px">開始(基準線モード)</td>
    <td style="padding:6px 10px;text-align:center;width:120px">終了(3 モード同一)</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">X/要件定義</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/1</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">6/30</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/3</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">Y/要件定義(→ready 後)</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/4</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/3</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/6</td>
  </tr>
</table>

**対照：乖離のある状態でのラベルペイン列**——モード差の実効はいっそう明らかになる。sister unit [schedule-rebaseline](./schedule-rebaseline.md) の Before 状態(同時点のスナップショット：Y の予測完了日 7/5・基準完了日 7/3・名目 3 日)で 3 モードを対照する：

<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:13px;width:100%;margin-top:10px">
  <tr style="background:#374151;color:#fff">
    <td style="padding:6px 10px;width:140px">モード</td>
    <td style="padding:6px 10px;text-align:center;width:110px">Y の開始</td>
    <td style="padding:6px 10px;text-align:center;width:110px">Y の終了</td>
    <td style="padding:6px 10px">意味</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">予測(既定)</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/3</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/5</td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;font-size:11.5px">生きた予測の開始日・完了日を主として出す(基準完了日はフォールバック)</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">基準線</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">6/30</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/3</td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;font-size:11.5px">基準完了日(7/3)と近似の基準開始日(7/3 − 名目 3 日 = 6/30・月境界越え)を出す</td>
  </tr>
  <tr>
    <td style="padding:6px 10px;border:1px solid #cbd5e1">両方併記</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">6/30 → 7/3</td>
    <td style="padding:4px 10px;border:1px solid #cbd5e1;text-align:right;font-family:monospace">7/3 → 7/5</td>
    <td style="padding:6px 10px;border:1px solid #cbd5e1;font-size:11.5px">「基準線 → 予測」の 2 値並記。両者一致時は 1 値のみ、片側が空なら空側は '—' で示す</td>
  </tr>
</table>

**親(非葉)行のロールアップ**——フィーチャー行など子孫を束ねる行の開始／終了は、モードに関わらず**子孫の最速／最遅**を集めて表示する(既存挙動を維持)。基準線モードで一部の子葉が基準未刻の場合、親の値は残りの子葉の範囲を反映し、未刻の子は行フィルタで拾える(親の値からは見えないが、行フィルタで基準未刻子を辿ることで隠さない)。

<small>実装接地の注(一次資料)：モード切替 UI・端末側の記憶キー・3 モード分岐・親行のロールアップ挙動はいずれも本 issue(#9)で新規実装される。近似の算術(基準完了日 − 名目日数)は既存の [`gantt-geometry.ts`](../../moira/frontend/src/surfaces/schedule/gantt-geometry.ts) `addDaysIso(frozenSlot, -nomDays)` を再利用(月境界越えの挙動は `d.setUTCDate(d.getUTCDate() + n)` に従い、7/3 − 3 日 = 6/30 になる)。バー描画層は完了・未凍結葉(PV 不算入の可視ギャップ状態・UI-DESIGN-BRIEF §3.2 状態C)にのみ「計画に載らない」帯(斜線ハッチ)を描く既存分岐に接地し、モード切替はこの分岐を変えない。乖離のある状態の借用値は sister unit `schedule-rebaseline` の Before 状態を 2026-07-21 時点でスナップショット(sister unit が改訂された場合は本ユニットの対照表も追随する)。</small>

**データ（After・素の値）**

| ノード | lifecycle | estimate | 見積値 | 担当 | 予測完了日 | 凍結スロット（frozenSlot） |
|---|---|---|---|---|---|---|
| X/要件定義 | ready | agreed | 3人日 | 太郎 | 2026-07-03 | 2026-07-03（凍結済み） |
| Y/要件定義（割当直後） | pending | agreed | 3人日 | 太郎 | 2026-07-06 | null（未凍結） |
| Y/要件定義（→ready 後） | ready | agreed | 3人日 | 太郎 | 2026-07-06 | 2026-07-06（凍結済み） |

スケジュール・カバレッジ：割当直後は X のみ凍結スロットあり → 部分的。→ready 後は X・Y とも凍結スロットあり → 上昇。
未割当バックログ：割当前 1 件 → 割当後 **0 件**。

## 5. 出力されるログ（どこに・何が）

| どこに | 何が |
|---|---|
| **プロジェクトの記録**（イベントログ：`moira/backend` のイベントストア） | transition イベントが **2 件** 追記される（下記 JSON） |
| **会話ログ**（`.kiro/conversations/{日付}-schedule-leveled.md`） | 割当判断の記録・スケジュール確認 |
| **schedule-time 画面** | ガントチャートに Y/要件定義の行が出現し、X/要件定義の後に配置される（§4） |

```json
[
  {
    "id": "e060", "ts": 60,
    "actor": { "kind": "human", "id": "dev:taro" },
    "kind": "transition",
    "node": "Y/req",
    "machine": "lifecycle",
    "to": "pending",
    "assignee": { "kind": "human", "id": "dev:taro" }
  },
  {
    "id": "e061", "ts": 61,
    "actor": { "kind": "human", "id": "dev:taro" },
    "kind": "transition",
    "node": "Y/req",
    "machine": "lifecycle",
    "to": "ready",
    "frozenSlot": "2026-07-06"
  }
]
```

<small>注：e060 は暫定割当（lifecycle 状態 = pending のまま、assignee を付帯。ユニット assign-spec-provisional と同じ遷移形式）。e061 は →ready 遷移で frozenSlot を凍結（MODEL §3②。初回のみ記録、以降の再スケジュールでは上書きされない＝fold.ts の `n.frozenSlot === null` ガード）。ノード ID・ts 値は例示。event 型は `moira/backend/src/types.ts` の `TransitionEvent` に一致する。e060 の `assignee` 付与時点で平準化（leveler）が再実行され predictedCompletion が導出される。frozenSlot の値は、→ready 発行時点の predictedCompletion を捕まえて event 属性に焼いたもの。</small>

## 6. 受け入れ条件（EARS）

- **WHEN** 作業に担当者が割り当てられたとき、**システムは** その担当者の既存の予定を考慮した上で、新しい作業がいつ着手・完了できるかをスケジュール上で導出**しなければならない**。
- **WHEN** 同じ担当者に複数の作業が割り当てられているとき、**システムは** その担当者の1日の稼働可能時間を超えて同日に作業を詰め込ま**ないようにしなければならない**。
- **WHEN** スケジュールが導出されたとき、**システムは** 各作業がいつからいつまでの予定かを時間軸上で並べて表示し、開発者が「今日はどの作業が入っているか」を一目で分かるように**しなければならない**。
- **WHEN** 作業が初めてスケジュールに載ったとき、**システムは** その時点の予測完了日を計画の基準完了日（ベースライン）として記録し、以降の予測変更で上書き**してはならない**。
- **WHILE** 担当者が割り当てられていない作業がある間、**システムは** その作業をスケジュールに載せず、「未割当」として別に表示**しなければならない**。
- **WHEN** 担当者が割り当てられていない作業について、**システムは** 計画の基準完了日を捏造**してはならない**（未凍結のまま正直に表示する）。
- **WHEN** スケジュール画面が表示されるとき、**システムは** ヘッダに「日付ソース」の 3 択トグル(予測／基準線／両方併記)を提供**しなければならない**(利用者が主として見る日付を選べる)。
- **WHEN** 開発者が日付ソースを**基準線**に切り替えたとき、**システムは** ラベルペインの「開始」列に基準完了日から名目日数を引いた近似の基準開始日を、「終了」列に基準完了日を表示し、生きた予測を当該列に出**してはならない**。
- **WHEN** 開発者が日付ソースを**予測**に切り替えたとき、**システムは** ラベルペインの「開始」列に生きた予測の開始日(基準完了日−名目日数の近似はフォールバック)を、「終了」列に生きた予測の完了日(基準完了日はフォールバック)を表示**しなければならない**。
- **WHEN** 開発者が日付ソースを**両方併記**に切り替えたとき、**システムは** 各セルに「基準線 → 予測」の 2 値を並記**しなければならない**(両者が同一日付なら 1 値のみ、片側が空なら空側は '—' で示す)。
- **WHEN** スケジュール画面を初回に開くとき、**システムは** 日付ソースの既定として「予測」を選択**しなければならない**(現行挙動を維持する)。
- **WHEN** 開発者が日付ソースを切り替えた後にページをリロードしたとき、**システムは** 直前の選択を端末側の記憶から復元**しなければならない**(記憶が使えない環境では既定「予測」にフォールバックする)。
- **WHILE** どの日付ソース(予測／基準線／両方併記)が選択されている間も、**システムは** 詳細パネル(基準完了日・予測完了日の 2 値並置)・ガントバーの色分けと稲妻線・進捗フィルタの判定基準・EVM 表示・親(非葉)行の子孫最速／最遅ロールアップを変更**してはならない**(モード切替は表示層のラベルペイン列だけに効く)。
- **WHEN** 基準線モードで基準完了日が未刻の葉を表示するとき、**システムは**「開始」「終了」列とも '—' を表示し、生きた予測を代役に埋め**てはならない**(バー領域は既存挙動のまま——完了・未凍結葉は「計画に載らない」帯を継続、他の未凍結葉は行フィルタで拾えるようにする)。
- **WHILE** 基準線モードが選択されている間、**システムは** 進捗フィルタ(「遅延中」／「順調」)の判定基準を変えて**はならない**——判定は引き続き生きた予測と基準完了日の乖離で行い、ラベルペイン列に表示される値と絞り込みの判定基準が別を指すことを利用者に委ねる。

## 7. 決定事項

<!-- 検証ループで確定した決定のみここに記す。 -->

- **frozenSlot を本シナリオに含める（ユーザー判断）:** 「スケジュールの可視性と衝突検知」に加えて、「初回スケジュール載り時に予定完了日が凍結される」ことを同一シナリオで扱う（別ユニットに切り出さない）。
- **日付ソース切替(3 モード)の断面を本ユニットに含める(2026-07-21):** 独立ユニットを新設せず、schedule-time ラベルペイン「開始／終了」列の 3 モード切替(予測／基準線／両方併記)のふるまいを本ユニットの §4 追加サブセクション・§6 追加 EARS として扱う。既存の §1〜§3 は不変。乖離状態の対照は sister unit [schedule-rebaseline](./schedule-rebaseline.md) の Before 状態を借用する。
