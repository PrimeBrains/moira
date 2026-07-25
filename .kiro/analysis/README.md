# 変更要因分析 台帳（`.kiro/analysis/`）

**非障害**と判定された変更 1 件ごとの要因分析（16 項目）を置く。**障害**と判定された件は
[`.kiro/postmortem/defects.md`](../postmortem/defects.md) 側に記録される——振り分けは受付（A0）が行い、
**判定と根拠は必ず分析票の項目 3 に残る**（暗黙の振り分けを禁じる）。

- **規範（正）**: [`.kiro/steering/moira-change-analysis.md`](../steering/moira-change-analysis.md)
- **振り付け**: [`.claude/skills/moira-change-analysis/`](../../.claude/skills/moira-change-analysis/)
- **設計判断**: `moira/DECISIONS-CATALOG.md` D-82〜D-86　**来歴**: `moira/plans/2026-07-25-change-analysis-dfd.md`

## 構造

| パス | 内容 |
|---|---|
| `INDEX.md` | 分析済みキーの索引（**障害・非障害の両方**を 1 行ずつ載せる——横断集約の入口を 1 か所にするため。**書き手は `moira-change-analysis`**——障害の本体を書く `/kiro-postmortem-add` は本ディレクトリを触らない）＋**すり抜け検出ログ** |
| `entries/<repo>-<番号>.md` | 非障害の分析票 本体（1 件 1 ファイル） |
| `reviews/<YYYY-MM-DD>.md` | 横断集約（4 軸頻度・クラスタ・Try 候補と裁定）の結果。**初回の集約時に作成される**（現時点では未作成） |

様式は [`.claude/skills/moira-change-analysis/templates/`](../../.claude/skills/moira-change-analysis/templates/) の
テンプレートに従う。

## キー規約

キーは **`<repo>#<番号>`**（例 `moira#16`）。**無修飾の `#N` を書かない**——`moira/changes/issue-39/42/43` は
旧リポ `PrimeBrains/sdd-workshop` の番号であり、本リポの同番号と衝突する。これは新しい規約ではなく
**D-80（移管前文書中の `#N` は旧リポ番号を指す）の本台帳への適用**であり、D-80 の「本文は書き換えない」に従って
**既存文書の `#N` を遡及修飾しない**（修飾義務は本台帳が新規に書くキーにのみ及ぶ）。

## 読むときの注意（この台帳の正直枠）

1. **各欄には出所ラベルが付いている。** `derived`（履歴から写した）／`inferred`（**AI が事後に再構成した**）／
   `captured`（変更時に採取した一次記録）／`unknown`（埋められなかった）。
   **`inferred` は「当時そう判断した記録」ではない**——後知恵の再構成である。
2. **`unknown` は欠損ではなく記録である。** ただし「履歴に無い項目＝`unknown`」ではない——履歴に無い 7 項目は、
   **根拠を示せる限り `inferred`（後知恵の再構成）で埋まる**。`unknown` になるのは**根拠そのものを示せないとき**だけで、
   件によっては 0 件になる（実際、初回実走 `entries/moira-9.md` は `unknown` 0）。
   **空欄を埋めるための推測を禁じている**結果として現れるのが `unknown` であり、多いほど誠実でも少ないほど手抜きでもない。
3. **同件調査の網羅性は保証しない。** 抽出は意味検索であり、見落としは残る。
4. **本台帳は検証器ではない。** ここに書かれた分析が変更を止めることはなく、計器①〜⑥にも含まれない。

## 未分析キューについて

**保存しない。** 「クローズ済み issue − 両台帳に entry のあるキー」で**毎回算出する**——保存すると
台帳と現実（GitHub 側の issue 状態）がずれた瞬間に嘘の件数を出すため（D-85）。
したがって本ディレクトリに「未分析一覧」ファイルは存在しない。

## 正典性

本台帳の entry は「**その分析を行った時点の判断の記録**」として残る（記録としての正典）。
ただし**運用規範そのもの**（工程・判定基準・項目定義・トリガ）の唯一の正典は
[`.kiro/steering/moira-change-analysis.md`](../steering/moira-change-analysis.md) であり、
本ディレクトリと個々の entry は規範に従って**生成される作業成果物**である。
規範と食い違えば steering が勝つ。**過去の entry は遡って書き換えない**（D-86）。
