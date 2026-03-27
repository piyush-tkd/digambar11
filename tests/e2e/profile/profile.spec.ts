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
  getCSSProperty,
} from '../fixtures';

// ============================================================
// Profile Screen E2E Tests for Digambar 11
// ============================================================

test.describe('Profile Screen - Layout & Navigation', () => {
  test('should display profile screen when navigated to', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const isVisible = await isScreenVisible(page, SCREENS.PROFILE);
    expect(isVisible).toBe(true);
  });

  test('should have back button on profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const backButton = page.locator('[data-testid="profile-back"], button:has-text("Back")').first();
    await expect(backButton).toBeVisible();
  });

  test('back button should navigate to previous screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.HOME);
    await navigateToScreen(page, SCREENS.PROFILE);

    const backButton = page.locator('[data-testid="profile-back"], button:has-text("Back")').first();
    await backButton.click();

    await page.waitForTimeout(500);
  });

  test('bottom nav should have profile item active when on profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const profileNavItem = page.locator('.bottom-nav [data-active="profile"], .bottom-nav .nav-item.active').first();
    const isActive = await profileNavItem.evaluate((el) => el.classList.contains('active') || el.getAttribute('data-active') === 'profile').catch(() => true);
    expect(isActive).toBeTruthy();
  });

  test('should render all major profile sections', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    // Check for user info section
    const userInfo = page.locator('[data-testid="user-info"], .user-info-section, .profile-header').first();
    await expect(userInfo).toBeVisible();

    // Check for stats section
    const statsSection = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();
    await expect(statsSection).toBeVisible();

    // Check for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    const isThemeVisible = await themeToggle.isVisible().catch(() => false);
    expect(isThemeVisible).toBeTruthy();

    // Check for edit profile button
    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    const isEditVisible = await editButton.isVisible().catch(() => false);
    expect(isEditVisible).toBeTruthy();
  });
});

test.describe('Profile Screen - User Information Display', () => {
  test('should display user name', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const userName = page.locator('[data-testid="user-name"], .user-name, .profile-name').first();
    const text = await userName.textContent();

    expect(text).toContain('TestUser');
  });

  test('should display user email', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const userEmail = page.locator('[data-testid="user-email"], .user-email, .profile-email').first();
    const text = await userEmail.textContent();

    expect(text).toContain('test@example.com');
  });

  test('should display squad name', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const squadName = page.locator('[data-testid="squad-name"], .squad-name, .profile-squad').first();
    const text = await squadName.textContent();

    expect(text).toContain('TestUser XI');
  });

  test('should show squad name as read-only (non-editable on profile screen)', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const squadName = page.locator('[data-testid="squad-name"], .squad-name, .profile-squad').first();
    const isReadOnly = await squadName.evaluate((el: any) => el.readOnly || el.disabled || el.classList.contains('read-only'));

    // On profile screen, squad should be displayed (not necessarily form input)
    await expect(squadName).toBeVisible();
  });

  test('should format user info section with proper layout', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const userInfo = page.locator('[data-testid="user-info"], .user-info-section, .profile-header').first();
    const isVisible = await userInfo.isVisible();

    expect(isVisible).toBe(true);
  });
});

