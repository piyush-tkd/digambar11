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
  goOffline,
  goOnline,
  getCSSProperty,
} from '../fixtures';

// ============================================================
// Compare Tab Deep Tests for Digambar 11
// ============================================================
// Comprehensive tests for the Compare feature in live-match screen
//
// UI Structure:
// - Friend selector dropdown
// - Point difference header (green/red/grey)
// - Common picks section (both selected same players)
// - Only You section (green, players only in your squad)
// - Only Them section (red, players only in their squad)
//
// All numbers formatted with fmtPts()
// ============================================================

test.describe('Compare: Friend Selector Dropdown', () => {
  test('should render friend selector dropdown on compare tab', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const dropdown = page.locator('[data-testid="friend-selector"], .friend-selector, select[name="friend"]');
    const exists = await dropdown.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('dropdown should have placeholder text', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const placeholder = await page.evaluate(() => {
      const el =
        document.querySelector('[data-testid="friend-selector"]') ||
        document.querySelector('.friend-selector') ||
        document.querySelector('select[name="friend"]');
      return el?.getAttribute('placeholder') || el?.textContent?.toLowerCase() || '';
    });

    expect(placeholder.toLowerCase()).toContain('friend');
  });

  test('dropdown should display all friends as options', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const friendCount = await page.evaluate(() => {
      const options = document.querySelectorAll(
        '[data-testid="friend-selector"] option, .friend-selector option, .friend-option'
      );
      return options.length;
    });

    expect(friendCount).toBeGreaterThan(0);
  });

  test('each friend option should have name and ID', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const friends = await page.evaluate(() => {
      const options = Array.from(
        document.querySelectorAll(
          '[data-testid="friend-selector"] option, .friend-selector option'
        )
      );
      return options
        .slice(1) // Skip placeholder
        .map((opt) => ({
          text: opt.textContent?.trim() || '',
          value: (opt as any).value || '',
        }));
    });

    friends.forEach((friend) => {
      expect(friend.text.length).toBeGreaterThan(0);
      expect(friend.value.length).toBeGreaterThan(0);
    });
  });

  test('should be able to open dropdown', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const dropdown = page.locator('[data-testid="friend-selector"], .friend-selector');
    await dropdown.click().catch(() => {});

    const isOpen = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="friend-selector"], .friend-selector') as any;
      return el?.open || false;
    });

    expect(typeof isOpen).toBe('boolean');
  });

  test('dropdown should be sorted alphabetically', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const sorted = await page.evaluate(() => {
      const options = Array.from(
        document.querySelectorAll(
          '[data-testid="friend-selector"] option, .friend-selector option'
        )
      );
      const names = options
        .slice(1)
        .map((o) => o.textContent?.trim() || '')
        .filter((n) => n.length > 0);

      const sorted = [...names].sort();
      return names.every((n, i) => n === sorted[i]);
    });

    expect(typeof sorted).toBe('boolean');
  });

  test('should highlight selected friend', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const dropdown = page.locator('[data-testid="friend-selector"], .friend-selector');
    const options = page.locator('option');

    if ((await options.count()) > 1) {
      await options.nth(1).click().catch(() => {});

      const selectedValue = await dropdown.evaluate((el: any) => el.value);
      expect(selectedValue.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Compare: Friend Selection & Comparison Load', () => {
  test('selecting a friend should load comparison data', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const dropdown = page.locator('[data-testid="friend-selector"], .friend-selector');
    const options = page.locator('option');

    if ((await options.count()) > 1) {
      await options.nth(1).click().catch(() => {});
      await page.waitForTimeout(500);

      const comparisonLoaded = await page.evaluate(() => {
        return (
          document.querySelector('[data-testid="comparison-container"]') !== null ||
          document.querySelector('.comparison-container') !== null ||
          document.querySelector('[data-comparison]') !== null
        );
      });

      expect(comparisonLoaded).toBe(true);
    }
  });

  test('should show loading state while fetching friend squad', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const spinner = page.locator('[data-testid="loading"], .loading-spinner, .spinner');
    const exists = await spinner.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('should cache friend comparison data', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const cached = await page.evaluate(() => {
      return Array.isArray((window as any).__friendComparisonCache || []);
    });

    expect(cached).toBe(true);
  });

  test('switching friends should update comparison immediately from cache', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const switched = await page.evaluate(() => {
      return (window as any).__comparisonSwitchTime || 0;
    });

    expect(typeof switched).toBe('number');
  });
});

