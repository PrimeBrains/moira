---
status: working-ledger
issue: 5
---

# fork バッチ — issue #5

## HB バッチ #1（2026-07-21・P4 doc-refine 敵対レビュー後）

| ID | 種別 | 対象行 | 平易文の争点 | 選択肢 | 裁定結果 | 日付 |
|---|---|---|---|---|---|---|
| F1 | genuine-fork | R1（moira/README.md） | doc-adversary Important #8: `moira/README.md` L110-141 のセットアップ手順に **pre-existing の pwd 遷移矛盾**がある。L112 で `cd moira/moira` した後、L119-123 で `cd backend / cd ../frontend`（pwd = `<clone>/moira/moira/frontend`）。ところが L137-141 の「1度だけ(本リポ内): backend/frontend をビルド → CLI を npm link」の `cd moira/backend` は git 根 `<clone>/moira/` を暗黙前提とし、上記 pwd では実行不能（L159・L174 も同種）。R1 改稿でファイル本文を触ったが、pwd 遷移矛盾自体は sdd-workshop 時代からの pre-existing bug。**本 issue の射程（sdd-workshop 依存記述解消）に含めるか、別 issue へ deferred するか** | (i) 本 issue で修正（pwd 復元コマンドを明示する最小補筆）／(ii) 新規 issue を起票して deferred | **(i) 本 issue で修正**（2026-07-21 HB 裁定）——L138 直前に「本リポの git 根 `<clone>/moira/` から実行」を明示する pwd 復元コマンドを最小補筆で追加した | 2026-07-21 |

## fork の経緯（監査用・H5 で読む義務なし）

- F1 は doc-adversary の敵対レビュー（Important #8）で検出。pre-existing bug は本 issue の scope
  外だが、R1 でファイル本文を触った以上「触ったのに直さない」判断は敵対者の攻撃角にかかる。
  ゆえに HB へ諮る。
- 他の doc-adversary 指摘（Important #1〜#6・Suggestion #7/#9-11・FYI #12）は以下いずれかで
  解消済み、または pending mechanical:
  - **#1・#6**: P2 差し戻し → 影響マップに R23（root README）／R24（moira-adapter-gen SKILL.md）／
    R25（moira-evm-digest SKILL.ja.md）を追加し改稿済み
  - **#2** (§3 URL/path 政策の scope 逸脱): HISTORICAL-REFERENCES.md §3 を削除して受け入れ基準 (a)
    の scope 内へ収縮（HA 批准 reject 事項 (z)「配置先を複数文書に分散させ SoT を作らない」の系にも整合）
  - **#3** (§2 対応表の SoT 二重化): §2 の表を削除し「移管記録が保持する」の 1 行参照に置換
  - **#4** (10 行程度目安の逸脱): HISTORICAL-REFERENCES.md 全体を §1 1 節に短縮（本体 8 行）
  - **#5** (D-80 state=proposed): `agreed` に昇格（受け入れ基準 (d) 直接充足・D-78 と対称）
  - **#7** (impact-map R5 grep-hit 列矛盾): R5 の grep-hit 列に「L192 sdd-workshop/issues/5 は D-80
    来歴保持で張り替え対象外」の注記を追加
  - **#9** (関連文書欠落): HISTORICAL-REFERENCES.md §4 を含む全体を短縮で解消（§4 自体を削除）
  - **#10** (D-80 決めたことに frontmatter 例外欠落): D-80 決めたこと末尾に一文追加
  - **#11** (cli/README `moira/` 二義): pwd 記述を「git 根から実行」へ精密化
  - **#12** (境界日曖昧): hedge 済みのまま留置

- doc-fact-checker 主張 7 (未マップ差分 `.moira-adapter.json`): 影響マップに R26 として追加、
  「`moira adapter install` の副産物として自動更新される managed metadata」と明示。
