// Render smoke for the schedule-time UX additions (issues #26–#29). Mounts the
// real components over demo data with renderToStaticMarkup — no browser — to pin
// that the new controls/markup exist and don't throw. Interaction (drag-resize,
// toggling, sticky follow) is covered by manual/E2E verification; here we only
// assert the presence of the observable hooks and the opt-in rendering paths.

import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MoiraProvider } from '../../moira/store';
import { App } from '../../App';
import { ScheduleGantt } from './ScheduleGantt';
import { Inspector } from './Inspector';
import { buildGanttModel, DEFAULT_ROW_FILTER, depSegments, type GanttModel, type GanttRow } from './gantt-geometry';
import { computePlannedCost, derive, fold, orgCalendarFallback } from '../../moira/engine';
import { makeCapacityLookup } from '../../moira/capacity';
import { labelOf, resetLabelsForTests } from '../../moira/labels';
import { demoEvents, demoCapacity, DEMO_AS_OF } from '../../moira/demo-data';

const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <MoiraProvider initialEvents={demoEvents} initialCapacity={demoCapacity} initialAsOf={DEMO_AS_OF}>
      {node}
    </MoiraProvider>,
  );

// Extract the inline style of the (first) element carrying a given data-testid.
// React server-renders props in insertion order (data-testid before style), so a
// non-greedy scan up to the style attr on the same tag is stable.
const styleFor = (html: string, testid: string): string =>
  new RegExp(`data-testid="${testid}"[^>]*?style="([^"]*)"`).exec(html)?.[1] ?? '';

// Extract the (first) text node directly inside the element carrying a given
// data-testid — for the planned-metrics cells (issue #34), which render a bare
// string child with no nested markup.
const textFor = (html: string, testid: string): string =>
  new RegExp(`data-testid="${testid}"[^>]*>([^<]*)<`).exec(html)?.[1] ?? '';

beforeEach(() => resetLabelsForTests()); // demo-label fallback active (module state leaks)