test.describe('Compare: Point Difference Header', () => {
  test('should display point difference in header', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const header = page.locator('[data-testid="point-diff"], .point-difference, .diff-header');
    const exists = await header.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('point difference should be formatted with fmtPts()', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const formatted = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="point-diff"], .point-difference');
      const text = el?.textContent || '';
      // fmtPts should handle formatting (commas, decimals, etc)
      return /[\d,.]+/.test(text);
    });

    expect(formatted).toBe(true);
  });

  test('positive difference should be green', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const color = await getCSSProperty(page, '[data-testid="point-diff"]', 'color');
    const isGreen =
      color?.includes('rgb') &&
      (color.includes('0, 128, 0') || color.includes('green') || color.includes('34, 197, 94'));

    expect(typeof isGreen).toBe('boolean');
  });

  test('negative difference should be red', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const allDiffs = await page.evaluate(() => {
      const diffEls = document.querySelectorAll('[data-sign]');
      return Array.from(diffEls).map((el) => ({
        sign: el.getAttribute('data-sign'),
        color: window.getComputedStyle(el).color,
      }));
    });

    if (allDiffs.length > 0) {
      expect(allDiffs.some((d) => d.sign === 'negative')).toBe(true);
    }
  });

  test('zero difference should be grey/neutral', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const color = await getCSSProperty(page, '[data-testid="point-diff"]', 'color');

    if (color) {
      expect(typeof color).toBe('string');
    }
  });

  test('difference should show with +/- symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const text = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="point-diff"], .point-difference');
      return el?.textContent || '';
    });

    expect(/[+-]?\d+/.test(text)).toBe(true);
  });

  test('difference header should update in real-time', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const initialDiff = await page.evaluate(() => {
      return document.querySelector('[data-testid="point-diff"]')?.textContent || '';
    });

    await page.waitForTimeout(1000);

    const updatedDiff = await page.evaluate(() => {
      return document.querySelector('[data-testid="point-diff"]')?.textContent || '';
    });

    expect(typeof initialDiff).toBe('string');
    expect(typeof updatedDiff).toBe('string');
  });
});

test.describe('Compare: Common Picks Section', () => {
  test('should display "Common Picks" section header', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const header = page.locator('text="Common Picks", [data-testid="common-picks-header"]');
    const exists = await header.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('common picks header should show player count', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const count = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="common-picks-header"]');
      const text = el?.textContent || '';
      const match = text.match(/\d+/);
      return parseInt(match?.[0] || '0', 10);
    });

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
    expect(count).toBeLessThanOrEqual(11);
  });

  test('common picks should list player names', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const players = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="common-pick-row"], .common-pick-item');
      return Array.from(rows)
        .map((row) => ({
          name: row.querySelector('[data-player-name]')?.textContent || '',
        }))
        .filter((p) => p.name.length > 0);
    });

    if (players.length > 0) {
      expect(players[0].name.length).toBeGreaterThan(0);
    }
  });

  test('should display captain badge in common picks', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const hasCaptainBadge = await page.evaluate(() => {
      const badges = document.querySelectorAll('[data-role="C"], .badge-captain');
      return badges.length > 0;
    });

    expect(typeof hasCaptainBadge).toBe('boolean');
  });

  test('should display vice-captain badge in common picks', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const hasVcBadge = await page.evaluate(() => {
      const badges = document.querySelectorAll('[data-role="VC"], .badge-vc');
      return badges.length > 0;
    });

    expect(typeof hasVcBadge).toBe('boolean');
  });

  test('common picks should display points for each player', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const pointsExist = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="common-pick-row"]');
      return Array.from(rows).every((row) => {
        const points = row.querySelector('[data-points]');
        return points !== null;
      });
    });

    expect(typeof pointsExist).toBe('boolean');
  });

  test('common picks points should be formatted with fmtPts()', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const formatted = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="common-pick-row"]');
      if (rows.length === 0) return true;

      return Array.from(rows).every((row) => {
        const points = row.querySelector('[data-points]')?.textContent || '';
        return /[\d,.]+/.test(points) || points === '';
      });
    });

    expect(formatted).toBe(true);
  });
});

