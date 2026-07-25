# Review Trigger Detection Rules

> `/kiro-postmortem-review` の起動トリガーを判定し、AI が能動的に起動提案を出すためのロジック。
> `/kiro-postmortem-add` 完了直後および通常会話の特定イベント時に評価する。
>
> **重要**: AI は本ルールに該当しても、ユーザー確認なしに `/kiro-postmortem-review` を自動起動しない
> (R9.3, R9.6)。提案フォーマット (本文末尾参照) で 1 行表示するのみ。
>
> **2026-07-25 改訂（issue #19・D-85）**: 旧トリガー (a) `spec-completion`（`/kiro-impl` 完了＝tasks 全 `[x]`）と
> (c) `new-spec-init`（`/kiro-spec-init` 直前）を**廃止**した——**R/D/T の使い捨て化（issue #40）により
> `.kiro/specs` は存在せず、両者は構造的に発火しない**（4 トリガーのうち 2 つが死んでいた）。
> 要因分析フロー（`.kiro/steering/moira-change-analysis.md` §6）の共通トリガーへ差し替える。

---

## 6 つのトリガー条件

> **ID の正は [`.kiro/steering/moira-change-analysis.md`](../../../../.kiro/steering/moira-change-analysis.md) §6**——
> 本ファイルは同じ ID の**判定ロジック**を持つ実装細目であり、ID・意味が食い違えば steering が勝つ。

| ID | Trigger | 検出契機 | 自動提案対象 |
|---|---|---|---|
| (a) | `queue-threshold` | **未分析キューが 10 件以上**（キューは保存せず算出——「クローズ済み issue − 両台帳に entry のあるキー」） | ✅ AI が提案 |
| (b) | `cluster-threshold` | 未レビューエントリ内で同じ `根本要因分類` ラベルまたは同じ `要因分類` ラベルが **2 件以上**に達した時点 | ✅ AI が提案 |
| (c) | `periodic` | 前回の横断集約（`.kiro/analysis/reviews/` の最新ファイル日付）から **1 か月**経過。**集約が一度も無いときは発火させない**（初回に毎回鳴るのを避ける——その局面は (a) が担う） | ✅ AI が提案 |
| (d) | `post-close` | `moira-change` P6 クローズ。**分析は走らせない**——クローズ自体が母集団入りを意味する（キューは算出値ゆえ「積む」操作は実体を持たない・正直開示） | ❌ |
| (e) | `escaped-defect` | **すり抜けギャップのある欠陥**を検出（「検知すべき工程 ≠ 実際に検知した工程」。フィルタは `moira-change-analysis` §2.1）——**その場で `.kiro/analysis/INDEX.md` の「すり抜け検出ログ」に 1 行残す**。この事象自体では起動提案しない | ❌（記録のみ） |
| (f) | `user-explicit` | ユーザーが「振り返りしたい」「レビューして」等を明示要求した時点 | ❌ AI は提案不要 (ユーザーが直接起動) |

(f) は他トリガー条件成立の有無に関わらず常に許容される。

> **(e) が起動提案の対象でない理由**: 欠陥検出のたびに「起票しますか」と割り込むと、運用ごと嫌われる。
> 検出は記録するだけにし、起動は (a)(b)(c)(f) が決める（D-84・D-85）。

---

## 判定ロジック (擬似コード)

```python
def detect_review_triggers(ledger, analysis_index, reviews_dir, closed_issues, session_context) -> list[str]:
    """
    /kiro-postmortem-add 完了直後 or AI 応答生成時に評価する。
    返り値の triggers が空でなければ AI は起動提案を出す。
    """
    triggers = []

    # (a) 未分析キューが 10 件以上（キューは保存せず毎回算出）
    #     再オープン→再クローズされたキーは、entry の analyzed-at より後の closed なら未分析として再計上する
    analyzed_keys = analysis_index.keys | {e.key for e in ledger.entries if e.key}
    queue = [i for i in closed_issues
             if qualified_key(i) not in analyzed_keys
             or i.closed_at > analyzed_at(qualified_key(i))]
    if len(queue) >= 10:
        triggers.append("queue-threshold")

    # (b) 同 根本要因分類 / 同 要因分類 が未レビューで 2 件以上
    #     v1(10 項目) entry も対象に含める——欠落項目は unknown として扱い、malformed で落とさない
    unreviewed = [e for e in ledger.entries if e.status == "recorded"]
    root_cause_counts = Counter(e.root_cause_category for e in unreviewed)
    cause_counts = Counter(e.cause_category for e in unreviewed)
    if any(c >= 2 for c in root_cause_counts.values()):
        triggers.append("cluster-threshold")
    elif any(c >= 2 for c in cause_counts.values()):
        triggers.append("cluster-threshold")

    # (c) 前回の横断集約から 1 か月経過（判定ソース = .kiro/analysis/reviews/ の最新ファイル日付）
    #     集約が一度も無い（None）ときは発火させない
    last = last_review_date(reviews_dir)
    if last is not None and months_since(last) >= 1:
        triggers.append("periodic")

    return triggers
```

---

## AI 提案フォーマット

トリガー検出時、AI は **1 行で** 以下フォーマットで提案する。複数提案を縦に並べない。

```
/kiro-postmortem-review を起動しますか？ 未分析 X 件・該当トリガー: {triggers}
```

### 具体例

```
/kiro-postmortem-review を起動しますか？ 未分析 11 件・該当トリガー: queue-threshold + cluster-threshold (assumption-error が 3 件)
```

```
/kiro-postmortem-review を起動しますか？ 未分析 4 件・該当トリガー: periodic (前回集約から 1 か月)
```

---

## ユーザー応答パターン

| ユーザー応答 | AI の振る舞い |
|---|---|
| `はい` / `yes` / `起動して` | ユーザーが `/kiro-postmortem-review` を打つまで待つ (skill は disable-model-invocation の可能性があるため AI が直接起動はしない) |
| `あとで` / `後で` / `スキップ` | AI は本セッション内で同トリガーの再提案を控える |
| (無視 / 別話題) | AI は次の自然なタイミングで再評価。連続再提案は避ける |

---

## 注意事項

- 本ルールは **提案** であり、ユーザーが最終判断する (R9.3)。
- 同トリガー条件で連続して提案するとノイズになる → セッション中 1 回提案して却下されたら、
  明確に状況が変化するまで再提案しない。
- `(f) user-explicit` はトリガーリストに含めない (ユーザーが直接起動するため AI 提案は不要)。
  `(d) post-close`・`(e) escaped-defect` も提案対象ではない（前者は母集団入りの意味しか持たず、後者は記録のみ）。
- AI は `.kiro/postmortem/defects.md`・`.kiro/analysis/INDEX.md` を Read し、`.kiro/analysis/reviews/` を `ls` してから判定する
  （頻度集計と未分析キューの算出は両台帳を読まないとできない）。
- **未分析キューをファイルに保存しない**——保存すると台帳と GitHub の実状態がずれた瞬間に嘘の件数を出す（D-85）。
