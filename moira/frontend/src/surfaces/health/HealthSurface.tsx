// health — two zones (R-S5/R-C2): 現行進捗 vs 累積稼得. EV% is always paired with
// estimateCoverage; SPI with scheduleCoverage (de-rated). null SPI/CPI are shown
// "算出不能", never potted to 1.0/0. Trend is a single asOf point (valid-time c
// blocker, §0 #3). The landing burnup (issue #13) replaced the CCPM fever
// placeholder — fever itself stays future work (CCPM not in canon, §0 #4).

import { EVM } from '../../theme/tokens';
import { Bar, Card, Pill, SectionTitle, SummaryStat } from '../../theme/atoms';
import { useDerived } from '../../moira/hooks';
import { LandingChart } from './LandingChart';

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
const idx = (v: number | null) => (v === null ? '算出不能' : v.toFixed(2));
const signed = (v: number) => (v > 0 ? `+${v.toFixed(0)}` : v.toFixed(0));
const varTone = (v: number): 'crit' | 'ok' | 'neutral' =>
  v < 0 ? 'crit' : v > 0 ? 'ok' : 'neutral';

export function HealthSurface() {
  const d = useDerived();
  const covLow = d.estimateCoverage < 0.999;
  const schedLow = d.scheduleCoverage < 0.999;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
      {/* zone 1 — current progress */}
      <Card>
        <SectionTitle hint="現行の有効集合（置き換え/中止を除外）">現行進捗</SectionTitle>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SummaryStat label="EV%" value={pct(d.evPercent, 1)} tone="brand" big sub={`見積カバレッジ ${pct(d.estimateCoverage)}`} testid="metric:ev-percent" />
            <div style={{ width: 150 }}>
              <Bar value={d.estimateCoverage} tone="brand" derate={covLow} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SummaryStat label="SPI" value={idx(d.spi)} sub={`スケジュールカバレッジ ${pct(d.scheduleCoverage)}`} testid="metric:spi" />
            <div style={{ width: 150 }}>
              <Bar value={d.scheduleCoverage} tone="ok" derate={schedLow} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SummaryStat label="実行中 (仕掛)" value={pct(d.executionCoverage, 0)} tone="warn" sub="完了前の作業中タスクの割合（EV%には未計上）" testid="metric:execution-coverage" />
            <div style={{ width: 150 }}>
              <Bar value={d.executionCoverage} tone="warn" />
            </div>
          </div>
          <SummaryStat label="CPI" value={idx(d.cpi)} testid="metric:cpi" />
          <SummaryStat label="EV_abs (MD)" value={d.evAbs.toFixed(0)} testid="metric:ev-abs" />
          <SummaryStat label="PV (MD)" value={d.pv.toFixed(0)} testid="metric:pv" />
          <SummaryStat label="AC (MD)" value={d.ac.toFixed(0)} testid="metric:ac" />
          <SummaryStat label="SV (MD)" value={signed(d.evAbs - d.pv)} tone={varTone(d.evAbs - d.pv)} />
          <SummaryStat label="CV (MD)" value={signed(d.evAbs - d.ac)} tone={varTone(d.evAbs - d.ac)} />
        </div>
        <div style={{ fontSize: 10.5, color: EVM.ink3, marginTop: 8 }}>
          EV%↔見積カバレッジ／SPI↔スケジュールカバレッジを常に対表示。見積/スケジュールが未整備の部分は斜線で注意表示。
          SPI＝スケジュール済み領域内の進捗率（全体進捗ではない）。SPI/CPI は PV/AC=0 のとき「算出不能」（潰さない）。
          SV＝EV−PV／CV＝EV−AC は提示恒等式（正典指標ではない）。SV はスケジュール済み領域のみを覆うため
          スケジュールカバレッジと対で読む（SPI と同規律）。CV は仕掛コストで悲観側に振れる（CPI と同性質）。
          実行中（仕掛）＝合意済みのうち作業中ノードの割合。完了主義の EV% が落とす執行中領域を示す
          <b>仕掛中の量であって出来高ではない</b>——EV% と足して全体進捗にはしない（次元が異なる）。実際の前進は
          Gantt の予測完了の乖離・タスクの経過で読む。
        </div>
      </Card>

      {/* zone 2 — cumulative earned */}
      <Card style={{ background: EVM.paperWarm }}>
        <SectionTitle hint="置き換え込み・中止（サンクコスト）除外">累積稼得（履歴）</SectionTitle>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
          <SummaryStat label="累積 EV_abs (MD)" value={d.cumulativeEvAbs.toFixed(0)} tone="neutral" />
          <SummaryStat label="現行 EV_abs (MD)" value={d.evAbs.toFixed(0)} tone="neutral" />
          <div style={{ alignSelf: 'center', fontSize: 11, color: EVM.ink3, maxWidth: 360 }}>
            差分 {(d.cumulativeEvAbs - d.evAbs).toFixed(0)} MD は置き換えられた旧ノードの稼得（働いた事実は残す）。
            サンク（cancelled）は backend が除外（別系列は拡張依存）。
          </div>
        </div>
      </Card>

      {/* zone 3 — correction meter (v21 §2.10 (d)・PR-CORRECTION-METER・issue #6)
          「常設 4 区分」— presentation may fold/mute, but count exclusion is
          not permitted (裁量ノブなし). Rendered even when all zero — an all-zero
          display is honest information ("no corrections have been applied"). */}
      <Card>
        <SectionTitle hint="第二層の追記専用訂正記録（§2.10）——数え方に裁量ノブを持たせない">
          訂正計器
        </SectionTitle>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
          <SummaryStat
            label="訂正総数"
            value={d.correctionMeter.total.toFixed(0)}
            tone="neutral"
            testid="metric:correction-total"
          />
          <SummaryStat
            label="施錠対象への訂正"
            value={d.correctionMeter.locked.toFixed(0)}
            tone={d.correctionMeter.locked > 0 ? 'warn' : 'neutral'}
            sub="完了区域のノードを対象とする訂正（I4 v21「黙っては変わらない」）"
            testid="metric:correction-locked"
          />
          <SummaryStat
            label="遡及訂正"
            value={d.correctionMeter.retroactive.toFixed(0)}
            tone={d.correctionMeter.retroactive > 0 ? 'warn' : 'neutral'}
            sub="対象イベントより 1 日以上後に発行された訂正"
            testid="metric:correction-retro"
          />
          <SummaryStat
            label="適用不能訂正"
            value={d.correctionMeter.inapplicable.toFixed(0)}
            tone={d.correctionMeter.inapplicable > 0 ? 'crit' : 'neutral'}
            sub="対象イベントの型と噛み合わない・対象が存在しない等"
            testid="metric:correction-inapplicable"
          />
        </div>
        <div style={{ fontSize: 10.5, color: EVM.ink3, marginTop: 8 }}>
          §2.10（普遍訂正原則）の第二層記録は追記専用・理由必須・元イベント id 名指し。
          <b>4 区分は常設</b>で、UI で畳む/沈めるは可でも、特定の訂正を計数から除外するオプションは持たない
          （PR-CORRECTION-METER）。①②③は単調計数（適用直前の読みでスタンプ）、④のみ現在状態述語。
          遡及書き込み警告（旧 issue #36）は本計器の③遡及に統合予定（配線は今後）。
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {/* SPI/CPI trend (blocked → single point) */}
        <Card style={{ flex: '1 1 320px' }}>
          <SectionTitle hint={<Pill tone="na">推移表示は今後対応（過去時点の再計算機能待ち）</Pill>}>SPI / CPI 推移</SectionTitle>
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
            <SummaryStat label={`SPI @ ${d.asOf}`} value={idx(d.spi)} />
            <SummaryStat label={`CPI @ ${d.asOf}`} value={idx(d.cpi)} />
          </div>
          <div style={{ fontSize: 10.5, color: EVM.ink3, marginTop: 8 }}>
            単一 asOf の実点のみ表示。過去時点の実測値が取得できるようになり次第、実測点を直線でつないで表示します。
            推定で曲線は描きません。
          </div>
        </Card>

        {/* Landing burnup (issue #13) — replaced the CCPM fever placeholder */}
        <LandingChart />
      </div>
    </div>
  );
}