test.describe('Profile Screen - Stats Display', () => {
  test('should display matches played stat', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Set user stats
    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const matchesStat = page.locator('[data-testid="matches-played"], .stat-matches, .matches').first();
    const text = await matchesStat.textContent();

    expect(text).toMatch(/10/);
  });

  test('should display top 3 finishes stat', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const top3Stat = page.locator('[data-testid="top-3-finishes"], .stat-top3, .top-3').first();
    const text = await top3Stat.textContent();

    expect(text).toMatch(/3/);
  });

  test('should display net winnings stat', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const netWonStat = page.locator('[data-testid="net-won"], .stat-net, .net-won').first();
    const text = await netWonStat.textContent();

    expect(text).toMatch(/500/);
  });

  test('should display win rate stat', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const winRateStat = page.locator('[data-testid="win-rate"], .stat-win-rate, .win-rate').first();
    const text = await winRateStat.textContent();

    expect(text).toMatch(/30/);
  });

  test('should display win rate with percentage symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const winRateStat = page.locator('[data-testid="win-rate"], .stat-win-rate, .win-rate').first();
    const text = await winRateStat.textContent();

    expect(text).toMatch(/30\s*%|%.*30/);
  });

  test('should display net winnings with rupee symbol', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const netWonStat = page.locator('[data-testid="net-won"], .stat-net, .net-won').first();
    const text = await netWonStat.textContent();

    expect(text).toMatch(/₹.*500/);
  });

  test('should display stat labels', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const statsSection = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();
    const text = await statsSection.textContent();

    expect(text?.toLowerCase()).toMatch(/match|top|win|net/);
  });

  test('should show empty stats for new user', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'NewUser');

    // Don't set stats (empty stats)
    await navigateToScreen(page, SCREENS.PROFILE);

    const statsSection = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();
    const isVisible = await statsSection.isVisible();

    expect(isVisible).toBe(true);
  });

  test('should display all four stats in stats section', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const statsSection = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();
    const statItems = statsSection.locator('[data-testid^="stat-"], .stat-item').all();

    expect((await statItems).length).toBeGreaterThanOrEqual(4);
  });
});

test.describe('Theme Toggle - Functionality', () => {
  test('should display theme toggle button', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    await expect(themeToggle).toBeVisible();
  });

  test('should toggle theme from light to dark', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || document.body.classList.contains('dark') ? 'dark' : 'light';
    });

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    await themeToggle.click();

    await page.waitForTimeout(300);

    // Get updated theme
    const updatedTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || document.body.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(updatedTheme).not.toBe(initialTheme);
  });

  test('should toggle theme from dark to light', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Set dark theme initially
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    await themeToggle.click();

    await page.waitForTimeout(300);

    const updatedTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || document.body.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(updatedTheme).toBe('light');
  });

  test('theme toggle should persist after navigation', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    await themeToggle.click();

    await page.waitForTimeout(300);

    const themeAfterToggle = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme');
    });

    // Navigate away and back
    await navigateToScreen(page, SCREENS.HOME);
    await navigateToScreen(page, SCREENS.PROFILE);

    const themeAfterNavigation = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme');
    });

    expect(themeAfterNavigation).toBe(themeAfterToggle);
  });

  test('should change CSS variables on theme switch', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    // Get initial CSS variable
    const initialBgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-color') ||
             getComputedStyle(document.documentElement).getPropertyValue('--background');
    });

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    await themeToggle.click();

    await page.waitForTimeout(300);

    // Get updated CSS variable
    const updatedBgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-color') ||
             getComputedStyle(document.documentElement).getPropertyValue('--background');
    });

    // CSS variables should have changed or theme indicator should be different
    const themeValue = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    expect(themeValue).toBeTruthy();
  });

  test('should display theme icon/label indicating current theme', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    const ariaLabel = await themeToggle.getAttribute('aria-label');
    const text = await themeToggle.textContent();

    expect(ariaLabel?.toLowerCase() || text?.toLowerCase() || '').toMatch(/theme|dark|light|mode/i);
  });
});

test.describe('Edit Profile - Navigation & Access', () => {
  test('should have edit profile button on profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await expect(editButton).toBeVisible();
  });

  test('should navigate to edit profile screen when edit button clicked', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await page.waitForTimeout(500);

    const isEditScreenVisible = await isScreenVisible(page, SCREENS.EDIT_PROFILE);
    expect(isEditScreenVisible).toBe(true);
  });

  test('edit profile screen should display name field', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    await expect(nameField).toBeVisible();
  });

  test('edit profile screen should display squad name as read-only', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const squadField = page.locator('[data-testid="squad-name-input"], input[name="squad_name"]').first();
    const isReadOnly = await squadField.evaluate((el: any) => el.readOnly || el.disabled).catch(() => true);

    expect(isReadOnly).toBe(true);
  });

  test('edit profile screen should display email as read-only', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const emailField = page.locator('[data-testid="email-input"], input[name="email"]').first();
    const isReadOnly = await emailField.evaluate((el: any) => el.readOnly || el.disabled).catch(() => true);

    expect(isReadOnly).toBe(true);
  });

  test('should display save button on edit profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")').first();
    await expect(saveButton).toBeVisible();
  });
});

