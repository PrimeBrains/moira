---
name: moira-change-analysis
description: >
  変更管理の履歴（GitHub issue ＋ `moira/changes/issue-N/` 台帳 ＋ 実差分）から、変更 1 件ごとの
  要因分析（17 項目）を起こし、横断集約して仕組み側の是正 Try に落とすオーケストレーション skill。
  「要因分析を回す」「振り返りをする」「変更履歴から要因分析」「未分析のを分析して」「定期の振り返り」
  などで起動。まず障害／非障害を受付で振り分け、障害の記録は `/kiro-postmortem-add` へ委譲する。
  規範は `.kiro/steering/moira-change-analysis.md`——本スキルは振り付けのみを所有し、規則の本文を
  複製しない。検証器（計器）ではなく事後分析であり、変更を止めない。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, Skill
argument-hint: <なし（未分析キューを算出）| キー（例 moira#16）| "since:2026-07-01" 等の絞り込み>
model: opus
metadata:
  origin: "custom"
  shared-rules: "templates/"
---

# moira-change-analysis

Turn the change-management history into structured causal analyses. **A0** intake decides, per change,
whether it was a **defect or not** — and records that verdict with its rationale, because an implicit
sort would let "judged non-defect, so never recorded" vanish without a trace. Defects are delegated to
the existing `/kiro-postmortem-add` (ledger `.kiro/postmortem/defects.md`); non-defects go to the new
`.kiro/analysis/` ledger. **Both ledgers share one field definition (17 items) and one taxonomy source
of truth**, so the cross-cutting aggregation (**A5**) can count across them.

The honest core: **7 of the 17 fields are not present in the existing inputs at all** (defect verdict,
change class, root cause, prevention, and three detection-stage fields — established by auditing all
existing ledgers under issue #19). So every field carries a **provenance label** — `derived` (copied
from history, source path required), `inferred` (AI reconstruction after the fact, rationale required),
`captured` (recorded at flow time — only two fields), `unknown` (**cannot be filled — say so; never
paper over a gap with a guess**). A human ratifies **four groups only**: defect verdict, root cause
(with mechanism attribution), prevention, and detection countermeasure.

Intake is filtered by **escape, not by detector** (D-84): a finding counts only when the stage that
*should* have caught it differs from the stage that *did* — an adversarial round catching a draft
defect is the process working, not a defect to record. Analysis never runs per close: items are queued,
and the run is proposed (never auto-started) once the queue reaches ten, a month passes, or the user asks.

> **Hard guardrails (highest priority):**
> 1. **This is not a gate.** No pass/fail verdict, no power to block a change. It is after-the-fact
>    analysis and is not part of instruments ①–⑥ (`moira-verification.md`).
> 2. **Never fabricate a field.** A field without evidence is `unknown`. An empty cell dressed up as
>    an answer is the one failure mode this skill exists to prevent.
> 3. **Never rewrite past records.** Older entries keep their original schema; readers accept both
>    `Schema: v1` (10 fields) and `v2` (17) and must not drop v1 entries as malformed.
> 4. **Never write steering directly.** Approved Tries leave through the existing exits
>    (`/kiro-steering-custom`, or an issue routed through `moira-change`).
> 5. **Never start unasked.** The AI proposes in one line; the human starts the run.

**This English file is the convention shell only. The full, normative procedure lives in
[`SKILL.ja.md`](./SKILL.ja.md)** (project language), which in turn defers to
[`.kiro/steering/moira-change-analysis.md`](../../../.kiro/steering/moira-change-analysis.md) as the
canonical rule text. To avoid a second source of truth, the procedure is NOT duplicated here — the
intake criteria (defect vs. non-defect, the escape filter), the 17 field definitions, the taxonomy
location, the triggers, and the honest limits all belong to the steering document; if they ever
disagree, steering wins.

## Boundary with existing skills

- `kiro-postmortem-add`: **invoked by** this skill to record entries judged to be defects. Owns the
  defect ledger, its append discipline, and the taxonomy source of truth. Dependency is one-way.
- `kiro-postmortem-review`: **invoked by** this skill for the cross-cutting aggregation (A5), which
  spans **both** ledgers. Owns the 4-axis aggregation, Try extraction, and the steering hand-off.
- `moira-change`: the flow whose exit (P6 close) is this flow's entrance. It also captures the two
  primary fields (defect verdict, change class) at close time. This skill never re-runs its gates.
- `kiro-steering-custom`: the only path by which an approved Try reaches `.kiro/steering/`.
