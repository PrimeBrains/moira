---
key: moira#10
schema: v2
status: aggregated
analyzed-at: 2026-07-25
verdict: 非障害
---

# 要因分析 — moira#10　変更管理フローの起点で worktree を切る運用の正典化

> 本 entry は **issue #21（初回バックフィル 13 本）**の一部である。過去分ゆえ大半の欄は
> **後知恵の再構成（`inferred`）**であり、「当時そう判断した記録」ではない。

## 証跡（sources）

- issue: https://github.com/PrimeBrains/moira/issues/10 （closed 2026-07-21T07:55:31Z）
- コメント: P1 triage（2026-07-21T07:08:46Z）／P3 HA（07:14:33Z）／P4→P6 クローズ（07:55:31Z）
- 台帳: `moira/changes/issue-10/{request,impact-map,intent-ratification,gate-round-records,closure-report}.md`
- 敵対ラウンド記録: `moira/changes/issue-10/gate-round-records.md`（doc-adversary Important 6 件・全修正）
- 差分: `a811ca9`（base = worktree 分岐点 `8a93f57`・main へ ff）

---

## 1. 対象システム　`derived`

`process`（`.kiro/steering/moira-change-management.md`・`.claude/skills/moira-change/SKILL.md`・
`SKILL.ja.md`・`.claude/skills/moira-change/templates/request.template.md`・`.gitignore`）
出典: `moira/changes/issue-10/impact-map.md` の波及先パス列（R1〜R5）。

## 2. 事象　`inferred`（素材は `derived`）

- **Given**: 変更管理フローは `diff(base..HEAD)` が「そのフローの作業そのもの」であることを前提に
  P5 の未マップ差分検査を行う。しかし複数セッションが**同一チェックアウトの作業ツリー・index を共有**していた。
- **When**: `moira#7` のフローを回している最中、別 issue（`moira#6`）の作業が自分の index に staged で
  紛れ込み、照合中に別セッションが `feeecff` としてコミット＋push したため **HEAD/base が動いた**
  （`8eb1b6f`→`df99c48`→`feeecff`）。
- **Then**（変更後）: full-flow は P1 で fresh な `origin/main` から issue 専用 worktree を切り、
  その分岐点を base とする運用が規範化された（軽量 exit は worktree 不要）。P6 で main 直マージ→push→
  クローズ→worktree 撤去。
- **期待値**: 他 issue の staged 作業が混ざらず、`base..HEAD` が当該フローの作業と一致すること。
- **実際値**: 期待どおり——**本 issue 自身を worktree で回してドッグフーディング**し、
  base（分岐点 `8a93f57`）が照合中に一切動かないことを実地確認した。

出典: issue #10 本文「背景（issue #7 で顕在化した事故）」・P6 クローズコメント。

## 3. 障害判定　`inferred` → HX 確定

**非障害** — 根拠: 当時の規範は**作業の隔離を約束していなかった**（`.kiro/steering/moira-change-management.md`
に §7「作業の隔離」は存在せず、base は受付時 commit と定義されていた）。base 再アンカーは
規範の枠内で許された運用であり、`moira#7` の閉包も PASS で成立している。
すなわち「約束されたふるまいから外れた状態」は無く、**約束そのものが薄かった**。

**境界事例としての読み（HX 確認対象）**: issue 本文は「今回は事故に至らなかったが、構造的に危うい」と
述べており、`moira/PROPERTIES.md` のような自己除外に入らないファイルが混入すれば **P5 未マップ差分検査が
壊れる**——これを「潜在欠陥（未発現）＝障害」と読む余地はある（steering §2 は潜在欠陥も障害に含める）。
本 entry が非障害を採るのは、**壊れうるのは規範が守ると宣言していない性質**だからである。
**この読みは割れうる。**

## 4. 変更分類　`inferred`

`process-improve`（開発プロセス側——規範 steering・skill・テンプレート・`.gitignore` の改善）

## 5. 変更範囲　`derived`

**F**（規範 steering・skill 2 本・テンプレート・`.gitignore`。全 5 行とも F 級 → doc-refine）
出典: `moira/changes/issue-10/impact-map.md` クラス列（F×5）・P3 HA コメント「すべて F 級」。

## 6. 発生原因サマリ（専門用語なし）　`inferred`

**一つの机の上で複数人が同時に別々の書類仕事をしていた。**自分の書類の束に他人の書類が紛れ込み、
「どこからどこまでが自分の仕事か」を数える作業が狂いかけた。そこで**仕事ごとに机を分ける**ことにした。
以前のやり方が「同じ机で作業してよい」と明記していたわけではなく、**分けるべきだと誰も書いていなかった**。

## 7. 発生原因詳細（技術者向け）　`inferred`（素材は `derived`）

P5 同期閉包は `diff(base..HEAD) − mapped == ∅` の検査に依存する。この等式は「base..HEAD が当該フローの
作業と一致する」ことを前提とするが、同一チェックアウトを複数セッションが共有すると (i) 他 issue の
staged 変更が index に載る (ii) 照合中に HEAD が進む (iii) 未コミットの他 issue 実装が作業ツリーに現れる、
の 3 経路で前提が崩れる。`moira/changes/**` の自己除外はこの汚染を吸収しない。
是正は `git worktree` によるプロセス分離——1 worktree = 1 書き手を前提に index を隔離し、
分岐点を base に固定する。**main への並行 push レースは解決しない**（正直開示として規範に明記）。
出典: issue #10 本文「提案」「正直な限界」・P6 クローズコメント R1〜R5。

## 8. 根本要因　`inferred` → HX 確定

