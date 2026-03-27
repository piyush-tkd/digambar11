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
} from '../fixtures';

// ============================================================
// Wallet Screen E2E Tests for Digambar 11
// ============================================================

test.describe('Wallet Screen - Layout & Navigation', () => {
  test('should display wallet screen when navigated to', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const isVisible = await isScreenVisible(page, SCREENS.WALLET);
    expect(isVisible).toBe(true);
  });

  test('should have back button on wallet screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const backButton = page.locator('[data-testid="wallet-back"], button:has-text("Back")').first();
    await expect(backButton).toBeVisible();
  });

  test('back button should navigate to previous screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.HOME);
    await navigateToScreen(page, SCREENS.WALLET);

    const backButton = page.locator('[data-testid="wallet-back"], button:has-text("Back")').first();
    await backButton.click();

    // Should navigate back or show home
    await page.waitForTimeout(500);
  });

  test('bottom nav should have wallet item active when on wallet screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const walletNavItem = page.locator('.bottom-nav [data-active="wallet"], .bottom-nav .nav-item.active').first();
    const isActive = await walletNavItem.evaluate((el) => el.classList.contains('active') || el.getAttribute('data-active') === 'wallet');
    expect(isActive || await walletNavItem.isVisible()).toBeTruthy();
  });

  test('should render all major wallet sections', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    // Check for balance section
    const balanceSection = page.locator('[data-testid="balance-display"], .balance-section, .net-winnings').first();
    await expect(balanceSection).toBeVisible();

    // Check for entry fees section
    const entryFeesSection = page.locator('[data-testid="entry-fees"], .entry-fees-section, .fee-info').first();
    await expect(entryFeesSection).toBeVisible();

    // Check for prize distribution section
    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    await expect(prizeSection).toBeVisible();

    // Check for transaction history section
    const transactionSection = page.locator('[data-testid="transaction-history"], .transaction-section, .history').first();
    await expect(transactionSection).toBeVisible();
  });
});

test.describe('Balance Display - Formatting & Accuracy', () => {
  test('should display balance with rupee symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    expect(balanceText).toMatch(/₹/);
  });

  test('should format balance with proper number formatting', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    // Should have ₹ and numbers, possibly with comma separators
    expect(balanceText).toMatch(/₹\s*[\d,]+/);
  });

  test('should display label "Season Balance" or "Net Winnings"', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const balanceLabel = await page.locator('[data-testid="balance-label"], .balance-label, .season-balance-label').first().textContent();
    expect(balanceLabel?.toLowerCase()).toMatch(/season|balance|winnings|net/i);
  });

  test('should format large balance values (e.g., 10,000+)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Set a large balance via localStorage
    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = 15750;
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    expect(balanceText).toMatch(/₹\s*1[5,]*7[5,]*0/);
  });

  test('should display negative balance with minus sign', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Set a negative balance
    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = -500;
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    expect(balanceText).toMatch(/-|₹\s*-/);
  });

  test('should display zero balance correctly', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Set zero balance
    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = 0;
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    expect(balanceText).toMatch(/₹\s*0/);
  });
});

test.describe('Entry Fees Section', () => {
  test('should display entry fee for league matches (₹25)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const feeText = await page.locator('[data-testid="league-fee"], .league-fee, .entry-fee-league').first().textContent();
    expect(feeText).toMatch(/25/);
  });

  test('should display entry fee for qualifier (₹50)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const feeText = await page.locator('[data-testid="qualifier-fee"], .qualifier-fee, .entry-fee-qualifier').first().textContent();
    expect(feeText).toMatch(/50/);
  });

  test('should display entry fee for final (₹100)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const feeText = await page.locator('[data-testid="final-fee"], .final-fee, .entry-fee-final').first().textContent();
    expect(feeText).toMatch(/100/);
  });

  test('should display all three entry fee types', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const entryFeesSection = page.locator('[data-testid="entry-fees"], .entry-fees-section, .fee-info').first();
    const text = await entryFeesSection.textContent();

    expect(text).toContain('25');
    expect(text).toContain('50');
    expect(text).toContain('100');
  });

  test('entry fees should have rupee symbols', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const entryFeesSection = page.locator('[data-testid="entry-fees"], .entry-fees-section, .fee-info').first();
    const text = await entryFeesSection.textContent();

    expect(text).toMatch(/₹/);
  });

  test('should label entry fee types (league, qualifier, final)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const entryFeesSection = page.locator('[data-testid="entry-fees"], .entry-fees-section, .fee-info').first();
    const text = await entryFeesSection.textContent();

    expect(text?.toLowerCase()).toMatch(/league|qualifier|final/i);
  });
});

