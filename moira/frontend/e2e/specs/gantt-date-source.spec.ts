// E2E VALUE-operability for the schedule-time Gantt label-pane 日付ソース
// (date-source) toggle — issue #9 / D-81.
//
// This is a freestanding UI-operability spec with NO SPEC_META, so it does not
// participate in the 計器③ coverage gate (coverage-check.test.ts only inspects
// *.meta.ts) — same posture as gantt-frozen-panes.spec.ts. It is the companion to
// schedule-leveled.spec.ts, which owns the meta-linked scenario regression:
//
//   · schedule-leveled.spec.ts (+ .meta.ts) greens the STATE-INDEPENDENT toggle
//     clauses (EARS 7 present / 11 default predicted / 12 localStorage round-trip)
//     — the ones a demo boot regresses faithfully with no scenario fixture.
//   · THIS file covers the VALUE-DEPENDENT operability the meta marks `deferred`
//     (EARS 8/9 mode values · 10 both-mode width+併記 · 13 bar/EVM invariance):
//     the impl exists and is demo-observable, but asserting units/schedule-leveled's
//     OWN §4 values (6/30, 7/3→7/5) faithfully needs the unbuilt X/Y/太郎 fixture,
//     so those stay operability-only here rather than scenario greens.
//
// Division of labour with the render tier: the branch logic (baseline vs predicted
// vs both cell text, the null-side '—' edge cases, the baseline-mode "no predicted
// fallback" rule of EARS 14) is pinned exhaustively by schedule-ui.test.tsx via
// renderToStaticMarkup. What genuinely needs a browser lives here: the value
// rendering after real click wiring (ScheduleTimeSurface → ScheduleGantt) and the
// live column-width change.
//
// The SUT boots from demo data (no fixture injected → main.tsx falls back to
// demoEvents). Grounding facts (moira/frontend/src/moira/demo-data.ts):
//   - The baseline-mode 終了 column is the frozen slot verbatim, independent of
//     the leveler forecast: oauth 6/24, audit 6/25, req-1 6/2, sso 5/20.
//   - bob is a 0.5-FTE contractor and carol is on leave, so the live forecast
//     pushes some leaves' predicted past their frozen slot → predicted ≠ baseline
//     for at least one leaf. This makes the "modes differ" and both-mode '→'
//     assertions non-vacuous.
//   - hotfix/reset have neither a frozen slot NOR a live forecast, so they read
//     '—' in BOTH modes; EARS 14's discriminating case (baseline '—' where the
//     predicted mode would otherwise fabricate a date) is not reproducible from a
//     demo boot and is covered by schedule-ui.test.tsx's synthetic row instead.
import { test, expect, type Page } from '@playwright/test';
import { navTo } from '../helpers';

/** M/D formatter matching ScheduleGantt.fmtShortDate (UTC, no leading zeros). */
const md = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

/** Every start/end label-pane cell's text, in DOM (row) order — used to prove a
 *  mode switch actually re-renders the columns, and (by equality) that the bar /
 *  EVM layer does not. */
const allColTexts = (page: Page, side: 'start' | 'end'): Promise<string[]> =>
  page.locator(`[data-testid^="gantt-col:${side}:"]`).allInnerTexts();

/** Sorted set of every drawn bar's title (frozen PMB band + live EAC bar). These
 *  are mode-INVARIANT: the bar layer never reads dateSource. */
const barTitles = async (page: Page): Promise<string[]> => {
  const pmb = await page
    .locator('div[title^="基準完了日（ベースライン）"]')
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).title).sort());
  const eac = await page
    .locator('div[title^="生きた予測 完了"]')
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).title).sort());
  return [...pmb, ...eac];
};

