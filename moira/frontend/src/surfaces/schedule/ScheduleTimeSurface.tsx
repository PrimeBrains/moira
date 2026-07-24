// schedule-time — the "母 view". actor filter = KIND (全員/人間/エージェント);
// 「自分」is greyed (no viewpoint actor in backend, §0 #2). Unassigned backlog is
// a time-less lane (P0/R-U9). SPI is shown ONLY paired with scheduleCoverage and
// de-rated (R-S6) — never as whole-project progress.

import { useMemo, useState, type ReactNode } from 'react';
import { EVM } from '../../theme/tokens';
import { Bar, Card, Pill, SectionTitle } from '../../theme/atoms';
import { useMoira } from '../../moira/hooks';
import { labelOf } from '../../moira/labels';
import {
  assigneeOptions,
  buildGanttModel,
  DEFAULT_DATE_SOURCE_MODE,
  DEFAULT_ROW_FILTER,
  type DateSourceMode,
  type RowFilter,
} from './gantt-geometry';
import { GanttFilterBar } from './GanttFilterBar';
import { ScheduleGantt } from './ScheduleGantt';
import { Inspector } from './Inspector';
import type { NodeId } from '../../moira/engine';

type Kind = 'all' | 'human' | 'agent';

// Label-pane date-source mode persistence (D-81 / issue #9). localStorage-only
// (URL query is out of scope per the issue #9 HA boundary call). A missing or
// malformed value falls back to the default (predicted = current behavior), the
// same honest-default posture as readLabelW in ScheduleGantt — a corrupt key
// never invents a mode the user did not choose.
const DATE_SOURCE_KEY = 'moira.schedule.dateSource';
const DATE_SOURCE_MODES: readonly DateSourceMode[] = ['predicted', 'baseline', 'both'];
function isDateSourceMode(v: string | null): v is DateSourceMode {
  return v === 'predicted' || v === 'baseline' || v === 'both';
}
function readDateSource(): DateSourceMode {
  try {
    const raw = localStorage.getItem(DATE_SOURCE_KEY);
    if (isDateSourceMode(raw)) return raw;
  } catch { /* localStorage unavailable (node/test) */ }
  return DEFAULT_DATE_SOURCE_MODE;
}
function writeDateSource(m: DateSourceMode): void {
  try {
    localStorage.setItem(DATE_SOURCE_KEY, m);
  } catch { /* localStorage unavailable (node/test) */ }
}
const dateSourceLabel: Record<DateSourceMode, string> = {
  predicted: '予測',
  baseline: '基準線',
  both: '両方',
};
const dateSourceTitle: Record<DateSourceMode, string> = {
  predicted: '生きた予測を主に表示（既定・現行挙動）',
  baseline: '基準線（凍結された基準完了日と近似の基準開始日）だけを表示。未凍結の葉は「—」',
  both: '「基準線 → 予測」の 2 値を並記',
};