describe('schedule-time UX additions', () => {
  it('#26/#28: the default surface mounts the column resizer and the axis/dep toggles', () => {
    const html = wrap(<App />);
    expect(html).toContain('data-testid="gantt-col-resizer"'); // resizable task-name column
    expect(html).toContain('data-testid="grid-weeks"');
    expect(html).toContain('data-testid="grid-days"');
    expect(html).toContain('data-testid="dep-toggle"');
    expect(html).toContain('aria-pressed="true"'); // week gridlines default ON
  });

  it('#27: the task-detail (Inspector) column is sticky so it follows vertical scroll', () => {
    const html = wrap(<App />);
    // the Inspector wrapper is the only sticky element offset from the top (the
    // header sticks at top:0); top:16px is its signature.
    expect(html).toContain('position:sticky');
    expect(html).toContain('top:16px');
  });

  it('#30/#31: the Gantt is a two-axis internal scroll box (frozen-pane container)', () => {
    const html = wrap(<App />);
    // bounding the height gives the sticky date header a vertical scroll container
    // to stick against; overflow:auto also carries the horizontal scroll for #30.
    const scroll = styleFor(html, 'gantt-scroll');
    expect(scroll).toContain('overflow:auto');
    expect(scroll).toContain('max-height:max('); // max(260px, calc(100vh - 300px))
  });

  it('#31: the date-header row sticks to the top (position:sticky; top:0)', () => {
    const html = wrap(<App />);
    // React server-renders a zero-valued offset as `top:0` (no px; px is only added
    // to non-zero numbers, e.g. the Inspector's top:16px above).
    const header = styleFor(html, 'gantt-date-header');
    expect(header).toContain('position:sticky');
    expect(header).toContain('top:0');
  });

  it('#30: the frozen corner sticks left (position:sticky; left:0) — left column stays visible', () => {
    const html = wrap(<App />);
    // the task-name/assignee column freezes on horizontal scroll; the header corner
    // is its top-left anchor (opaque bg so ticks sliding under it are covered).
    const corner = styleFor(html, 'gantt-corner');
    expect(corner).toContain('position:sticky');
    expect(corner).toContain('left:0');
    // and at least one body label cell shares the same sticky-left signature.
    expect(html).toContain('left:0');
  });

  it('#28: week gridlines are drawn by default (dashed asOf plus solid gridlines)', () => {
    const html = wrap(<App />);
    // buildAxisTicks feeds <line> gridlines into the SVG overlay; the asOf line is
    // dashed, gridlines are solid with a fractional opacity.
    expect(html).toMatch(/opacity="0\.1[28]"/); // month 0.18 / week 0.12 gridline
  });

  it('#29: predecessors are listed in the Inspector for a node with a dependency', () => {
    const projected = fold(demoEvents);
    const edge = projected.dependencyEdges.find(
      (e) => projected.nodes.has(e.from) && projected.nodes.has(e.to),
    );
    expect(edge).toBeDefined();
    const html = wrap(<Inspector node={edge!.to} onSelect={() => {}} />);
    expect(html).toContain('data-testid="field:predecessors"');
    expect(html).toContain('先行タスク');
    expect(html).toContain(labelOf(edge!.from)); // the predecessor's label is shown
  });

  it('#29: dependency connectors render only when showDeps is on', () => {
    const projected = fold(demoEvents);
    const derived = derive(demoEvents, { asOf: DEMO_AS_OF });
    const model = buildGanttModel(projected, derived, DEFAULT_ROW_FILTER);

    const off = wrap(
      <ScheduleGantt model={model} asOf={DEMO_AS_OF} selected={null} onSelect={() => {}} edges={projected.dependencyEdges} />,
    );
    expect(off).not.toContain('依存（先行→後続・破線）'); // legend hidden when off

    const on = wrap(
      <ScheduleGantt
        model={model}
        asOf={DEMO_AS_OF}
        selected={null}
        onSelect={() => {}}
        edges={projected.dependencyEdges}
        showDeps
      />,
    );
    // demo has leaf→leaf dependencies (at minimum the critical-path chain)
    const segs = depSegments(model.rows, projected.dependencyEdges, model.start, 18);
    expect(segs.length).toBeGreaterThan(0);
    expect(on).toContain('依存（先行→後続・破線）'); // legend appears
    expect(on).toContain('stroke-dasharray="4 3"'); // a finish→start connector is drawn
  });

  it('#34: the label pane renders 3 fixed planned-metrics columns (工数/開始/終了) with real values for a scheduled+agreed leaf', () => {
    const html = wrap(<App />);
    expect(textFor(html, 'gantt-col-head:cost')).toBe('工数');
    expect(textFor(html, 'gantt-col-head:start')).toBe('開始');
    expect(textFor(html, 'gantt-col-head:end')).toBe('終了');

    // req-1: agreed (frozenBudget=4), scheduled 2026-06-02, live-forecast 2026-05-25
    // (demo-data.ts + org-calendar-derated capacity) — real (non-placeholder)
    // values must render, not '—'.
    expect(textFor(html, 'gantt-col:cost:req-1')).toBe('4');
    expect(textFor(html, 'gantt-col:start:req-1')).toBe('5/20');
    expect(textFor(html, 'gantt-col:end:req-1')).toBe('5/25');
  });

  it('#34: a parent row shows the rolled-up plannedCost (Σ children, not a leaf/placeholder value) and a planned date span', () => {
    const html = wrap(<App />);
    // F1 is a root feature (demo-data.ts) — its rollup must be a real, non-'—' value.
    expect(textFor(html, 'gantt-col:cost:F1')).not.toBe('—');
    expect(textFor(html, 'gantt-col:cost:F1')).not.toBe('');
    expect(textFor(html, 'gantt-col:start:F1')).not.toBe('—');
    expect(textFor(html, 'gantt-col:end:F1')).not.toBe('—');
  });

  it('#34: an unscheduled/unestimated leaf renders the "—" placeholder, not a stray value', () => {
    const html = wrap(<App />);
    // hotfix: agreed + completed but NEVER scheduled → frozenSlot null (demo-data.ts
    // "third state" comment). No frozenSlot/predictedStart ⇒ plannedStart is null.
    expect(textFor(html, 'gantt-col:start:hotfix')).toBe('—');
  });

  // Regression (found in independent review): raising MIN_LABEL_W 140→220 (issue
  // #34) made readLabelW() DISCARD any saved width in [140,219] as "invalid",
  // silently reverting a user's resize back to DEFAULT_LABEL_W (250) instead of
  // clamping it into the new range. `vitest.config.ts` runs this suite under
  // `environment: 'node'` (no real localStorage), so the fix's try/catch around
  // `localStorage.getItem` normally always throws and falls through to the
  // default — these tests install a minimal fake `localStorage` for their
  // duration (restored after) so the saved-value branch is actually exercised.
  describe('#34 fix: a saved label width outside the raised MIN_LABEL_W is clamped, not discarded', () => {
    const withFakeLocalStorage = (saved: string, run: () => void): void => {
      const store: Record<string, string> = { 'moira.schedule.labelW': saved };
      const fake = {
        getItem: (k: string) => (k in store ? store[k] : null),
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k of Object.keys(store)) delete store[k];
        },
        key: () => null,
        length: 0,
      } as unknown as Storage;
      const hadOwn = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage');
      const original = (globalThis as { localStorage?: Storage }).localStorage;
      (globalThis as { localStorage?: Storage }).localStorage = fake;
      try {
        run();
      } finally {
        if (hadOwn) (globalThis as { localStorage?: Storage }).localStorage = original;
        else delete (globalThis as { localStorage?: Storage }).localStorage;
      }
    };

    it('a pre-issue-#34 saved width (180px, once valid) is clamped UP to the new MIN_LABEL_W (220), not reset to DEFAULT_LABEL_W (250)', () => {
      withFakeLocalStorage('180', () => {
        const html = wrap(<App />);
        const corner = styleFor(html, 'gantt-corner');
        expect(corner).toContain('width:220px');
      });
    });

    it('a saved width still inside range (300px) is kept as-is, not re-clamped', () => {
      withFakeLocalStorage('300', () => {
        const html = wrap(<App />);
        const corner = styleFor(html, 'gantt-corner');
        expect(corner).toContain('width:300px');
      });
    });

    it('no saved value at all still falls back to DEFAULT_LABEL_W (250), not MIN_LABEL_W', () => {
      withFakeLocalStorage('', () => {
        // simulate "never saved" by removing the key rather than an empty string
        (globalThis as unknown as { localStorage: Storage }).localStorage.removeItem('moira.schedule.labelW');
        const html = wrap(<App />);
        const corner = styleFor(html, 'gantt-corner');
        expect(corner).toContain('width:250px');
      });
    });
  });
});

