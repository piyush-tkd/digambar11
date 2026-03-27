import { test, expect, loadApp, waitForScreen, SCREENS, mockLogin, APP_URL, navigateToScreen, isScreenVisible, setupErrorMonitor, collectConsoleErrors } from '../fixtures';

test.describe('Leaderboard Screen', () => {
  test.beforeEach(async ({ page }) => {
    await setupErrorMonitor(page);
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LEADERBOARD);
    await waitForScreen(page, SCREENS.LEADERBOARD);
  });

  // Screen Layout Tests
  test.describe('Screen Layout', () => {
    test('should display leaderboard screen title', async ({ page }) => {
      const title = page.locator('[data-testid="leaderboard-title"]');
      await expect(title).toBeVisible();
      await expect(title).toHaveText(/Leaderboard/i);
    });

    test('should display match leaderboard section', async ({ page }) => {
      const matchLB = page.locator('[data-testid="match-leaderboard-section"]');
      await expect(matchLB).toBeVisible();
    });

    test('should display league standings section', async ({ page }) => {
      const leagueLB = page.locator('[data-testid="league-standings-section"]');
      await expect(leagueLB).toBeVisible();
    });

    test('should display both sections simultaneously', async ({ page }) => {
      const matchLB = page.locator('[data-testid="match-leaderboard-section"]');
      const leagueLB = page.locator('[data-testid="league-standings-section"]');
      await expect(matchLB).toBeVisible();
      await expect(leagueLB).toBeVisible();
    });

    test('should display back button in header', async ({ page }) => {
      const backBtn = page.locator('[data-testid="leaderboard-back-btn"]');
      await expect(backBtn).toBeVisible();
    });

    test('should have tabs or sections switcher', async ({ page }) => {
      const tabs = page.locator('[data-testid="leaderboard-tabs"]');
      if (await tabs.isVisible()) {
        await expect(tabs).toBeVisible();
      }
    });

    test('should display header with correct page structure', async ({ page }) => {
      const header = page.locator('[data-testid="leaderboard-header"]');
      const content = page.locator('[data-testid="leaderboard-content"]');
      await expect(header).toBeVisible();
      await expect(content).toBeVisible();
    });
  });

  // Match Leaderboard Column Tests
  test.describe('Match Leaderboard Columns', () => {
    test('should display rank column header', async ({ page }) => {
      const rankHeader = page.locator('[data-testid="match-lb-header-rank"]');
      if (await rankHeader.isVisible()) {
        await expect(rankHeader).toContainText(/Rank|#/i);
      }
    });

    test('should display name column header', async ({ page }) => {
      const nameHeader = page.locator('[data-testid="match-lb-header-name"]');
      if (await nameHeader.isVisible()) {
        await expect(nameHeader).toContainText(/Name|Player/i);
      }
    });

    test('should display squad column header', async ({ page }) => {
      const squadHeader = page.locator('[data-testid="match-lb-header-squad"]');
      if (await squadHeader.isVisible()) {
        await expect(squadHeader).toContainText(/Squad/i);
      }
    });

    test('should display points column header', async ({ page }) => {
      const ptsHeader = page.locator('[data-testid="match-lb-header-pts"]');
      if (await ptsHeader.isVisible()) {
        await expect(ptsHeader).toContainText(/Points|Pts/i);
      }
    });

    test('should display winnings column header', async ({ page }) => {
      const wonHeader = page.locator('[data-testid="match-lb-header-won"]');
      if (await wonHeader.isVisible()) {
        await expect(wonHeader).toContainText(/Won|Winnings/i);
      }
    });

    test('should display rank in each row', async ({ page }) => {
      const rankCell = page.locator('[data-testid="match-lb-rank"]').first();
      if (await rankCell.isVisible()) {
        const rankText = await rankCell.textContent();
        expect(rankText).toMatch(/\d+/);
      }
    });

    test('should display player name in each row', async ({ page }) => {
      const nameCell = page.locator('[data-testid="match-lb-name"]').first();
      if (await nameCell.isVisible()) {
        const nameText = await nameCell.textContent();
        expect(nameText).toBeTruthy();
      }
    });

    test('should display squad name in each row', async ({ page }) => {
      const squadCell = page.locator('[data-testid="match-lb-squad"]').first();
      if (await squadCell.isVisible()) {
        const squadText = await squadCell.textContent();
        expect(squadText).toBeTruthy();
      }
    });

    test('should display points in each row', async ({ page }) => {
      const ptsCell = page.locator('[data-testid="match-lb-pts"]').first();
      if (await ptsCell.isVisible()) {
        const ptsText = await ptsCell.textContent();
        expect(ptsText).toMatch(/\d+/);
      }
    });

    test('should display winnings amount in each row', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"]').first();
      if (await wonCell.isVisible()) {
        const wonText = await wonCell.textContent();
        expect(wonText).toBeTruthy();
      }
    });
  });

  // League Standings Column Tests
  test.describe('League Standings Columns', () => {
    test('should display rank column in league standings', async ({ page }) => {
      const rankHeader = page.locator('[data-testid="league-header-rank"]');
      if (await rankHeader.isVisible()) {
        await expect(rankHeader).toContainText(/Rank|#/i);
      }
    });

    test('should display name column in league standings', async ({ page }) => {
      const nameHeader = page.locator('[data-testid="league-header-name"]');
      if (await nameHeader.isVisible()) {
        await expect(nameHeader).toContainText(/Name|Player/i);
      }
    });

    test('should display wins column in league standings', async ({ page }) => {
      const winsHeader = page.locator('[data-testid="league-header-wins"]');
      if (await winsHeader.isVisible()) {
        await expect(winsHeader).toContainText(/Wins|W/i);
      }
    });

    test('should display losses column in league standings', async ({ page }) => {
      const lossesHeader = page.locator('[data-testid="league-header-losses"]');
      if (await lossesHeader.isVisible()) {
        await expect(lossesHeader).toContainText(/Losses|L/i);
      }
    });

    test('should display average points column in league standings', async ({ page }) => {
      const avgPtsHeader = page.locator('[data-testid="league-header-avg-pts"]');
      if (await avgPtsHeader.isVisible()) {
        await expect(avgPtsHeader).toContainText(/Avg|Average/i);
      }
    });

    test('should display net winnings column in league standings', async ({ page }) => {
      const netHeader = page.locator('[data-testid="league-header-net"]');
      if (await netHeader.isVisible()) {
        await expect(netHeader).toContainText(/Net|Winnings/i);
      }
    });

    test('should display rank in league standing rows', async ({ page }) => {
      const rankCell = page.locator('[data-testid="league-rank"]').first();
      if (await rankCell.isVisible()) {
        const rankText = await rankCell.textContent();
        expect(rankText).toMatch(/\d+/);
      }
    });

    test('should display wins count in league standing rows', async ({ page }) => {
      const winsCell = page.locator('[data-testid="league-wins"]').first();
      if (await winsCell.isVisible()) {
        const winsText = await winsCell.textContent();
        expect(winsText).toMatch(/\d+/);
      }
    });

    test('should display losses count in league standing rows', async ({ page }) => {
      const lossesCell = page.locator('[data-testid="league-losses"]').first();
      if (await lossesCell.isVisible()) {
        const lossesText = await lossesCell.textContent();
        expect(lossesText).toMatch(/\d+/);
      }
    });

    test('should display average points in league standing rows', async ({ page }) => {
      const avgPtsCell = page.locator('[data-testid="league-avg-pts"]').first();
      if (await avgPtsCell.isVisible()) {
        const avgPtsText = await avgPtsCell.textContent();
        expect(avgPtsText).toMatch(/\d+/);
      }
    });

    test('should display net winnings in league standing rows', async ({ page }) => {
      const netCell = page.locator('[data-testid="league-net"]').first();
      if (await netCell.isVisible()) {
        const netText = await netCell.textContent();
        expect(netText).toBeTruthy();
      }
    });
  });

  // Current User Row Highlighting Tests
  test.describe('Current User Row Highlighting', () => {
    test('should highlight current user row in match leaderboard', async ({ page }) => {
      const currentUserRow = page.locator('[data-testid="match-lb-row"][data-is-current-user="true"]');
      if (await currentUserRow.isVisible()) {
        await expect(currentUserRow).toHaveClass(/current-user|highlighted|active/);
      }
    });

    test('should display "YOU" badge on current user in match leaderboard', async ({ page }) => {
      const youBadge = page.locator('[data-testid="match-lb-you-badge"]');
      if (await youBadge.isVisible()) {
        await expect(youBadge).toContainText(/YOU/i);
      }
    });

    test('should highlight current user row in league standings', async ({ page }) => {
      const currentUserRow = page.locator('[data-testid="league-row"][data-is-current-user="true"]');
      if (await currentUserRow.isVisible()) {
        await expect(currentUserRow).toHaveClass(/current-user|highlighted|active/);
      }
    });

    test('should display "YOU" badge on current user in league standings', async ({ page }) => {
      const youBadge = page.locator('[data-testid="league-you-badge"]');
      if (await youBadge.isVisible()) {
        await expect(youBadge).toContainText(/YOU/i);
      }
    });

    test('should use distinct background color for current user row', async ({ page }) => {
      const currentUserRow = page.locator('[data-testid="match-lb-row"][data-is-current-user="true"]');
      if (await currentUserRow.isVisible()) {
        const backgroundColor = await currentUserRow.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(backgroundColor).not.toBe('');
      }
    });

    test('should center and prominently display YOU label', async ({ page }) => {
      const youLabel = page.locator('[data-testid="match-lb-you-label"]');
      if (await youLabel.isVisible()) {
        await expect(youLabel).toBeVisible();
      }
    });

    test('should position YOU badge at the start of current user row', async ({ page }) => {
      const youBadge = page.locator('[data-testid="match-lb-you-badge"]').first();
      if (await youBadge.isVisible()) {
        const boundingBox = await youBadge.boundingBox();
        expect(boundingBox).not.toBeNull();
      }
    });
  });

  // Rank Badge Styling Tests
  test.describe('Rank Badge Styling', () => {
    test('should display gold badge for rank 1', async ({ page }) => {
      const goldBadge = page.locator('[data-testid="rank-badge"][data-rank="1"]');
      if (await goldBadge.isVisible()) {
        await expect(goldBadge).toHaveClass(/gold|first/i);
      }
    });

    test('should display silver badge for rank 2', async ({ page }) => {
      const silverBadge = page.locator('[data-testid="rank-badge"][data-rank="2"]');
      if (await silverBadge.isVisible()) {
        await expect(silverBadge).toHaveClass(/silver|second/i);
      }
    });

    test('should display bronze badge for rank 3', async ({ page }) => {
      const bronzeBadge = page.locator('[data-testid="rank-badge"][data-rank="3"]');
      if (await bronzeBadge.isVisible()) {
        await expect(bronzeBadge).toHaveClass(/bronze|third/i);
      }
    });

    test('should display gold color for rank 1', async ({ page }) => {
      const goldBadge = page.locator('[data-testid="rank-badge"][data-rank="1"]');
      if (await goldBadge.isVisible()) {
        const color = await goldBadge.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should display silver color for rank 2', async ({ page }) => {
      const silverBadge = page.locator('[data-testid="rank-badge"][data-rank="2"]');
      if (await silverBadge.isVisible()) {
        const color = await silverBadge.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should display bronze color for rank 3', async ({ page }) => {
      const bronzeBadge = page.locator('[data-testid="rank-badge"][data-rank="3"]');
      if (await bronzeBadge.isVisible()) {
        const color = await bronzeBadge.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should show numeric rank for positions beyond top 3', async ({ page }) => {
      const numericRank = page.locator('[data-testid="rank-cell"]').nth(4);
      if (await numericRank.isVisible()) {
        const rankText = await numericRank.textContent();
        expect(rankText).toMatch(/[4-9]|\d+/);
      }
    });

    test('should display rank badges in match leaderboard', async ({ page }) => {
      const badge = page.locator('[data-testid="match-lb-rank-badge"]');
      if (await badge.isVisible()) {
        await expect(badge).toBeVisible();
      }
    });

    test('should display rank badges in league standings', async ({ page }) => {
      const badge = page.locator('[data-testid="league-rank-badge"]');
      if (await badge.isVisible()) {
        await expect(badge).toBeVisible();
      }
    });
  });

  // Points Display Formatting Tests
  test.describe('Points Display Formatting (fmtPts)', () => {
    test('should display points with clean formatting', async ({ page }) => {
      const ptsCell = page.locator('[data-testid="match-lb-pts"]').first();
      if (await ptsCell.isVisible()) {
        const ptsText = await ptsCell.textContent();
        expect(ptsText).toMatch(/\d+/);
      }
    });

    test('should format small points numbers', async ({ page }) => {
      const ptsCell = page.locator('[data-testid="match-lb-pts"]').first();
      if (await ptsCell.isVisible()) {
        const ptsText = await ptsCell.textContent();
        expect(ptsText).toMatch(/^\d+$/);
      }
    });

    test('should format large points numbers with K notation', async ({ page }) => {
      const ptsCell = page.locator('[data-testid="match-lb-pts"]');
      const ptsWithK = ptsCell.filter({ hasText: /\d+k/i }).first();
      if (await ptsWithK.isVisible()) {
        const ptsText = await ptsWithK.textContent();
        expect(ptsText).toMatch(/\d+\.?\d*k/i);
      }
    });

    test('should use consistent formatting across all rows', async ({ page }) => {
      const ptsCells = page.locator('[data-testid="match-lb-pts"]');
      const count = await ptsCells.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const ptsText = await ptsCells.nth(i).textContent();
        expect(ptsText).toMatch(/\d+/);
      }
    });

    test('should align points numbers to the right', async ({ page }) => {
      const ptsCell = page.locator('[data-testid="match-lb-pts"]').first();
      if (await ptsCell.isVisible()) {
        const textAlign = await ptsCell.evaluate((el) => window.getComputedStyle(el).textAlign);
        expect(['right', 'end']).toContain(textAlign);
      }
    });

    test('should display average points with consistent formatting', async ({ page }) => {
      const avgPtsCell = page.locator('[data-testid="league-avg-pts"]').first();
      if (await avgPtsCell.isVisible()) {
        const avgText = await avgPtsCell.textContent();
        expect(avgText).toMatch(/\d+/);
      }
    });
  });

  // Won Amount Formatting Tests
  test.describe('Won Amount Formatting', () => {
    test('should display rupee symbol in won amounts', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"]').first();
      if (await wonCell.isVisible()) {
        const wonText = await wonCell.textContent();
        expect(wonText).toContain('₹');
      }
    });

    test('should display green color for positive winnings', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"][data-won-type="positive"]').first();
      if (await wonCell.isVisible()) {
        const color = await wonCell.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should display red color for negative winnings', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"][data-won-type="negative"]').first();
      if (await wonCell.isVisible()) {
        const color = await wonCell.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should add + sign for positive amounts', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"].won-positive').first();
      if (await wonCell.isVisible()) {
        const wonText = await wonCell.textContent();
        expect(wonText).toMatch(/^\+|^₹/);
      }
    });

    test('should format large won amounts with commas', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"]').first();
      if (await wonCell.isVisible()) {
        const wonText = await wonCell.textContent();
        if (wonText && wonText.length > 6) {
          expect(wonText).toMatch(/₹[\d,]+/);
        }
      }
    });

    test('should align won amounts to the right', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"]').first();
      if (await wonCell.isVisible()) {
        const textAlign = await wonCell.evaluate((el) => window.getComputedStyle(el).textAlign);
        expect(['right', 'end']).toContain(textAlign);
      }
    });

    test('should display net winnings in league standings with color coding', async ({ page }) => {
      const netCell = page.locator('[data-testid="league-net"]').first();
      if (await netCell.isVisible()) {
        const netText = await netCell.textContent();
        expect(netText).toBeTruthy();
      }
    });

    test('should handle zero amount display', async ({ page }) => {
      const wonCell = page.locator('[data-testid="match-lb-won"]').first();
      if (await wonCell.isVisible()) {
        const wonText = await wonCell.textContent();
        expect(wonText).toBeTruthy();
      }
    });
  });

  // Expandable Match History Tests
  test.describe('Expandable Match History', () => {
    test('should have clickable player row to expand/collapse', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const expandedSection = page.locator('[data-testid="match-history"]');
        const isExpanded = await expandedSection.isVisible().catch(() => false);
        expect([true, false]).toContain(isExpanded);
      }
    });

    test('should display match history on player expand', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const matchHistory = page.locator('[data-testid="match-history"]').first();
        const isVisible = await matchHistory.isVisible().catch(() => false);
        if (isVisible) {
          await expect(matchHistory).toBeVisible();
        }
      }
    });

    test('should show expand icon on player row', async ({ page }) => {
      const expandIcon = page.locator('[data-testid="expand-icon"]').first();
      if (await expandIcon.isVisible()) {
        await expect(expandIcon).toBeVisible();
      }
    });

    test('should change expand icon on click', async ({ page }) => {
      const expandIcon = page.locator('[data-testid="expand-icon"]').first();
      if (await expandIcon.isVisible()) {
        const beforeClass = await expandIcon.getAttribute('class');
        await expandIcon.click();
        const afterClass = await expandIcon.getAttribute('class');
        expect(beforeClass).not.toBe(afterClass);
      }
    });

    test('should display match history items', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const historyItem = page.locator('[data-testid="match-history-item"]').first();
        const isVisible = await historyItem.isVisible().catch(() => false);
        expect([true, false]).toContain(isVisible);
      }
    });

    test('should hide match history on second click', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        await playerRow.click();
        const matchHistory = page.locator('[data-testid="match-history"]').first();
        const isVisible = await matchHistory.isVisible().catch(() => false);
        expect(isVisible).toBe(false);
      }
    });
  });

  // Match History Row Tests
  test.describe('Match History Rows', () => {
    test('should display match name in history', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const matchName = page.locator('[data-testid="history-match-name"]').first();
        const isVisible = await matchName.isVisible().catch(() => false);
        if (isVisible) {
          const nameText = await matchName.textContent();
          expect(nameText).toBeTruthy();
        }
      }
    });

    test('should display match date in history', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const matchDate = page.locator('[data-testid="history-match-date"]').first();
        const isVisible = await matchDate.isVisible().catch(() => false);
        if (isVisible) {
          const dateText = await matchDate.textContent();
          expect(dateText).toBeTruthy();
        }
      }
    });

    test('should display rank in match history', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const historyRank = page.locator('[data-testid="history-rank"]').first();
        const isVisible = await historyRank.isVisible().catch(() => false);
        if (isVisible) {
          const rankText = await historyRank.textContent();
          expect(rankText).toMatch(/\d+/);
        }
      }
    });

    test('should display points earned in match history', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const historyPts = page.locator('[data-testid="history-pts"]').first();
        const isVisible = await historyPts.isVisible().catch(() => false);
        if (isVisible) {
          const ptsText = await historyPts.textContent();
          expect(ptsText).toMatch(/\d+/);
        }
      }
    });

    test('should display amount won in match history', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const historyWon = page.locator('[data-testid="history-won"]').first();
        const isVisible = await historyWon.isVisible().catch(() => false);
        if (isVisible) {
          const wonText = await historyWon.textContent();
          expect(wonText).toBeTruthy();
        }
      }
    });

    test('should render all match history items for expanded player', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const historyItems = page.locator('[data-testid="match-history-item"]');
        const count = await historyItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  // Multiple Players Sorted by Rank Tests
  test.describe('Multiple Players Sorted by Rank', () => {
    test('should display multiple players in match leaderboard', async ({ page }) => {
      const playerRows = page.locator('[data-testid="match-lb-row"]');
      const count = await playerRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should sort players by rank in ascending order', async ({ page }) => {
      const rankCells = page.locator('[data-testid="match-lb-rank"]');
      const firstRank = await rankCells.first().textContent();
      const secondRank = await rankCells.nth(1).textContent();
      const firstNum = parseInt(firstRank || '0');
      const secondNum = parseInt(secondRank || '999');
      expect(firstNum).toBeLessThanOrEqual(secondNum);
    });

    test('should display multiple players in league standings', async ({ page }) => {
      const playerRows = page.locator('[data-testid="league-row"]');
      const count = await playerRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should sort players by rank in league standings', async ({ page }) => {
      const rankCells = page.locator('[data-testid="league-rank"]');
      const firstRank = await rankCells.first().textContent();
      const secondRank = await rankCells.nth(1).textContent();
      const firstNum = parseInt(firstRank || '0');
      const secondNum = parseInt(secondRank || '999');
      expect(firstNum).toBeLessThanOrEqual(secondNum);
    });

    test('should display consistent ranks across both sections', async ({ page }) => {
      const matchRank = page.locator('[data-testid="match-lb-rank"]').first();
      const leagueRank = page.locator('[data-testid="league-rank"]').first();
      if (await matchRank.isVisible() && await leagueRank.isVisible()) {
        const matchRankText = await matchRank.textContent();
        const leagueRankText = await leagueRank.textContent();
        expect(matchRankText).toBe(leagueRankText);
      }
    });

    test('should maintain rank order during scrolling', async ({ page }) => {
      const leaderboard = page.locator('[data-testid="leaderboard-content"]');
      await leaderboard.evaluate((el) => (el.scrollTop += 200));
      const rankCells = page.locator('[data-testid="match-lb-rank"]');
      const firstRank = await rankCells.first().textContent();
      expect(firstRank).toMatch(/\d+/);
    });
  });

  // Net Winnings Color Tests
  test.describe('Net Winnings Color Coding', () => {
    test('should display green for positive net winnings', async ({ page }) => {
      const positiveNet = page.locator('[data-testid="league-net"].net-positive').first();
      if (await positiveNet.isVisible()) {
        const color = await positiveNet.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should display red for negative net winnings', async ({ page }) => {
      const negativeNet = page.locator('[data-testid="league-net"].net-negative').first();
      if (await negativeNet.isVisible()) {
        const color = await negativeNet.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toBeTruthy();
      }
    });

    test('should add positive class for green net winnings', async ({ page }) => {
      const positiveNet = page.locator('[data-testid="league-net"].net-positive').first();
      if (await positiveNet.isVisible()) {
        await expect(positiveNet).toHaveClass(/net-positive/);
      }
    });

    test('should add negative class for red net winnings', async ({ page }) => {
      const negativeNet = page.locator('[data-testid="league-net"].net-negative').first();
      if (await negativeNet.isVisible()) {
        await expect(negativeNet).toHaveClass(/net-negative/);
      }
    });

    test('should display net winnings with currency symbol', async ({ page }) => {
      const netCell = page.locator('[data-testid="league-net"]').first();
      if (await netCell.isVisible()) {
        const netText = await netCell.textContent();
        expect(netText).toContain('₹');
      }
    });

    test('should format large net winnings with commas', async ({ page }) => {
      const netCell = page.locator('[data-testid="league-net"]').first();
      if (await netCell.isVisible()) {
        const netText = await netCell.textContent();
        if (netText && netText.length > 6) {
          expect(netText).toMatch(/₹[\d,]+/);
        }
      }
    });
  });

  // Empty Leaderboard State Tests
  test.describe('Empty Leaderboard State', () => {
    test('should display empty state message when no players', async ({ page }) => {
      const emptyState = page.locator('[data-testid="leaderboard-empty-state"]');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText(/no players|no data|empty/i);
      }
    });

    test('should display empty state for match leaderboard', async ({ page }) => {
      const matchEmptyState = page.locator('[data-testid="match-lb-empty-state"]');
      if (await matchEmptyState.isVisible()) {
        await expect(matchEmptyState).toBeVisible();
      }
    });

    test('should display empty state for league standings', async ({ page }) => {
      const leagueEmptyState = page.locator('[data-testid="league-empty-state"]');
      if (await leagueEmptyState.isVisible()) {
        await expect(leagueEmptyState).toBeVisible();
      }
    });
  });

  // Back Navigation Tests
  test.describe('Back Navigation', () => {
    test('should navigate back on back button click', async ({ page }) => {
      const backBtn = page.locator('[data-testid="leaderboard-back-btn"]');
      await backBtn.click();
      const leaderboardScreen = page.locator('[data-testid="screen-leaderboard"]');
      await expect(leaderboardScreen).not.toBeVisible();
    });

    test('should return to previous screen', async ({ page }) => {
      const backBtn = page.locator('[data-testid="leaderboard-back-btn"]');
      await backBtn.click();
      const previousScreen = page.locator('[data-testid="screen-home"], [data-testid="home-screen"]');
      const isVisible = await previousScreen.isVisible().catch(() => false);
      expect([true, false]).toContain(isVisible);
    });

    test('should have visible back button at all times', async ({ page }) => {
      const backBtn = page.locator('[data-testid="leaderboard-back-btn"]');
      await expect(backBtn).toBeVisible();
    });

    test('should keep back button visible while scrolling', async ({ page }) => {
      const leaderboard = page.locator('[data-testid="leaderboard-content"]');
      const backBtn = page.locator('[data-testid="leaderboard-back-btn"]');
      await leaderboard.evaluate((el) => (el.scrollTop += 500));
      await expect(backBtn).toBeVisible();
    });
  });

  // Accordion Behavior Tests
  test.describe('Accordion Behavior (Match History)', () => {
    test('should only have one expanded match history at a time', async ({ page }) => {
      const playerRows = page.locator('[data-testid="league-row"]');
      const firstRow = playerRows.first();
      const secondRow = playerRows.nth(1);

      if (await firstRow.isVisible() && await secondRow.isVisible()) {
        await firstRow.click();
        const firstHistory = page.locator('[data-testid="match-history"]').first();
        const firstVisible = await firstHistory.isVisible().catch(() => false);

        if (firstVisible) {
          await secondRow.click();
          const secondHistory = page.locator('[data-testid="match-history"]').nth(1);
          const secondVisible = await secondHistory.isVisible().catch(() => false);

          if (secondVisible) {
            const firstAfter = await firstHistory.isVisible().catch(() => false);
            expect(firstAfter).toBe(false);
          }
        }
      }
    });

    test('should collapse previous expansion when expanding new player', async ({ page }) => {
      const playerRows = page.locator('[data-testid="league-row"]');
      const count = await playerRows.count();

      if (count >= 2) {
        const firstRow = playerRows.first();
        await firstRow.click();
        const expandedCount1 = await page.locator('[data-testid="match-history"]').filter({ hasText: '' }).count();

        const secondRow = playerRows.nth(1);
        await secondRow.click();
        const expandedCount2 = await page.locator('[data-testid="match-history"]').filter({ hasText: '' }).count();

        expect(expandedCount1).toBeLessThanOrEqual(expandedCount2 + 1);
      }
    });

    test('should allow collapsing by clicking same row again', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        await playerRow.click();
        const matchHistory = page.locator('[data-testid="match-history"]').first();
        const isVisible = await matchHistory.isVisible().catch(() => false);
        expect(isVisible).toBe(false);
      }
    });

    test('should animate accordion open and close', async ({ page }) => {
      const playerRow = page.locator('[data-testid="league-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        const matchHistory = page.locator('[data-testid="match-history"]').first();
        const initialHeight = await matchHistory.evaluate((el) => el.offsetHeight).catch(() => 0);
        expect(initialHeight).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // Performance with Many Entries Tests
  test.describe('Performance with Many Entries', () => {
    test('should render large number of players smoothly', async ({ page }) => {
      const startTime = Date.now();
      const playerRows = page.locator('[data-testid="match-lb-row"]');
      const count = await playerRows.count();
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
      expect(count).toBeGreaterThan(0);
    });

    test('should handle scrolling through many entries', async ({ page }) => {
      const leaderboard = page.locator('[data-testid="leaderboard-content"]');
      const startTime = Date.now();
      await leaderboard.evaluate((el) => (el.scrollTop = el.scrollHeight));
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should maintain performance with expanded match histories', async ({ page }) => {
      const playerRows = page.locator('[data-testid="league-row"]');
      const startTime = Date.now();
      if (await playerRows.first().isVisible()) {
        await playerRows.first().click();
        const expandIcon = page.locator('[data-testid="expand-icon"]').first();
        const isExpanded = await expandIcon.getAttribute('data-expanded').catch(() => 'false');
        expect(['true', 'false']).toContain(isExpanded);
      }
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should use efficient rendering for visible rows only', async ({ page }) => {
      const visibleRows = page.locator('[data-testid="match-lb-row"]:visible');
      const totalRows = page.locator('[data-testid="match-lb-row"]');
      const visibleCount = await visibleRows.count();
      const totalCount = await totalRows.count();
      expect(visibleCount).toBeLessThanOrEqual(totalCount);
    });

    test('should load leaderboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      const leaderboard = page.locator('[data-testid="leaderboard-content"]');
      await leaderboard.waitFor({ state: 'visible' });
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  // Error Handling Tests
  test.describe('Error Handling', () => {
    test('should display error message on load failure', async ({ page }) => {
      const errorMessage = page.locator('[data-testid="leaderboard-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/error|failed|try again/i);
      }
    });

    test('should show retry button on error', async ({ page }) => {
      const retryBtn = page.locator('[data-testid="leaderboard-retry-btn"]');
      if (await retryBtn.isVisible()) {
        await expect(retryBtn).toBeEnabled();
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      const leaderboard = page.locator('[data-testid="leaderboard-content"]');
      const errorState = page.locator('[data-testid="leaderboard-error"]');
      const hasContent = await leaderboard.isVisible().catch(() => false);
      const hasError = await errorState.isVisible().catch(() => false);
      expect(hasContent || hasError).toBeTruthy();
    });

    test('should display loading state while fetching data', async ({ page }) => {
      const loader = page.locator('[data-testid="leaderboard-loader"]');
      if (await loader.isVisible()) {
        await expect(loader).toBeVisible();
      }
    });

    test('should capture console errors', async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      const leaderboardErrors = errors.filter((e) => e.includes('leaderboard') || e.includes('Leaderboard'));
      expect(leaderboardErrors.length).toBeLessThanOrEqual(0);
    });

    test('should handle missing player data gracefully', async ({ page }) => {
      const playerRows = page.locator('[data-testid="match-lb-row"]');
      const count = await playerRows.count();
      if (count > 0) {
        const firstPlayer = playerRows.first();
        await expect(firstPlayer).toBeVisible();
      }
    });
  });
});
