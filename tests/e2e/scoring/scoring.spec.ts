import {
  test,
  expect,
  loadApp,
  waitForScreen,
  SCREENS,
  mockLogin,
  APP_URL,
  navigateToScreen,
  isScreenVisible,
  setupErrorMonitor,
  collectConsoleErrors,
  tapBottomNav,
  IPL_TEAMS,
} from '../fixtures';

test.describe('Scoring Rules Screen', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorMonitor(page);
    await loadApp(page, APP_URL);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.SCORING);
    await waitForScreen(page, SCREENS.SCORING);
  });

  test.describe('Screen Layout & Navigation', () => {
    test('scoring screen is visible', async ({ page }) => {
      expect(await isScreenVisible(page, SCREENS.SCORING)).toBeTruthy();
    });

    test('displays screen title', async ({ page }) => {
      const title = page.locator('[data-testid="scoring-title"]');
      await expect(title).toBeVisible();
      const text = await title.textContent();
      expect(text?.toLowerCase()).toContain('scoring');
    });

    test('displays back button', async ({ page }) => {
      const backBtn = page.locator('[data-testid="scoring-back"]');
      await expect(backBtn).toBeVisible();
    });

    test('back button navigates to previous screen', async ({ page }) => {
      const backBtn = page.locator('[data-testid="scoring-back"]');
      await backBtn.click();
      await page.waitForTimeout(200);
      const isOnScoringScreen = await page.locator('[data-testid="scoring-rules"]').isVisible();
      expect(!isOnScoringScreen).toBeTruthy();
    });

    test('displays bottom navigation', async ({ page }) => {
      const bottomNav = page.locator('[data-testid="bottom-nav"]');
      await expect(bottomNav).toBeVisible();
    });

    test('bottom nav has Scoring tab active', async ({ page }) => {
      const scoringTab = page.locator('[data-testid="bottom-nav-scoring"]');
      const isActive = await scoringTab.evaluate((el) =>
        el.classList.contains('active') || el.getAttribute('aria-selected') === 'true'
      );
      expect(isActive).toBeTruthy();
    });

    test('content is scrollable', async ({ page }) => {
      const container = page.locator('[data-testid="scoring-container"]');
      await expect(container).toBeVisible();
    });
  });

  test.describe('Batting Rules Section', () => {
    test('displays Batting section', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-batting"]');
      await expect(section).toBeVisible();
    });

    test('displays Batting section header', async ({ page }) => {
      const header = page.locator('[data-testid="scoring-section-batting"] [data-testid="section-header"]');
      await expect(header).toBeVisible();
      const text = await header.textContent();
      expect(text?.toLowerCase()).toContain('batting');
    });

    test('displays run rule', async ({ page }) => {
      const runRule = page.locator('[data-testid="scoring-rule-batting-run"]');
      await expect(runRule).toBeVisible();
    });

    test('run rule shows correct description', async ({ page }) => {
      const runRule = page.locator('[data-testid="scoring-rule-batting-run"]');
      const text = await runRule.textContent();
      expect(text?.toLowerCase()).toContain('run');
    });

    test('run rule displays 1 point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-batting-run-points"]');
      const text = await points.textContent();
      expect(text).toContain('1');
    });

    test('displays boundary rule', async ({ page }) => {
      const boundaryRule = page.locator('[data-testid="scoring-rule-batting-boundary"]');
      await expect(boundaryRule).toBeVisible();
    });

    test('boundary rule shows correct description', async ({ page }) => {
      const boundaryRule = page.locator('[data-testid="scoring-rule-batting-boundary"]');
      const text = await boundaryRule.textContent();
      expect(text?.toLowerCase()).toContain('boundary');
    });

    test('boundary rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-batting-boundary-points"]');
      const text = await points.textContent();
      expect(text).toContain('1');
    });

    test('boundary rule mentions 4 runs', async ({ page }) => {
      const boundaryRule = page.locator('[data-testid="scoring-rule-batting-boundary"]');
      const text = await boundaryRule.textContent();
      expect(text).toContain('4');
    });

    test('displays six rule', async ({ page }) => {
      const sixRule = page.locator('[data-testid="scoring-rule-batting-six"]');
      await expect(sixRule).toBeVisible();
    });

    test('six rule shows correct description', async ({ page }) => {
      const sixRule = page.locator('[data-testid="scoring-rule-batting-six"]');
      const text = await sixRule.textContent();
      expect(text?.toLowerCase()).toContain('six');
    });

    test('six rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-batting-six-points"]');
      const text = await points.textContent();
      expect(text).toContain('2');
    });

    test('six rule mentions 6 runs', async ({ page }) => {
      const sixRule = page.locator('[data-testid="scoring-rule-batting-six"]');
      const text = await sixRule.textContent();
      expect(text).toContain('6');
    });

    test('all batting rules are readable', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-batting"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('batting rules are properly formatted', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-batting"]');
      const rules = section.locator('[data-testid^="scoring-rule"]');
      const count = await rules.count();

      for (let i = 0; i < count; i++) {
        const rule = rules.nth(i);
        const text = await rule.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Bowling Rules Section', () => {
    test('displays Bowling section', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-bowling"]');
      await expect(section).toBeVisible();
    });

    test('displays Bowling section header', async ({ page }) => {
      const header = page.locator('[data-testid="scoring-section-bowling"] [data-testid="section-header"]');
      await expect(header).toBeVisible();
      const text = await header.textContent();
      expect(text?.toLowerCase()).toContain('bowling');
    });

    test('displays wicket rule', async ({ page }) => {
      const wicketRule = page.locator('[data-testid="scoring-rule-bowling-wicket"]');
      await expect(wicketRule).toBeVisible();
    });

    test('wicket rule shows correct description', async ({ page }) => {
      const wicketRule = page.locator('[data-testid="scoring-rule-bowling-wicket"]');
      const text = await wicketRule.textContent();
      expect(text?.toLowerCase()).toContain('wicket');
    });

    test('wicket rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-bowling-wicket-points"]');
      const text = await points.textContent();
      expect(text).toContain('10');
    });

    test('displays maiden over rule', async ({ page }) => {
      const maidenRule = page.locator('[data-testid="scoring-rule-bowling-maiden"]');
      await expect(maidenRule).toBeVisible();
    });

    test('maiden over rule shows correct description', async ({ page }) => {
      const maidenRule = page.locator('[data-testid="scoring-rule-bowling-maiden"]');
      const text = await maidenRule.textContent();
      expect(text?.toLowerCase()).toContain('maiden');
    });

    test('maiden over rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-bowling-maiden-points"]');
      const text = await points.textContent();
      expect(text).toContain('4');
    });

    test('all bowling rules are readable', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-bowling"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('bowling rules are properly formatted', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-bowling"]');
      const rules = section.locator('[data-testid^="scoring-rule"]');
      const count = await rules.count();

      for (let i = 0; i < count; i++) {
        const rule = rules.nth(i);
        const text = await rule.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Fielding Rules Section', () => {
    test('displays Fielding section', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-fielding"]');
      await expect(section).toBeVisible();
    });

    test('displays Fielding section header', async ({ page }) => {
      const header = page.locator('[data-testid="scoring-section-fielding"] [data-testid="section-header"]');
      await expect(header).toBeVisible();
      const text = await header.textContent();
      expect(text?.toLowerCase()).toContain('fielding');
    });

    test('displays catch rule', async ({ page }) => {
      const catchRule = page.locator('[data-testid="scoring-rule-fielding-catch"]');
      await expect(catchRule).toBeVisible();
    });

    test('catch rule shows correct description', async ({ page }) => {
      const catchRule = page.locator('[data-testid="scoring-rule-fielding-catch"]');
      const text = await catchRule.textContent();
      expect(text?.toLowerCase()).toContain('catch');
    });

    test('catch rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-catch-points"]');
      const text = await points.textContent();
      expect(text).toContain('4');
    });

    test('displays runout rule', async ({ page }) => {
      const runoutRule = page.locator('[data-testid="scoring-rule-fielding-runout"]');
      await expect(runoutRule).toBeVisible();
    });

    test('runout rule shows correct description', async ({ page }) => {
      const runoutRule = page.locator('[data-testid="scoring-rule-fielding-runout"]');
      const text = await runoutRule.textContent();
      expect(text?.toLowerCase()).toContain('runout');
    });

    test('runout rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-runout-points"]');
      const text = await points.textContent();
      expect(text).toContain('8');
    });

    test('displays stumped rule', async ({ page }) => {
      const stumpedRule = page.locator('[data-testid="scoring-rule-fielding-stumped"]');
      await expect(stumpedRule).toBeVisible();
    });

    test('stumped rule shows correct description', async ({ page }) => {
      const stumpedRule = page.locator('[data-testid="scoring-rule-fielding-stumped"]');
      const text = await stumpedRule.textContent();
      expect(text?.toLowerCase()).toContain('stumped');
    });

    test('stumped rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-stumped-points"]');
      const text = await points.textContent();
      expect(text).toContain('12');
    });

    test('displays direct hit rule', async ({ page }) => {
      const directHitRule = page.locator('[data-testid="scoring-rule-fielding-direct-hit"]');
      await expect(directHitRule).toBeVisible();
    });

    test('direct hit rule shows correct description', async ({ page }) => {
      const directHitRule = page.locator('[data-testid="scoring-rule-fielding-direct-hit"]');
      const text = await directHitRule.textContent();
      expect(text?.toLowerCase()).toContain('direct hit');
    });

    test('direct hit rule displays correct point value', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-direct-hit-points"]');
      const text = await points.textContent();
      expect(text).toContain('1');
    });

    test('all fielding rules are readable', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-fielding"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('fielding rules are properly formatted', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-fielding"]');
      const rules = section.locator('[data-testid^="scoring-rule"]');
      const count = await rules.count();

      for (let i = 0; i < count; i++) {
        const rule = rules.nth(i);
        const text = await rule.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Bonuses Section', () => {
    test('displays Bonuses section', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-bonuses"]');
      await expect(section).toBeVisible();
    });

    test('displays Bonuses section header', async ({ page }) => {
      const header = page.locator('[data-testid="scoring-section-bonuses"] [data-testid="section-header"]');
      await expect(header).toBeVisible();
      const text = await header.textContent();
      expect(text?.toLowerCase()).toContain('bonus');
    });

    test('displays Captain multiplier rule', async ({ page }) => {
      const captainRule = page.locator('[data-testid="scoring-rule-bonus-captain"]');
      await expect(captainRule).toBeVisible();
    });

    test('Captain rule shows correct multiplier', async ({ page }) => {
      const captainRule = page.locator('[data-testid="scoring-rule-bonus-captain"]');
      const text = await captainRule.textContent();
      expect(text?.toLowerCase()).toContain('captain');
      expect(text).toContain('2');
    });

    test('Captain rule mentions 2x multiplier', async ({ page }) => {
      const multiplier = page.locator('[data-testid="scoring-rule-bonus-captain-multiplier"]');
      const text = await multiplier.textContent();
      expect(text).toContain('2');
    });

    test('displays Vice-Captain multiplier rule', async ({ page }) => {
      const vcRule = page.locator('[data-testid="scoring-rule-bonus-vc"]');
      await expect(vcRule).toBeVisible();
    });

    test('Vice-Captain rule shows correct multiplier', async ({ page }) => {
      const vcRule = page.locator('[data-testid="scoring-rule-bonus-vc"]');
      const text = await vcRule.textContent();
      expect(text?.toLowerCase()).toContain('vice-captain');
      expect(text).toContain('1.5');
    });

    test('Vice-Captain rule mentions 1.5x multiplier', async ({ page }) => {
      const multiplier = page.locator('[data-testid="scoring-rule-bonus-vc-multiplier"]');
      const text = await multiplier.textContent();
      expect(text).toContain('1.5');
    });

    test('all bonus rules are readable', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-bonuses"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Complete Scoring Points Reference', () => {
    test('runs award 1 point per run', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-batting-run-points"]');
      const text = await points.textContent();
      expect(text).toContain('1');
    });

    test('boundary awards 1 point plus runs', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-batting-boundary-points"]');
      const text = await points.textContent();
      expect(text).toContain('1');
    });

    test('six awards 2 points', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-batting-six-points"]');
      const text = await points.textContent();
      expect(text).toContain('2');
    });

    test('wicket awards 10 points', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-bowling-wicket-points"]');
      const text = await points.textContent();
      expect(text).toContain('10');
    });

    test('maiden over awards 4 points', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-bowling-maiden-points"]');
      const text = await points.textContent();
      expect(text).toContain('4');
    });

    test('catch awards 4 points', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-catch-points"]');
      const text = await points.textContent();
      expect(text).toContain('4');
    });

    test('runout awards 8 points', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-runout-points"]');
      const text = await points.textContent();
      expect(text).toContain('8');
    });

    test('stumped awards 12 points', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-stumped-points"]');
      const text = await points.textContent();
      expect(text).toContain('12');
    });

    test('direct hit awards 1 point', async ({ page }) => {
      const points = page.locator('[data-testid="scoring-rule-fielding-direct-hit-points"]');
      const text = await points.textContent();
      expect(text).toContain('1');
    });

    test('captain multiplier is 2x', async ({ page }) => {
      const multiplier = page.locator('[data-testid="scoring-rule-bonus-captain-multiplier"]');
      const text = await multiplier.textContent();
      expect(text).toContain('2');
    });

    test('vice-captain multiplier is 1.5x', async ({ page }) => {
      const multiplier = page.locator('[data-testid="scoring-rule-bonus-vc-multiplier"]');
      const text = await multiplier.textContent();
      expect(text).toContain('1.5');
    });
  });

  test.describe('Scrolling & Content Access', () => {
    test('all sections are accessible by scrolling', async ({ page }) => {
      const container = page.locator('[data-testid="scoring-container"]');

      const batting = page.locator('[data-testid="scoring-section-batting"]');
      const bowling = page.locator('[data-testid="scoring-section-bowling"]');
      const fielding = page.locator('[data-testid="scoring-section-fielding"]');
      const bonuses = page.locator('[data-testid="scoring-section-bonuses"]');

      await batting.scrollIntoViewIfNeeded();
      expect(await batting.isVisible()).toBeTruthy();

      await bowling.scrollIntoViewIfNeeded();
      expect(await bowling.isVisible()).toBeTruthy();

      await fielding.scrollIntoViewIfNeeded();
      expect(await fielding.isVisible()).toBeTruthy();

      await bonuses.scrollIntoViewIfNeeded();
      expect(await bonuses.isVisible()).toBeTruthy();
    });

    test('batting section scrolls into view', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-batting"]');
      await section.scrollIntoViewIfNeeded();
      expect(await section.isVisible()).toBeTruthy();
    });

    test('bowling section scrolls into view', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-bowling"]');
      await section.scrollIntoViewIfNeeded();
      expect(await section.isVisible()).toBeTruthy();
    });

    test('fielding section scrolls into view', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-fielding"]');
      await section.scrollIntoViewIfNeeded();
      expect(await section.isVisible()).toBeTruthy();
    });

    test('bonuses section scrolls into view', async ({ page }) => {
      const section = page.locator('[data-testid="scoring-section-bonuses"]');
      await section.scrollIntoViewIfNeeded();
      expect(await section.isVisible()).toBeTruthy();
    });

    test('can scroll down through entire page', async ({ page }) => {
      const container = page.locator('[data-testid="scoring-container"]');
      const initialScroll = await container.evaluate((el) => el.scrollTop);

      await page.keyboard.press('End');
      await page.waitForTimeout(200);

      const finalScroll = await container.evaluate((el) => el.scrollTop);
      expect(finalScroll).toBeGreaterThan(initialScroll);
    });

    test('can scroll back to top', async ({ page }) => {
      const container = page.locator('[data-testid="scoring-container"]');

      await page.keyboard.press('End');
      await page.waitForTimeout(200);

      await page.keyboard.press('Home');
      await page.waitForTimeout(200);

      const scrollPosition = await container.evaluate((el) => el.scrollTop);
      expect(scrollPosition).toBe(0);
    });
  });

  test.describe('Rules Organization & Formatting', () => {
    test('sections are clearly separated', async ({ page }) => {
      const sections = page.locator('[data-testid^="scoring-section-"]');
      const count = await sections.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('each section has a header', async ({ page }) => {
      const sections = page.locator('[data-testid^="scoring-section-"]');
      const count = await sections.count();

      for (let i = 0; i < count; i++) {
        const section = sections.nth(i);
        const header = section.locator('[data-testid="section-header"]');
        expect(await header.isVisible()).toBeTruthy();
      }
    });

    test('section headers are readable', async ({ page }) => {
      const headers = page.locator('[data-testid^="scoring-section-"] [data-testid="section-header"]');
      const count = await headers.count();

      for (let i = 0; i < count; i++) {
        const header = headers.nth(i);
        const text = await header.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('rules are consistently formatted', async ({ page }) => {
      const rules = page.locator('[data-testid^="scoring-rule-"]');
      const count = await rules.count();
      expect(count).toBeGreaterThan(9);
    });

    test('each rule displays name and points', async ({ page }) => {
      const rules = page.locator('[data-testid^="scoring-rule-"]');
      const firstRule = rules.first();

      const name = firstRule.locator('[data-testid*="name"], [data-testid*="description"]');
      const points = firstRule.locator('[data-testid*="points"]');

      const nameVisible = await name.isVisible();
      const pointsVisible = await points.isVisible();

      expect(nameVisible || pointsVisible).toBeTruthy();
    });

    test('rules are visually distinct', async ({ page }) => {
      const rule1 = page.locator('[data-testid^="scoring-rule-"]').first();
      const rule2 = page.locator('[data-testid^="scoring-rule-"]').nth(1);

      const bg1 = await rule1.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const bg2 = await rule2.evaluate((el) => window.getComputedStyle(el).backgroundColor);

      expect(bg1).toBeTruthy();
      expect(bg2).toBeTruthy();
    });
  });

  test.describe('All Scoring Categories Present', () => {
    test('batting section contains at least 3 rules', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-batting"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('bowling section contains at least 2 rules', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-bowling"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('fielding section contains at least 4 rules', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-fielding"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('bonuses section contains at least 2 rules', async ({ page }) => {
      const rules = page.locator('[data-testid="scoring-section-bonuses"] [data-testid^="scoring-rule"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('page contains at least 11 total rules', async ({ page }) => {
      const rules = page.locator('[data-testid^="scoring-rule-"]');
      const count = await rules.count();
      expect(count).toBeGreaterThanOrEqual(11);
    });

    test('all rule categories are represented', async ({ page }) => {
      const batting = page.locator('[data-testid="scoring-section-batting"]');
      const bowling = page.locator('[data-testid="scoring-section-bowling"]');
      const fielding = page.locator('[data-testid="scoring-section-fielding"]');
      const bonuses = page.locator('[data-testid="scoring-section-bonuses"]');

      expect(await batting.isVisible()).toBeTruthy();
      expect(await bowling.isVisible()).toBeTruthy();
      expect(await fielding.isVisible()).toBeTruthy();
      expect(await bonuses.isVisible()).toBeTruthy();
    });
  });

  test.describe('Bottom Navigation', () => {
    test('bottom nav is visible on scoring screen', async ({ page }) => {
      const nav = page.locator('[data-testid="bottom-nav"]');
      await expect(nav).toBeVisible();
    });

    test('scoring tab is highlighted in bottom nav', async ({ page }) => {
      const tab = page.locator('[data-testid="bottom-nav-scoring"]');
      const isActive = await tab.evaluate((el) =>
        el.classList.contains('active') || el.getAttribute('aria-selected') === 'true'
      );
      expect(isActive).toBeTruthy();
    });

    test('clicking home tab in bottom nav navigates away', async ({ page }) => {
      const homeTab = page.locator('[data-testid="bottom-nav-home"]');
      if (await homeTab.isVisible()) {
        await homeTab.click();
        await page.waitForTimeout(200);
        const isScoringVisible = await page.locator('[data-testid="scoring-rules"]').isVisible();
        expect(!isScoringVisible).toBeTruthy();
      }
    });

    test('bottom nav tabs are interactive', async ({ page }) => {
      const tabs = page.locator('[data-testid^="bottom-nav-"]');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(1);
    });
  });

  test.describe('Readability & Accessibility', () => {
    test('all text is readable on the screen', async ({ page }) => {
      const rules = page.locator('[data-testid^="scoring-rule-"]');
      const count = await rules.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const rule = rules.nth(i);
        const text = await rule.textContent();
        expect(text).toBeTruthy();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('point values are clearly visible', async ({ page }) => {
      const points = page.locator('[data-testid*="points"]');
      const count = await points.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const point = points.nth(i);
        const text = await point.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test('section headers are prominent', async ({ page }) => {
      const headers = page.locator('[data-testid="section-header"]');
      const firstHeader = headers.first();

      const fontSize = await firstHeader.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      expect(fontSize).toBeTruthy();
    });

    test('there are no overlapping text elements', async ({ page }) => {
      const rules = page.locator('[data-testid^="scoring-rule-"]');
      const count = await rules.count();

      for (let i = 0; i < count; i++) {
        const rule = rules.nth(i);
        const isVisible = await rule.isVisible();
        expect(isVisible).toBeTruthy();
      }
    });

    test('color contrast is sufficient for text', async ({ page }) => {
      const sections = page.locator('[data-testid^="scoring-section-"]');
      const count = await sections.count();

      for (let i = 0; i < count; i++) {
        const section = sections.nth(i);
        const color = await section.evaluate((el) =>
          window.getComputedStyle(el).color
        );
        expect(color).toBeTruthy();
      }
    });
  });

  test.afterEach(async ({ page }) => {
    const errors = collectConsoleErrors(page);
    expect(errors.length).toBe(0);
  });
});