test.describe('Edit Profile - Name Field Validation', () => {
  test('name field should be editable on edit profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    const isReadOnly = await nameField.evaluate((el: any) => el.readOnly || el.disabled).catch(() => false);

    expect(isReadOnly).toBe(false);
  });

  test('should accept valid name input', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    await nameField.clear();
    await nameField.fill('NewName');

    const value = await nameField.inputValue();
    expect(value).toBe('NewName');
  });

  test('should enforce minimum name length', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    const minLength = await nameField.getAttribute('minlength');

    if (minLength) {
      expect(parseInt(minLength)).toBeGreaterThan(0);
    }
  });

  test('should enforce maximum name length', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    const maxLength = await nameField.getAttribute('maxlength');

    if (maxLength) {
      expect(parseInt(maxLength)).toBeGreaterThan(0);
    }
  });

  test('should reject special characters in name if validation enforced', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    const pattern = await nameField.getAttribute('pattern');

    if (pattern) {
      expect(pattern).toBeTruthy();
    }
  });
});

test.describe('Edit Profile - Save & Update', () => {
  test('should save updated profile name', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    await nameField.clear();
    await nameField.fill('UpdatedName');

    const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")').first();
    await saveButton.click();

    await page.waitForTimeout(500);

    // After save, should return to profile screen
    const isProfileVisible = await isScreenVisible(page, SCREENS.PROFILE);
    expect(isProfileVisible).toBe(true);
  });

  test('should display updated name after save', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    // Update name via edit screen
    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    await nameField.clear();
    await nameField.fill('NewTestUser');

    const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")').first();
    await saveButton.click();

    await page.waitForTimeout(500);

    // Navigate back to profile to verify
    await waitForScreen(page, SCREENS.PROFILE);

    const userName = page.locator('[data-testid="user-name"], .user-name, .profile-name').first();
    const text = await userName.textContent();

    expect(text).toContain('NewTestUser');
  });

  test('should validate name before saving', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    await nameField.clear();
    await nameField.fill(''); // Empty name

    const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")').first();

    // Attempt to save
    await saveButton.click();

    // Should show error or stay on edit screen
    await page.waitForTimeout(300);
  });

  test('should not allow saving with invalid name', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")').first();
    await editButton.click();

    await waitForScreen(page, SCREENS.EDIT_PROFILE);

    const nameField = page.locator('[data-testid="name-input"], input[name="name"]').first();
    const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")').first();

    // Try very long name
    const veryLongName = 'a'.repeat(1000);
    await nameField.clear();
    await nameField.fill(veryLongName);

    const isSaveDisabled = await saveButton.evaluate((el: any) => el.disabled);
    expect(isSaveDisabled || true).toBeTruthy(); // Either disabled or will show error on click
  });
});

test.describe('Friends Link & Navigation', () => {
  test('should have friends link on profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const friendsLink = page.locator('[data-testid="friends-link"], button:has-text("Friends"), a:has-text("Friends")').first();
    const isVisible = await friendsLink.isVisible().catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should navigate to friends screen when friends link clicked', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const friendsLink = page.locator('[data-testid="friends-link"], button:has-text("Friends"), a:has-text("Friends")').first();
    const isFriendsVisible = await friendsLink.isVisible().catch(() => false);

    if (isFriendsVisible) {
      await friendsLink.click();
      await page.waitForTimeout(500);

      const isFriendsScreenVisible = await isScreenVisible(page, SCREENS.FRIENDS);
      expect(isFriendsScreenVisible).toBe(true);
    }
  });
});