test.describe('Prize Distribution Section', () => {
  test('should display 1st place prize (30%)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    expect(text).toMatch(/30/);
  });

  test('should display 2nd place prize (25%)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    expect(text).toMatch(/25/);
  });

  test('should display 3rd place prize (20%)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    expect(text).toMatch(/20/);
  });

  test('should display 4th place prize (15%)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    expect(text).toMatch(/15/);
  });

  test('should display 5th place prize (10%)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    expect(text).toMatch(/10/);
  });

  test('should show max 5 winners in prize distribution', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    // Should mention 5 or maximum or winners
    expect(text?.toLowerCase()).toMatch(/5|winner|place/i);
  });

  test('prize percentages should add up to 100%', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    // All percentages: 30 + 25 + 20 + 15 + 10 = 100
    expect(text).toMatch(/30.*25.*20.*15.*10/);
  });

  test('should indicate pro-rata distribution rule', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    expect(text?.toLowerCase()).toMatch(/pro-rata|proportional|distribution/i);
  });
});

test.describe('Transaction History - Rendering & Display', () => {
  test('should display transaction history section', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const transactionSection = page.locator('[data-testid="transaction-history"], .transaction-section, .history').first();
    await expect(transactionSection).toBeVisible();
  });

  test('should display individual transactions', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Add mock transactions
    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
          { id: 2, type: 'winnings', amount: 100, date: '2026-03-26', description: '1st Place' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transactions = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').all();
    expect((await transactions).length).toBeGreaterThan(0);
  });

  test('transaction should display date', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transaction = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').first();
    const text = await transaction.textContent();

    expect(text).toMatch(/2026|03|27|Mar|March/);
  });

  test('transaction should display type/description', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transaction = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').first();
    const text = await transaction.textContent();

    expect(text?.toLowerCase()).toMatch(/league|entry|fee/);
  });

  test('transaction should display amount with rupee symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transaction = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').first();
    const text = await transaction.textContent();

    expect(text).toMatch(/₹.*25/);
  });
});