// Label-pane date-source selector (D-81 / issue #9). The 開始／終了 columns can be
// shown as the live prediction (default), the frozen baseline only, or both
// side-by-side. Everything else — Inspector two-value display, bar drawing,
// progress filter, EVM decisions — stays put; these tests pin (a) the toggle
// exists with 3 options and the right default, (b) each mode renders the right
// column text, (c) the selection round-trips through localStorage, and (d) the
// bar layer is mode-invariant (display-layer-only change).
describe('#9 / D-81: label-pane date-source selector', () => {
  // Reproduce the store's ONE derivation exactly (store.tsx): the same
  // capacityOf = makeCapacityLookup(demoCapacity, orgCalendarFallback()) it
  // builds (org calendar defaults on), so the leveler's predicted dates here
  // match what <App/> renders — otherwise a capacity-less derive() forecasts
  // different completion dates and the predicted-mode column text diverges.
  const demoModel = (): { model: GanttModel; req1: GanttRow } => {
    const projected = fold(demoEvents);
    const capacityOf = makeCapacityLookup(demoCapacity, orgCalendarFallback());
    const derived = derive(demoEvents, { asOf: DEMO_AS_OF, capacityOf });
    const pc = computePlannedCost(projected);
    const model = buildGanttModel(projected, derived, DEFAULT_ROW_FILTER, pc);
    const req1 = model.rows.find((r) => r.node === 'req-1')!;
    return { model, req1 };
  };

  // M/D formatter mirroring ScheduleGantt.fmtShortDate (not exported); '—' for
  // null — the same em-dash the component renders for an empty slot.
  const md = (iso: string | null): string => {
    if (iso === null) return '—';
    const d = new Date(`${iso}T00:00:00Z`);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };

  const pressed = (html: string, testid: string): boolean =>
    new RegExp(`data-testid="${testid}"[^>]*aria-pressed="true"`).test(html);

  // Fake localStorage seeded with arbitrary keys for one render (restored after);
  // generic sibling of the #34 helper above.
  const withFakeStorage = (seed: Record<string, string>, run: () => void): void => {
    const store: Record<string, string> = { ...seed };
    const fake = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    } as unknown as Storage;
    const hadOwn = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage');
    const original = (globalThis as { localStorage?: Storage }).localStorage;
    (globalThis as { localStorage?: Storage }).localStorage = fake;
    try {
      run();
    } finally {
      if (hadOwn) (globalThis as { localStorage?: Storage }).localStorage = original;
      else delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  };

  const mkRow = (o: Partial<GanttRow>): GanttRow => ({
    node: 'x',
    depth: 0,
    isLeaf: true,
    label: 'X',
    lifecycle: 'ready',
    estimateState: 'proposed',
    assignee: null,
    kind: null,
    latestEstimate: null,
    frozenBudget: null,
    ownCost: 0,
    ac: 0,
    frozenSlot: null,
    predicted: null,
    completed: false,
    slotState: 'unscheduled-incomplete',
    contextOnly: false,
    nominalDurationDays: 1,
    plannedCost: null,
    plannedStart: null,
    plannedEnd: null,
    plannedStartBaseline: null,
    plannedEndBaseline: null,
    ...o,
  });
  const mkModel = (rows: GanttRow[]): GanttModel => ({ rows, start: '2026-01-01', end: '2026-02-01', totalDays: 31 });

  const gantt = (model: GanttModel, dateSource: 'predicted' | 'baseline' | 'both') =>
    wrap(<ScheduleGantt model={model} asOf={DEMO_AS_OF} selected={null} onSelect={() => {}} dateSource={dateSource} />);

  it('renders 3 options (予測／基準線／両方) with predicted as the default pressed state', () => {
    const html = wrap(<App />);
    expect(html).toContain('data-testid="date-source:predicted"');
    expect(html).toContain('data-testid="date-source:baseline"');
    expect(html).toContain('data-testid="date-source:both"');
    expect(pressed(html, 'date-source:predicted')).toBe(true); // default = current behavior
    expect(pressed(html, 'date-source:baseline')).toBe(false);
    expect(pressed(html, 'date-source:both')).toBe(false);
  });

  it('predicted mode is the current behavior: 開始/終了 show the live-forecast pair (5/20, 5/25 for req-1)', () => {
    const { model, req1 } = demoModel();
    const html = gantt(model, 'predicted');
    expect(textFor(html, 'gantt-col:start:req-1')).toBe(md(req1.plannedStart));
    expect(textFor(html, 'gantt-col:end:req-1')).toBe(md(req1.plannedEnd));
    // pin the concrete current-behavior values (same as the #34 metrics test)
    expect(textFor(html, 'gantt-col:start:req-1')).toBe('5/20');
    expect(textFor(html, 'gantt-col:end:req-1')).toBe('5/25');
  });

  it('baseline mode shows the frozenSlot-based pair and does NOT fall back to predicted', () => {
    const { model, req1 } = demoModel();
    // sanity: req-1 is the interesting leaf — a frozen baseline that DIVERGES from
    // its live forecast, so the mode switch is actually observable here.
    expect(req1.frozenSlot).not.toBeNull();
    expect(req1.plannedEndBaseline).toBe(req1.frozenSlot);
    expect(req1.plannedEnd).not.toBe(req1.frozenSlot);

    const html = gantt(model, 'baseline');
    expect(textFor(html, 'gantt-col:end:req-1')).toBe(md(req1.plannedEndBaseline));
    expect(textFor(html, 'gantt-col:start:req-1')).toBe(md(req1.plannedStartBaseline));
    // non-vacuous on BOTH columns: baseline genuinely differs from predicted-mode
    // (a blanket predicted-substitution regression would flip either column).
    expect(textFor(html, 'gantt-col:end:req-1')).not.toBe(md(req1.plannedEnd));
    expect(textFor(html, 'gantt-col:start:req-1')).not.toBe(md(req1.plannedStart));
  });

  it("baseline mode leaves an unfrozen leaf as '—' on BOTH columns (third-state preserved, no predicted代役)", () => {
    const { model } = demoModel();
    const html = gantt(model, 'baseline');
    // hotfix: agreed + completed but NEVER scheduled → frozenSlot null (demo-data)
    expect(textFor(html, 'gantt-col:start:hotfix')).toBe('—');
    expect(textFor(html, 'gantt-col:end:hotfix')).toBe('—');
  });

  it("baseline mode does NOT substitute a live prediction when the baseline is null but a prediction exists (D-81 rule 3 / EARS 14)", () => {
    // The DISCRIMINATING case the review must protect: a leaf whose baseline is
    // absent (未凍結) yet whose live forecast IS known. hotfix above is both-null,
    // so it cannot tell '—' from a fallback; THIS synthetic row can. A regression
    // like `plannedStartBaseline ?? plannedStart` would render '1/3'/'1/9' here.
    const model = mkModel([
      mkRow({ node: 'nobase', plannedStartBaseline: null, plannedStart: '2026-01-03', plannedEndBaseline: null, plannedEnd: '2026-01-09' }),
    ]);
    const html = gantt(model, 'baseline');
    expect(textFor(html, 'gantt-col:start:nobase')).toBe('—');
    expect(textFor(html, 'gantt-col:end:nobase')).toBe('—');
    // explicit non-vacuity: the '—' is NOT the (present) predicted value leaking in.
    expect(textFor(html, 'gantt-col:start:nobase')).not.toBe('1/3');
    expect(textFor(html, 'gantt-col:end:nobase')).not.toBe('1/9');
  });

  it("both mode shows the 'baseline → predicted' 2-value for a divergent leaf", () => {
    const { model, req1 } = demoModel();
    const html = gantt(model, 'both');
    expect(textFor(html, 'gantt-col:end:req-1')).toBe(`${md(req1.plannedEndBaseline)} → ${md(req1.plannedEnd)}`);
    expect(textFor(html, 'gantt-col:end:req-1')).toContain('→');
  });

  it('both mode widens the 開始/終了 columns (78px) vs the single-value modes (42px)', () => {
    const { model } = demoModel();
    expect(styleFor(gantt(model, 'predicted'), 'gantt-col-head:start')).toContain('width:42px');
    expect(styleFor(gantt(model, 'both'), 'gantt-col-head:start')).toContain('width:78px');
    expect(styleFor(gantt(model, 'both'), 'gantt-col-head:end')).toContain('width:78px');
  });

  it("both mode edge cases: equal baseline/predicted collapses to one value; a null side renders '—'; a fully-empty slot collapses to a single '—'", () => {
    const model = mkModel([
      mkRow({ node: 'eq', plannedStartBaseline: '2026-01-10', plannedStart: '2026-01-10', plannedEndBaseline: '2026-01-12', plannedEnd: '2026-01-12' }),
      mkRow({ node: 'nopred', plannedStartBaseline: '2026-01-05', plannedStart: null, plannedEndBaseline: '2026-01-07', plannedEnd: null }),
      mkRow({ node: 'nobase', plannedStartBaseline: null, plannedStart: '2026-01-03', plannedEndBaseline: null, plannedEnd: '2026-01-09' }),
      mkRow({ node: 'empty', plannedStartBaseline: null, plannedStart: null, plannedEndBaseline: null, plannedEnd: null }),
    ]);
    const html = wrap(<ScheduleGantt model={model} asOf="2026-01-08" selected={null} onSelect={() => {}} dateSource="both" />);
    expect(textFor(html, 'gantt-col:start:eq')).toBe('1/10'); // equal → single value, no arrow
    expect(textFor(html, 'gantt-col:end:eq')).toBe('1/12');
    expect(textFor(html, 'gantt-col:start:nopred')).toBe('1/5 → —'); // predicted side null
    expect(textFor(html, 'gantt-col:start:nobase')).toBe('— → 1/3'); // baseline side null
    // fully-empty slot collapses to a single '—' (not '— → —'), matching the
    // single-value modes' empty cell.
    expect(textFor(html, 'gantt-col:start:empty')).toBe('—');
    expect(textFor(html, 'gantt-col:end:empty')).toBe('—');
  });

  it('the selection is restored from localStorage on mount (baseline pressed AND baseline columns rendered)', () => {
    withFakeStorage({ 'moira.schedule.dateSource': 'baseline' }, () => {
      const html = wrap(<App />);
      expect(pressed(html, 'date-source:baseline')).toBe(true);
      const { req1 } = demoModel();
      // the columns actually reflect baseline mode, not the predicted default
      expect(textFor(html, 'gantt-col:end:req-1')).toBe(md(req1.plannedEndBaseline));
      expect(textFor(html, 'gantt-col:end:req-1')).not.toBe(md(req1.plannedEnd));
    });
  });

  it('a malformed saved value falls back to the predicted default', () => {
    withFakeStorage({ 'moira.schedule.dateSource': 'garbage' }, () => {
      const html = wrap(<App />);
      expect(pressed(html, 'date-source:predicted')).toBe(true);
      expect(pressed(html, 'date-source:baseline')).toBe(false);
    });
  });

  it('bar drawing is mode-invariant: the frozen PMB band and live EAC bar render identically in every mode', () => {
    const { model, req1 } = demoModel();
    const pmb = `基準完了日（ベースライン） ${req1.frozenSlot}`;
    const eac = `生きた予測 完了 ${req1.predicted}`;
    for (const mode of ['predicted', 'baseline', 'both'] as const) {
      const html = gantt(model, mode);
      expect(html).toContain(pmb); // frozen PMB band title unchanged across modes
      expect(html).toContain(eac); // live EAC bar title unchanged across modes
    }
  });
});