- **仕組み帰責**: **規範（変更管理フロー DFD）が、自身の閉包判定が依拠する前提——「base..HEAD は
  このフローの作業と一致する」——を明文化していなかった。** 明文化されていない前提は敵対レビューの
  的にもならず、並行実行という現実的条件下で成り立つかを誰も問わなかった。
  **判定式は書かれていたが、その健全性条件が書かれていない**という様式の穴である。
- **根本要因分類**（Why 軸）: `state-management-gap`（セッション間で作業ツリー／index の状態が
  共有・混線するパターンを設計時に想定していなかった——R14 の定義に合致）
- **要因分類**（What 軸）: `design-error`（欠陥が宿るのは変更管理フローの設計。要件でも実装でもない）
- **詳細**: 単一セッション前提で設計された工程が、実際には複数セッション（複数エージェント）で回された。
  **前提の変化は誰の担当でもなかった**——issue #7 の運用者が違和感として拾い、会話ベースの依頼として
  正規化されて本 issue になった。この「運用者の違和感」に依存する検出は再現性を持たない。

<!-- 撤回条件タグ: 該当なし。 -->

## 9. 同件調査対象　`derived`

走査した母集団: (i) `.kiro/analysis/entries/`（`moira-9.md`＋本バックフィル 13 本）
(ii) `.kiro/postmortem/defects.md`（#0001・`Schema: v1`）(iii) 本リポのクローズ済み issue 14 本と
対応する `moira/changes/issue-*/` 台帳。旧リポ由来の `issue-39/42/43` は対象外（D-80）。

## 10. 同件調査結果　`inferred`（意味検索・網羅性は保証しない）

**あり（2 件）**:

1. **`moira#16`** — 同 issue に **2 セッションが並行して変更管理フローを走らせ**、一方の実装が
   ユーザー裁定で破棄された（issue #16 コメント 2026-07-24T14:48:15Z）。worktree による作業隔離は
   成立していたが、**同じ issue を 2 人が同時に取ることは防げていない**——本件の是正の射程外で
   同型の並行性問題が再発している。
2. **`moira#13`** — `MOIRA_DIR` 継承によるテスト隔離漏れ。「実行環境の状態が別の実行に漏れる」という
   **状態隔離の失敗**という点で根本要因分類（`state-management-gap`）を共有する。

## 11. 同件の対応状況　`derived`

- `moira#16` — https://github.com/PrimeBrains/moira/issues/16 — state: **CLOSED**（2026-07-24。
  並行フローの後始末はコメントに記録され、重複実装は破棄で決着）
- `moira#13` — https://github.com/PrimeBrains/moira/issues/13 — state: **CLOSED**（2026-07-21）
出典: `gh issue list --repo PrimeBrains/moira --state all`（2026-07-25 実行）。

## 12. 再発防止策　`inferred` → HX 確定

1. **判定式を持つ規範には「その式が成り立つ前提」を併記する規律を足す**——閉包判定・被覆判定など
   数式めいた判定を書くとき、健全性条件（何が保たれていれば正しいか）を同じ節に書く。
   出口: `.kiro/steering/moira-change-management.md`（§5 閉包規則）／`doc-refine` の攻撃角チェックリスト
   （`.claude/skills/doc-refine/adversarial-vectors.md` に「判定式の健全性条件」項目を追加）。
   **根拠: 項目 8 の仕組み帰責。**
2. **同一 issue の重複着手を防ぐ運用を決める**——worktree は作業ツリーを隔離するが、
   **担当の排他**は与えない（`moira#16` で実際に重複実装が発生し破棄された）。
   出口: `.kiro/steering/moira-change-management.md` §7（作業の隔離）の追補、または issue の assign 運用。
   **根拠: 項目 10-1 の実在。**

## 13. 検知すべき工程　`inferred`

`gate-adversary`——変更管理フロー規範（`moira-change-management.md`）を確定した `doc-refine` の
敵対レビュー。「この判定式は並行セッション下でも成り立つか」は敵対者が問うべき典型的な攻撃角である。
根拠: 本件の是正自体が同じ `doc-refine` ゲートで Important 6 件を出して通っている
（＝この問いを立てられる工程であることの実証）。

## 14. 実際に検知した工程　`derived`

`p5-closure`——`moira#7` の P5 同期閉包の照合中に、index 混入と HEAD/base の移動として顕在化した。
出典: issue #10 本文「背景（issue #7 で顕在化した事故）」。

## 15. なぜ然るべき工程で検知できなかったか　`inferred` → HX 確定

規範の敵対レビューは**書かれている主張**を攻撃対象にする。本件で欠けていたのは
**書かれていない前提**（base..HEAD の健全性条件）であり、書かれていないものは攻撃の的にならない。
加えて、規範を確定した時点では並行セッション運用が常態ではなかったため、
「複数の書き手が同時に回す」という条件自体が想定に入っていなかった（項目 8）。

## 16. 検知するための対策　`inferred` → HX 確定

**チェックリストを足す**（計器・ゲートの新設は不要）: `doc-refine` の攻撃角チェックリスト
（`.claude/skills/doc-refine/adversarial-vectors.md`）に
「**この文書の判定式・保証は、複数の書き手が同時に作業する条件下でも成り立つか**」を 1 項目加える。
既存の敵対ゲート内で問える範囲であり、新しい検証器は要らない。

---

## 出所の集計

| ラベル | 欄数 |
|---|---|
| `derived` | 5（項目 1・5・9・11・14） |
| `inferred` | 11（項目 2・3・4・6・7・8・10・12・13・15・16） |
| `captured` | **0**——本件のクローズ（2026-07-21）は一次採取 2 欄の導入（issue #19・2026-07-25）より前 |
| `unknown` | 0 |

**`unknown` の欄**: なし。