test.describe('schedule-time Gantt label-pane date-source toggle (issue #9 / D-81)', () => {
  // NB: EARS 7 (toggle present) / 11 (default predicted) / 12 (localStorage
  // round-trip) are the meta-linked scenario greens — they live in
  // schedule-leveled.spec.ts. This file covers the value-dependent operability the
  // meta defers. The default-predicted precondition is still exercised implicitly
  // below: each test snapshots the predicted (default) columns before switching.
  test('基準線モードは凍結スロット基準・予測モードとは値が変わる（EARS 8・9）', async ({ page }) => {
    await page.goto('/');
    await navTo(page, 'schedule-time');

    // predicted (default) snapshot
    const predStart = await allColTexts(page, 'start');
    const predEnd = await allColTexts(page, 'end');

    await page.getByTestId('date-source:baseline').click();
    await expect(page.getByTestId('date-source:baseline')).toHaveAttribute('aria-pressed', 'true');

    // baseline 終了 = frozenSlot verbatim (leveler-independent, deterministic data)
    await expect(page.getByTestId('gantt-col:end:oauth')).toHaveText(md('2026-06-24'));
    await expect(page.getByTestId('gantt-col:end:audit')).toHaveText(md('2026-06-25'));
    await expect(page.getByTestId('gantt-col:end:req-1')).toHaveText(md('2026-06-02'));
    await expect(page.getByTestId('gantt-col:end:sso')).toHaveText(md('2026-05-20'));

    // the two modes render different column values (⇒ predicted ≠ baseline for at
    // least one leaf; non-vacuous given the demo's capacity-driven divergence).
    const baseStart = await allColTexts(page, 'start');
    const baseEnd = await allColTexts(page, 'end');
    expect(baseStart.join('|')).not.toBe(predStart.join('|'));
    expect(baseEnd.join('|')).not.toBe(predEnd.join('|'));
  });

  test('両方併記モードは「基準線 → 予測」の 2 値で列幅も広がる（EARS 10）', async ({ page }) => {
    await page.goto('/');
    await navTo(page, 'schedule-time');

    const headStart = page.getByTestId('gantt-col-head:start');
    const wNarrow = (await headStart.boundingBox())!.width;

    await page.getByTestId('date-source:both').click();
    await expect(page.getByTestId('date-source:both')).toHaveAttribute('aria-pressed', 'true');

    // widened date column in both mode (DATE_COL_W_BOTH 78 vs DATE_COL_W 42)
    const wBoth = (await headStart.boundingBox())!.width;
    expect(wBoth).toBeGreaterThan(wNarrow + 20);

    // baseline side renders first, so oauth's end cell begins with its frozen slot
    // regardless of divergence.
    const oauthEnd = (await page.getByTestId('gantt-col:end:oauth').innerText()).trim();
    expect(oauthEnd.startsWith(md('2026-06-24'))).toBe(true);

    // at least one cell shows the 2-value 'baseline → predicted' join (non-vacuous
    // divergence guaranteed by the demo capacity profile).
    const ends = await allColTexts(page, 'end');
    expect(ends.some((t) => t.includes('→'))).toBe(true);
  });

  test('バー描画と EVM 表示はモードに依らず不変（EARS 13）', async ({ page }) => {
    await page.goto('/');
    await navTo(page, 'schedule-time');

    const predBars = await barTitles(page);
    const predSpi = await page.getByTestId('metric:spi').innerText();
    const predCov = await page.getByTestId('metric:schedule-coverage').innerText();
    expect(predBars.length, 'demo must draw bars for this to be non-vacuous').toBeGreaterThan(0);

    for (const m of ['baseline', 'both'] as const) {
      await page.getByTestId(`date-source:${m}`).click();
      await expect(page.getByTestId(`date-source:${m}`)).toHaveAttribute('aria-pressed', 'true');
      // bar titles (frozen PMB band + live EAC bar) unchanged
      expect(await barTitles(page)).toEqual(predBars);
      // EVM strip (SPI + schedule coverage) unchanged
      expect(await page.getByTestId('metric:spi').innerText()).toBe(predSpi);
      expect(await page.getByTestId('metric:schedule-coverage').innerText()).toBe(predCov);
    }
  });
});