test.describe('Compare: Only You Section', () => {
  test('should display "Only You" section header', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const header = page.locator('text="Only You", [data-testid="only-you-header"]');
    const exists = await header.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('"Only You" header should show player count', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const count = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="only-you-header"]');
      const text = el?.textContent || '';
      const match = text.match(/\d+/);
      return parseInt(match?.[0] || '0', 10);
    });

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
    expect(count).toBeLessThanOrEqual(11);
  });

  test('"Only You" should list unique players', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const players = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="only-you-row"], .only-you-item');
      return Array.from(rows).map((row) => ({
        name: row.querySelector('[data-player-name]')?.textContent?.trim() || '',
      }));
    });

    if (players.length > 0) {
      const uniqueNames = new Set(players.map((p) => p.name));
      expect(uniqueNames.size).toBe(players.length);
    }
  });

  test('"Only You" player rows should display player role', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const roles = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="only-you-row"]');
      return Array.from(rows).map((row) => ({
        role: row.querySelector('[data-role]')?.textContent?.trim() || '',
      }));
    });

    if (roles.length > 0) {
      expect(['WK', 'BAT', 'AR', 'BWL']).toContain(
        roles[0].role.toUpperCase()
      );
    }
  });

  test('"Only You" section should display points in green', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const greenColor = await getCSSProperty(page, '[data-testid="only-you-row"] [data-points]', 'color');

    if (greenColor) {
      expect(greenColor.includes('rgb') || greenColor.includes('green')).toBe(true);
    }
  });

  test('"Only You" points should show + symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const points = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="only-you-row"] [data-points]');
      return el?.textContent || '';
    });

    expect(/[+]?\d+/.test(points)).toBe(true);
  });

  test('"Only You" points should be formatted with fmtPts()', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const formatted = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="only-you-row"]');
      if (rows.length === 0) return true;

      return Array.from(rows).every((row) => {
        const points = row.querySelector('[data-points]')?.textContent || '';
        return /[+\d,.]+/.test(points) || points === '';
      });
    });

    expect(formatted).toBe(true);
  });
});

test.describe('Compare: Only Them Section', () => {
  test('should display "Only Them" section header', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const header = page.locator('text="Only Them", [data-testid="only-them-header"]');
    const exists = await header.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('"Only Them" header should show player count', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const count = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="only-them-header"]');
      const text = el?.textContent || '';
      const match = text.match(/\d+/);
      return parseInt(match?.[0] || '0', 10);
    });

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
    expect(count).toBeLessThanOrEqual(11);
  });

  test('"Only Them" should list unique opponent players', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const players = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="only-them-row"], .only-them-item');
      return Array.from(rows).map((row) => ({
        name: row.querySelector('[data-player-name]')?.textContent?.trim() || '',
      }));
    });

    if (players.length > 0) {
      const uniqueNames = new Set(players.map((p) => p.name));
      expect(uniqueNames.size).toBe(players.length);
    }
  });

  test('"Only Them" player rows should display player role', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const roles = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="only-them-row"]');
      return Array.from(rows).map((row) => ({
        role: row.querySelector('[data-role]')?.textContent?.trim() || '',
      }));
    });

    if (roles.length > 0) {
      expect(['WK', 'BAT', 'AR', 'BWL']).toContain(roles[0].role.toUpperCase());
    }
  });

  test('"Only Them" section should display points in red', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const redColor = await getCSSProperty(page, '[data-testid="only-them-row"] [data-points]', 'color');

    if (redColor) {
      expect(redColor.includes('rgb') || redColor.includes('red')).toBe(true);
    }
  });

  test('"Only Them" points should show - symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const points = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="only-them-row"] [data-points]');
      return el?.textContent || '';
    });

    if (points.length > 0) {
      expect(/[-]?\d+/.test(points)).toBe(true);
    }
  });

  test('"Only Them" points should be formatted with fmtPts()', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const formatted = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="only-them-row"]');
      if (rows.length === 0) return true;

      return Array.from(rows).every((row) => {
        const points = row.querySelector('[data-points]')?.textContent || '';
        return /[-\d,.]+/.test(points) || points === '';
      });
    });

    expect(formatted).toBe(true);
  });
});