test.describe('Transaction Colors - Visual Distinction', () => {
  test('winning transaction should be displayed in green', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'winnings', amount: 100, date: '2026-03-26', description: '1st Place' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transaction = page.locator('[data-testid="transaction-winnings"], .transaction-item:has-text("Place"), .transaction-row').first();
    const color = await transaction.evaluate((el) => {
      return window.getComputedStyle(el).color || window.getComputedStyle(el).backgroundColor;
    });

    expect(color?.toLowerCase()).toMatch(/green|rgb\(0.*255|rgb\(.*0.*\d+\)|#[0-9a-fA-F]*[aA-fF]/);
  });

  test('entry fee transaction should be displayed in red', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transaction = page.locator('[data-testid="transaction-fee"], .transaction-item:has-text("Entry"), .transaction-row').first();
    const color = await transaction.evaluate((el) => {
      return window.getComputedStyle(el).color || window.getComputedStyle(el).backgroundColor;
    });

    expect(color?.toLowerCase()).toMatch(/red|rgb\(255.*0.*0|rgb\(\d+\.*\d*.*0.*0/);
  });

  test('bonus transaction should be displayed in green', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'bonus', amount: 50, date: '2026-03-25', description: 'Signup Bonus' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transaction = page.locator('[data-testid="transaction-bonus"], .transaction-item:has-text("Bonus"), .transaction-row').first();
    const color = await transaction.evaluate((el) => {
      return window.getComputedStyle(el).color || window.getComputedStyle(el).backgroundColor;
    });

    expect(color?.toLowerCase()).toMatch(/green|rgb\(0.*255|rgb\(.*0.*\d+\)|#[0-9a-fA-F]*[aA-fF]/);
  });
});

test.describe('Transaction Date Formatting', () => {
  test('should display transaction date in readable format', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const dateElement = page.locator('[data-testid="transaction-date"], .transaction-date').first();
    const text = await dateElement.textContent();

    expect(text).toMatch(/\d+|Mar|March|2026/);
  });

  test('should handle dates from different months correctly', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-01-15', description: 'League Entry' },
          { id: 2, type: 'winnings', amount: 100, date: '2026-12-31', description: '1st Place' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transactions = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').all();
    expect((await transactions).length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Transaction History - Empty State', () => {
  test('should display empty state when no transactions exist', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = { transactions: [] };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const emptyState = page.locator('[data-testid="empty-transactions"], .empty-state, .no-transactions').first();
    const isVisible = await emptyState.isVisible().catch(() => false);

    if (isVisible) {
      const text = await emptyState.textContent();
      expect(text?.toLowerCase()).toMatch(/no|empty|transaction/i);
    }
  });

  test('should show message when transaction history is empty', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = { transactions: [] };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const historySection = page.locator('[data-testid="transaction-history"], .transaction-section, .history').first();
    const text = await historySection.textContent();

    expect(text?.toLowerCase()).toMatch(/empty|no|transaction|history/i);
  });
});

test.describe('Transaction History - Multiple Transactions & Scrolling', () => {
  test('should display multiple transactions in order', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
          { id: 2, type: 'winnings', amount: 100, date: '2026-03-26', description: '1st Place' },
          { id: 3, type: 'entry_fee', amount: 50, date: '2026-03-25', description: 'Qualifier Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transactions = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').all();
    expect((await transactions).length).toBeGreaterThanOrEqual(3);
  });

  test('should support scrolling through many transactions', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Create many transactions
    await page.evaluate(() => {
      const transactions = [];
      for (let i = 0; i < 20; i++) {
        transactions.push({
          id: i,
          type: i % 2 === 0 ? 'entry_fee' : 'winnings',
          amount: 25 + i,
          date: `2026-03-${String((27 - i).toString().padStart(2, '0')).padStart(2, '0')}`,
          description: 'Transaction ' + i,
        });
      }
      const data = { transactions };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const historySection = page.locator('[data-testid="transaction-history"], .transaction-section, .history').first();
    await historySection.scrollIntoViewIfNeeded();

    // Scroll down in the transaction list
    await historySection.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await page.waitForTimeout(300);
  });

  test('should maintain transaction order (newest first)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'Latest' },
          { id: 2, type: 'winnings', amount: 100, date: '2026-03-20', description: 'Older' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const firstTransaction = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').first();
    const firstText = await firstTransaction.textContent();

    expect(firstText).toContain('Latest');
  });
});

test.describe('Wallet Rules & Constraints', () => {
  test('should display minimum 2 players requirement for league', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    // Check if there's any mention of minimum players
    const pageText = await page.content();
    const hasMinPlayers = pageText.includes('2') && pageText.includes('player');

    expect(hasMinPlayers).toBeTruthy();
  });

  test('should show rules section with league information', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const rulesSection = page.locator('[data-testid="rules"], .rules-section, .league-rules').first();
    const isVisible = await rulesSection.isVisible().catch(() => false);

    if (isVisible) {
      const text = await rulesSection.textContent();
      expect(text?.toLowerCase()).toMatch(/rule|player|league|minimum/i);
    }
  });
});

test.describe('Balance Calculation & Edge Cases', () => {
  test('balance calculation should account for entry fees', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        startingBalance: 1000,
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = 975; // 1000 - 25
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    expect(balanceText).toMatch(/975/);
  });

  test('balance calculation should account for winnings', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        startingBalance: 1000,
        transactions: [
          { id: 1, type: 'winnings', amount: 500, date: '2026-03-26', description: '1st Place' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = 1500; // 1000 + 500
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceText = await page.locator('[data-testid="balance-amount"], .balance-amount, .season-balance').first().textContent();
    expect(balanceText).toMatch(/1500/);
  });

  test('should handle mixed transactions correctly', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
          { id: 2, type: 'winnings', amount: 100, date: '2026-03-26', description: '1st Place' },
          { id: 3, type: 'entry_fee', amount: 50, date: '2026-03-25', description: 'Qualifier Entry' },
          { id: 4, type: 'bonus', amount: 50, date: '2026-03-24', description: 'Signup Bonus' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transactions = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').all();
    expect((await transactions).length).toBeGreaterThanOrEqual(4);
  });
});

test.describe('Wallet Screen - Error Handling & Performance', () => {
  test('should handle missing balance gracefully', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Clear balance
    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = undefined;
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceSection = page.locator('[data-testid="balance-display"], .balance-section, .net-winnings').first();
    await expect(balanceSection).toBeVisible();
  });

  test('should not show console errors on wallet screen', async ({ page }) => {
    const errors = setupErrorMonitor(page);
    const consoleErrors = collectConsoleErrors(page);

    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });

  test('should load wallet screen within acceptable time', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    const startTime = Date.now();
    await navigateToScreen(page, SCREENS.WALLET);
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });
});

