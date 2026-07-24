// E2E scenario-regression for units/schedule-leveled (計器③) — the label-pane
// 日付ソース (date-source) toggle clauses introduced by issue #9 / D-81.
//
// WHY THIS SPEC BOOTS DEMO DATA (no loadFixture): units/schedule-leveled's §2/§5
// state (X/Y both assigned to 太郎 → →ready → frozenSlot) has no fixture — building
// the assign→level→freeze pipeline is out of issue #9's display-only scope (unit §7
// / issue #8 impact-map R7). So this spec greens ONLY the toggle clauses that are
// STATE-INDEPENDENT — they hold for any Gantt render, so a demo boot regresses them
// faithfully and non-vacuously:
//   · EARS 7  — the 3-way toggle (予測/基準線/両方併記) is present in the header.
//   · EARS 11 — first open with no saved preference defaults to 予測 (current behavior).
//   · EARS 12 — the choice persists to localStorage and is restored across a real reload.
// These are exactly the clauses the ratified P4-R2 E2E plan staged as xfail
// tripwires ({7,12}); with R3–R8 implemented they are promoted to green here.
//
// The value-DEPENDENT clauses (8/9/10/13/14/15 — which assert the scenario's OWN
// 6/30 / 7/3→7/5 dates or compound invariants) are marked `deferred` in the meta:
// their browser-level operability is regressed in gantt-date-source.spec.ts and
// their render/geometry logic in schedule-ui.test.tsx / gantt-geometry.test.ts, but
// faithfully asserting the §4 scenario values needs the (unbuilt) fixture.
import { test, expect } from '@playwright/test';
import { navTo } from '../helpers';
import { SPEC_META } from './schedule-leveled.meta';

test.describe(SPEC_META.scenarioUnit, () => {
  test('ヘッダに日付ソースの 3 択トグルを提供する [EARS 7]', async ({ page }) => {
    await page.goto('/');
    await navTo(page, 'schedule-time');

    for (const m of ['predicted', 'baseline', 'both'] as const) {
      await expect(page.getByTestId(`date-source:${m}`)).toBeVisible();
    }
  });

  test('初回に開くと既定は「予測」— 現行挙動を維持 [EARS 11]', async ({ page }) => {
    // Fresh Playwright context ⇒ empty localStorage ⇒ no saved preference.
    await page.goto('/');
    await navTo(page, 'schedule-time');

    await expect(page.getByTestId('date-source:predicted')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('date-source:baseline')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('date-source:both')).toHaveAttribute('aria-pressed', 'false');
  });

  test('選択は端末側に永続しリロードで復元される [EARS 12]', async ({ page }) => {
    await page.goto('/');
    await navTo(page, 'schedule-time');

    // change away from the default, then hard-reload — the choice must survive.
    await page.getByTestId('date-source:baseline').click();
    await expect(page.getByTestId('date-source:baseline')).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await navTo(page, 'schedule-time');

    // restored from localStorage (moira.schedule.dateSource); non-vacuous because a
    // no-persistence impl would revert to the default 'predicted' here.
    await expect(page.getByTestId('date-source:baseline')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('date-source:predicted')).toHaveAttribute('aria-pressed', 'false');
  });
});
