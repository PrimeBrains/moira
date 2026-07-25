<!--
  分析票（非障害）テンプレート。`.kiro/analysis/entries/<repo>-<番号>.md` として保存。
  規範: .kiro/steering/moira-change-analysis.md §3（17 項目）・§4（出所ラベル）・§5（タクソノミー）
  {{...}} を実値に置換する。

  【最重要】各項目の見出し行末に必ず出所ラベルを付ける:
    `derived`（履歴から写した・出典パス必須）／`inferred`（AI 推論・根拠必須）／
    `captured`（フロー実行時の一次記録）／`unknown`（埋められない）
  根拠を示せない欄は本文を空にせず **`unknown` と書く**。空欄での穴埋め・推測の断定は禁止。

  障害と判定された件は本テンプレートを使わず /kiro-postmortem-add へ委譲する（steering §9）。
-->
---
key: {{REPO}}#{{NUMBER}}
schema: v2
status: {{STATUS}}          # drafted | ratified | aggregated
analyzed-at: {{ISO8601}}
verdict: {{障害|非障害}}
---

# 要因分析 — {{REPO}}#{{NUMBER}}　{{TITLE}}

## 証跡（sources）

<!-- A1 で集めた出典を全列挙。以後の各欄の `derived`/`inferred` はここを指す。 -->

- issue: {{ISSUE_URL}}
- コメント: {{COMMENT_URLS}}
- 台帳: {{LEDGER_PATHS}}
- 敵対ラウンド記録: {{GATE_ROUND_RECORDS_PATH_OR_なし}}
- 差分: {{GIT_RANGE}} / {{CHANGED_PATHS}}

---

## 1. 対象システム　`{{PROVENANCE}}`

{{backend | frontend | cli | adapter | process}}（複数可）＋サブスコープ
出典: {{SOURCE}}

## 2. 事象　`{{PROVENANCE}}`

- **Given**: {{GIVEN}}
- **When**: {{WHEN}}
- **Then**: {{THEN}}
- **期待値**: {{EXPECTED}}
- **実際値**: {{ACTUAL}}

<!-- 非障害では「Then＝変更後にこうなる」を書く。期待値/実際値が意味をなさない変更では unknown。 -->

## 3. 障害判定　`{{PROVENANCE}}`

**{{障害|非障害}}** — 根拠: {{RATIONALE}}

<!-- steering §2 の基準。潜在（未発現）欠陥も障害。境界事例は障害側に倒す。
     HX で人間が判定を覆した場合は、覆した履歴もここに残す。 -->

## 4. 変更分類　`{{PROVENANCE}}`

`{{req-change | req-add | refactor | bugfix | test-add | ops-change | process-improve | doc-only | other}}`

## 5. 変更範囲　`{{PROVENANCE}}`

{{M|D|P|S|C|V|F}}（複数可）　出典: {{IMPACT_MAP_PATH}} のクラス列

## 6. 発生原因サマリ（専門用語なし）　`{{PROVENANCE}}`

{{PLAIN_SUMMARY}}

## 7. 発生原因詳細（技術者向け）　`{{PROVENANCE}}`

{{TECHNICAL_DETAIL}}
出典: {{SOURCE_PATHS}}

## 8. 根本要因　`{{PROVENANCE}}`

- **仕組み帰責（必須で一度は問う）**: SKILL／steering／テンプレート／工程配線／タクソノミー／
  人間タッチポイント設計に穴がなかったか → {{MECHANISM_ATTRIBUTION}}
- **根本要因分類**: `{{LABEL}}`（正本: `.claude/skills/kiro-postmortem-add/rules/taxonomy-reference.md`）
- **詳細**: {{WHY_IT_FIRED}}

<!-- 該当する場合のみ literal タグを本文に含める（他機構の撤回条件が grep で数える計器）:
     [deferred-important] / [rdt-disposal] / [intent-drift] -->

## 9. 同件調査対象　`{{PROVENANCE}}`

走査した母集団: {{POPULATION}}
<!-- 範囲を書かない「該当なし」は認めない。 -->

## 10. 同件調査結果　`{{PROVENANCE}}`

{{有無}}: {{KEYS}}
<!-- 意味検索であり網羅性は保証しない（steering §0-4）。 -->

## 11. 同件の対応状況　`{{PROVENANCE}}`

{{KEY}} {{URL}} — state: {{OPEN|CLOSED}}（`gh issue view` で機械照合）

## 12. 再発防止策　`{{PROVENANCE}}`

- {{TRY}}（出口: {{steering | skill | テンプレート | 計器}} の {{名指し}}）

## 13. 検知すべき工程　`{{PROVENANCE}}`

`{{LABEL}}`

## 14. 実際に検知した工程　`{{PROVENANCE}}`

`{{LABEL}}`　出典: {{GATE_ROUND_RECORDS_OR_INFERENCE}}

## 15. なぜ然るべき工程で検知できなかったか　`{{PROVENANCE}}`

{{REASON}}
<!-- 13≠14 なら必須。13=14 なら「同工程で検知」。 -->

## 16. 検知するための対策　`{{PROVENANCE}}`

{{DETECTION_COUNTERMEASURE}}（計器・ゲート・チェックリストのどれを足すか名指す）

---

## 出所の集計

| ラベル | 欄数 |
|---|---|
| `derived` | {{N}} |
| `inferred` | {{N}} |
| `captured` | {{N}} |
| `unknown` | {{N}} |

**`unknown` の欄**: {{列挙・隠さない}}
