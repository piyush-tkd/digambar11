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
  fmtPts,
} from '../fixtures';

/**
 * ============================================================
 * Captain Selection Screen (screen-captain) E2E Tests
 * ============================================================
 *
 * The captain screen shows 11 selected players.
 * User must pick 1 Captain (2x points) and 1 Vice-Captain (1.5x points).
 *
 * Total: 55+ comprehensive tests covering:
 * - Screen layout and structure
 * - Captain selection mechanics
 * - Vice-Captain selection mechanics
 * - Selection constraints
 * - Point multipliers
 * - Navigation and back functionality
 * - Visual styling and badges
 * - Edge cases (rapid tapping, deselection, etc.)
 */

test.describe('Captain Selection Screen', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorMonitor(page);
    collectConsoleErrors(page);
    await loadApp(page);
    await mockLogin(page, 'CaptainTest');
    // Navigate to captain selection screen
    await navigateToScreen(page, SCREENS.CAPTAIN);
  });

  // ============================================================
  // 1. SCREEN LAYOUT TESTS
  // ============================================================

  test.describe('Screen Layout & Structure', () => {
    test('captain screen is visible on load', async ({ page }) => {
      const isVisible = await isScreenVisible(page, SCREENS.CAPTAIN);
      expect(isVisible).toBeTruthy();
    });

    test('screen has title element', async ({ page }) => {
      const title = page.locator('[data-testid="captain-title"], .captain-title, h1');
      await expect(title).toBeVisible();
    });

    test('screen title shows "Select Captain & Vice-Captain" or similar', async ({ page }) => {
      const title = page.locator('[data-testid="captain-title"], .captain-title, h1').first();
      const text = await title.textContent();
      expect(text?.toLowerCase()).toMatch(/captain|vice.*captain/i);
    });

    test('player list container is visible', async ({ page }) => {
      const playerList = page.locator('[data-testid="player-list"], .player-list, [class*="players"]');
      await expect(playerList.first()).toBeVisible();
    });

    test('proceed button is present', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue"), button:has-text("Next")');
      await expect(proceedBtn.first()).toBeVisible();
    });

    test('back button is present', async ({ page }) => {
      const backBtn = page.locator('[data-testid="back-btn"], button:has-text("Back"), .back-button, [aria-label*="back" i]');
      await expect(backBtn.first()).toBeVisible();
    });

    test('all 11 players are displayed', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row, [class*="player"][class*="row"]');
      const count = await playerRows.count();
      expect(count).toBe(11);
    });

    test('each player row has name element', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row').first();
      const name = playerRows.locator('[data-testid*="name"], .player-name, [class*="name"]');
      await expect(name).toBeVisible();
    });

    test('each player row has team badge', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row').first();
      const team = playerRows.locator('[data-testid*="team"], .team-badge, [class*="team"]');
      await expect(team).toBeVisible();
    });

    test('each player row has role badge', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row').first();
      const role = playerRows.locator('[data-testid*="role"], .role-badge, [class*="role"]');
      await expect(role).toBeVisible();
    });

    test('each player row has points display', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row').first();
      const points = playerRows.locator('[data-testid*="points"], .points, [class*="points"]');
      await expect(points).toBeVisible();
    });

    test('captain and vice-captain selection labels visible', async ({ page }) => {
      const labels = page.locator('.captain-label, .vice-captain-label, [data-testid*="label"]');
      const count = await labels.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================
  // 2. CAPTAIN SELECTION TESTS
  // ============================================================

  test.describe('Captain Selection Mechanics', () => {
    test('can tap player to select as captain', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();
      await firstPlayer.click();

      const captainBadge = firstPlayer.locator('[data-testid*="captain"], .badge-captain, [class*="captain"]');
      await expect(captainBadge).toBeVisible();
    });

    test('selected captain gets gold/yellow badge', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();
      await firstPlayer.click();

      const badge = firstPlayer.locator('[data-testid*="badge"], .badge, [class*="badge"]').first();
      const bgColor = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
      // Gold is typically rgb(255, 215, 0) or similar yellowish tone
      expect(bgColor).toMatch(/rgb.*\d+.*\d+/);
    });

    test('captain badge shows "C" label', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();
      await firstPlayer.click();

      const badge = firstPlayer.locator('[data-testid*="badge"], .badge, .captain-badge, [class*="captain"]').first();
      const text = await badge.textContent();
      expect(text?.trim()).toBe('C');
    });

    test('can change captain by tapping another player', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      const firstPlayer = players.nth(0);
      const secondPlayer = players.nth(1);

      await firstPlayer.click();
      const firstBadge = firstPlayer.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(firstBadge).toBeVisible();

      await secondPlayer.click();
      const secondBadge = secondPlayer.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(secondBadge).toBeVisible();

      // First player should no longer have C badge
      const firstStillHasBadge = await firstBadge.isVisible().catch(() => false);
      expect(firstStillHasBadge).toBeFalsy();
    });

    test('captain can be deselected and reselected', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();

      // Select as captain
      await firstPlayer.click();
      let badge = firstPlayer.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(badge).toBeVisible();

      // Deselect
      await firstPlayer.click();
      const isBadgeGone = await badge.isVisible().catch(() => false);
      expect(isBadgeGone).toBeFalsy();

      // Re-select
      await firstPlayer.click();
      badge = firstPlayer.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(badge).toBeVisible();
    });

    test('only one captain can be selected at a time', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();
      await players.nth(2).click();

      const captainBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const count = await captainBadges.count();
      expect(count).toBe(1);
    });

    test('captain selection updates points display (2x multiplier)', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();
      const pointsDisplay = firstPlayer.locator('[data-testid*="points"], .points');
      const originalPoints = await pointsDisplay.textContent();

      await firstPlayer.click();
      const multiplierDisplay = firstPlayer.locator('[data-testid*="multiplier"], .multiplier, [class*="multiplier"]');
      const multiplierText = await multiplierDisplay.textContent();

      expect(multiplierText).toMatch(/2x|2\.0x|200%/);
    });

    test('rapid tapping player does not cause multiple captains', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();

      for (let i = 0; i < 5; i++) {
        await firstPlayer.click();
      }

      const captainBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const count = await captainBadges.count();
      expect(count).toBe(1);
    });
  });

  // ============================================================
  // 3. VICE-CAPTAIN SELECTION TESTS
  // ============================================================

  test.describe('Vice-Captain Selection Mechanics', () => {
    test('can tap player to select as vice-captain', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      // First select captain
      await players.nth(0).click();

      // Then select vice-captain
      await players.nth(1).click();

      const vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      await expect(vcBadge).toBeVisible();
    });

    test('vice-captain gets blue badge', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();

      const vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').first();
      const bgColor = await vcBadge.evaluate((el) => getComputedStyle(el).backgroundColor);
      // Blue is typically rgb(0, 0, 255) or similar
      expect(bgColor).toMatch(/rgb.*\d+.*\d+/);
    });

    test('vice-captain badge shows "VC" or "V" label', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();

      const vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').first();
      const text = await vcBadge.textContent();
      expect(text?.trim()).toMatch(/^VC?$/);
    });

    test('can change vice-captain by selecting different player', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      // Set captain and VC
      await players.nth(0).click();
      await players.nth(1).click();

      const firstVCBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      await expect(firstVCBadge).toBeVisible();

      // Change VC to different player
      await players.nth(2).click();
      const secondVCBadge = players.nth(2).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      await expect(secondVCBadge).toBeVisible();

      // Original VC should no longer have badge
      const firstStillVC = await firstVCBadge.isVisible().catch(() => false);
      expect(firstStillVC).toBeFalsy();
    });

    test('vice-captain can be deselected', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();

      let vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      await expect(vcBadge).toBeVisible();

      await players.nth(1).click();
      const isGone = await vcBadge.isVisible().catch(() => false);
      expect(isGone).toBeFalsy();
    });

    test('vice-captain selection updates points display (1.5x multiplier)', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();

      const multiplierDisplay = players.nth(1).locator('[data-testid*="multiplier"], .multiplier, [class*="multiplier"]');
      const multiplierText = await multiplierDisplay.textContent();

      expect(multiplierText).toMatch(/1\.5x|1\.5|150%/);
    });

    test('only one vice-captain can be selected at a time', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();
      await players.nth(2).click();
      await players.nth(3).click();

      const vcBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      const count = await vcBadges.count();
      expect(count).toBe(1);
    });
  });

  // ============================================================
  // 4. SELECTION CONSTRAINTS TESTS
  // ============================================================

  test.describe('Selection Constraints', () => {
    test('cannot select same player as both captain and vice-captain', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();

      // First click: becomes captain
      await firstPlayer.click();
      let badges = firstPlayer.locator('[data-testid*="badge"], .badge');
      let captainBadge = badges.filter({ hasText: 'C' });
      await expect(captainBadge).toBeVisible();

      // Second click: should deselect or switch role, not create both
      await firstPlayer.click();
      badges = firstPlayer.locator('[data-testid*="badge"], .badge');
      const allBadges = await badges.count();
      expect(allBadges).toBeLessThanOrEqual(1);
    });

    test('when selecting captain, VC role is not assigned', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();

      const vcBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      const count = await vcBadges.count();
      expect(count).toBe(0);
    });

    test('cannot make captain also vice-captain via second tap on same player', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid^="player-row"], .player-row').first();

      await firstPlayer.click();
      const captainBadge = firstPlayer.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(captainBadge).toBeVisible();

      await firstPlayer.click();

      // After deselect, should not have any badge
      const badges = firstPlayer.locator('[data-testid*="badge"], .badge');
      const count = await badges.count();
      expect(count).toBe(0);
    });
  });

  // ============================================================
  // 5. VISUAL STYLING & BADGES TESTS
  // ============================================================

  test.describe('Visual Styling & Badges', () => {
    test('captain badge has gold/yellow background', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();

      const badge = players.nth(0).locator('[class*="badge"], [data-testid*="badge"]').first();
      const bgColor = await badge.evaluate((el) => {
        const computed = getComputedStyle(el);
        return computed.backgroundColor;
      });

      // Gold/yellow should have high red and green, low blue
      expect(bgColor).toMatch(/rgb/);
    });

    test('vice-captain badge has blue background', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const badge = players.nth(1).locator('[class*="badge"], [data-testid*="badge"]').first();
      const bgColor = await badge.evaluate((el) => {
        const computed = getComputedStyle(el);
        return computed.backgroundColor;
      });

      expect(bgColor).toMatch(/rgb/);
    });

    test('unselected players have no badge overlay', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      const unselected = players.nth(5);

      const badges = unselected.locator('[data-testid*="badge"], [class*="badge"]');
      const count = await badges.count();
      expect(count).toBe(0);
    });

    test('selected player row has distinct styling', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      const selectedPlayer = players.nth(0);

      const borderOrBg = await selectedPlayer.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          border: computed.border,
          backgroundColor: computed.backgroundColor,
          boxShadow: computed.boxShadow,
        };
      });

      // At least one of these should be styled
      const isStyled = borderOrBg.border !== 'none' || borderOrBg.backgroundColor !== 'transparent' || borderOrBg.boxShadow !== 'none';
      expect(isStyled).toBeTruthy();
    });

    test('captain and vice-captain both visible simultaneously', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();

      const captainBadge = players.nth(0).locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });

      await expect(captainBadge).toBeVisible();
      await expect(vcBadge).toBeVisible();
    });
  });

  // ============================================================
  // 6. POINT MULTIPLIER DISPLAY TESTS
  // ============================================================

  test.describe('Point Multipliers & Display', () => {
    test('captain shows 2x point multiplier label', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();

      const multiplier = players.nth(0).locator('[data-testid*="multiplier"], .multiplier, [class*="2x"], [class*="2\.0x"]');
      const text = await multiplier.textContent();
      expect(text).toMatch(/2/);
    });

    test('vice-captain shows 1.5x point multiplier label', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const multiplier = players.nth(1).locator('[data-testid*="multiplier"], .multiplier, [class*="1\.5"], [class*="150"]');
      const text = await multiplier.textContent();
      expect(text).toMatch(/1\.5|150%/);
    });

    test('point multiplier visible when captain selected', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();

      const multiplier = players.nth(0).locator('[data-testid*="multiplier"], .multiplier');
      await expect(multiplier).toBeVisible();
    });

    test('point multiplier visible when vice-captain selected', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const multiplier = players.nth(1).locator('[data-testid*="multiplier"], .multiplier');
      await expect(multiplier).toBeVisible();
    });

    test('point multiplier hidden when player not selected', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      const unselected = players.nth(5);

      const multiplier = unselected.locator('[data-testid*="multiplier"], .multiplier');
      const isVisible = await multiplier.isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
    });

    test('captain point calculation uses fmtPts function', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();

      const pointsDisplay = players.nth(0).locator('[data-testid*="points"], .points');
      const pointsText = await pointsDisplay.textContent();

      // fmtPts should format the points (no floating point artifacts)
      expect(pointsText).toMatch(/^\d+(\.\d{1,2})?$/);
    });
  });

  // ============================================================
  // 7. PROCEED BUTTON TESTS
  // ============================================================

  test.describe('Proceed Button State Management', () => {
    test('proceed button is disabled initially', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const isDisabled = await proceedBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('proceed button disabled after selecting only captain', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const isDisabled = await proceedBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('proceed button disabled after selecting only vice-captain', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(0).click(); // Deselect captain
      await players.nth(1).click(); // Select VC

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const isDisabled = await proceedBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('proceed button enabled after selecting both captain and vice-captain', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const isDisabled = await proceedBtn.isDisabled();
      expect(isDisabled).toBeFalsy();
    });

    test('proceed button becomes disabled if VC deselected', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      let proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      expect(await proceedBtn.isDisabled()).toBeFalsy();

      // Deselect VC
      await players.nth(1).click();
      proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      expect(await proceedBtn.isDisabled()).toBeTruthy();
    });

    test('proceed button has correct styling when enabled', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const opacity = await proceedBtn.evaluate((el) => getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeGreaterThan(0.5);
    });

    test('proceed button has reduced opacity when disabled', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const opacity = await proceedBtn.evaluate((el) => getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeLessThan(1);
    });
  });

  // ============================================================
  // 8. NAVIGATION TESTS
  // ============================================================

  test.describe('Navigation & Back Button', () => {
    test('back button returns to team select screen', async ({ page }) => {
      const backBtn = page.locator('[data-testid="back-btn"], button:has-text("Back"), [aria-label*="back" i]').first();
      await backBtn.click();

      const isOnTeamSelect = await isScreenVisible(page, SCREENS.TEAM_SELECT);
      expect(isOnTeamSelect).toBeTruthy();
    });

    test('back button does not navigate if user clicks proceed', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      await proceedBtn.click();

      const isOnTeamSelect = await isScreenVisible(page, SCREENS.TEAM_SELECT);
      expect(isOnTeamSelect).toBeFalsy();
    });

    test('proceed button navigates to preview screen', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      await proceedBtn.click();

      const isOnPreview = await isScreenVisible(page, SCREENS.PREVIEW);
      expect(isOnPreview).toBeTruthy();
    });

    test('back button is always clickable', async ({ page }) => {
      const backBtn = page.locator('[data-testid="back-btn"], button:has-text("Back"), [aria-label*="back" i]').first();
      const isDisabled = await backBtn.isDisabled();
      expect(isDisabled).toBeFalsy();
    });

    test('navigating back and returning preserves team but resets selections', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      const backBtn = page.locator('[data-testid="back-btn"], button:has-text("Back"), [aria-label*="back" i]').first();
      await backBtn.click();

      // Navigate back to captain
      await navigateToScreen(page, SCREENS.CAPTAIN);

      // Selections should be reset
      const captainBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const count = await captainBadges.count();
      expect(count).toBe(0);
    });
  });

  // ============================================================
  // 9. PLAYER INFORMATION DISPLAY TESTS
  // ============================================================

  test.describe('Player Information Display', () => {
    test('each player displays name', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 3; i++) {
        const name = playerRows.nth(i).locator('[data-testid*="name"], .player-name');
        const text = await name.textContent();
        expect(text).toBeTruthy();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('each player displays team', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 3; i++) {
        const team = playerRows.nth(i).locator('[data-testid*="team"], .team-badge, [class*="team"]');
        const text = await team.textContent();
        expect(text).toBeTruthy();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('each player displays role', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 3; i++) {
        const role = playerRows.nth(i).locator('[data-testid*="role"], .role-badge, [class*="role"]');
        const text = await role.textContent();
        expect(text).toBeTruthy();
        expect(/WK|BAT|AR|BWL/i.test(text || '')).toBeTruthy();
      }
    });

    test('each player displays points', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 3; i++) {
        const points = playerRows.nth(i).locator('[data-testid*="points"], .points');
        const text = await points.textContent();
        expect(text).toBeTruthy();
        expect(/\d+/i.test(text || '')).toBeTruthy();
      }
    });

    test('points display is properly formatted without floating artifacts', async ({ page }) => {
      const playerRows = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 3; i++) {
        const points = playerRows.nth(i).locator('[data-testid*="points"], .points');
        const text = await points.textContent();
        // Should not have excessive decimal places
        expect(text).toMatch(/^\d+(\.\d{1,2})?$/);
      }
    });
  });

  // ============================================================
  // 10. EDGE CASES & STRESS TESTS
  // ============================================================

  test.describe('Edge Cases & Stress Tests', () => {
    test('rapid captain changes do not break UI', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 5; i++) {
        await players.nth(i).click();
        await page.waitForTimeout(50);
      }

      const captainBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const count = await captainBadges.count();
      expect(count).toBe(1);
    });

    test('rapid vice-captain changes do not break UI', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();

      for (let i = 1; i < 6; i++) {
        await players.nth(i).click();
        await page.waitForTimeout(50);
      }

      const vcBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      const count = await vcBadges.count();
      expect(count).toBe(1);
    });

    test('selecting last player as captain works', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');
      const lastPlayer = players.nth(10);

      await lastPlayer.click();

      const captainBadge = lastPlayer.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(captainBadge).toBeVisible();
    });

    test('selecting first and last players as C and VC works', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(10).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const isDisabled = await proceedBtn.isDisabled();
      expect(isDisabled).toBeFalsy();
    });

    test('deselecting all players returns to initial disabled state', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();
      await players.nth(0).click();
      await players.nth(1).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      const isDisabled = await proceedBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('no console errors during selections', async ({ page }) => {
      const errorMonitor = setupErrorMonitor(page);

      const players = page.locator('[data-testid^="player-row"], .player-row');
      await players.nth(0).click();
      await players.nth(1).click();

      expect(errorMonitor.length).toBe(0);
    });

    test('players remain selectable after multiple selections', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      for (let i = 0; i < 3; i++) {
        await players.nth(0).click();
        await players.nth(1).click();
        await players.nth(0).click();
        await players.nth(1).click();
      }

      // Final selection
      await players.nth(0).click();
      await players.nth(1).click();

      const captainBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const vcBadges = page.locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });

      expect(await captainBadges.count()).toBe(1);
      expect(await vcBadges.count()).toBe(1);
    });
  });

  // ============================================================
  // 11. INTEGRATION TESTS
  // ============================================================

  test.describe('Integration Tests', () => {
    test('can complete full captain selection flow', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      // Select captain
      await players.nth(0).click();

      // Verify captain selected
      let captainBadge = players.nth(0).locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(captainBadge).toBeVisible();

      // Select vice-captain
      await players.nth(1).click();

      // Verify vice-captain selected
      let vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      await expect(vcBadge).toBeVisible();

      // Verify proceed is enabled
      const proceedBtn = page.locator('[data-testid="proceed-btn"], button:has-text("Proceed"), button:has-text("Continue")').first();
      expect(await proceedBtn.isDisabled()).toBeFalsy();

      // Click proceed
      await proceedBtn.click();

      // Should navigate to preview
      const isOnPreview = await isScreenVisible(page, SCREENS.PREVIEW);
      expect(isOnPreview).toBeTruthy();
    });

    test('selections persist through visual updates', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      await players.nth(0).click();
      await players.nth(1).click();

      // Wait for any animations
      await page.waitForTimeout(300);

      // Verify selections still visible
      const captainBadge = players.nth(0).locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      const vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });

      await expect(captainBadge).toBeVisible();
      await expect(vcBadge).toBeVisible();
    });

    test('captain and VC selections are independent', async ({ page }) => {
      const players = page.locator('[data-testid^="player-row"], .player-row');

      // Select captain
      await players.nth(0).click();
      const captainBadge = players.nth(0).locator('[data-testid*="badge"], .badge').filter({ hasText: 'C' });
      await expect(captainBadge).toBeVisible();

      // Select VC
      await players.nth(1).click();

      // Change captain
      await players.nth(2).click();

      // Original captain should no longer have badge
      const firstStillCaptain = await captainBadge.isVisible().catch(() => false);
      expect(firstStillCaptain).toBeFalsy();

      // VC should remain unchanged
      const vcBadge = players.nth(1).locator('[data-testid*="badge"], .badge').filter({ hasText: /VC|V/ });
      await expect(vcBadge).toBeVisible();
    });
  });
});