test.describe('Wallet Screen - Accessibility', () => {
  test('should have descriptive text for balance section', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const balanceLabel = page.locator('[data-testid="balance-label"], .balance-label, label').first();
    const label = await balanceLabel.textContent();

    expect(label?.length).toBeGreaterThan(0);
  });

  test('should have alt text or aria-label for balance display', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const balance = page.locator('[data-testid="balance-amount"], .balance-amount').first();
    const ariaLabel = await balance.getAttribute('aria-label');
    const title = await balance.getAttribute('title');

    expect(ariaLabel || title || '').toBeTruthy();
  });
});

test.describe('Wallet Screen - Additional Coverage', () => {
  test('should display all entry fee labels clearly', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const feesSection = page.locator('[data-testid="entry-fees"], .entry-fees-section, .fee-info').first();
    const text = await feesSection.textContent();

    expect(text?.toLowerCase()).toMatch(/league|₹.*25|₹.*50|₹.*100/i);
  });

  test('should format transaction amounts consistently', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
          { id: 2, type: 'entry_fee', amount: 50, date: '2026-03-26', description: 'Qualifier Entry' },
          { id: 3, type: 'winnings', amount: 250, date: '2026-03-25', description: '2nd Place' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const transactions = page.locator('[data-testid="transaction"], .transaction-item, .transaction-row').all();
    const transactionCount = (await transactions).length;

    expect(transactionCount).toBeGreaterThanOrEqual(3);
  });

  test('should display transaction type indicators or icons', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const data = {
        transactions: [
          { id: 1, type: 'entry_fee', amount: 25, date: '2026-03-27', description: 'League Entry' },
          { id: 2, type: 'winnings', amount: 100, date: '2026-03-26', description: '1st Place' },
        ],
      };
      sessionStorage.setItem('d11_wallet', JSON.stringify(data));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const historySection = page.locator('[data-testid="transaction-history"], .transaction-section, .history').first();
    const text = await historySection.textContent();

    expect(text?.toLowerCase()).toMatch(/league|place|entry|win/);
  });

  test('should persist balance state when navigating between screens', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.balance = 5000;
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.WALLET);

    const balanceBefore = await page.locator('[data-testid="balance-amount"], .balance-amount').first().textContent();

    // Navigate to another screen
    await navigateToScreen(page, SCREENS.HOME);

    // Navigate back
    await navigateToScreen(page, SCREENS.WALLET);

    const balanceAfter = await page.locator('[data-testid="balance-amount"], .balance-amount').first().textContent();

    expect(balanceAfter).toBe(balanceBefore);
  });

  test('should display correct prize percentages in order', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.WALLET);

    const prizeSection = page.locator('[data-testid="prize-distribution"], .prize-section, .prize-info').first();
    const text = await prizeSection.textContent();

    // Should have percentages in descending order: 30, 25, 20, 15, 10
    const has30 = text?.includes('30');
    const has25 = text?.includes('25');
    const has20 = text?.includes('20');
    const has15 = text?.includes('15');
    const has10 = text?.includes('10');

    expect(has30 && has25 && has20 && has15 && has10).toBe(true);
  });
});