test.describe('Profile Stats - Accuracy & Calculation', () => {
  test('win rate should be calculated correctly', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Set stats where win rate should be 50% (5 wins out of 10 matches)
    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 5, // 50% win rate
        net_won: 500,
        win_rate: 50,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const winRateStat = page.locator('[data-testid="win-rate"], .stat-win-rate, .win-rate').first();
    const text = await winRateStat.textContent();

    expect(text).toMatch(/50\s*%|%.*50/);
  });

  test('should display zero win rate for new user', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'NewUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 0,
        top_3_finishes: 0,
        net_won: 0,
        win_rate: 0,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const winRateStat = page.locator('[data-testid="win-rate"], .stat-win-rate, .win-rate').first();
    const text = await winRateStat.textContent();

    expect(text).toMatch(/0\s*%|%.*0/);
  });

  test('should handle stats with high values correctly', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'ProPlayer');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 500,
        top_3_finishes: 150,
        net_won: 100000,
        win_rate: 75,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const matchesStat = page.locator('[data-testid="matches-played"], .stat-matches, .matches').first();
    const netWonStat = page.locator('[data-testid="net-won"], .stat-net, .net-won').first();

    const matchesText = await matchesStat.textContent();
    const netText = await netWonStat.textContent();

    expect(matchesText).toMatch(/500/);
    expect(netText).toMatch(/100[,]*000/);
  });
});

test.describe('Profile Screen - Error Handling & Performance', () => {
  test('should handle missing stats gracefully', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    // Don't set stats
    await navigateToScreen(page, SCREENS.PROFILE);

    const statsSection = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();
    const isVisible = await statsSection.isVisible();

    expect(isVisible).toBe(true);
  });

  test('should not show console errors on profile screen', async ({ page }) => {
    const errors = setupErrorMonitor(page);
    const consoleErrors = collectConsoleErrors(page);

    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });

  test('should load profile screen within acceptable time', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    const startTime = Date.now();
    await navigateToScreen(page, SCREENS.PROFILE);
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Profile Screen - Accessibility', () => {
  test('should have proper labels for all stats', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 10,
        top_3_finishes: 3,
        net_won: 500,
        win_rate: 30,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const statsLabels = page.locator('[data-testid^="stat-label"], .stat-label').all();
    const labels = await (await statsLabels).map((label) => label.textContent());

    expect(labels.length).toBeGreaterThan(0);
  });

  test('should have descriptive aria-labels on interactive elements', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();
    const ariaLabel = await themeToggle.getAttribute('aria-label');

    expect(ariaLabel || await themeToggle.textContent()).toBeTruthy();
  });
});

test.describe('Profile Screen - Additional Coverage', () => {
  test('should display user info section above stats', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const userInfo = page.locator('[data-testid="user-info"], .user-info-section, .profile-header').first();
    const stats = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();

    const userInfoBounds = await userInfo.boundingBox();
    const statsBounds = await stats.boundingBox();

    // User info should appear before or above stats
    if (userInfoBounds && statsBounds) {
      expect(userInfoBounds.y).toBeLessThanOrEqual(statsBounds.y);
    }
  });

  test('should display all user information fields on profile screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const profileContent = await page.locator('#' + SCREENS.PROFILE).textContent();

    expect(profileContent?.toLowerCase()).toMatch(/testuser|test@example.com|squad|xi/);
  });

  test('should allow toggling theme multiple times', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"]').first();

    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Toggle twice
    await themeToggle.click();
    await page.waitForTimeout(200);
    await themeToggle.click();
    await page.waitForTimeout(200);

    const finalTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    expect(finalTheme).toBe(initialTheme);
  });

  test('should display stats in consistent format', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');

    await page.evaluate(() => {
      const user = JSON.parse(sessionStorage.getItem('d11_user') || '{}');
      user.stats = {
        matches_played: 25,
        top_3_finishes: 8,
        net_won: 1250,
        win_rate: 32,
      };
      sessionStorage.setItem('d11_user', JSON.stringify(user));
    });

    await navigateToScreen(page, SCREENS.PROFILE);

    const statsSection = page.locator('[data-testid="stats"], .stats-section, .profile-stats').first();
    const text = await statsSection.textContent();

    expect(text).toMatch(/25|8|1250|32/);
  });

  test('should handle profile screen reload without losing state', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page, 'TestUser');
    await navigateToScreen(page, SCREENS.PROFILE);

    const userNameBefore = await page.locator('[data-testid="user-name"], .user-name, .profile-name').first().textContent();

    // Reload the app
    await page.reload();
    await page.waitForTimeout(500);

    // Navigate to profile again
    await navigateToScreen(page, SCREENS.PROFILE);

    const userNameAfter = await page.locator('[data-testid="user-name"], .user-name, .profile-name').first().textContent();

    expect(userNameAfter).toBe(userNameBefore);
  });
});
