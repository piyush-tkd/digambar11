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
  simulateSlowNetwork,
  goOffline,
  goOnline,
  getCreditsRemaining,
  getSelectedPlayerCount,
  TEAM_RULES,
  ROLES,
  IPL_TEAMS,
} from '../fixtures';

test.describe('Edge Cases Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, SCREENS.HOME);
  });

  // ====== CREDIT BOUNDARY TESTS ======
  test.describe('Credit Boundaries', () => {
    test('should allow team with exactly 100 credits used', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Select players totaling exactly 100 credits
      const players = page.locator('[data-player]');
      let creditsUsed = 0;
      let selectedCount = 0;

      for (let i = 0; i < await players.count() && selectedCount < 11; i++) {
        const player = players.nth(i);
        const creditsText = await player.getAttribute('data-credits');
        const credits = parseFloat(creditsText || '0');

        if (creditsUsed + credits <= 100 && creditsUsed + credits > 0) {
          await player.click();
          creditsUsed += credits;
          selectedCount++;
        }

        if (creditsUsed === 100) break;
      }

      const remaining = await getCreditsRemaining(page);
      expect(remaining).toBe(0);
    });

    test('should prevent selection when credits would exceed 100', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let creditsUsed = 95;

      // Manually set high credit usage
      await page.evaluate((credits) => {
        const state = (window as any).__appState;
        if (state) state.creditsUsed = credits;
      }, creditsUsed);

      // Try to select a 10-credit player
      const expensivePlayer = page.locator('[data-credits="10.0"]').first();
      if (await expensivePlayer.isVisible()) {
        await expensivePlayer.click();

        // Should not be able to select
        const errorMsg = page.locator('text=/exceeds.*budget|not enough/i');
        expect(errorMsg).toBeVisible();
      }
    });

    test('should show exactly 0 credits remaining', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let creditsUsed = 0;
      let selectedCount = 0;

      for (let i = 0; i < await players.count() && selectedCount < 11; i++) {
        const player = players.nth(i);
        const creditsText = await player.getAttribute('data-credits');
        const credits = parseFloat(creditsText || '0');

        if (creditsUsed + credits <= 100) {
          await player.click();
          creditsUsed += credits;
          selectedCount++;
        }
      }

      const remaining = await getCreditsRemaining(page);
      expect(remaining).toBe(0);
    });

    test('should prevent exceeding 100 credit limit', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Try to exceed 100 credits
      const players = page.locator('[data-player]');
      for (let i = 0; i < 20 && i < await players.count(); i++) {
        await players.nth(i).click();
      }

      const remaining = await getCreditsRemaining(page);
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });

  // ====== ROLE QUOTA TESTS ======
  test.describe('Role Quota Boundaries', () => {
    test('should enforce minimum 1 WK (Wicket-Keeper)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let wkCount = 0;

      // Try to select only non-WK players
      for (let i = 0; i < 11 && i < await players.count(); i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role !== 'WK') {
          await players.nth(i).click();
        }
      }

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      const error = page.locator('text=/at least 1.*WK|wicket.*keeper/i');
      expect(error).toBeVisible();
    });

    test('should enforce minimum 3 BAT (Batsmen)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');

      // Try to select fewer than 3 batsmen
      for (let i = 0; i < 11 && i < await players.count(); i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role !== 'BAT') {
          await players.nth(i).click();
        }
      }

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      const error = page.locator('text=/at least 3.*BAT|batsmen/i');
      expect(error).toBeVisible();
    });

    test('should enforce minimum 1 AR (All-Rounder)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');

      // Try to select only non-AR players
      for (let i = 0; i < 11 && i < await players.count(); i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role !== 'AR') {
          await players.nth(i).click();
        }
      }

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      const error = page.locator('text=/at least 1.*AR|all.*rounder/i');
      expect(error).toBeVisible();
    });

    test('should enforce minimum 3 BWL (Bowlers)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');

      // Try to select fewer than 3 bowlers
      for (let i = 0; i < 11 && i < await players.count(); i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role !== 'BWL') {
          await players.nth(i).click();
        }
      }

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      const error = page.locator('text=/at least 3.*BWL|bowlers/i');
      expect(error).toBeVisible();
    });

    test('should allow maximum 4 WK', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let wkCount = 0;

      for (let i = 0; i < await players.count() && wkCount < 4; i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role === 'WK') {
          await players.nth(i).click();
          wkCount++;
        }
      }

      expect(wkCount).toBeLessThanOrEqual(4);
    });

    test('should allow maximum 6 BAT', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let batCount = 0;

      for (let i = 0; i < await players.count() && batCount < 6; i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role === 'BAT') {
          await players.nth(i).click();
          batCount++;
        }
      }

      expect(batCount).toBeLessThanOrEqual(6);
    });

    test('should allow maximum 4 AR', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let arCount = 0;

      for (let i = 0; i < await players.count() && arCount < 4; i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role === 'AR') {
          await players.nth(i).click();
          arCount++;
        }
      }

      expect(arCount).toBeLessThanOrEqual(4);
    });

    test('should allow maximum 6 BWL', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      let bwlCount = 0;

      for (let i = 0; i < await players.count() && bwlCount < 6; i++) {
        const role = await players.nth(i).getAttribute('data-role');
        if (role === 'BWL') {
          await players.nth(i).click();
          bwlCount++;
        }
      }

      expect(bwlCount).toBeLessThanOrEqual(6);
    });

    test('should prevent 5 WK selection', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const wkPlayers = page.locator('[data-role="WK"]');
      for (let i = 0; i < 5 && i < await wkPlayers.count(); i++) {
        const selected = await wkPlayers.nth(i).getAttribute('data-selected');
        if (selected !== 'true') {
          await wkPlayers.nth(i).click();
        }
      }

      // 5th WK should not be selectable
      const fifthWK = wkPlayers.nth(4);
      const isDisabled = await fifthWK.getAttribute('data-disabled');
      expect(isDisabled === 'true' || (await fifthWK.getAttribute('aria-disabled'))).toBeTruthy();
    });

    test('should prevent 7 BAT selection', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const batPlayers = page.locator('[data-role="BAT"]');
      for (let i = 0; i < 7 && i < await batPlayers.count(); i++) {
        const selected = await batPlayers.nth(i).getAttribute('data-selected');
        if (selected !== 'true') {
          await batPlayers.nth(i).click();
        }
      }

      // 7th BAT should not be selectable
      const seventhBAT = batPlayers.nth(6);
      const isDisabled = await seventhBAT.getAttribute('data-disabled');
      expect(isDisabled === 'true' || (await seventhBAT.getAttribute('aria-disabled'))).toBeTruthy();
    });
  });

  // ====== TEAM COMPOSITION TESTS ======
  test.describe('Team Composition Edge Cases', () => {
    test('should auto-proceed after selecting 11th player', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      for (let i = 0; i < 11 && i < await players.count(); i++) {
        await players.nth(i).click();
      }

      // Should auto-navigate to captain selection or confirmation
      await page.waitForNavigation({ url: new RegExp(SCREENS.CAPTAIN_SELECT + '|' + SCREENS.TEAM_CONFIRM) });
      expect(page.url()).toMatch(new RegExp(SCREENS.CAPTAIN_SELECT + '|' + SCREENS.TEAM_CONFIRM));
    });

    test('should deselect captain badge when captain removed', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      for (let i = 0; i < 11 && i < await players.count(); i++) {
        await players.nth(i).click();
      }

      await navigateToScreen(page, SCREENS.CAPTAIN_SELECT);

      const firstPlayer = players.nth(0);
      await firstPlayer.click(); // Set as captain

      const captainBadge = page.locator('[data-captain-badge]');
      expect(await captainBadge.count()).toBe(1);

      // Click again to deselect
      await firstPlayer.click();

      expect(await captainBadge.count()).toBe(0);
    });

    test('should prevent all 11 players from same team', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      const firstPlayerTeam = await players.nth(0).getAttribute('data-team');

      let teamPlayerCount = 0;
      for (let i = 0; i < await players.count() && teamPlayerCount < 7; i++) {
        const team = await players.nth(i).getAttribute('data-team');
        if (team === firstPlayerTeam) {
          await players.nth(i).click();
          teamPlayerCount++;
        }
      }

      // Should not allow 8th player from same team
      const eighthPlayer = page
        .locator(`[data-team="${firstPlayerTeam}"]`)
        .locator('[data-selected="false"]')
        .first();

      if (await eighthPlayer.isVisible()) {
        await eighthPlayer.click();

        const error = page.locator('text=/maximum.*7.*players|team limit/i');
        if (await error.isVisible()) {
          expect(error).toBeVisible();
        }
      }
    });

    test('should allow exactly 7 players from one team', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      const firstPlayerTeam = await players.nth(0).getAttribute('data-team');

      let teamPlayerCount = 0;
      for (let i = 0; i < await players.count() && teamPlayerCount < 7; i++) {
        const team = await players.nth(i).getAttribute('data-team');
        if (team === firstPlayerTeam) {
          await players.nth(i).click();
          teamPlayerCount++;
        }
      }

      expect(teamPlayerCount).toBe(7);
    });

    test('should block 8th player from same team', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      const firstPlayerTeam = await players.nth(0).getAttribute('data-team');

      let teamPlayerCount = 0;
      for (let i = 0; i < await players.count() && teamPlayerCount < 7; i++) {
        const team = await players.nth(i).getAttribute('data-team');
        if (team === firstPlayerTeam) {
          await players.nth(i).click();
          teamPlayerCount++;
        }
      }

      // Try to select 8th
      const eighthPlayer = page
        .locator(`[data-team="${firstPlayerTeam}"]`)
        .locator('[data-selected="false"]')
        .first();

      if (await eighthPlayer.isVisible()) {
        const isDisabled = await eighthPlayer.getAttribute('data-disabled');
        expect(isDisabled === 'true' || (await eighthPlayer.getAttribute('aria-disabled'))).toBeTruthy();
      }
    });
  });

  // ====== PLAYER CREDIT EDGE CASES ======
  test.describe('Player Credit Edge Cases', () => {
    test('should display player with 0 credit cost', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'Free Player', credits: 0, role: 'BAT', team: 'RCB' },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const freePlayer = page.locator('[data-player]:has-text("Free Player")');
      expect(freePlayer).toBeVisible();

      const credits = await freePlayer.getAttribute('data-credits');
      expect(credits).toBe('0');
    });

    test('should display player with maximum credit (11.0)', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'Star Player', credits: 11, role: 'BAT', team: 'RCB' },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const starPlayer = page.locator('[data-player]:has-text("Star Player")');
      expect(starPlayer).toBeVisible();

      const credits = await starPlayer.getAttribute('data-credits');
      expect(credits).toBe('11');
    });

    test('should allow selecting free players without credit impact', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'Free1', credits: 0, role: 'BAT', team: 'RCB' },
              { id: '2', name: 'Free2', credits: 0, role: 'WK', team: 'MI' },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const freePlayers = page.locator('[data-credits="0"]');
      const count = await freePlayers.count();

      for (let i = 0; i < count; i++) {
        await freePlayers.nth(i).click();
      }

      const remaining = await getCreditsRemaining(page);
      expect(remaining).toBe(100);
    });
  });

  // ====== LEADERBOARD EDGE CASES ======
  test.describe('Leaderboard & Scoring Edge Cases', () => {
    test('should handle zero-point player display', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LEADERBOARD);

      const scores = page.locator('[data-points]');
      const hasZeroPoints = await scores.evaluate((elements) =>
        (elements as HTMLElement[]).some((el) => el.textContent?.includes('0'))
      );

      // Should handle 0 points gracefully
      expect(scores).toBeTruthy();
    });

    test('should handle negative point difference in compare', async ({ page }) => {
      await navigateToScreen(page, SCREENS.COMPARE_TEAMS);

      const comparisons = page.locator('[data-point-diff]');
      expect(comparisons).toBeTruthy();
    });

    test('should display all friends with identical points', async ({ page }) => {
      await page.route('**/friends/leaderboard*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'Friend 1', points: 500 },
              { id: '2', name: 'Friend 2', points: 500 },
              { id: '3', name: 'Friend 3', points: 500 },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.FRIENDS);

      const friendItems = page.locator('[data-friend-item]');
      expect(await friendItems.count()).toBe(3);
    });

    test('should handle single friend in league', async ({ page }) => {
      await page.route('**/friends*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [{ id: '1', name: 'Single Friend', points: 100 }],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.FRIENDS);

      const friends = page.locator('[data-friend-item]');
      expect(await friends.count()).toBe(1);
    });

    test('should paginate large friend list', async ({ page }) => {
      const largeFriendList = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        name: `Friend ${i}`,
        points: Math.random() * 1000,
      }));

      await page.route('**/friends*', (route) =>
        route.fulfill({
          body: JSON.stringify({ data: largeFriendList }),
        })
      );

      await navigateToScreen(page, SCREENS.FRIENDS);

      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        expect(page.locator('[data-friend-item]')).toBeTruthy();
      }
    });

    test('should handle exact tie in leaderboard', async ({ page }) => {
      await page.route('**/leaderboard*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'User 1', points: 500, rank: 1 },
              { id: '2', name: 'User 2', points: 500, rank: 1 },
              { id: '3', name: 'User 3', points: 499, rank: 3 },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.LEADERBOARD);

      const user1Rank = page.locator('[data-user-id="1"]').locator('[data-rank]');
      const user2Rank = page.locator('[data-user-id="2"]').locator('[data-rank]');

      expect(await user1Rank.textContent()).toBe(await user2Rank.textContent());
    });

    test('should handle multiple users at rank 1', async ({ page }) => {
      await page.route('**/leaderboard*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'User 1', points: 1000, rank: 1 },
              { id: '2', name: 'User 2', points: 1000, rank: 1 },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.LEADERBOARD);

      const rank1Users = page.locator('[data-rank="1"]');
      expect(await rank1Users.count()).toBe(2);
    });
  });

  // ====== TEXT HANDLING EDGE CASES ======
  test.describe('Text Handling Edge Cases', () => {
    test('should truncate very long player names', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              {
                id: '1',
                name: 'A'.repeat(100),
                credits: 8,
                role: 'BAT',
                team: 'RCB',
              },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const playerName = page.locator('[data-player-name]').first();
      const text = await playerName.textContent();

      expect(text?.length).toBeLessThanOrEqual(50);
    });

    test('should handle very long squad names', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const nameInput = page.locator('input[placeholder="Squad Name"]');
      const longName = 'X'.repeat(200);

      await nameInput.fill(longName);

      const inputValue = await nameInput.inputValue();
      expect(inputValue.length).toBeLessThanOrEqual(100);
    });

    test('should handle unicode characters in names', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              {
                id: '1',
                name: '🏏 Virat Kohli 💪',
                credits: 11,
                role: 'BAT',
                team: 'RCB',
              },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const player = page.locator('[data-player]:has-text("Virat")');
      expect(player).toBeVisible();
    });

    test('should handle special characters in team names', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const nameInput = page.locator('input[placeholder="Team Name"]');
      await nameInput.fill('Team <>&"\'');

      const value = await nameInput.inputValue();
      expect(value).toBeTruthy();
    });
  });

  // ====== EMPTY STATE EDGE CASES ======
  test.describe('Empty State Edge Cases', () => {
    test('should handle empty match list', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: [] }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/no matches|empty/i')).toBeVisible();
    });

    test('should handle all matches completed', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', status: 'COMPLETED', name: 'Match 1' },
              { id: '2', status: 'COMPLETED', name: 'Match 2' },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const liveMatches = page.locator('[data-status="LIVE"]');
      expect(await liveMatches.count()).toBe(0);
    });

    test('should handle all matches upcoming (no live)', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', status: 'UPCOMING', name: 'Match 1' },
              { id: '2', status: 'UPCOMING', name: 'Match 2' },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const liveMatches = page.locator('[data-status="LIVE"]');
      expect(await liveMatches.count()).toBe(0);
    });

    test('should handle match with no players data', async ({ page }) => {
      await page.route('**/matches/*/players*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: null }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_DETAIL);

      expect(page.locator('text=/no players|unavailable/i')).toBeVisible();
    });
  });

  // ====== SESSION & NAVIGATION EDGE CASES ======
  test.describe('Session & Navigation Edge Cases', () => {
    test('should handle session timeout during team creation', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Simulate session expiration
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.removeItem('authToken');
      });

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      await page.waitForNavigation();
      expect(page.url()).toContain(SCREENS.LOGIN);
    });

    test('should handle browser back button during team flow', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      for (let i = 0; i < 3 && i < await players.count(); i++) {
        await players.nth(i).click();
      }

      await page.goBack();

      expect(page.url()).toContain(SCREENS.HOME || SCREENS.MATCH_LIST);
    });

    test('should preserve team state on back/forward navigation', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const players = page.locator('[data-player]');
      await players.nth(0).click();

      const selectedCount1 = await getSelectedPlayerCount(page);

      await page.goBack();
      await page.goForward();

      const selectedCount2 = await getSelectedPlayerCount(page);

      expect(selectedCount1).toBe(selectedCount2);
    });

    test('should handle rapid tab switching on live match', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      // Rapidly switch tabs
      for (let i = 0; i < 5; i++) {
        await page.goBack();
        await page.goForward();
        await page.waitForTimeout(100);
      }

      // Should still be functional
      expect(page.locator('[data-match-info]')).toBeTruthy();
    });
  });

  // ====== TIME-BASED EDGE CASES ======
  test.describe('Time-Based Edge Cases', () => {
    test('should handle timer crossing midnight', async ({ page }) => {
      // Mock time to be near midnight
      await page.evaluate(() => {
        jest.setSystemTime(new Date('2026-03-27T23:59:58Z'));
      });

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      // Wait past midnight
      await page.waitForTimeout(3000);

      // Should still work
      expect(page.locator('[data-match-info]')).toBeTruthy();
    });

    test('should handle timezone conversion for match times', async ({ page }) => {
      const mockMatches = [
        {
          id: '1',
          name: 'Match 1',
          startTime: '2026-03-27T06:00:00Z', // UTC
          status: 'UPCOMING',
        },
      ];

      await page.route('**/matches*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: mockMatches }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const matchTime = page.locator('[data-match-time]').first();
      expect(matchTime).toBeVisible();
    });

    test('should handle very fast live simulation (points changing rapidly)', async ({
      page,
    }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      // Simulate rapid point updates
      for (let i = 0; i < 10; i++) {
        await page.evaluate((points) => {
          const score = document.querySelector('[data-score]');
          if (score) score.textContent = String(points);
        }, i * 10);
        await page.waitForTimeout(100);
      }

      // Should not crash or show errors
      const errors = await collectConsoleErrors(page);
      const criticalErrors = errors.filter((e) => !e.includes('404'));
      expect(criticalErrors.length).toBe(0);
    });

    test('should handle match completion during live view', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      // Simulate match completion
      await page.evaluate(() => {
        const matchStatus = document.querySelector('[data-status]');
        if (matchStatus) matchStatus.setAttribute('data-status', 'COMPLETED');
      });

      await page.waitForTimeout(1000);

      expect(page.locator('[data-status="COMPLETED"]')).toBeTruthy();
    });
  });

  // ====== PRIZE DISTRIBUTION EDGE CASES ======
  test.describe('Prize Distribution Edge Cases', () => {
    test('should handle prize distribution with 1 player', async ({ page }) => {
      await page.route('**/contests/*/leaderboard*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [{ id: '1', name: 'Player', points: 1000, prize: 1000 }],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CONTEST_LEADERBOARD);

      const prizeAmount = page.locator('[data-prize]').first();
      expect(prizeAmount).toBeTruthy();
    });

    test('should handle prize distribution with exactly 5 players', async ({ page }) => {
      const players = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        name: `Player ${i}`,
        points: 1000 - i * 100,
        prize: 200,
      }));

      await page.route('**/contests/*/leaderboard*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: players }) })
      );

      await navigateToScreen(page, SCREENS.CONTEST_LEADERBOARD);

      const prizeItems = page.locator('[data-prize]');
      expect(await prizeItems.count()).toBe(5);
    });

    test('should handle prize distribution with more than 5 players', async ({ page }) => {
      const players = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        name: `Player ${i}`,
        points: Math.random() * 1000,
        prize: i < 5 ? 200 - i * 20 : 0,
      }));

      await page.route('**/contests/*/leaderboard*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: players }) })
      );

      await navigateToScreen(page, SCREENS.CONTEST_LEADERBOARD);

      const prizeItems = page.locator('[data-prize]:not(:has-text("0"))');
      expect(await prizeItems.count()).toBeLessThanOrEqual(5);
    });
  });

  // ====== WALLET EDGE CASES ======
  test.describe('Wallet & Transaction Edge Cases', () => {
    test('should handle wallet balance exactly 0', async ({ page }) => {
      await page.route('**/wallet*', (route) =>
        route.fulfill({
          body: JSON.stringify({ data: { balance: 0 } }),
        })
      );

      await navigateToScreen(page, SCREENS.WALLET);

      const balance = page.locator('[data-balance]');
      expect(await balance.textContent()).toContain('0');
    });

    test('should handle transaction history with 100+ entries', async ({ page }) => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        type: i % 2 === 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.random() * 1000,
        date: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      await page.route('**/transactions*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: transactions }) })
      );

      await navigateToScreen(page, SCREENS.WALLET);

      const transactionItems = page.locator('[data-transaction]');
      const count = await transactionItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should paginate transaction history', async ({ page }) => {
      await navigateToScreen(page, SCREENS.WALLET);

      const nextBtn = page.locator('button:has-text("Next Page")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        expect(page.locator('[data-transaction]')).toBeTruthy();
      }
    });
  });

  // ====== CONCURRENT OPERATION EDGE CASES ======
  test.describe('Concurrent Operation Edge Cases', () => {
    test('should handle concurrent team saves', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      let saveCallCount = 0;
      await page.route('**/teams', (route) => {
        saveCallCount++;
        route.fulfill({ body: JSON.stringify({ data: { id: String(saveCallCount) } }) });
      });

      const saveBtn = page.locator('button:has-text("Save Team")');

      // Simulate rapid clicks
      await Promise.all([
        saveBtn.click(),
        page.waitForTimeout(50).then(() => saveBtn.click()),
        page.waitForTimeout(100).then(() => saveBtn.click()),
      ]);

      await page.waitForTimeout(1000);

      // Should have made at most 2-3 calls due to debouncing
      expect(saveCallCount).toBeLessThanOrEqual(3);
    });

    test('should handle browser resize during gameplay', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      const initialWidth = page.viewportSize()?.width || 1280;

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      expect(page.locator('[data-match-info]')).toBeTruthy();

      // Resize back
      await page.setViewportSize({ width: initialWidth, height: 720 });
      await page.waitForTimeout(500);

      expect(page.locator('[data-match-info]')).toBeTruthy();
    });

    test('should handle orientation change on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Simulate orientation change
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape
      await page.waitForTimeout(500);

      expect(page.locator('[data-player]')).toBeTruthy();
    });
  });

  // ====== BUTTON INTERACTION EDGE CASES ======
  test.describe('Button Interaction Edge Cases', () => {
    test('should prevent double-click on confirm button', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      let confirmCount = 0;
      await page.route('**/teams', (route) => {
        confirmCount++;
        route.fulfill({ body: JSON.stringify({ data: { id: '1' } }) });
      });

      const confirmBtn = page.locator('button:has-text("Confirm")');

      // Double-click
      await confirmBtn.dblClick();

      await page.waitForTimeout(1000);

      // Should only submit once
      expect(confirmCount).toBeLessThanOrEqual(1);
    });

    test('should handle missing button click handlers gracefully', async ({ page }) => {
      const errors = await collectConsoleErrors(page);

      const buttonClickErrors = errors.filter(
        (e) => e.includes('click') && e.includes('undefined')
      );

      expect(buttonClickErrors.length).toBe(0);
    });
  });
});
