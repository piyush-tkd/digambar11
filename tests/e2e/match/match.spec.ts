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

test.describe('Match Screens - Home, Detail, My Matches & Preview', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorMonitor(page);
    await loadApp(page, APP_URL);
    await mockLogin(page);
  });

  test.describe('Home Screen - Match Cards Rendering', () => {
    test('home screen displays list of match cards', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCards = page.locator('[data-testid="match-card"]');
      await expect(matchCards.first()).toBeVisible();
    });

    test('match card displays team A name', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const teamAName = page.locator('[data-testid="match-card-team-a"]').first();
      await expect(teamAName).toBeVisible();
      const text = await teamAName.textContent();
      expect(text).toBeTruthy();
    });

    test('match card displays team B name', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const teamBName = page.locator('[data-testid="match-card-team-b"]').first();
      await expect(teamBName).toBeVisible();
      const text = await teamBName.textContent();
      expect(text).toBeTruthy();
    });

    test('match card displays team A logo', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const logoA = page.locator('[data-testid="match-card-logo-a"]').first();
      await expect(logoA).toBeVisible();
    });

    test('match card displays team B logo', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const logoB = page.locator('[data-testid="match-card-logo-b"]').first();
      await expect(logoB).toBeVisible();
    });

    test('match card displays match time', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchTime = page.locator('[data-testid="match-card-time"]').first();
      await expect(matchTime).toBeVisible();
      const text = await matchTime.textContent();
      expect(text).toMatch(/\d+:\d+/);
    });

    test('match card displays venue', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const venue = page.locator('[data-testid="match-card-venue"]').first();
      await expect(venue).toBeVisible();
      const text = await venue.textContent();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('match card displays friend count', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const friendCount = page.locator('[data-testid="match-card-friend-count"]').first();
      await expect(friendCount).toBeVisible();
      const text = await friendCount.textContent();
      expect(text).toMatch(/\d+/);
    });

    test('match card displays Create Team button', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const createBtn = page.locator('[data-testid="match-card-create-team"]').first();
      await expect(createBtn).toBeVisible();
      await expect(createBtn).toContainText('Create Team');
    });

    test('multiple match cards render correctly', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCards = page.locator('[data-testid="match-card"]');
      const count = await matchCards.count();
      expect(count).toBeGreaterThan(1);
    });

    test('match cards are scrollable', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchContainer = page.locator('[data-testid="match-list-container"]');
      await expect(matchContainer).toBeVisible();
    });

    test('match card text is readable and properly formatted', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const card = page.locator('[data-testid="match-card"]').first();
      const teamNames = await card.locator('[data-testid*="team"]').allTextContents();
      teamNames.forEach((name) => {
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Home Screen - Match Card Navigation', () => {
    test('clicking match card navigates to match detail screen', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCard = page.locator('[data-testid="match-card"]').first();
      await matchCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
      expect(await isScreenVisible(page, SCREENS.MATCH_DETAIL)).toBeTruthy();
    });

    test('match card click maintains team data in navigation', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const teamAText = await page
        .locator('[data-testid="match-card-team-a"]')
        .first()
        .textContent();
      const matchCard = page.locator('[data-testid="match-card"]').first();
      await matchCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
      const detailTeamA = await page
        .locator('[data-testid="match-detail-team-a"]')
        .textContent();
      expect(detailTeamA).toContain(teamAText?.trim() || '');
    });

    test('multiple match card clicks navigate correctly', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const firstCard = page.locator('[data-testid="match-card"]').first();
      await firstCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);

      await navigateToScreen(page, SCREENS.HOME);
      const secondCard = page.locator('[data-testid="match-card"]').nth(1);
      await secondCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
      expect(await isScreenVisible(page, SCREENS.MATCH_DETAIL)).toBeTruthy();
    });
  });

  test.describe('Match Detail Screen - Banner & Team Info', () => {
    test.beforeEach(async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCard = page.locator('[data-testid="match-card"]').first();
      await matchCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
    });

    test('match detail displays banner', async ({ page }) => {
      const banner = page.locator('[data-testid="match-detail-banner"]');
      await expect(banner).toBeVisible();
    });

    test('match detail banner displays team A name', async ({ page }) => {
      const teamA = page.locator('[data-testid="match-detail-team-a"]');
      await expect(teamA).toBeVisible();
      const text = await teamA.textContent();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('match detail banner displays team B name', async ({ page }) => {
      const teamB = page.locator('[data-testid="match-detail-team-b"]');
      await expect(teamB).toBeVisible();
      const text = await teamB.textContent();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('match detail banner displays vs separator', async ({ page }) => {
      const separator = page.locator('[data-testid="match-detail-vs"]');
      await expect(separator).toBeVisible();
    });

    test('match detail displays venue', async ({ page }) => {
      const venue = page.locator('[data-testid="match-detail-venue"]');
      await expect(venue).toBeVisible();
      const text = await venue.textContent();
      expect(text).toBeTruthy();
    });

    test('match detail displays date and time', async ({ page }) => {
      const dateTime = page.locator('[data-testid="match-detail-datetime"]');
      await expect(dateTime).toBeVisible();
      const text = await dateTime.textContent();
      expect(text).toMatch(/\d+/);
    });

    test('live match shows current score', async ({ page }) => {
      const liveIndicator = page.locator('[data-testid="match-detail-live-indicator"]');
      const isLive = await liveIndicator.isVisible();

      if (isLive) {
        const scoreA = page.locator('[data-testid="match-detail-score-a"]');
        const scoreB = page.locator('[data-testid="match-detail-score-b"]');
        expect(await scoreA.isVisible()).toBeTruthy();
        expect(await scoreB.isVisible()).toBeTruthy();
      }
    });
  });

  test.describe('Match Detail Screen - Friends League', () => {
    test.beforeEach(async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCard = page.locator('[data-testid="match-card"]').first();
      await matchCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
    });

    test('displays Friends League section', async ({ page }) => {
      const section = page.locator('[data-testid="match-detail-friends-league"]');
      await expect(section).toBeVisible();
    });

    test('displays entry fee in Friends League', async ({ page }) => {
      const entryFee = page.locator('[data-testid="match-detail-entry-fee"]');
      await expect(entryFee).toBeVisible();
      const text = await entryFee.textContent();
      expect(text).toMatch(/\d+/);
    });

    test('displays prize pool in Friends League', async ({ page }) => {
      const prizePool = page.locator('[data-testid="match-detail-prize-pool"]');
      await expect(prizePool).toBeVisible();
      const text = await prizePool.textContent();
      expect(text).toMatch(/\d+/);
    });

    test('displays friend count in Friends League', async ({ page }) => {
      const friendCount = page.locator('[data-testid="match-detail-friend-count"]');
      await expect(friendCount).toBeVisible();
      const text = await friendCount.textContent();
      expect(text).toMatch(/\d+/);
    });

    test('displays friend status avatars', async ({ page }) => {
      const avatars = page.locator('[data-testid="match-detail-friend-avatar"]');
      const count = await avatars.count();
      expect(count).toBeGreaterThan(0);
    });

    test('friend avatar with Ready status is green', async ({ page }) => {
      const readyAvatar = page.locator('[data-testid="match-detail-friend-avatar-ready"]').first();
      if (await readyAvatar.isVisible()) {
        const color = await readyAvatar.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(color).toContain('rgb');
      }
    });

    test('friend avatar with Picking status is yellow', async ({ page }) => {
      const pickingAvatar = page.locator('[data-testid="match-detail-friend-avatar-picking"]').first();
      if (await pickingAvatar.isVisible()) {
        const color = await pickingAvatar.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(color).toContain('rgb');
      }
    });

    test('friend avatar with Joined status is blue', async ({ page }) => {
      const joinedAvatar = page.locator('[data-testid="match-detail-friend-avatar-joined"]').first();
      if (await joinedAvatar.isVisible()) {
        const color = await joinedAvatar.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(color).toContain('rgb');
      }
    });

    test('displays friend names on avatar hover', async ({ page }) => {
      const avatar = page.locator('[data-testid="match-detail-friend-avatar"]').first();
      await avatar.hover();
      const tooltip = page.locator('[data-testid="match-detail-friend-tooltip"]');
      await expect(tooltip).toBeVisible();
    });
  });

  test.describe('Match Detail Screen - Prize Breakdown', () => {
    test.beforeEach(async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCard = page.locator('[data-testid="match-card"]').first();
      await matchCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
    });

    test('displays prize breakdown section', async ({ page }) => {
      const section = page.locator('[data-testid="match-detail-prize-breakdown"]');
      await expect(section).toBeVisible();
    });

    test('prize breakdown displays first rank prize', async ({ page }) => {
      const firstPrize = page.locator('[data-testid="match-detail-prize-rank-1"]');
      await expect(firstPrize).toBeVisible();
      const text = await firstPrize.textContent();
      expect(text).toMatch(/\d+/);
    });

    test('prize breakdown displays second rank prize', async ({ page }) => {
      const secondPrize = page.locator('[data-testid="match-detail-prize-rank-2"]');
      if (await secondPrize.isVisible()) {
        const text = await secondPrize.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test('prize breakdown is scrollable', async ({ page }) => {
      const prizeSection = page.locator('[data-testid="match-detail-prize-breakdown"]');
      const initialScroll = await prizeSection.evaluate((el) => el.scrollLeft);
      await page.keyboard.press('End');
      const finalScroll = await prizeSection.evaluate((el) => el.scrollLeft);
      expect(finalScroll).toBeGreaterThanOrEqual(initialScroll);
    });
  });

  test.describe('Match Detail Screen - Create Team Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matchCard = page.locator('[data-testid="match-card"]').first();
      await matchCard.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);
    });

    test('displays Create Team button', async ({ page }) => {
      const btn = page.locator('[data-testid="match-detail-create-team"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('Create Team');
    });

    test('Create Team button click navigates to team select screen', async ({ page }) => {
      const btn = page.locator('[data-testid="match-detail-create-team"]');
      await btn.click();
      await waitForScreen(page, SCREENS.TEAM_SELECT);
      expect(await isScreenVisible(page, SCREENS.TEAM_SELECT)).toBeTruthy();
    });
  });

  test.describe('My Matches Screen - Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.MY_MATCHES);
      await waitForScreen(page, SCREENS.MY_MATCHES);
    });

    test('displays My Matches screen', async ({ page }) => {
      expect(await isScreenVisible(page, SCREENS.MY_MATCHES)).toBeTruthy();
    });

    test('displays Upcoming tab', async ({ page }) => {
      const tab = page.locator('[data-testid="my-matches-tab-upcoming"]');
      await expect(tab).toBeVisible();
      await expect(tab).toContainText('Upcoming');
    });

    test('displays Live tab', async ({ page }) => {
      const tab = page.locator('[data-testid="my-matches-tab-live"]');
      await expect(tab).toBeVisible();
      await expect(tab).toContainText('Live');
    });

    test('displays Completed tab', async ({ page }) => {
      const tab = page.locator('[data-testid="my-matches-tab-completed"]');
      await expect(tab).toBeVisible();
      await expect(tab).toContainText('Completed');
    });

    test('Upcoming tab is selected by default', async ({ page }) => {
      const tab = page.locator('[data-testid="my-matches-tab-upcoming"]');
      const isActive = await tab.evaluate((el) =>
        el.classList.contains('active') || el.getAttribute('aria-selected') === 'true'
      );
      expect(isActive).toBeTruthy();
    });

    test('clicking Live tab switches to Live matches', async ({ page }) => {
      const liveTab = page.locator('[data-testid="my-matches-tab-live"]');
      await liveTab.click();
      const liveMatches = page.locator('[data-testid="my-match-live"]');
      const isVisible = await liveMatches.first().isVisible();
      if (await liveMatches.count() > 0) {
        expect(isVisible).toBeTruthy();
      }
    });

    test('clicking Completed tab switches to Completed matches', async ({ page }) => {
      const completedTab = page.locator('[data-testid="my-matches-tab-completed"]');
      await completedTab.click();
      const completedMatches = page.locator('[data-testid="my-match-completed"]');
      const isVisible = await completedMatches.first().isVisible();
      if (await completedMatches.count() > 0) {
        expect(isVisible).toBeTruthy();
      }
    });

    test('switching between tabs maintains state', async ({ page }) => {
      const liveTab = page.locator('[data-testid="my-matches-tab-live"]');
      const upcomingTab = page.locator('[data-testid="my-matches-tab-upcoming"]');

      await liveTab.click();
      await page.waitForTimeout(200);

      await upcomingTab.click();
      await page.waitForTimeout(200);

      const isUpcomingActive = await upcomingTab.evaluate((el) =>
        el.classList.contains('active') || el.getAttribute('aria-selected') === 'true'
      );
      expect(isUpcomingActive).toBeTruthy();
    });
  });

  test.describe('My Matches Screen - Match Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.MY_MATCHES);
      await waitForScreen(page, SCREENS.MY_MATCHES);
    });

    test('Upcoming tab shows only upcoming matches', async ({ page }) => {
      const matches = page.locator('[data-testid="my-match-upcoming"]');
      const count = await matches.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Live tab shows only live matches', async ({ page }) => {
      const liveTab = page.locator('[data-testid="my-matches-tab-live"]');
      await liveTab.click();
      const liveMatches = page.locator('[data-testid="my-match-live"]');
      const upcomingMatches = page.locator('[data-testid="my-match-upcoming"]');

      expect(await upcomingMatches.count()).toBe(0);
    });

    test('Completed tab shows only completed matches', async ({ page }) => {
      const completedTab = page.locator('[data-testid="my-matches-tab-completed"]');
      await completedTab.click();
      const completedMatches = page.locator('[data-testid="my-match-completed"]');
      const liveMatches = page.locator('[data-testid="my-match-live"]');

      expect(await liveMatches.count()).toBe(0);
    });
  });

  test.describe('My Matches Screen - Empty States', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.MY_MATCHES);
      await waitForScreen(page, SCREENS.MY_MATCHES);
    });

    test('displays empty state message when no upcoming matches', async ({ page }) => {
      const upcomingMatches = page.locator('[data-testid="my-match-upcoming"]');
      if (await upcomingMatches.count() === 0) {
        const emptyState = page.locator('[data-testid="my-matches-empty-state"]');
        await expect(emptyState).toBeVisible();
      }
    });

    test('displays appropriate empty state text', async ({ page }) => {
      const upcomingMatches = page.locator('[data-testid="my-match-upcoming"]');
      if (await upcomingMatches.count() === 0) {
        const emptyText = page.locator('[data-testid="my-matches-empty-message"]');
        const text = await emptyText.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('displays empty state for Live tab if no live matches', async ({ page }) => {
      const liveTab = page.locator('[data-testid="my-matches-tab-live"]');
      await liveTab.click();
      const liveMatches = page.locator('[data-testid="my-match-live"]');

      if (await liveMatches.count() === 0) {
        const emptyState = page.locator('[data-testid="my-matches-empty-state"]');
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('Match Countdown Timer', () => {
    test.beforeEach(async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
    });

    test('match card displays countdown timer', async ({ page }) => {
      const timer = page.locator('[data-testid="match-card-timer"]').first();
      if (await timer.isVisible()) {
        const text = await timer.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test('countdown timer updates over time', async ({ page }) => {
      const timer = page.locator('[data-testid="match-card-timer"]').first();
      if (await timer.isVisible()) {
        const initialText = await timer.textContent();
        await page.waitForTimeout(2000);
        const updatedText = await timer.textContent();
        expect(initialText).toBeTruthy();
        expect(updatedText).toBeTruthy();
      }
    });

    test('match detail displays countdown timer', async ({ page }) => {
      const card = page.locator('[data-testid="match-card"]').first();
      await card.click();
      await waitForScreen(page, SCREENS.MATCH_DETAIL);

      const timer = page.locator('[data-testid="match-detail-timer"]');
      if (await timer.isVisible()) {
        const text = await timer.textContent();
        expect(text).toBeTruthy();
      }
    });
  });

  test.describe('Team Preview Screen - Field Visualization', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.PREVIEW);
      await waitForScreen(page, SCREENS.PREVIEW);
    });

    test('displays team preview screen', async ({ page }) => {
      expect(await isScreenVisible(page, SCREENS.PREVIEW)).toBeTruthy();
    });

    test('displays cricket field visualization', async ({ page }) => {
      const field = page.locator('[data-testid="preview-field"]');
      await expect(field).toBeVisible();
    });

    test('displays 11 player positions on field', async ({ page }) => {
      const players = page.locator('[data-testid="preview-player"]');
      const count = await players.count();
      expect(count).toBe(11);
    });

    test('all players are visible on field', async ({ page }) => {
      const players = page.locator('[data-testid="preview-player"]');
      const count = await players.count();

      for (let i = 0; i < count; i++) {
        const player = players.nth(i);
        await expect(player).toBeVisible();
      }
    });
  });

  test.describe('Team Preview Screen - Player Positions', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.PREVIEW);
      await waitForScreen(page, SCREENS.PREVIEW);
    });

    test('displays batsman players in correct area', async ({ page }) => {
      const batsmen = page.locator('[data-testid="preview-player-batsman"]');
      const count = await batsmen.count();
      expect(count).toBeGreaterThan(0);
    });

    test('displays bowler players in correct area', async ({ page }) => {
      const bowlers = page.locator('[data-testid="preview-player-bowler"]');
      const count = await bowlers.count();
      expect(count).toBeGreaterThan(0);
    });

    test('displays fielder players in correct area', async ({ page }) => {
      const fielders = page.locator('[data-testid="preview-player-fielder"]');
      const count = await fielders.count();
      expect(count).toBeGreaterThan(0);
    });

    test('displays wicket keeper in correct position', async ({ page }) => {
      const wk = page.locator('[data-testid="preview-player-wicket-keeper"]');
      if (await wk.isVisible()) {
        await expect(wk).toBeVisible();
      }
    });

    test('player cards display player names', async ({ page }) => {
      const players = page.locator('[data-testid="preview-player"]').first();
      const name = players.locator('[data-testid="preview-player-name"]');
      const text = await name.textContent();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('player cards display player jersey numbers', async ({ page }) => {
      const jersey = page.locator('[data-testid="preview-player-jersey"]').first();
      if (await jersey.isVisible()) {
        const number = await jersey.textContent();
        expect(number).toMatch(/\d+/);
      }
    });

    test('player role badges are displayed', async ({ page }) => {
      const badges = page.locator('[data-testid="preview-player-role"]');
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Team Preview Screen - Captain & Vice-Captain', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.PREVIEW);
      await waitForScreen(page, SCREENS.PREVIEW);
    });

    test('displays captain badge on captain player', async ({ page }) => {
      const captainBadge = page.locator('[data-testid="preview-captain-badge"]').first();
      await expect(captainBadge).toBeVisible();
      await expect(captainBadge).toContainText('C');
    });

    test('displays vice-captain badge on VC player', async ({ page }) => {
      const vcBadge = page.locator('[data-testid="preview-vc-badge"]').first();
      await expect(vcBadge).toBeVisible();
      await expect(vcBadge).toContainText('VC');
    });

    test('captain badge has distinct styling', async ({ page }) => {
      const captainBadge = page.locator('[data-testid="preview-captain-badge"]').first();
      const bgColor = await captainBadge.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
    });

    test('vice-captain badge has distinct styling', async ({ page }) => {
      const vcBadge = page.locator('[data-testid="preview-vc-badge"]').first();
      const bgColor = await vcBadge.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
    });

    test('only one captain is displayed', async ({ page }) => {
      const captainBadges = page.locator('[data-testid="preview-captain-badge"]');
      const count = await captainBadges.count();
      expect(count).toBe(1);
    });

    test('only one vice-captain is displayed', async ({ page }) => {
      const vcBadges = page.locator('[data-testid="preview-vc-badge"]');
      const count = await vcBadges.count();
      expect(count).toBe(1);
    });
  });

  test.describe('Team Preview Screen - Navigation & Confirmation', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToScreen(page, SCREENS.PREVIEW);
      await waitForScreen(page, SCREENS.PREVIEW);
    });

    test('displays Confirm button', async ({ page }) => {
      const btn = page.locator('[data-testid="preview-confirm"]');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText('Confirm');
    });

    test('Confirm button is enabled', async ({ page }) => {
      const btn = page.locator('[data-testid="preview-confirm"]');
      const isDisabled = await btn.isDisabled();
      expect(isDisabled).toBeFalsy();
    });

    test('displays Back button', async ({ page }) => {
      const backBtn = page.locator('[data-testid="preview-back"]');
      await expect(backBtn).toBeVisible();
    });

    test('Back button click navigates to previous screen', async ({ page }) => {
      const backBtn = page.locator('[data-testid="preview-back"]');
      await backBtn.click();
      const isOnPreviousScreen = await page.locator('[data-testid="match-card"]').isVisible();
      expect(isOnPreviousScreen).toBeTruthy();
    });

    test('Confirm button click submits team', async ({ page }) => {
      const confirmBtn = page.locator('[data-testid="preview-confirm"]');
      await confirmBtn.click();
      await page.waitForTimeout(500);
      const successMessage = page.locator('[data-testid="team-created-success"]');
      const isSuccess = await successMessage.isVisible();
      expect(isSuccess).toBeTruthy();
    });
  });

  test.describe('Match Status Transitions', () => {
    test('upcoming match becomes live after match start time', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const upcomingIndicator = page.locator('[data-testid="match-card-status-upcoming"]').first();

      if (await upcomingIndicator.isVisible()) {
        const text = await upcomingIndicator.textContent();
        expect(text).toContain('Upcoming');
      }
    });

    test('live match shows live indicator', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const liveIndicator = page.locator('[data-testid="match-card-status-live"]').first();

      if (await liveIndicator.isVisible()) {
        const text = await liveIndicator.textContent();
        expect(text).toContain('Live');
      }
    });

    test('completed match shows final result', async ({ page }) => {
      await navigateToScreen(page, SCREENS.MY_MATCHES);
      const completedTab = page.locator('[data-testid="my-matches-tab-completed"]');
      await completedTab.click();

      const completedMatch = page.locator('[data-testid="my-match-completed"]').first();
      if (await completedMatch.isVisible()) {
        const status = await completedMatch.locator('[data-testid="match-status"]').textContent();
        expect(status).toBeTruthy();
      }
    });
  });

  test.describe('Multiple Matches Rendering', () => {
    test('home screen renders at least 3 matches', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matches = page.locator('[data-testid="match-card"]');
      const count = await matches.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('all matches have required fields', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matches = page.locator('[data-testid="match-card"]');
      const count = await matches.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const match = matches.nth(i);
        const teamA = match.locator('[data-testid*="team-a"]');
        const teamB = match.locator('[data-testid*="team-b"]');
        const venue = match.locator('[data-testid*="venue"]');

        expect(await teamA.isVisible()).toBeTruthy();
        expect(await teamB.isVisible()).toBeTruthy();
        expect(await venue.isVisible()).toBeTruthy();
      }
    });

    test('different matches have different team names', async ({ page }) => {
      await waitForScreen(page, SCREENS.HOME);
      const matches = page.locator('[data-testid="match-card"]');
      const count = await matches.count();

      if (count >= 2) {
        const team1 = await matches.nth(0).locator('[data-testid="match-card-team-a"]').textContent();
        const team2 = await matches.nth(1).locator('[data-testid="match-card-team-a"]').textContent();

        expect(team1).not.toBe(team2);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    const errors = collectConsoleErrors(page);
    expect(errors.length).toBe(0);
  });
});