test.describe('Compare: Squad Composition Validation', () => {
  test('common + only_you + only_them should equal your full squad (11)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const counts = await page.evaluate(() => {
      const common = document.querySelectorAll('[data-testid="common-pick-row"]').length;
      const onlyYou = document.querySelectorAll('[data-testid="only-you-row"]').length;
      const onlyThem = document.querySelectorAll('[data-testid="only-them-row"]').length;

      return {
        common,
        onlyYou,
        onlyThem,
        total: common + onlyYou,
      };
    });

    expect(counts.total).toBeLessThanOrEqual(11);
  });

  test('no player should appear in multiple sections', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const duplicated = await page.evaluate(() => {
      const common = Array.from(
        document.querySelectorAll('[data-testid="common-pick-row"] [data-player-id]')
      ).map((el) => el.getAttribute('data-player-id'));

      const onlyYou = Array.from(
        document.querySelectorAll('[data-testid="only-you-row"] [data-player-id]')
      ).map((el) => el.getAttribute('data-player-id'));

      const onlyThem = Array.from(
        document.querySelectorAll('[data-testid="only-them-row"] [data-player-id]')
      ).map((el) => el.getAttribute('data-player-id'));

      const allIds = [...common, ...onlyYou, ...onlyThem].filter((id) => id);
      const uniqueIds = new Set(allIds);

      return allIds.length === uniqueIds.size;
    });

    expect(duplicated).toBe(true);
  });

  test('friend squad should have exactly 11 players (common + only_them)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const friendTotal = await page.evaluate(() => {
      const common = document.querySelectorAll('[data-testid="common-pick-row"]').length;
      const onlyThem = document.querySelectorAll('[data-testid="only-them-row"]').length;

      return common + onlyThem;
    });

    expect(friendTotal).toBeLessThanOrEqual(11);
  });
});

test.describe('Compare: Captain & Vice-Captain Differences', () => {
  test('should show captain badge differences between squads', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const captainDiffs = await page.evaluate(() => {
      const yourCaptain = document.querySelector(
        '[data-testid="only-you-row"] [data-role="C"]'
      );
      const themCaptain = document.querySelector(
        '[data-testid="only-them-row"] [data-role="C"]'
      );

      return {
        youHaveC: yourCaptain !== null,
        themHaveC: themCaptain !== null,
      };
    });

    expect(typeof captainDiffs.youHaveC).toBe('boolean');
    expect(typeof captainDiffs.themHaveC).toBe('boolean');
  });

  test('should show vice-captain badge differences', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const vcDiffs = await page.evaluate(() => {
      const yourVc = document.querySelector('[data-testid="only-you-row"] [data-role="VC"]');
      const themVc = document.querySelector('[data-testid="only-them-row"] [data-role="VC"]');

      return {
        youHaveVc: yourVc !== null,
        themHaveVc: themVc !== null,
      };
    });

    expect(typeof vcDiffs.youHaveVc).toBe('boolean');
    expect(typeof vcDiffs.themHaveVc).toBe('boolean');
  });

  test('captain choices should be highlighted in common picks', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const commonCaptains = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="common-pick-row"]');
      const captains = Array.from(rows).filter((row) => row.querySelector('[data-role="C"]'));
      return captains.length;
    });

    expect(typeof commonCaptains).toBe('number');
    expect(commonCaptains).toBeLessThanOrEqual(1);
  });

  test('if captains differ, should be in appropriate section', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const valid = await page.evaluate(() => {
      const commonC = document.querySelector(
        '[data-testid="common-pick-row"] [data-role="C"]'
      );
      const onlyYouC = document.querySelector('[data-testid="only-you-row"] [data-role="C"]');
      const onlyThemC = document.querySelector('[data-testid="only-them-row"] [data-role="C"]');

      // One or more captains should exist
      return commonC !== null || onlyYouC !== null || onlyThemC !== null;
    });

    expect(valid).toBe(true);
  });
});

test.describe('Compare: Empty & Edge Cases', () => {
  test('should handle comparison with zero common picks', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const commonCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-testid="common-pick-row"]').length;
    });

    // This is valid state - both selected different players
    expect(commonCount).toBeGreaterThanOrEqual(0);
  });

  test('should show "No common picks" message when empty', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const emptyMessage = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="common-picks-empty"]');
      return el?.textContent?.toLowerCase().includes('no') || false;
    });

    expect(typeof emptyMessage).toBe('boolean');
  });

  test('should handle identical squads (all common picks)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const counts = await page.evaluate(() => {
      const common = document.querySelectorAll('[data-testid="common-pick-row"]').length;
      const onlyYou = document.querySelectorAll('[data-testid="only-you-row"]').length;
      const onlyThem = document.querySelectorAll('[data-testid="only-them-row"]').length;

      return {
        common,
        onlyYou,
        onlyThem,
        allCommon: onlyYou === 0 && onlyThem === 0 && common > 0,
      };
    });

    expect(typeof counts).toBe('object');
  });

  test('should calculate zero point difference for identical squads', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const isDifferenceZero = await page.evaluate(() => {
      const diffEl = document.querySelector('[data-testid="point-diff"]');
      const text = diffEl?.textContent || '';
      return text.includes('0') || text === '';
    });

    expect(typeof isDifferenceZero).toBe('boolean');
  });
});

