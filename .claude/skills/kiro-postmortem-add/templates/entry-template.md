### {{ENTRY_ID}}: {{TITLE}}

Status: recorded
Entry ID: {{ENTRY_ID}}
Key: {{KEY}}
Schema: v2
Created: {{ISO_TIMESTAMP}}
Source: {{SOURCE_FLAG}}
Verdict: 障害

#### 1. 対象システム　`{{PROVENANCE}}`
{{TARGET_SYSTEM}}

#### 2. 事象　`{{PROVENANCE}}`
- **Given**: {{GIVEN}}
- **When**: {{WHEN}}
- **Then**: {{THEN}}
- **期待値**: {{EXPECTED}}
- **実際値**: {{ACTUAL}}

#### 3. 障害判定　`{{PROVENANCE}}`
障害 — 根拠: {{VERDICT_RATIONALE}}

#### 4. 変更分類　`{{PROVENANCE}}`
{{CHANGE_CLASS_LABEL}}

#### 5. 変更範囲　`{{PROVENANCE}}`
{{SCOPE_CLASSES}}

#### 6. 発生原因サマリ（専門用語なし）　`{{PROVENANCE}}`
{{PLAIN_SUMMARY}}

#### 7. 発生原因詳細（技術者向け）　`{{PROVENANCE}}`
{{TECHNICAL_DETAIL}}

#### 8. 根本要因　`{{PROVENANCE}}`
- **仕組み帰責**: {{MECHANISM_ATTRIBUTION}}
- **根本要因分類**: {{ROOT_CAUSE_CATEGORY_LABEL}}
- **要因分類**: {{CAUSE_CATEGORY_LABEL}}
- **詳細**: {{ROOT_CAUSE_DETAIL}}

#### 9. 同件調査対象　`{{PROVENANCE}}`
{{POPULATION}}

#### 10. 同件調査結果　`{{PROVENANCE}}`
{{RELATED_ENTRIES}}

#### 11. 同件の対応状況　`{{PROVENANCE}}`
{{RELATED_STATUS}}

#### 12. 再発防止策　`{{PROVENANCE}}`
{{TRY_PROPOSAL}}

#### 13. 検知すべき工程　`{{PROVENANCE}}`
{{SHOULD_DETECT_AT_LABEL}}

#### 14. 実際に検知した工程　`{{PROVENANCE}}`
{{DETECTED_AT_LABEL}}

#### 15. なぜ然るべき工程で検知できなかったか　`{{PROVENANCE}}`
{{GAP_REASON}}

#### 16. 検知するための対策　`{{PROVENANCE}}`
{{DETECTION_COUNTERMEASURE}}

<!--
Placeholder reference (for kiro-postmortem-add):

【メタ】
- ENTRY_ID: zero-padded 4-digit int, e.g. "0004" (next ID from ledger max + 1)
- KEY: repo 修飾の変更キー e.g. "moira#16"（変更に紐づかない不具合は「該当なし」）。
      無修飾の "#N" を書かない（.kiro/steering/moira-change-analysis.md §8・D-80 の適用）
- Schema: v2 固定（本テンプレートは 16 項目）。**既存の v1 entry（10 項目）は書き換えない**——
      読み取り側は v1/v2 の両方を受理し、v1 の欠落項目を unknown として集計に載せる
- TITLE: 1-line summary of 事象
- ISO_TIMESTAMP: e.g. "2026-07-25T13:45:00Z" (UTC at finalization)
- SOURCE_FLAG: "organic" (通常追記) or "analysis-intake" (要因分析フローの A0 受付から委譲)

【出所ラベル（PROVENANCE）—— 全項目に必須】
  derived   = 履歴（issue・moira/changes 台帳・git）から写した。出典パス／URL を本文に添える
  inferred  = AI が推論した。根拠（どの記述から）を本文に添える。後知恵の再構成であることを含意
  captured  = 変更管理フロー実行時に採取された一次記録（障害判定・変更分類の 2 欄のみ）
  unknown   = 埋められない。**空欄・推測での穴埋めを禁じる**——本文に "unknown" と書く

【各項目】
- TARGET_SYSTEM: **正本 R13（`rules/taxonomy-reference.md`）のラベル**から。複数可＋任意サブスコープ
      （値集合をここに列挙しない——正本の複製を作らないため）
- 2. 事象: Given/When/Then ＋ 期待値／実際値
- VERDICT_RATIONALE: 「意図した仕様・約束されたふるまいから外れた状態が実在した」根拠
      （潜在＝未発現の欠陥も障害。境界事例は障害側に倒す）
- CHANGE_CLASS_LABEL: req-change / req-add / refactor / bugfix / test-add / ops-change /
      process-improve / doc-only / other
- SCOPE_CLASSES: M/D/P/S/C/V/F（複数可・影響マップのクラス列から）
- PLAIN_SUMMARY: 専門用語なしの平易文 1〜2 文
- MECHANISM_ATTRIBUTION: **仕組み帰責を必ず一度は問う**——SKILL / steering / テンプレート /
      工程配線 / タクソノミー / 人間タッチポイント設計に穴がなかったか
- ROOT_CAUSE_DETAIL: 「なぜそのメカニズムが発動したか」。該当時は literal タグ
      [deferred-important] / [rdt-disposal] / [intent-drift] を本文に含める
      （各 steering の撤回条件が grep で数える計器。該当しなければ付けない）
- POPULATION: 走査した母集団の明示（範囲を書かない「該当なし」は認めない）
- RELATED_ENTRIES: 該当 entry ID／キーを "#0003, moira#16" 形式で列挙、または「なし」
- RELATED_STATUS: 別 issue のキー＋リンク＋state（gh issue view で機械照合）
- SHOULD_DETECT_AT_LABEL / DETECTED_AT_LABEL: 検知工程タクソノミー 1 label
      （V モデル軸: code-review / unit-test / integration-test / e2e / manual-verification /
        production / user-report ／ プロセス軸: p1-triage / p2-impact-survey / ha-ratification /
        gate-adversary / gate-judge / p5-closure / ci / post-close）
- GAP_REASON: 13 ≠ 14 の場合は非空 / 13 == 14 は「該当なし（同工程で検知）」可
- DETECTION_COUNTERMEASURE: 計器・ゲート・チェックリストのどれを足すか名指す

タクソノミーの正本は rules/taxonomy-reference.md
（.kiro/postmortem/defects.md ヘッダは要約＋正本へのポインタであり、定義の正本ではない）。
-->
