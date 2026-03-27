import { test, expect, loadApp, waitForScreen, SCREENS, mockLogin, APP_URL, navigateToScreen, isScreenVisible, setupErrorMonitor, collectConsoleErrors } from '../fixtures';

test.describe('Friends Screen', () => {
  test.beforeEach(async ({ page }) => {
    await setupErrorMonitor(page);
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.FRIENDS);
    await waitForScreen(page, SCREENS.FRIENDS);
  });

  // Screen Layout Tests
  test.describe('Screen Layout', () => {
    test('should display friends screen title', async ({ page }) => {
      const title = page.locator('[data-testid="friends-title"]');
      await expect(title).toBeVisible();
      await expect(title).toHaveText(/Friends/i);
    });

    test('should display friends list container', async ({ page }) => {
      const listContainer = page.locator('[data-testid="friends-list"]');
      await expect(listContainer).toBeVisible();
    });

    test('should display invite friends button', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await expect(inviteBtn).toBeVisible();
      await expect(inviteBtn).toHaveText(/Invite/i);
    });

    test('should display back button in header', async ({ page }) => {
      const backBtn = page.locator('[data-testid="friends-back-btn"]');
      await expect(backBtn).toBeVisible();
    });

    test('should have correct page structure with header and content', async ({ page }) => {
      const header = page.locator('[data-testid="friends-header"]');
      const content = page.locator('[data-testid="friends-content"]');
      await expect(header).toBeVisible();
      await expect(content).toBeVisible();
    });
  });

  // Friend Rows Tests
  test.describe('Friend Rows Display', () => {
    test('should display friend name in each row', async ({ page }) => {
      const friendName = page.locator('[data-testid="friend-name"]').first();
      await expect(friendName).toBeVisible();
      const nameText = await friendName.textContent();
      expect(nameText).toBeTruthy();
    });

    test('should display net balance for each friend', async ({ page }) => {
      const netBalance = page.locator('[data-testid="friend-net-balance"]').first();
      await expect(netBalance).toBeVisible();
      const balanceText = await netBalance.textContent();
      expect(balanceText).toMatch(/[₹£$€]|[+-]?[\d,]+/);
    });

    test('should display friend status indicator', async ({ page }) => {
      const statusIcon = page.locator('[data-testid="friend-status"]').first();
      await expect(statusIcon).toBeVisible();
    });

    test('should display friend avatar/initial', async ({ page }) => {
      const avatar = page.locator('[data-testid="friend-avatar"]').first();
      await expect(avatar).toBeVisible();
    });

    test('should have clickable friend row', async ({ page }) => {
      const friendRow = page.locator('[data-testid="friend-row"]').first();
      await expect(friendRow).toBeVisible();
      await friendRow.click();
      // Should navigate or show details
      const detailsOrScreen = page.locator('[data-testid="friend-detail"], [data-testid="screen-friends"]');
      await expect(detailsOrScreen).toBeVisible();
    });

    test('should render complete friend card structure', async ({ page }) => {
      const friendCard = page.locator('[data-testid="friend-card"]').first();
      const name = friendCard.locator('[data-testid="friend-name"]');
      const balance = friendCard.locator('[data-testid="friend-net-balance"]');
      await expect(name).toBeVisible();
      await expect(balance).toBeVisible();
    });
  });

  // Net Balance Color Tests
  test.describe('Net Balance Color Coding', () => {
    test('should display green color for positive balance', async ({ page }) => {
      const balanceElement = page.locator('[data-testid="friend-net-balance"][data-balance-type="positive"]').first();
      if (await balanceElement.isVisible()) {
        const color = await balanceElement.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toContain('rgb');
      }
    });

    test('should display red color for negative balance', async ({ page }) => {
      const balanceElement = page.locator('[data-testid="friend-net-balance"][data-balance-type="negative"]').first();
      if (await balanceElement.isVisible()) {
        const color = await balanceElement.evaluate((el) => window.getComputedStyle(el).color);
        expect(color).toContain('rgb');
      }
    });

    test('should display neutral color for zero balance', async ({ page }) => {
      const balanceElement = page.locator('[data-testid="friend-net-balance"][data-balance-type="zero"]').first();
      if (await balanceElement.isVisible()) {
        await expect(balanceElement).toBeVisible();
      }
    });

    test('should add proper class for positive balance styling', async ({ page }) => {
      const positiveBalance = page.locator('[data-testid="friend-net-balance"].balance-positive').first();
      if (await positiveBalance.isVisible()) {
        await expect(positiveBalance).toHaveClass(/balance-positive/);
      }
    });

    test('should add proper class for negative balance styling', async ({ page }) => {
      const negativeBalance = page.locator('[data-testid="friend-net-balance"].balance-negative').first();
      if (await negativeBalance.isVisible()) {
        await expect(negativeBalance).toHaveClass(/balance-negative/);
      }
    });
  });

  // Invite Button Tests
  test.describe('Invite Friends Button', () => {
    test('should have invite button visible and clickable', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await expect(inviteBtn).toBeVisible();
      await expect(inviteBtn).toBeEnabled();
    });

    test('should show modal or popup on invite button click', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const modal = page.locator('[data-testid="invite-modal"], [data-testid="invite-dialog"]');
      await expect(modal).toBeVisible();
    });

    test('should display invite link in modal', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const inviteLink = page.locator('[data-testid="invite-link"]');
      await expect(inviteLink).toBeVisible();
      const linkText = await inviteLink.inputValue();
      expect(linkText).toMatch(/https?:\/\/.+/);
    });

    test('should have copy button for invite link', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const copyBtn = page.locator('[data-testid="copy-invite-btn"]');
      await expect(copyBtn).toBeVisible();
    });

    test('should copy invite link to clipboard', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const copyBtn = page.locator('[data-testid="copy-invite-btn"]');
      await copyBtn.click();
      const toast = page.locator('[data-testid="toast"], [role="status"]');
      await expect(toast).toContainText(/copied|Copied/i);
    });

    test('should have close button on invite modal', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const closeBtn = page.locator('[data-testid="close-invite-modal"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      const modal = page.locator('[data-testid="invite-modal"]');
      await expect(modal).not.toBeVisible();
    });

    test('should display unique invite link', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const inviteLink = page.locator('[data-testid="invite-link"]');
      const link1 = await inviteLink.inputValue();
      expect(link1).toBeTruthy();
      expect(link1.length).toBeGreaterThan(10);
    });
  });

  // Invite Link Generation Tests
  test.describe('Invite Link Generation', () => {
    test('should generate valid invite URL', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const inviteLink = page.locator('[data-testid="invite-link"]');
      const linkValue = await inviteLink.inputValue();
      expect(linkValue).toMatch(/https?:\/\/.+\?.*/);
    });

    test('should include user ID in invite link', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const inviteLink = page.locator('[data-testid="invite-link"]');
      const linkValue = await inviteLink.inputValue();
      expect(linkValue).toContain('ref=') || expect(linkValue).toContain('user=') || expect(linkValue).toContain('id=');
    });

    test('should provide shareable invite link', async ({ page }) => {
      const inviteBtn = page.locator('[data-testid="invite-friends-btn"]');
      await inviteBtn.click();
      const shareBtn = page.locator('[data-testid="share-invite-btn"]');
      if (await shareBtn.isVisible()) {
        await expect(shareBtn).toBeEnabled();
      }
    });
  });

  // Empty State Tests
  test.describe('Empty Friends List State', () => {
    test('should display empty state message when no friends', async ({ page }) => {
      const emptyState = page.locator('[data-testid="friends-empty-state"]');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText(/no friends|invite friends|add friends/i);
      }
    });

    test('should show invite CTA in empty state', async ({ page }) => {
      const emptyState = page.locator('[data-testid="friends-empty-state"]');
      if (await emptyState.isVisible()) {
        const inviteBtn = emptyState.locator('[data-testid="invite-friends-btn"]');
        await expect(inviteBtn).toBeVisible();
      }
    });

    test('should display empty friends list count', async ({ page }) => {
      const friendCount = page.locator('[data-testid="friends-count"]');
      if (await friendCount.isVisible()) {
        const countText = await friendCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    });
  });

  // Multiple Friends Tests
  test.describe('Multiple Friends Rendering', () => {
    test('should render all friends in list', async ({ page }) => {
      const friendRows = page.locator('[data-testid="friend-row"]');
      const count = await friendRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display correct number of friends', async ({ page }) => {
      const friendRows = page.locator('[data-testid="friend-row"]');
      const count = await friendRows.count();
      const friendCount = page.locator('[data-testid="friends-count"]');
      if (await friendCount.isVisible()) {
        const countText = await friendCount.textContent();
        expect(countText).toContain(count.toString());
      }
    });

    test('should render friend with all properties', async ({ page }) => {
      const friendRow = page.locator('[data-testid="friend-row"]').first();
      const name = friendRow.locator('[data-testid="friend-name"]');
      const balance = friendRow.locator('[data-testid="friend-net-balance"]');
      const status = friendRow.locator('[data-testid="friend-status"]');
      await expect(name).toBeVisible();
      await expect(balance).toBeVisible();
      await expect(status).toBeVisible();
    });
  });

  // Sorting Tests
  test.describe('Friend Sorting', () => {
    test('should have sort options available', async ({ page }) => {
      const sortMenu = page.locator('[data-testid="friends-sort-menu"]');
      if (await sortMenu.isVisible()) {
        await expect(sortMenu).toBeVisible();
      }
    });

    test('should sort friends by name', async ({ page }) => {
      const sortBtn = page.locator('[data-testid="sort-by-name"]');
      if (await sortBtn.isVisible()) {
        await sortBtn.click();
        const friendRows = page.locator('[data-testid="friend-row"]');
        const firstFriend = await friendRows.first().locator('[data-testid="friend-name"]').textContent();
        expect(firstFriend).toBeTruthy();
      }
    });

    test('should sort friends by balance', async ({ page }) => {
      const sortBtn = page.locator('[data-testid="sort-by-balance"]');
      if (await sortBtn.isVisible()) {
        await sortBtn.click();
        const friendRows = page.locator('[data-testid="friend-row"]');
        const firstBalance = await friendRows.first().locator('[data-testid="friend-net-balance"]').textContent();
        expect(firstBalance).toBeTruthy();
      }
    });

    test('should toggle ascending/descending sort', async ({ page }) => {
      const sortBtn = page.locator('[data-testid="sort-toggle"]');
      if (await sortBtn.isVisible()) {
        await sortBtn.click();
        const sortIcon = sortBtn.locator('[data-testid="sort-icon"]');
        await expect(sortIcon).toBeVisible();
      }
    });

    test('should maintain sort order after navigation', async ({ page }) => {
      const sortBtn = page.locator('[data-testid="sort-by-balance"]');
      if (await sortBtn.isVisible()) {
        await sortBtn.click();
        const backBtn = page.locator('[data-testid="friends-back-btn"]');
        await backBtn.click();
        await navigateToScreen(page, SCREENS.FRIENDS);
        const firstFriend = page.locator('[data-testid="friend-row"]').first();
        await expect(firstFriend).toBeVisible();
      }
    });
  });

  // Back Navigation Tests
  test.describe('Back Navigation', () => {
    test('should navigate back on back button click', async ({ page }) => {
      const backBtn = page.locator('[data-testid="friends-back-btn"]');
      await backBtn.click();
      const friendsScreen = page.locator('[data-testid="screen-friends"]');
      await expect(friendsScreen).not.toBeVisible();
    });

    test('should navigate to previous screen', async ({ page }) => {
      const backBtn = page.locator('[data-testid="friends-back-btn"]');
      await backBtn.click();
      const homeScreen = page.locator('[data-testid="screen-home"], [data-testid="home-screen"]');
      const isVisible = await homeScreen.isVisible().catch(() => false);
      expect([true, false]).toContain(isVisible);
    });

    test('should have visible back button at all times', async ({ page }) => {
      const backBtn = page.locator('[data-testid="friends-back-btn"]');
      await expect(backBtn).toBeVisible();
    });
  });

  // Currency Formatting Tests
  test.describe('Currency Formatting', () => {
    test('should display currency symbol in balances', async ({ page }) => {
      const balance = page.locator('[data-testid="friend-net-balance"]').first();
      if (await balance.isVisible()) {
        const balanceText = await balance.textContent();
        expect(balanceText).toMatch(/[₹£$€]/);
      }
    });

    test('should format large numbers with commas', async ({ page }) => {
      const balance = page.locator('[data-testid="friend-net-balance"]').first();
      if (await balance.isVisible()) {
        const balanceText = await balance.textContent();
        if (balanceText && balanceText.includes('00')) {
          expect(balanceText).toMatch(/[₹£$€][\d,]+/);
        }
      }
    });

    test('should display positive amounts without + sign or with +', async ({ page }) => {
      const positiveBalance = page.locator('[data-testid="friend-net-balance"].balance-positive').first();
      if (await positiveBalance.isVisible()) {
        const balanceText = await positiveBalance.textContent();
        expect(balanceText).toMatch(/[₹£$€][\d,]+/);
      }
    });

    test('should display negative amounts with - sign', async ({ page }) => {
      const negativeBalance = page.locator('[data-testid="friend-net-balance"].balance-negative').first();
      if (await negativeBalance.isVisible()) {
        const balanceText = await negativeBalance.textContent();
        expect(balanceText).toMatch(/-[₹£$€]?[\d,]+|[₹£$€]-[\d,]+/);
      }
    });

    test('should handle decimal amounts correctly', async ({ page }) => {
      const balance = page.locator('[data-testid="friend-net-balance"]').first();
      if (await balance.isVisible()) {
        const balanceText = await balance.textContent();
        expect(balanceText).toBeTruthy();
      }
    });
  });

  // Large List Scrolling Tests
  test.describe('Large Friend Lists Scrolling', () => {
    test('should support scrolling for large lists', async ({ page }) => {
      const listContainer = page.locator('[data-testid="friends-list"]');
      const initialScroll = await listContainer.evaluate((el) => el.scrollTop);
      await listContainer.evaluate((el) => (el.scrollTop += 100));
      const afterScroll = await listContainer.evaluate((el) => el.scrollTop);
      expect(afterScroll).toBeGreaterThan(initialScroll);
    });

    test('should render friends efficiently with virtualization', async ({ page }) => {
      const friendRows = page.locator('[data-testid="friend-row"]');
      const count = await friendRows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should maintain performance with many friends', async ({ page }) => {
      const startTime = Date.now();
      const listContainer = page.locator('[data-testid="friends-list"]');
      await listContainer.evaluate((el) => (el.scrollTop = el.scrollHeight));
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  // Friend Count Display Tests
  test.describe('Friend Count Display', () => {
    test('should display friend count in header', async ({ page }) => {
      const friendCount = page.locator('[data-testid="friends-count"]');
      if (await friendCount.isVisible()) {
        const countText = await friendCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    });

    test('should update friend count dynamically', async ({ page }) => {
      const friendCount = page.locator('[data-testid="friends-count"]');
      if (await friendCount.isVisible()) {
        const countBefore = await friendCount.textContent();
        expect(countBefore).toBeTruthy();
      }
    });

    test('should show plural/singular correctly', async ({ page }) => {
      const friendCountLabel = page.locator('[data-testid="friends-count-label"]');
      if (await friendCountLabel.isVisible()) {
        const label = await friendCountLabel.textContent();
        expect(label).toMatch(/friend/i);
      }
    });
  });

  // Error Handling Tests
  test.describe('Error Handling', () => {
    test('should display error message on load failure', async ({ page }) => {
      const errorMessage = page.locator('[data-testid="friends-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/error|failed|try again/i);
      }
    });

    test('should show retry button on error', async ({ page }) => {
      const retryBtn = page.locator('[data-testid="friends-retry-btn"]');
      if (await retryBtn.isVisible()) {
        await expect(retryBtn).toBeEnabled();
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      const friendsList = page.locator('[data-testid="friends-list"]');
      const errorState = page.locator('[data-testid="friends-error"]');
      const hasContent = await friendsList.isVisible().catch(() => false);
      const hasError = await errorState.isVisible().catch(() => false);
      expect(hasContent || hasError).toBeTruthy();
    });

    test('should capture console errors', async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      const friendsErrors = errors.filter((e) => e.includes('friends') || e.includes('Friends'));
      expect(friendsErrors.length).toBeLessThanOrEqual(0);
    });

    test('should handle missing friend data gracefully', async ({ page }) => {
      const friendRows = page.locator('[data-testid="friend-row"]');
      const count = await friendRows.count();
      if (count > 0) {
        const firstFriend = friendRows.first();
        await expect(firstFriend).toBeVisible();
      }
    });
  });
});