export function ScheduleTimeSurface() {
  const { projected, derived, asOf, criticalPath, plannedCost } = useMoira();
  const [filter, setFilter] = useState<RowFilter>(DEFAULT_ROW_FILTER);
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [showWeeks, setShowWeeks] = useState(true); // issue #28 — week gridlines (default on)
  const [showDays, setShowDays] = useState(false); // issue #28 — day gridlines (default off)
  const [showDeps, setShowDeps] = useState(false); // issue #29 — dependency lines (default off)
  // Label-pane 開始／終了 column date source (D-81 / issue #9). Restored from
  // localStorage (default 'predicted' = current behavior); persisted on change.
  const [dateSource, setDateSource] = useState<DateSourceMode>(readDateSource);
  const changeDateSource = (m: DateSourceMode): void => {
    setDateSource(m);
    writeDateSource(m);
  };

  const model = useMemo(
    () => buildGanttModel(projected, derived, filter, plannedCost),
    [projected, derived, filter, plannedCost],
  );
  const options = useMemo(() => assigneeOptions(projected), [projected]);

  // P7 dependency longest chain (issue #16) — a read-only projection of the
  // store's criticalPath. A single node is not a chain: highlight only when the
  // path actually crosses a dependency edge (≥ 2 nodes).
  const cpSet = useMemo<ReadonlySet<NodeId>>(
    () => (criticalPath.path.length >= 2 ? new Set(criticalPath.path) : new Set()),
    [criticalPath],
  );

  const spi = derived.spi;
  const cov = derived.scheduleCoverage;

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16 }}>
      <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* actor kind filter + de-rate strip */}
        <Card pad={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: EVM.ink3 }}>キュー</span>
              {(['all', 'human', 'agent'] as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter({ ...filter, kind: k })}
                  data-testid={`queue-filter:${k}`}
                  style={{
                    fontSize: 11.5,
                    border: `1px solid ${filter.kind === k ? EVM.brandDeep : EVM.rule}`,
                    background: filter.kind === k ? EVM.brandSoft : EVM.paperWarm,
                    color: filter.kind === k ? EVM.brandDeep : EVM.ink2,
                    borderRadius: 999,
                    padding: '3px 11px',
                    cursor: 'pointer',
                    fontWeight: filter.kind === k ? 600 : 400,
                  }}
                >
                  {k === 'all' ? '全員' : k === 'human' ? '人間（レビュー/作業）' : 'エージェント'}
                </button>
              ))}
              <span
                title="現在のユーザー情報が未設定のため使用できません"
                style={{ fontSize: 11.5, border: `1px dashed ${EVM.rule}`, background: EVM.ruleSoft, color: EVM.ink4, borderRadius: 999, padding: '3px 11px', cursor: 'not-allowed' }}
              >
                自分（backend拡張待ち）
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, minWidth: 280 }}>
              <span data-testid="metric:spi" className="mono" style={{ fontSize: 13, color: spi === null ? EVM.na : EVM.ink }}>
                SPI {spi === null ? '算出不能' : spi.toFixed(2)}
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: EVM.ink3 }}>
                  <span>スケジュールカバレッジ</span>
                  <span data-testid="metric:schedule-coverage" className="mono">{(cov * 100).toFixed(0)}%</span>
                </div>
                <Bar value={cov} tone="brand" derate={cov < 0.999} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: EVM.ink3, marginTop: 6 }}>
            SPI＝スケジュール済み領域内の進捗率（全体進捗ではない）。カバレッジが低いときは斜線の注意表示。
          </div>
          {/* row filter (担当 / 完了 / 進捗) — issue #8 */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${EVM.ruleSoft}` }}>
            <GanttFilterBar filter={filter} onChange={setFilter} options={options} />
          </div>
        </Card>

        {/* unassigned backlog lane */}
        <Card pad={12}>
          <SectionTitle hint={<Pill tone="warn">P0 可視ギャップ</Pill>}>未割当バックログ（時間軸を持たない）</SectionTitle>
          {derived.unassignedBacklog.length === 0 ? (
            <div style={{ fontSize: 12, color: EVM.ink3 }}>未割当の agreed ノードはありません。</div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {derived.unassignedBacklog.map((id) => (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  data-testid={`backlog-item:${id}`}
                  style={{ fontSize: 11.5, border: `1px solid ${EVM.rule}`, background: EVM.paperWarm, color: EVM.ink2, borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}
                >
                  {labelOf(id)}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* gantt */}
        <Card pad={10}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <SectionTitle hint="凍結ベースライン(PMB) ＋ 生きた予測(EAC)">Gantt</SectionTitle>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* date-source selector (D-81 / issue #9) — chooses what the label
                  pane's 開始／終了 columns show; display-layer only (Inspector,
                  bar drawing, progress filter, EVM all unchanged). */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: EVM.ink3 }}>日付ソース</span>
                {DATE_SOURCE_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => changeDateSource(m)}
                    data-testid={`date-source:${m}`}
                    aria-pressed={dateSource === m}
                    title={dateSourceTitle[m]}
                    style={{
                      fontSize: 11.5,
                      border: `1px solid ${dateSource === m ? EVM.brandDeep : EVM.rule}`,
                      background: dateSource === m ? EVM.brandSoft : EVM.paperWarm,
                      color: dateSource === m ? EVM.brandDeep : EVM.ink2,
                      borderRadius: 999,
                      padding: '3px 11px',
                      cursor: 'pointer',
                      fontWeight: dateSource === m ? 600 : 400,
                    }}
                  >
                    {dateSourceLabel[m]}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: EVM.ink3 }}>表示</span>
                <GanttToggle testid="grid-weeks" on={showWeeks} onClick={() => setShowWeeks((v) => !v)}>
                  週境界
                </GanttToggle>
                <GanttToggle testid="grid-days" on={showDays} onClick={() => setShowDays((v) => !v)}>
                  日境界
                </GanttToggle>
                <GanttToggle testid="dep-toggle" on={showDeps} onClick={() => setShowDeps((v) => !v)}>
                  依存線
                </GanttToggle>
              </div>
            </div>
          </div>
          {model.rows.length === 0 ? (
            <div data-testid="filter-empty" style={{ fontSize: 12, color: EVM.ink3, padding: '18px 6px' }}>
              条件に合う行がありません。
            </div>
          ) : (
            <ScheduleGantt
              model={model}
              asOf={asOf}
              selected={selected}
              onSelect={setSelected}
              cpSet={cpSet}
              edges={projected.dependencyEdges}
              showWeeks={showWeeks}
              showDays={showDays}
              showDeps={showDeps}
              dateSource={dateSource}
            />
          )}
        </Card>
      </div>

      {/* task detail — sticky so it follows vertical scroll of a long Gantt (issue #27) */}
      <div
        style={{
          position: 'sticky',
          top: 16,
          alignSelf: 'flex-start',
          flex: '0 0 auto',
          maxHeight: 'calc(100vh - 96px)',
          overflowY: 'auto',
        }}
      >
        <Inspector node={selected} onSelect={setSelected} />
      </div>
    </div>
  );
}

/** Small on/off pill for the Gantt display toggles (issues #28/#29). */
function GanttToggle({
  children,
  on,
  onClick,
  testid,
}: {
  children: ReactNode;
  on: boolean;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      aria-pressed={on}
      style={{
        fontSize: 11,
        border: `1px solid ${on ? EVM.brandDeep : EVM.rule}`,
        background: on ? EVM.brandSoft : EVM.paperWarm,
        color: on ? EVM.brandDeep : EVM.ink2,
        borderRadius: 999,
        padding: '3px 10px',
        cursor: 'pointer',
        fontWeight: on ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}
