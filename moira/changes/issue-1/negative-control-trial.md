---
status: working-ledger
issue: 1
---

# 陰性対照試走記録 — issue #1（影響マップ R11・HA ②裁定「課す」の履行）

**目的**: 照合方式を裏面 ref 起点から AI 意味突合へ置換した decision-conformance-checker が、
(i) 守られている判断を ALIGNED と出し、(ii) わざと壊した見本を DRIFTED と検知することの実証。
**自己検証禁止（V 級の精神）**: checker 自身の PASS 宣言は証跡にしない——本試走記録＋独立レビュー（codex）が証跡。

## 方法

- checker は**改訂後定義**（作業ツリーの `.claude/agents/decision-conformance-checker.md`）を読み役割採用した
  sonnet ワーカー 3 体。**並列・独立・期待結果は伏せた blind 実行**。入力は改訂後契約どおり
  （ID・決めたこと一文・判定文・計器タグ・仕分け・明示 scope・正/負の別）——**裏面 ref は渡していない**（存在しない）。
- 変異見本: `moira/backend/src` を scratchpad へコピーし、D-34 違反を注入——`Actor` 型へ `skills?: string[]`・
  `proficiency?: Record<string, 1|2|3>` を追加＋スキル適格性フィルタ `skill-match.ts`（`eligibleBySkill`）を新設。
  リポジトリ本体は無改変（#39 の「注入→検知→revert」と同型だが、コピー断面方式のため revert 不要）。

## 結果（3/3 期待どおり）

| # | 対象 | サーフェス | 期待 | 実結果 | 要点 |
|---|---|---|---|---|---|
| 1 | D-34（スキル・習熟度をモデル化しない）負の照合 | 実サーフェス（backend/src・frontend/src 作業ツリー） | ALIGNED | **ALIGNED**（DRIFT 0・UNVERIFIABLE 0） | 型定義全件・導出層・割当 UI・容量 UI を探索し footprint 不在を確認。MODEL A4・既存 fidelity テスト（禁止パターン走査）を足場に採用——**裏面 ref なしで正典 clause（A4/R-U6）へ自力到達** |
| 2 | D-40（留保率を独立ノブとして持たない）負の照合 | 実サーフェス（同上） | ALIGNED | **ALIGNED**（DRIFT 0・UNVERIFIABLE 0） | 日英キーワード・型フィールド全件・導出定数・設定入力面を探索し不在確認。近傍語（landing の `slack`＝日付差）を独立ノブでないと正しく弁別 |
| 3 | D-34 同上・**変異見本** | scratchpad コピー断面（違反注入済み） | DRIFTED | **DRIFTED**（DRIFT 1） | 注入した `types.ts` の `skills`/`proficiency` と `skill-match.ts` の `eligibleBySkill` を `file:line` で特定。**未配線（どこからも呼ばれない）でも「モデル化自体が違反」と正しく判定**し、容量まわりは ALIGNED と切り分け。原因断定は鉄則どおり回避 |
| 参考 | 旧方式との対応 | — | — | — | 2026-06-27 の旧方式試走（D-34/D-40 ともに ALIGNED・出典は git 履歴の旧被覆マップ表）と同一対象で再現し、検知力の後退なしを確認 |

## 判定（codex 注記反映後の確定文）

改訂後の意味突合方式は、(i) **conformance 判定の維持**（選定 2 件が探索範囲明示つきで ALIGNED——旧方式の
2026-06-27 判定と同結果）と (ii) **この既知違反 1 件の検知**（注入した型レベル違反を、未配線でも「モデル化
自体が違反」と正しく DRIFTED 判定）を示した。**一般的な検知精度や偽陰性の不在を主張するものではない**
（1 見本の検知は「この違反を検知できた」以上を意味しない——過大主張の禁止）。R11 の postcondition
（旧試走実績 2 件の再照合＋既知違反 1 件の検知＋独立レビュー）は充足。

## codex 独立レビュー（2026-07-20・read-only・生出力は scratchpad/codex-negctl-review.txt）

**Verdict: accept-with-notes**（R11 の証跡として受理）。注記と対応:

| 重さ | 注記 | 対応 |
|---|---|---|
| Moderate | 記録に verbatim プロンプト・全文レポート・fixture ダイジェストが無く監査可能性が限定的 | 下記「付録」に 3 体の報告全文（会話ログからの転記）と fixture 差分の記述を追加。blind 統制の完全な独立検証は不能である旨を正直開示 |
| Moderate | 「偽陰性の不在の実証」は過大・「真陽性」は用語が紛らわしい | 上記判定文を縮小・修正済み |
| Low | fixture は公正だが識別子が判断文の語彙に近く「容易寄り」——最低限の陰性対照ではある | そのとおりと認める（意味的に偽装した違反・無関係判断の誤検知耐性・UNVERIFIABLE 誘発ケース等は将来の強化枠——下記） |
| Low | blind の統制が弱い（checker 定義が D-34/D-40 を例示・fixture パス名 `negctl-surface` 等の手がかり） | 正直開示として記録。期待 verdict 自体は伏せた |

**将来の強化案（codex 提案・非ブロッキング・次回⑥網羅実走時に検討）**: verbatim プロンプト保存／fixture の
ハッシュ化／無関係判断の ALIGNED 維持（誤検知耐性）／UNVERIFIABLE 誘発ケース／語彙偽装違反／配線あり・なし対／
複数 worker 反復。

## 付録: checker 報告全文（3 体・転記）

### 試走 1（D-34・実サーフェス）→ ALIGNED
- 探索: `capacity`/`skill`/`proficiency`/`competence`/`expertise`/`capability`/`requiredSkill` 等で backend/frontend 全体。
- 根拠: `types.ts:89-93`（CapacityEntry＝時間量・reason は contract|holiday|leave|temporary-reduction のみ）・
  `types.ts:18-21`（Actor にスキール欄なし）・`leveler.ts:80-192`（時間量のみで容量消費）・
  `warnings.ts:172-179`（assigneeOptions にスキルフィルタなし）・`CapacitySurface.tsx:1-27`・
  `fidelity.test.ts:25`（`skillLevel|difficulty|habituation` 禁止パターン走査＝A4）・`MODEL.md:40`（A4）。
- DRIFT_COUNT 0／UNVERIFIABLE_COUNT 0。

### 試走 2（D-40・実サーフェス）→ ALIGNED
- 探索: 留保/余裕/バッファ率/念のため・`reserveRate|bufferRate|marginRate|contingency|safetyMargin` 等＋
  `types.ts` 数値フィールド全件＋`coverage.ts`/`forecast.ts`/`landing.ts` の定数＋設定/スキーマ面（該当ファイル無し）。
- 近傍語の弁別: `landing-verdict.ts:46-53` の `slack`＝着地日と期限の日付差（D-42 整合の派生表示）であり独立ノブでない。
- DRIFT_COUNT 0／UNVERIFIABLE_COUNT 0。

### 試走 3（D-34・変異サーフェス）→ DRIFTED
- 検知: `types.ts:20-21` の `skills?: string[]`・`proficiency?: Record<string,1|2|3>`＋`skill-match.ts:1-8` の
  `eligibleBySkill`（スキルタグ一致 AND 習熟度≥2 のフィルタ）——D-34「他の選び方」欄の「スキル属性＋能力
  マッチングの自動割当（全廃済）」と型・機能ともに一致。
- 正典到達: R-U6（`MODEL.md:265-266`）を自力同定。
- 弁別: 容量まわりは ALIGNED と切り分け。`eligibleBySkill` は未配線（どこからも import されない）だが
  「判断文が禁じるのはモデル化そのもの」として DRIFTED 判定。原因断定は回避（鉄則どおり）。
- DRIFT_COUNT 1／UNVERIFIABLE_COUNT 0。

### fixture 差分（変異サーフェス＝backend/src コピーとの差）
1. `types.ts` Actor へ 2 フィールド追加（`skills?`・`proficiency?`＋能力マッチング用途を示すコメント）
2. `skill-match.ts` 新規（`eligibleBySkill` 関数・8 行）
上記以外は実サーフェスと同一。リポジトリ本体は無改変。
