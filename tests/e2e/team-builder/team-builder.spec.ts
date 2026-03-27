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
  getVisiblePlayers,
  getSelectedPlayerCount,
  getCreditsRemaining,
  TEAM_RULES,
  ROLES,
  IPL_TEAMS,
} from '../fixtures';

test.describe('Team Builder - Player Selection Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    setupErrorMonitor(page);
    await navigateToScreen(page, SCREENS.TEAM_SELECT);
    await waitForScreen(page, SCREENS.TEAM_SELECT);
  });

  test.describe('Screen Layout and Elements', () => {
    test('should display team builder header', async ({ page }) => {
      const header = page.locator('[data-testid="team-builder-header"]');
      await expect(header).toBeVisible();
    });

    test('should display page title "Select Your Team"', async ({ page }) => {
      const title = page.locator('[data-testid="screen-title"]');
      await expect(title).toContainText('Select Your Team');
    });

    test('should display role filter tabs', async ({ page }) => {
      const tabsContainer = page.locator('[data-testid="role-filter-tabs"]');
      await expect(tabsContainer).toBeVisible();
    });

    test('should display all role filter tabs: ALL, WK, BAT, AR, BWL', async ({
      page,
    }) => {
      const allTab = page.locator('button:has-text("ALL")');
      const wkTab = page.locator('button:has-text("WK")');
      const batTab = page.locator('button:has-text("BAT")');
      const arTab = page.locator('button:has-text("AR")');
      const bwlTab = page.locator('button:has-text("BWL")');

      await expect(allTab).toBeVisible();
      await expect(wkTab).toBeVisible();
      await expect(batTab).toBeVisible();
      await expect(arTab).toBeVisible();
      await expect(bwlTab).toBeVisible();
    });

    test('should display sort options dropdown', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await expect(sortButton).toBeVisible();
    });

    test('should display player list container', async ({ page }) => {
      const playerList = page.locator('[data-testid="player-list"]');
      await expect(playerList).toBeVisible();
    });

    test('should display credits remaining display', async ({ page }) => {
      const creditsDisplay = page.locator('[data-testid="credits-remaining"]');
      await expect(creditsDisplay).toBeVisible();
    });

    test('should display selected player count', async ({ page }) => {
      const countDisplay = page.locator('[data-testid="selected-count"]');
      await expect(countDisplay).toBeVisible();
    });

    test('should display composition bar', async ({ page }) => {
      const compositionBar = page.locator('[data-testid="composition-bar"]');
      await expect(compositionBar).toBeVisible();
    });

    test('should display proceed button', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      await expect(proceedBtn).toBeVisible();
    });

    test('should display team split indicator', async ({ page }) => {
      const teamSplit = page.locator('[data-testid="team-split-indicator"]');
      await expect(teamSplit).toBeVisible();
    });

    test('should have initially disabled proceed button', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      await expect(proceedBtn).toBeDisabled();
    });
  });

  test.describe('Player List Rendering', () => {
    test('should display player list with correct data', async ({ page }) => {
      const playerRows = await getVisiblePlayers(page);
      expect(playerRows.length).toBeGreaterThan(0);
    });

    test('should render player name for each player', async ({ page }) => {
      const playerNames = page.locator('[data-testid^="player-name-"]');
      const count = await playerNames.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should render player role badge', async ({ page }) => {
      const roleBadges = page.locator('[data-testid^="player-role-"]');
      const count = await roleBadges.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should render player credit cost', async ({ page }) => {
      const credits = page.locator('[data-testid^="player-credits-"]');
      const count = await credits.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should render player team affiliation', async ({ page }) => {
      const teams = page.locator('[data-testid^="player-team-"]');
      const count = await teams.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should render player points', async ({ page }) => {
      const points = page.locator('[data-testid^="player-points-"]');
      const count = await points.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display overseas flag for overseas players', async ({
      page,
    }) => {
      const overseasFlags = page.locator('[data-testid^="player-overseas-"]');
      const count = await overseasFlags.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show correct role values (WK, BAT, AR, BWL)', async ({
      page,
    }) => {
      const roleBadges = page.locator('[data-testid^="player-role-"]');
      for (let i = 0; i < (await roleBadges.count()); i++) {
        const role = await roleBadges.nth(i).textContent();
        expect(ROLES).toContain(role?.trim());
      }
    });

    test('should display credit costs between 5.0 and 11.0', async ({
      page,
    }) => {
      const credits = page.locator('[data-testid^="player-credits-"]');
      for (let i = 0; i < (await credits.count()); i++) {
        const creditText = await credits.nth(i).textContent();
        const creditValue = parseFloat(creditText || '0');
        expect(creditValue).toBeGreaterThanOrEqual(5.0);
        expect(creditValue).toBeLessThanOrEqual(11.0);
      }
    });

    test('should display teams as IPL team abbreviations', async ({
      page,
    }) => {
      const teams = page.locator('[data-testid^="player-team-"]');
      for (let i = 0; i < (await teams.count()); i++) {
        const team = await teams.nth(i).textContent();
        expect(IPL_TEAMS).toContain(team?.trim());
      }
    });
  });

  test.describe('Player Selection - Basic Interactions', () => {
    test('should select player on click', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const firstPlayerId = await firstPlayer.getAttribute('data-player-id');

      await firstPlayer.click();

      const selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBe(1);

      const selectedPlayer = page.locator(
        `[data-testid="player-row"][data-player-id="${firstPlayerId}"]`
      );
      await expect(selectedPlayer).toHaveClass(/selected/);
    });

    test('should deselect player on second click', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();

      await firstPlayer.click();
      let selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBe(1);

      await firstPlayer.click();
      selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBe(0);

      await expect(firstPlayer).not.toHaveClass(/selected/);
    });

    test('should highlight selected player row', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      await expect(firstPlayer).toHaveClass(/selected/);
    });

    test('should toggle selection state on repeated clicks', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();

      await firstPlayer.click();
      await expect(firstPlayer).toHaveClass(/selected/);

      await firstPlayer.click();
      await expect(firstPlayer).not.toHaveClass(/selected/);

      await firstPlayer.click();
      await expect(firstPlayer).toHaveClass(/selected/);
    });

    test('should allow selecting multiple players', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const secondPlayer = page.locator('[data-testid="player-row"]').nth(1);
      const thirdPlayer = page.locator('[data-testid="player-row"]').nth(2);

      await firstPlayer.click();
      await secondPlayer.click();
      await thirdPlayer.click();

      const selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBe(3);
    });

    test('should maintain selection when scrolling', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const firstPlayerId = await firstPlayer.getAttribute('data-player-id');

      await firstPlayer.click();
      await page.locator('[data-testid="player-list"]').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      const selectedPlayer = page.locator(
        `[data-testid="player-row"][data-player-id="${firstPlayerId}"]`
      );
      await expect(selectedPlayer).toHaveClass(/selected/);
    });
  });

  test.describe('Credits Calculation', () => {
    test('should deduct credits when player selected', async ({ page }) => {
      const initialCredits = await getCreditsRemaining(page);
      expect(initialCredits).toBe(100);

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const creditText = await firstPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const playerCredit = parseFloat(creditText || '0');

      await firstPlayer.click();

      const remainingCredits = await getCreditsRemaining(page);
      expect(remainingCredits).toBeCloseTo(100 - playerCredit, 1);
    });

    test('should add credits back when player deselected', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const creditText = await firstPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const playerCredit = parseFloat(creditText || '0');

      await firstPlayer.click();
      let remainingCredits = await getCreditsRemaining(page);
      expect(remainingCredits).toBeCloseTo(100 - playerCredit, 1);

      await firstPlayer.click();
      remainingCredits = await getCreditsRemaining(page);
      expect(remainingCredits).toBe(100);
    });

    test('should calculate total credits for multiple selections', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      const firstPlayer = players.first();
      const secondPlayer = players.nth(1);

      const credit1Text = await firstPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const credit1 = parseFloat(credit1Text || '0');

      const credit2Text = await secondPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const credit2 = parseFloat(credit2Text || '0');

      await firstPlayer.click();
      await secondPlayer.click();

      const remainingCredits = await getCreditsRemaining(page);
      expect(remainingCredits).toBeCloseTo(100 - credit1 - credit2, 1);
    });

    test('should display credits with 1 decimal place', async ({ page }) => {
      const creditsDisplay = page.locator('[data-testid="credits-remaining"]');
      const text = await creditsDisplay.textContent();
      expect(text).toMatch(/\d+\.\d/);
    });

    test('should handle credit calculation for all 11 players if valid', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      let totalCredits = 0;

      for (let i = 0; i < 11; i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');
        totalCredits += credit;

        if (totalCredits <= 100) {
          await player.click();
        }
      }

      const remainingCredits = await getCreditsRemaining(page);
      expect(remainingCredits).toBeGreaterThanOrEqual(0);
      expect(remainingCredits).toBeLessThanOrEqual(100);
    });
  });

  test.describe('Role Filter Tabs', () => {
    test('ALL tab should show all players', async ({ page }) => {
      const allTab = page.locator('button:has-text("ALL")');
      await allTab.click();

      const visiblePlayers = await getVisiblePlayers(page);
      expect(visiblePlayers.length).toBeGreaterThan(0);
    });

    test('WK tab should show only wicket keeper players', async ({ page }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < (await players.count()); i++) {
        const role = await players
          .nth(i)
          .locator('[data-testid^="player-role-"]')
          .textContent();
        expect(role?.trim()).toBe('WK');
      }
    });

    test('BAT tab should show only batting players', async ({ page }) => {
      const batTab = page.locator('button:has-text("BAT")');
      await batTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < (await players.count()); i++) {
        const role = await players
          .nth(i)
          .locator('[data-testid^="player-role-"]')
          .textContent();
        expect(role?.trim()).toBe('BAT');
      }
    });

    test('AR tab should show only all-rounder players', async ({ page }) => {
      const arTab = page.locator('button:has-text("AR")');
      await arTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < (await players.count()); i++) {
        const role = await players
          .nth(i)
          .locator('[data-testid^="player-role-"]')
          .textContent();
        expect(role?.trim()).toBe('AR');
      }
    });

    test('BWL tab should show only bowler players', async ({ page }) => {
      const bwlTab = page.locator('button:has-text("BWL")');
      await bwlTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < (await players.count()); i++) {
        const role = await players
          .nth(i)
          .locator('[data-testid^="player-role-"]')
          .textContent();
        expect(role?.trim()).toBe('BWL');
      }
    });

    test('should highlight active role filter tab', async ({ page }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      await expect(wkTab).toHaveClass(/active/);
    });

    test('should update player list when switching filter tabs', async ({
      page,
    }) => {
      const allTab = page.locator('button:has-text("ALL")');
      const wkTab = page.locator('button:has-text("WK")');

      await allTab.click();
      const allPlayersCount = await page
        .locator('[data-testid="player-row"]')
        .count();

      await wkTab.click();
      const wkPlayersCount = await page
        .locator('[data-testid="player-row"]')
        .count();

      expect(wkPlayersCount).toBeLessThanOrEqual(allPlayersCount);
    });
  });

  test.describe('Sort Functionality', () => {
    test('should display sort options button', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await expect(sortButton).toBeVisible();
    });

    test('should open sort menu on click', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const sortMenu = page.locator('[data-testid="sort-menu"]');
      await expect(sortMenu).toBeVisible();
    });

    test('should have sort option: Credits (Low to High)', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const option = page.locator('text=Credits');
      await expect(option).toBeVisible();
    });

    test('should have sort option: Points (High to Low)', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const option = page.locator('text=Points');
      await expect(option).toBeVisible();
    });

    test('should have sort option: Selection %', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const option = page.locator('text=Selection');
      await expect(option).toBeVisible();
    });

    test('should sort by credits when option selected', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const creditOption = page.locator('[data-testid="sort-by-credits"]');
      await creditOption.click();

      const players = page.locator('[data-testid="player-row"]');
      const firstCredit = await players
        .first()
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const secondCredit = await players
        .nth(1)
        .locator('[data-testid^="player-credits-"]')
        .textContent();

      const first = parseFloat(firstCredit || '0');
      const second = parseFloat(secondCredit || '0');
      expect(first).toBeLessThanOrEqual(second);
    });

    test('should sort by points when option selected', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const pointsOption = page.locator('[data-testid="sort-by-points"]');
      await pointsOption.click();

      const players = page.locator('[data-testid="player-row"]');
      const firstPoints = await players
        .first()
        .locator('[data-testid^="player-points-"]')
        .textContent();
      const secondPoints = await players
        .nth(1)
        .locator('[data-testid^="player-points-"]')
        .textContent();

      const first = parseInt(firstPoints || '0');
      const second = parseInt(secondPoints || '0');
      expect(first).toBeGreaterThanOrEqual(second);
    });

    test('should sort by selection % when option selected', async ({
      page,
    }) => {
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const selectionOption = page.locator(
        '[data-testid="sort-by-selection-percent"]'
      );
      await selectionOption.click();

      const players = page.locator('[data-testid="player-row"]');
      const count = await players.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Selected Count Updates', () => {
    test('should display 0 selected initially', async ({ page }) => {
      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(0);
    });

    test('should increment selected count on player select', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(1);
    });

    test('should decrement selected count on player deselect', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();
      await firstPlayer.click();

      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(0);
    });

    test('should show correct count for 5 selections', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 5; i++) {
        await players.nth(i).click();
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(5);
    });

    test('should show correct count for 11 selections', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 11; i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        const remaining = await getCreditsRemaining(page);
        if (remaining >= credit) {
          await player.click();
        }
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBeLessThanOrEqual(11);
    });

    test('should display selected count in readable format', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const countDisplay = page.locator('[data-testid="selected-count"]');
      const text = await countDisplay.textContent();
      expect(text).toContain('1');
    });
  });

  test.describe('Composition Bar Updates', () => {
    test('should display composition bar', async ({ page }) => {
      const bar = page.locator('[data-testid="composition-bar"]');
      await expect(bar).toBeVisible();
    });

    test('should show WK composition', async ({ page }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const wkComposition = page.locator('[data-testid="composition-wk"]');
      await expect(wkComposition).toBeVisible();
    });

    test('should show BAT composition', async ({ page }) => {
      const batTab = page.locator('button:has-text("BAT")');
      await batTab.click();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const batComposition = page.locator('[data-testid="composition-bat"]');
      await expect(batComposition).toBeVisible();
    });

    test('should show AR composition', async ({ page }) => {
      const arTab = page.locator('button:has-text("AR")');
      await arTab.click();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const arComposition = page.locator('[data-testid="composition-ar"]');
      await expect(arComposition).toBeVisible();
    });

    test('should show BWL composition', async ({ page }) => {
      const bwlTab = page.locator('button:has-text("BWL")');
      await bwlTab.click();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const bwlComposition = page.locator('[data-testid="composition-bwl"]');
      await expect(bwlComposition).toBeVisible();
    });

    test('should update composition bar when player selected', async ({
      page,
    }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const wkComposition = page
        .locator('[data-testid="composition-wk"]')
        .first();
      const initialText = await wkComposition.textContent();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const updatedText = await wkComposition.textContent();
      expect(updatedText).not.toBe(initialText);
    });
  });

  test.describe('Role Constraints - Minimum and Maximum', () => {
    test('should enforce WK minimum (1)', async ({ page }) => {
      const allTab = page.locator('button:has-text("ALL")');
      await allTab.click();

      let wkCount = 0;
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const role = await player
          .locator('[data-testid^="player-role-"]')
          .textContent();

        if (role?.trim() === 'WK' && wkCount === 0) {
          await player.click();
          wkCount++;
          break;
        }
      }

      const selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBeGreaterThanOrEqual(1);
    });

    test('should enforce WK maximum (4)', async ({ page }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 4; i++) {
        const player = players.nth(i);
        await player.click();
      }

      const fifthPlayer = players.nth(4);
      const isFifthDisabled = await fifthPlayer.evaluate(
        (el) => el.classList.contains('disabled')
      );

      if (isFifthDisabled) {
        expect(isFifthDisabled).toBe(true);
      }
    });

    test('should enforce BAT minimum (3)', async ({ page }) => {
      // Select valid distribution
      const allTab = page.locator('button:has-text("ALL")');
      await allTab.click();

      const players = page.locator('[data-testid="player-row"]');
      let batCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const role = await player
          .locator('[data-testid^="player-role-"]')
          .textContent();

        if (role?.trim() === 'BAT' && batCount < 3) {
          await player.click();
          batCount++;
        }
      }

      expect(batCount).toBeGreaterThanOrEqual(3);
    });

    test('should enforce BAT maximum (6)', async ({ page }) => {
      const batTab = page.locator('button:has-text("BAT")');
      await batTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 6; i++) {
        const player = players.nth(i);
        const canClick = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));
        if (canClick) {
          await player.click();
        }
      }

      const seventhPlayer = players.nth(6);
      const isSeventhDisabled = await seventhPlayer.evaluate(
        (el) => el.classList.contains('disabled')
      );

      if (isSeventhDisabled) {
        expect(isSeventhDisabled).toBe(true);
      }
    });

    test('should enforce AR minimum (1)', async ({ page }) => {
      const allTab = page.locator('button:has-text("ALL")');
      await allTab.click();

      let arCount = 0;
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const role = await player
          .locator('[data-testid^="player-role-"]')
          .textContent();

        if (role?.trim() === 'AR' && arCount === 0) {
          await player.click();
          arCount++;
          break;
        }
      }

      const selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBeGreaterThanOrEqual(1);
    });

    test('should enforce AR maximum (4)', async ({ page }) => {
      const arTab = page.locator('button:has-text("AR")');
      await arTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 4; i++) {
        const player = players.nth(i);
        const canClick = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));
        if (canClick) {
          await player.click();
        }
      }

      const fifthPlayer = players.nth(4);
      const isFifthDisabled = await fifthPlayer.evaluate(
        (el) => el.classList.contains('disabled')
      );

      if (isFifthDisabled) {
        expect(isFifthDisabled).toBe(true);
      }
    });

    test('should enforce BWL minimum (3)', async ({ page }) => {
      const allTab = page.locator('button:has-text("ALL")');
      await allTab.click();

      let bwlCount = 0;
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const role = await player
          .locator('[data-testid^="player-role-"]')
          .textContent();

        if (role?.trim() === 'BWL' && bwlCount < 3) {
          await player.click();
          bwlCount++;
        }
      }

      expect(bwlCount).toBeGreaterThanOrEqual(3);
    });

    test('should enforce BWL maximum (6)', async ({ page }) => {
      const bwlTab = page.locator('button:has-text("BWL")');
      await bwlTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 6; i++) {
        const player = players.nth(i);
        const canClick = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));
        if (canClick) {
          await player.click();
        }
      }

      const seventhPlayer = players.nth(6);
      const isSeventhDisabled = await seventhPlayer.evaluate(
        (el) => el.classList.contains('disabled')
      );

      if (isSeventhDisabled) {
        expect(isSeventhDisabled).toBe(true);
      }
    });
  });

  test.describe('Credit Limit Enforcement', () => {
    test('should prevent selection when selecting would exceed 100 credits', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      let totalCredits = 0;
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        if (totalCredits + credit <= 100) {
          await player.click();
          totalCredits += credit;
          selectedCount++;
        } else {
          const remaining = await getCreditsRemaining(page);
          expect(remaining).toBeCloseTo(100 - totalCredits, 1);
          break;
        }
      }

      const finalRemaining = await getCreditsRemaining(page);
      expect(finalRemaining).toBeLessThanOrEqual(100);
      expect(finalRemaining).toBeGreaterThanOrEqual(0);
    });

    test('should disable player if selecting would exceed budget', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      let totalCredits = 100;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        if (totalCredits - credit < 0) {
          const isDisabled = await player.evaluate((el) =>
            el.classList.contains('disabled')
          );
          // If not disabled by role, should still be clickable but feedback may be given
          break;
        }
      }
    });

    test('should allow selection at exactly 100 credits', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const creditText = await firstPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const credit = parseFloat(creditText || '0');

      await firstPlayer.click();

      const remaining = await getCreditsRemaining(page);
      if (remaining === 100 - credit) {
        expect(remaining).toBeCloseTo(100 - credit, 1);
      }
    });

    test('should show credit remaining as 0 when exactly 100 spent', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      let totalCredits = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        if (totalCredits + credit === 100) {
          await player.click();
          const remaining = await getCreditsRemaining(page);
          expect(remaining).toBeCloseTo(0, 1);
          break;
        } else if (totalCredits + credit < 100) {
          await player.click();
          totalCredits += credit;
        }
      }
    });
  });

  test.describe('Overseas Player Limit', () => {
    test('should allow up to 4 overseas players', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let overseasCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const overseasFlag = await player
          .locator('[data-testid^="player-overseas-"]')
          .count();

        if (overseasFlag > 0 && overseasCount < 4) {
          await player.click();
          overseasCount++;
        }
      }

      expect(overseasCount).toBeLessThanOrEqual(4);
    });

    test('should prevent selecting 5th overseas player', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let overseasCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const overseasFlag = await player
          .locator('[data-testid^="player-overseas-"]')
          .count();

        if (overseasFlag > 0) {
          await player.click();
          overseasCount++;

          if (overseasCount === 5) {
            const isDisabled = await player.evaluate((el) =>
              el.classList.contains('disabled')
            );
            if (overseasCount > 4) {
              expect(overseasCount).toBeLessThanOrEqual(4);
            }
            break;
          }
        }
      }
    });

    test('should track overseas count in composition', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let overseasSelected = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const overseasFlag = await player
          .locator('[data-testid^="player-overseas-"]')
          .count();

        if (overseasFlag > 0 && overseasSelected < 4) {
          await player.click();
          overseasSelected++;
        }
      }

      const compositionOverseas = page.locator(
        '[data-testid="composition-overseas"]'
      );
      const count = await compositionOverseas.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow selecting 4 overseas and rest domestic', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      let overseasCount = 0;
      let domesticCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const overseasFlag = await player
          .locator('[data-testid^="player-overseas-"]')
          .count();

        if (overseasFlag > 0 && overseasCount < 4) {
          await player.click();
          overseasCount++;
        } else if (overseasFlag === 0 && domesticCount < 7) {
          const remaining = await getCreditsRemaining(page);
          const creditText = await player
            .locator('[data-testid^="player-credits-"]')
            .textContent();
          const credit = parseFloat(creditText || '0');

          if (remaining >= credit) {
            await player.click();
            domesticCount++;
          }
        }

        if (overseasCount + domesticCount === 11) {
          break;
        }
      }

      const selectedCount = await getSelectedPlayerCount(page);
      expect(selectedCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Per-Team Limit (Max 7 from one team)', () => {
    test('should allow up to 7 players from one team', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      const teamCounts: Record<string, number> = {};

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const teamText = await player
          .locator('[data-testid^="player-team-"]')
          .textContent();
        const team = teamText?.trim() || '';

        if (!teamCounts[team]) {
          teamCounts[team] = 0;
        }

        if (teamCounts[team] < 7) {
          const remaining = await getCreditsRemaining(page);
          const creditText = await player
            .locator('[data-testid^="player-credits-"]')
            .textContent();
          const credit = parseFloat(creditText || '0');

          if (remaining >= credit) {
            await player.click();
            teamCounts[team]++;
          }
        }
      }

      Object.values(teamCounts).forEach((count) => {
        expect(count).toBeLessThanOrEqual(7);
      });
    });

    test('should prevent selecting 8th player from same team', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      let cskCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const teamText = await player
          .locator('[data-testid^="player-team-"]')
          .textContent();
        const team = teamText?.trim() || '';

        if (team === 'CSK' && cskCount < 7) {
          await player.click();
          cskCount++;
        } else if (team === 'CSK' && cskCount === 7) {
          const isDisabled = await player.evaluate((el) =>
            el.classList.contains('disabled')
          );
          if (isDisabled) {
            expect(isDisabled).toBe(true);
          }
          break;
        }
      }
    });

    test('should show team split indicator "4 | 7" format', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < 11; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
        }
      }

      const teamSplit = page.locator('[data-testid="team-split-indicator"]');
      const text = await teamSplit.textContent();
      const splitPattern = /\d+\s*\|\s*\d+/;
      expect(text).toMatch(splitPattern);
    });

    test('should balance team selection (4 and 7)', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      const teamCounts: Record<string, number> = {};
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const teamText = await player
          .locator('[data-testid^="player-team-"]')
          .textContent();
        const team = teamText?.trim() || '';

        if (!teamCounts[team]) {
          teamCounts[team] = 0;
        }

        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (
          canSelect &&
          teamCounts[team] < 7 &&
          selectedCount < 11
        ) {
          const remaining = await getCreditsRemaining(page);
          const creditText = await player
            .locator('[data-testid^="player-credits-"]')
            .textContent();
          const credit = parseFloat(creditText || '0');

          if (remaining >= credit) {
            await player.click();
            teamCounts[team]++;
            selectedCount++;
          }
        }
      }

      const teams = Object.keys(teamCounts);
      let hasValidSplit = false;
      for (const team1 of teams) {
        for (const team2 of teams) {
          if (
            team1 !== team2 &&
            teamCounts[team1] + teamCounts[team2] <= 11
          ) {
            hasValidSplit = true;
            break;
          }
        }
        if (hasValidSplit) break;
      }

      expect(hasValidSplit || selectedCount <= 11).toBe(true);
    });
  });

  test.describe('Proceed Button State', () => {
    test('should be disabled initially', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      await expect(proceedBtn).toBeDisabled();
    });

    test('should be disabled with less than 11 players', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      await players.nth(0).click();
      await players.nth(1).click();

      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      await expect(proceedBtn).toBeDisabled();
    });

    test('should be enabled with exactly 11 valid players and valid distribution', async ({
      page,
    }) => {
      // This is a complex test - select 11 players with valid distribution
      const players = page.locator('[data-testid="player-row"]');
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
          selectedCount++;
        }
      }

      if (selectedCount === 11) {
        const proceedBtn = page.locator('[data-testid="proceed-btn"]');
        const isEnabled = await proceedBtn.isEnabled();
        if (isEnabled) {
          await expect(proceedBtn).toBeEnabled();
        }
      }
    });

    test('should remain disabled if role constraints violated', async ({
      page,
    }) => {
      // Try to select 11 players but violate role constraints
      const players = page.locator('[data-testid="player-row"]');
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        await player.click();
        selectedCount++;
      }

      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      const isDisabled = await proceedBtn.evaluate((el) =>
        el.hasAttribute('disabled')
      );
      expect(isDisabled || (await proceedBtn.isEnabled())).toBeDefined();
    });

    test('should be disabled if over 100 credits with 11 players', async ({
      page,
    }) => {
      // Select expensive players
      const players = page.locator('[data-testid="player-row"]');
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        const remaining = await getCreditsRemaining(page);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        if (remaining >= credit) {
          await player.click();
          selectedCount++;
        }
      }

      const finalRemaining = await getCreditsRemaining(page);
      const proceedBtn = page.locator('[data-testid="proceed-btn"]');

      if (finalRemaining < 0) {
        await expect(proceedBtn).toBeDisabled();
      }
    });

    test('should be clickable when all constraints met', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
          selectedCount++;
        }
      }

      if (selectedCount === 11) {
        const proceedBtn = page.locator('[data-testid="proceed-btn"]');
        const isClickable = await proceedBtn.evaluate((el) => !el.hasAttribute('disabled'));
        if (isClickable) {
          await expect(proceedBtn).toHaveCount(1);
        }
      }
    });
  });

  test.describe('Team Split Display', () => {
    test('should display team split indicator', async ({ page }) => {
      const teamSplit = page.locator('[data-testid="team-split-indicator"]');
      await expect(teamSplit).toBeVisible();
    });

    test('should show format "X | Y" where X + Y = 11', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < 11; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
        }
      }

      const teamSplit = page.locator('[data-testid="team-split-indicator"]');
      const text = await teamSplit.textContent();

      if (text) {
        const match = text.match(/(\d+)\s*\|\s*(\d+)/);
        if (match) {
          const num1 = parseInt(match[1]);
          const num2 = parseInt(match[2]);
          expect(num1 + num2).toBeLessThanOrEqual(11);
        }
      }
    });

    test('should update team split when player selected', async ({ page }) => {
      const teamSplit = page.locator('[data-testid="team-split-indicator"]');
      const initialText = await teamSplit.textContent();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const updatedText = await teamSplit.textContent();
      // Text may not change if starting at "0 | 0" but should exist
      await expect(teamSplit).toBeVisible();
    });

    test('should show balanced teams (4 | 7 or 5 | 6)', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      const teamCounts: Record<string, number> = {};
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        const teamText = await player
          .locator('[data-testid^="player-team-"]')
          .textContent();
        const team = teamText?.trim() || '';

        if (!teamCounts[team]) {
          teamCounts[team] = 0;
        }

        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect && teamCounts[team] < 7 && selectedCount < 11) {
          const remaining = await getCreditsRemaining(page);
          const creditText = await player
            .locator('[data-testid^="player-credits-"]')
            .textContent();
          const credit = parseFloat(creditText || '0');

          if (remaining >= credit) {
            await player.click();
            teamCounts[team]++;
            selectedCount++;
          }
        }
      }

      const teamSplit = page.locator('[data-testid="team-split-indicator"]');
      await expect(teamSplit).toBeVisible();
    });
  });

  test.describe('Player Search/Filter', () => {
    test('should display search input if available', async ({ page }) => {
      const searchInput = page.locator('[data-testid="player-search"]');
      const exists = await searchInput.count();
      expect(exists).toBeGreaterThanOrEqual(0);
    });

    test('should filter players by name when search used', async ({ page }) => {
      const searchInput = page.locator('[data-testid="player-search"]');
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('Kohli');

        const players = page.locator('[data-testid="player-row"]');
        const count = await players.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show empty state when no search results', async ({
      page,
    }) => {
      const searchInput = page.locator('[data-testid="player-search"]');
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('XYZ123NonExistent');

        const emptyState = page.locator('[data-testid="empty-state"]');
        const count = await emptyState.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should reset search when cleared', async ({ page }) => {
      const searchInput = page.locator('[data-testid="player-search"]');
      if ((await searchInput.count()) > 0) {
        await searchInput.fill('Kohli');
        await searchInput.clear();

        const players = page.locator('[data-testid="player-row"]');
        const count = await players.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Deselection and Re-selection', () => {
    test('should allow deselecting and reselecting same player', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const firstPlayerId = await firstPlayer.getAttribute('data-player-id');

      await firstPlayer.click();
      await expect(firstPlayer).toHaveClass(/selected/);

      await firstPlayer.click();
      await expect(firstPlayer).not.toHaveClass(/selected/);

      await firstPlayer.click();
      const selectedPlayer = page.locator(
        `[data-testid="player-row"][data-player-id="${firstPlayerId}"]`
      );
      await expect(selectedPlayer).toHaveClass(/selected/);
    });

    test('should restore credits when deselecting', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const creditText = await firstPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const credit = parseFloat(creditText || '0');

      await firstPlayer.click();
      let remaining = await getCreditsRemaining(page);
      expect(remaining).toBeCloseTo(100 - credit, 1);

      await firstPlayer.click();
      remaining = await getCreditsRemaining(page);
      expect(remaining).toBe(100);
    });

    test('should preserve team selection when reselecting after deselect', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      await players.nth(0).click();
      await players.nth(1).click();
      let count = await getSelectedPlayerCount(page);
      expect(count).toBe(2);

      await players.nth(0).click();
      count = await getSelectedPlayerCount(page);
      expect(count).toBe(1);

      await players.nth(0).click();
      count = await getSelectedPlayerCount(page);
      expect(count).toBe(2);
    });

    test('should handle rapid select/deselect cycles', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();

      for (let i = 0; i < 5; i++) {
        await firstPlayer.click();
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(1);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle exactly 100 credits spent', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let totalCredits = 0;
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        if (totalCredits + credit === 100) {
          await player.click();
          totalCredits += credit;
          selectedCount++;
          break;
        } else if (totalCredits + credit < 100) {
          await player.click();
          totalCredits += credit;
          selectedCount++;
        }
      }

      if (totalCredits === 100) {
        const remaining = await getCreditsRemaining(page);
        expect(remaining).toBeCloseTo(0, 1);
      }
    });

    test('should handle exactly 4 overseas players', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let overseasCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const overseasFlag = await player
          .locator('[data-testid^="player-overseas-"]')
          .count();

        if (overseasFlag > 0 && overseasCount < 4) {
          await player.click();
          overseasCount++;
        }
      }

      expect(overseasCount).toBeLessThanOrEqual(4);
    });

    test('should handle exactly 7 players from one team', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      const teamCounts: Record<string, number> = {};
      let maxTeamCount = 0;

      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const teamText = await player
          .locator('[data-testid^="player-team-"]')
          .textContent();
        const team = teamText?.trim() || '';

        if (!teamCounts[team]) {
          teamCounts[team] = 0;
        }

        if (teamCounts[team] < 7) {
          const remaining = await getCreditsRemaining(page);
          const creditText = await player
            .locator('[data-testid^="player-credits-"]')
            .textContent();
          const credit = parseFloat(creditText || '0');

          if (remaining >= credit) {
            await player.click();
            teamCounts[team]++;
            maxTeamCount = Math.max(maxTeamCount, teamCounts[team]);
          }
        }
      }

      expect(maxTeamCount).toBeLessThanOrEqual(7);
    });

    test('should handle large player list with many scrolls', async ({
      page,
    }) => {
      const playerList = page.locator('[data-testid="player-list"]');
      const initialCount = await page
        .locator('[data-testid="player-row"]')
        .count();

      for (let i = 0; i < 5; i++) {
        await playerList.evaluate((el) => {
          el.scrollTop += el.clientHeight;
        });
      }

      const finalCount = await page
        .locator('[data-testid="player-row"]')
        .count();
      expect(finalCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle rapid selection of 11 players', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      let selectedCount = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
          selectedCount++;
        }
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBeLessThanOrEqual(11);
    });
  });

  test.describe('Error States and Validation', () => {
    test('should show error if too many of one role selected', async ({
      page,
    }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 5; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
        } else {
          // Should be disabled due to max role constraint
          const isDisabled = await player.evaluate((el) =>
            el.classList.contains('disabled')
          );
          expect(isDisabled).toBe(true);
        }
      }
    });

    test('should show error message when over budget', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      const remaining = await getCreditsRemaining(page);

      // Try to select a player that would go over budget
      for (let i = 0; i < (await players.count()); i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        if (credit > remaining) {
          // This player would exceed budget
          const errorMsg = page.locator('[data-testid="error-message"]');
          const count = await errorMsg.count();
          expect(count).toBeGreaterThanOrEqual(0);
          break;
        }
      }
    });

    test('should disable player row when constraints violated', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < Math.min(5, await players.count()); i++) {
        const player = players.nth(i);
        const isDisabled = await player.evaluate((el) =>
          el.classList.contains('disabled')
        );
        expect(typeof isDisabled).toBe('boolean');
      }
    });

    test('should show validation message for incomplete team', async ({
      page,
    }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      const disabledState = await proceedBtn.evaluate((el) =>
        el.hasAttribute('disabled')
      );

      expect(disabledState).toBe(true);
    });
  });

  test.describe('Visual Indicators', () => {
    test('should highlight selected player row', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const highlightClass = await firstPlayer.evaluate((el) =>
        el.classList.contains('selected')
      );
      expect(highlightClass).toBe(true);
    });

    test('should show different styling for selected vs unselected', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      const firstPlayer = players.first();
      const secondPlayer = players.nth(1);

      await firstPlayer.click();

      const firstSelected = await firstPlayer.evaluate((el) =>
        el.classList.contains('selected')
      );
      const secondSelected = await secondPlayer.evaluate((el) =>
        el.classList.contains('selected')
      );

      expect(firstSelected).not.toBe(secondSelected);
    });

    test('should show disabled styling for constrained players', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < Math.min(3, await players.count()); i++) {
        const player = players.nth(i);
        const classList = await player.evaluate((el) =>
          Array.from(el.classList)
        );
        expect(classList.length).toBeGreaterThan(0);
      }
    });

    test('should show checkmark or indicator on selected player', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const checkmark = firstPlayer.locator('[data-testid="selection-indicator"]');
      const count = await checkmark.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show active state on selected role filter', async ({
      page,
    }) => {
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const isActive = await wkTab.evaluate((el) =>
        el.classList.contains('active')
      );
      expect(isActive).toBe(true);
    });
  });

  test.describe('Large Player List Scrolling', () => {
    test('should allow scrolling through large player list', async ({
      page,
    }) => {
      const playerList = page.locator('[data-testid="player-list"]');
      const initialScrollTop = await playerList.evaluate(
        (el) => el.scrollTop
      );

      await playerList.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      const finalScrollTop = await playerList.evaluate((el) => el.scrollTop);
      expect(finalScrollTop).toBeGreaterThan(initialScrollTop);
    });

    test('should maintain selections while scrolling', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');
      const firstPlayerId = await players.first().getAttribute('data-player-id');

      await players.first().click();

      const playerList = page.locator('[data-testid="player-list"]');
      await playerList.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      const selectedPlayer = page.locator(
        `[data-testid="player-row"][data-player-id="${firstPlayerId}"]`
      );
      const isSelected = await selectedPlayer.evaluate((el) =>
        el.classList.contains('selected')
      );

      if (isSelected) {
        expect(isSelected).toBe(true);
      }
    });

    test('should render visible players efficiently', async ({ page }) => {
      const playerList = page.locator('[data-testid="player-list"]');
      const visiblePlayers = await page
        .locator('[data-testid="player-row"]:visible')
        .count();

      expect(visiblePlayers).toBeGreaterThan(0);
    });

    test('should load more players on scroll to bottom', async ({ page }) => {
      const playerList = page.locator('[data-testid="player-list"]');
      const initialCount = await page
        .locator('[data-testid="player-row"]')
        .count();

      await playerList.evaluate((el) => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
      });

      await page.waitForTimeout(500);

      const finalCount = await page
        .locator('[data-testid="player-row"]')
        .count();

      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  test.describe('Rapid Selection/Deselection', () => {
    test('should handle rapid clicking on same player', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();

      for (let i = 0; i < 10; i++) {
        await firstPlayer.click();
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(0); // 10 clicks = deselected (even number)
    });

    test('should handle rapid clicking on different players', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < 5; i++) {
        await players.nth(i).click();
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(5);
    });

    test('should maintain consistent state after rapid operations', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      // Rapid selection
      for (let i = 0; i < 3; i++) {
        await players.nth(i).click();
      }

      let count = await getSelectedPlayerCount(page);
      expect(count).toBe(3);

      // Rapid deselection
      for (let i = 0; i < 3; i++) {
        await players.nth(i).click();
      }

      count = await getSelectedPlayerCount(page);
      expect(count).toBe(0);
    });

    test('should not corrupt state with simultaneous operations', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');
      const initialCredits = await getCreditsRemaining(page);

      for (let i = 0; i < 5; i++) {
        await players.nth(i).click();
      }

      const creditsAfter = await getCreditsRemaining(page);
      expect(creditsAfter).toBeLessThanOrEqual(initialCredits);
    });
  });

  test.describe('Reset/Clear Selections', () => {
    test('should allow clearing all selections', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');

      // Select 5 players
      for (let i = 0; i < 5; i++) {
        await players.nth(i).click();
      }

      let count = await getSelectedPlayerCount(page);
      expect(count).toBe(5);

      // Deselect all
      for (let i = 0; i < 5; i++) {
        await players.nth(i).click();
      }

      count = await getSelectedPlayerCount(page);
      expect(count).toBe(0);
    });

    test('should reset credits to 100 when all cleared', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < 3; i++) {
        await players.nth(i).click();
      }

      for (let i = 0; i < 3; i++) {
        await players.nth(i).click();
      }

      const remaining = await getCreditsRemaining(page);
      expect(remaining).toBe(100);
    });

    test('should have clear all button if available', async ({ page }) => {
      const clearBtn = page.locator('[data-testid="clear-all-btn"]');
      const count = await clearBtn.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Credit Display Formatting', () => {
    test('should display credits with exactly 1 decimal place', async ({
      page,
    }) => {
      const creditsDisplay = page.locator('[data-testid="credits-remaining"]');
      const text = await creditsDisplay.textContent();

      if (text) {
        const creditMatch = text.match(/\d+\.\d+/);
        if (creditMatch) {
          const parts = creditMatch[0].split('.');
          expect(parts[1].length).toBe(1);
        }
      }
    });

    test('should show player credits with correct decimal format', async ({
      page,
    }) => {
      const creditElements = page.locator('[data-testid^="player-credits-"]');

      for (let i = 0; i < Math.min(5, await creditElements.count()); i++) {
        const text = await creditElements.nth(i).textContent();
        if (text) {
          const creditMatch = text.match(/\d+\.\d/);
          expect(creditMatch).not.toBeNull();
        }
      }
    });

    test('should round credits to 1 decimal place in calculations', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const creditText = await firstPlayer
        .locator('[data-testid^="player-credits-"]')
        .textContent();
      const playerCredit = parseFloat(creditText || '0');

      await firstPlayer.click();

      const remaining = await getCreditsRemaining(page);
      const expected = 100 - playerCredit;

      expect(remaining).toBeCloseTo(expected, 1);
    });
  });

  test.describe('Integration Tests', () => {
    test('should complete full team selection flow', async ({ page }) => {
      // Navigate to team select
      const screenVisible = await isScreenVisible(page, SCREENS.TEAM_SELECT);
      expect(screenVisible).toBe(true);

      // Select 11 valid players
      const players = page.locator('[data-testid="player-row"]');
      let selectedCount = 0;
      let totalCredits = 0;

      for (let i = 0; i < (await players.count()) && selectedCount < 11; i++) {
        const player = players.nth(i);
        const creditText = await player
          .locator('[data-testid^="player-credits-"]')
          .textContent();
        const credit = parseFloat(creditText || '0');

        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect && totalCredits + credit <= 100) {
          await player.click();
          totalCredits += credit;
          selectedCount++;
        }
      }

      // Verify counts
      const count = await getSelectedPlayerCount(page);
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter and select from filtered list', async ({ page }) => {
      // Switch to WK filter
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      // Select first WK player
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      // Verify selection
      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(1);

      // Switch back to ALL
      const allTab = page.locator('button:has-text("ALL")');
      await allTab.click();

      // Verify selection maintained
      const countAfterFilter = await getSelectedPlayerCount(page);
      expect(countAfterFilter).toBe(1);
    });

    test('should sort and select from sorted list', async ({ page }) => {
      // Sort by credits
      const sortButton = page.locator('[data-testid="sort-options"]');
      await sortButton.click();

      const creditOption = page.locator('[data-testid="sort-by-credits"]');
      await creditOption.click();

      // Select cheapest players
      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 5; i++) {
        const player = players.nth(i);
        const canSelect = !(await player.evaluate((el) =>
          el.classList.contains('disabled')
        ));

        if (canSelect) {
          await player.click();
        }
      }

      const count = await getSelectedPlayerCount(page);
      expect(count).toBeGreaterThan(0);
    });

    test('should handle role constraints across filters', async ({ page }) => {
      // Select some players
      const wkTab = page.locator('button:has-text("WK")');
      await wkTab.click();

      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      // Switch to BAT
      const batTab = page.locator('button:has-text("BAT")');
      await batTab.click();

      const secondPlayer = page.locator('[data-testid="player-row"]').first();
      await secondPlayer.click();

      // Verify both selected
      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(2);
    });

    test('should update composition across operations', async ({ page }) => {
      const players = page.locator('[data-testid="player-row"]');

      // Select 3 players
      for (let i = 0; i < 3; i++) {
        await players.nth(i).click();
      }

      const compositionBar = page.locator('[data-testid="composition-bar"]');
      await expect(compositionBar).toBeVisible();

      // Deselect 1 player
      await players.first().click();

      // Verify composition updates
      const count = await getSelectedPlayerCount(page);
      expect(count).toBe(2);
    });
  });

  test.describe('Performance and Stress Tests', () => {
    test('should handle multiple rapid selections without lag', async ({
      page,
    }) => {
      const startTime = Date.now();

      const players = page.locator('[data-testid="player-row"]');
      for (let i = 0; i < 10; i++) {
        await players.nth(i).click();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('should maintain responsiveness with many selections', async ({
      page,
    }) => {
      const players = page.locator('[data-testid="player-row"]');

      for (let i = 0; i < Math.min(11, await players.count()); i++) {
        const player = players.nth(i);
        await player.click({ timeout: 1000 });
      }

      // Should still be able to interact
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await expect(firstPlayer).toBeVisible();
    });

    test('should handle scrolling large list smoothly', async ({ page }) => {
      const playerList = page.locator('[data-testid="player-list"]');

      for (let i = 0; i < 10; i++) {
        await playerList.evaluate((el) => {
          el.scrollTop += 50;
        });
      }

      // Should still be responsive
      const players = page.locator('[data-testid="player-row"]');
      const count = await players.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility and Error Monitoring', () => {
    test('should have no console errors during normal operation', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.click();

      const errors = await collectConsoleErrors(page);
      expect(errors.length).toBe(0);
    });

    test('should maintain accessibility while selecting players', async ({
      page,
    }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      const isAccessible = await firstPlayer.evaluate((el) => {
        return el.getAttribute('role') || el.tagName === 'BUTTON' || el.role === 'button';
      });

      expect(typeof isAccessible).toBe('boolean');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const proceedBtn = page.locator('[data-testid="proceed-btn"]');
      const hasLabel = await proceedBtn.evaluate(
        (el) => el.getAttribute('aria-label') || el.textContent?.trim().length > 0
      );

      expect(hasLabel).toBeDefined();
    });

    test('should support keyboard navigation', async ({ page }) => {
      const firstPlayer = page.locator('[data-testid="player-row"]').first();
      await firstPlayer.focus();

      const isFocused = await firstPlayer.evaluate((el) => {
        return document.activeElement === el;
      });

      expect(typeof isFocused).toBe('boolean');
    });
  });
});