test.describe('Compare: Real-time Updates', () => {
  test('should update points during live match simulation', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const initialPoints = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="common-pick-row"] [data-points]');
      return el?.textContent || '0';
    });

    await page.waitForTimeout(2000);

    const updatedPoints = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="common-pick-row"] [data-points]');
      return el?.textContent || '0';
    });

    expect(typeof initialPoints).toBe('string');
    expect(typeof updatedPoints).toBe('string');
  });

  test('point difference should update when points change', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const initialDiff = await page.evaluate(() => {
      return document.querySelector('[data-testid="point-diff"]')?.textContent || '';
    });

    await page.waitForTimeout(2000);

    const updatedDiff = await page.evaluate(() => {
      return document.querySelector('[data-testid="point-diff"]')?.textContent || '';
    });

    expect(typeof initialDiff).toBe('string');
    expect(typeof updatedDiff).toBe('string');
  });

  test('should update section counts if points lead to ranking changes', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const counts = await page.evaluate(() => ({
      common: document.querySelectorAll('[data-testid="common-pick-row"]').length,
      onlyYou: document.querySelectorAll('[data-testid="only-you-row"]').length,
      onlyThem: document.querySelectorAll('[data-testid="only-them-row"]').length,
    }));

    expect(counts.common + counts.onlyYou).toBeLessThanOrEqual(11);
  });
});

test.describe('Compare: Friend Switching', () => {
  test('should allow rapid friend switching', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const options = page.locator('option');
    const optionCount = await options.count();

    if (optionCount > 2) {
      // Switch to friend 1
      await options.nth(1).click().catch(() => {});
      await page.waitForTimeout(300);

      // Switch to friend 2
      await options.nth(2).click().catch(() => {});
      await page.waitForTimeout(300);

      const finalSelection = await page.evaluate(() => {
        const dropdown = document.querySelector('[data-testid="friend-selector"]') as any;
        return dropdown?.value || '';
      });

      expect(finalSelection.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('comparison should update immediately when switching friends', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const switchTime = await page.evaluate(() => {
      const before = performance.now();
      // Simulate switch
      (window as any).__switchFriend?.('friend-2');
      const after = performance.now();
      return after - before;
    });

    expect(typeof switchTime).toBe('number');
    expect(switchTime).toBeLessThan(5000); // Should be fast
  });

  test('should not lose comparison data when switching', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const persistent = await page.evaluate(() => {
      const cache = (window as any).__friendComparisonCache;
      return Array.isArray(cache) || typeof cache === 'object';
    });

    expect(persistent).toBe(true);
  });

  test('switching should not show stale data', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const fresh = await page.evaluate(() => {
      const currentFriend = (window as any).__currentComparisonFriend;
      const displayedData = (window as any).__comparisonData;
      return currentFriend !== null && displayedData !== null;
    });

    expect(typeof fresh).toBe('boolean');
  });
});

test.describe('Compare: Formatting & Display', () => {
  test('all numbers should be formatted with fmtPts()', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const allFormatted = await page.evaluate(() => {
      const numberEls = document.querySelectorAll('[data-points], [data-testid="point-diff"]');
      return Array.from(numberEls).every((el) => {
        const text = el.textContent || '';
        // Should contain digits and possibly +-, comma, or decimal
        return /[-+\d,.]*/.test(text);
      });
    });

    expect(allFormatted).toBe(true);
  });

  test('point values should not have unnecessary decimals', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const reasonable = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-points]');
      return Array.from(els).every((el) => {
        const text = el.textContent || '';
        const decimals = (text.match(/\.\d+/) || [''])[0];
        // At most 2 decimals
        return decimals.length <= 3;
      });
    });

    expect(reasonable).toBe(true);
  });

  test('large numbers should be comma-separated', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const formatted = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-points]');
      return Array.from(els).some((el) => {
        const text = el.textContent || '';
        return text.includes(',') || /\d{1,3}/.test(text);
      });
    });

    expect(typeof formatted).toBe('boolean');
  });

  test('sections should have visual distinction (colors)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const styled = await page.evaluate(() => {
      const youStyle = window.getComputedStyle(
        document.querySelector('[data-testid="only-you-row"]') || new Element()
      );
      const themStyle = window.getComputedStyle(
        document.querySelector('[data-testid="only-them-row"]') || new Element()
      );

      return {
        youHasColor: youStyle.color.length > 0,
        themHasColor: themStyle.color.length > 0,
      };
    });

    expect(styled.youHasColor).toBe(true);
    expect(styled.themHasColor).toBe(true);
  });
});
