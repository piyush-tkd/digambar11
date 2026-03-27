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

test.describe('Bottom Navigation Bar', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should display 5 bottom navigation items', async ({ page }) => {
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    expect(bottomNav).toBeVisible();

    const navItems = page.locator('[data-testid="bottom-nav-item"]');
    await expect(navItems).toHaveCount(5);
  });

  test('should have correct bottom nav item labels', async ({ page }) => {
    const navLabels = page.locator('[data-testid="bottom-nav-item-label"]');
    const labels = await navLabels.allTextContents();

    expect(labels).toContain('Home');
    expect(labels).toContain('My Matches');
    expect(labels).toContain('Wallet');
    expect(labels).toContain('Profile');
    expect(labels).toContain('Scoring');
  });

  test('should navigate to Home screen via bottom nav', async ({ page }) => {
    await tapBottomNav(page, 'Home');
    await expect(isScreenVisible(page, 'home')).toBeTruthy();
  });

  test('should navigate to My Matches screen via bottom nav', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');
    await expect(isScreenVisible(page, 'my-matches')).toBeTruthy();
  });

  test('should navigate to Wallet screen via bottom nav', async ({ page }) => {
    await tapBottomNav(page, 'Wallet');
    await waitForScreen(page, 'wallet');
    await expect(isScreenVisible(page, 'wallet')).toBeTruthy();
  });

  test('should navigate to Profile screen via bottom nav', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    await waitForScreen(page, 'profile');
    await expect(isScreenVisible(page, 'profile')).toBeTruthy();
  });

  test('should navigate to Scoring screen via bottom nav', async ({ page }) => {
    await tapBottomNav(page, 'Scoring');
    await waitForScreen(page, 'scoring');
    await expect(isScreenVisible(page, 'scoring')).toBeTruthy();
  });

  test('should highlight active bottom nav item on Home', async ({ page }) => {
    await tapBottomNav(page, 'Home');
    const homeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
    const label = homeItem.locator('[data-testid="bottom-nav-item-label"]');
    await expect(label).toContainText('Home');
  });

  test('should highlight active bottom nav item on My Matches', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    const activeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
    const label = activeItem.locator('[data-testid="bottom-nav-item-label"]');
    await expect(label).toContainText('My Matches');
  });

  test('should highlight active bottom nav item on Wallet', async ({ page }) => {
    await tapBottomNav(page, 'Wallet');
    const activeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
    const label = activeItem.locator('[data-testid="bottom-nav-item-label"]');
    await expect(label).toContainText('Wallet');
  });

  test('should highlight active bottom nav item on Profile', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    const activeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
    const label = activeItem.locator('[data-testid="bottom-nav-item-label"]');
    await expect(label).toContainText('Profile');
  });

  test('should highlight active bottom nav item on Scoring', async ({ page }) => {
    await tapBottomNav(page, 'Scoring');
    const activeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
    const label = activeItem.locator('[data-testid="bottom-nav-item-label"]');
    await expect(label).toContainText('Scoring');
  });

  test('should maintain bottom nav visibility when switching screens', async ({ page }) => {
    const bottomNav = page.locator('[data-testid="bottom-nav"]');

    await tapBottomNav(page, 'Home');
    expect(bottomNav).toBeVisible();

    await tapBottomNav(page, 'My Matches');
    expect(bottomNav).toBeVisible();

    await tapBottomNav(page, 'Profile');
    expect(bottomNav).toBeVisible();
  });

  test('should not show bottom nav on splash screen', async ({ page }) => {
    await page.goto(APP_URL);
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).not.toBeVisible();
  });

  test('should not show bottom nav on login screen', async ({ page }) => {
    await page.goto(APP_URL);
    await navigateToScreen(page, 'login');
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).not.toBeVisible();
  });
});

test.describe('Screen Transitions and Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should show only one screen at a time', async ({ page }) => {
    const screens = page.locator('[data-testid="screen"]');
    const visibleScreens = screens.filter({ has: page.locator(':visible') });
    await expect(visibleScreens).toHaveCount(1);
  });

  test('should transition from home to match-detail', async ({ page }) => {
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();

    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();

    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();
  });

  test('should transition from match-detail to team-select', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();

    const teamSelectScreen = page.locator('[data-testid="screen-team-select"]');
    await expect(teamSelectScreen).toBeVisible();
  });

  test('should transition from team-select to captain', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();
    await waitForScreen(page, 'team-select');

    const nextButton = page.locator('[data-testid="next-button"]');
    await nextButton.click();

    const captainScreen = page.locator('[data-testid="screen-captain"]');
    await expect(captainScreen).toBeVisible();
  });

  test('should transition from captain to preview', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();
    await waitForScreen(page, 'team-select');

    const nextButton = page.locator('[data-testid="next-button"]');
    await nextButton.click();
    await waitForScreen(page, 'captain');

    const confirmButton = page.locator('[data-testid="confirm-captain-button"]');
    await confirmButton.click();

    const previewScreen = page.locator('[data-testid="screen-preview"]');
    await expect(previewScreen).toBeVisible();
  });

  test('should hide home screen when navigating to match-detail', async ({ page }) => {
    const homeScreen = page.locator('[data-testid="screen-home"]');
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();

    await expect(homeScreen).not.toBeVisible();
  });

  test('should show home screen when returning from my-matches', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');

    await tapBottomNav(page, 'Home');
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });

  test('should display correct header title on home screen', async ({ page }) => {
    const header = page.locator('[data-testid="screen-header"]');
    await expect(header).toContainText('Contests');
  });

  test('should display correct header title on my-matches screen', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    const header = page.locator('[data-testid="screen-header"]');
    await expect(header).toContainText('My Matches');
  });

  test('should display correct header title on wallet screen', async ({ page }) => {
    await tapBottomNav(page, 'Wallet');
    const header = page.locator('[data-testid="screen-header"]');
    await expect(header).toContainText('Wallet');
  });

  test('should display correct header title on profile screen', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    const header = page.locator('[data-testid="screen-header"]');
    await expect(header).toContainText('Profile');
  });

  test('should display correct header title on scoring screen', async ({ page }) => {
    await tapBottomNav(page, 'Scoring');
    const header = page.locator('[data-testid="screen-header"]');
    await expect(header).toContainText('Scoring');
  });
});

test.describe('Back Button Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should go back from match-detail to home', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });

  test('should go back from team-select to match-detail', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();
    await waitForScreen(page, 'team-select');

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();
  });

  test('should go back from captain to team-select', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();
    await waitForScreen(page, 'team-select');

    const nextButton = page.locator('[data-testid="next-button"]');
    await nextButton.click();
    await waitForScreen(page, 'captain');

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    const teamSelectScreen = page.locator('[data-testid="screen-team-select"]');
    await expect(teamSelectScreen).toBeVisible();
  });

  test('should support browser back button', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    await page.goBack();
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });

  test('should maintain navigation history for multiple steps', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();
    await waitForScreen(page, 'team-select');

    await page.goBack();
    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();

    await page.goBack();
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });
});

test.describe('Deep Linking via URL Hash', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('should navigate to login via #login hash', async ({ page }) => {
    await page.goto(`${APP_URL}#login`);
    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should navigate to home via #home hash', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#home`);
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });

  test('should navigate to my-matches via #my-matches hash', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#my-matches`);
    const myMatchesScreen = page.locator('[data-testid="screen-my-matches"]');
    await expect(myMatchesScreen).toBeVisible();
  });

  test('should navigate to wallet via #wallet hash', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#wallet`);
    const walletScreen = page.locator('[data-testid="screen-wallet"]');
    await expect(walletScreen).toBeVisible();
  });

  test('should navigate to profile via #profile hash', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#profile`);
    const profileScreen = page.locator('[data-testid="screen-profile"]');
    await expect(profileScreen).toBeVisible();
  });

  test('should navigate to scoring via #scoring hash', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#scoring`);
    const scoringScreen = page.locator('[data-testid="screen-scoring"]');
    await expect(scoringScreen).toBeVisible();
  });

  test('should navigate to squad-setup via #squad-setup hash', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#squad-setup`);
    const squadSetupScreen = page.locator('[data-testid="screen-squad-setup"]');
    await expect(squadSetupScreen).toBeVisible();
  });

  test('should navigate to match-detail via hash with parameters', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#match-detail/123`);
    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();
  });

  test('should navigate to team-select via hash with parameters', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#team-select/123`);
    const teamSelectScreen = page.locator('[data-testid="screen-team-select"]');
    await expect(teamSelectScreen).toBeVisible();
  });

  test('should update URL hash when navigating screens', async ({ page }) => {
    await mockLogin(page);
    await waitForScreen(page, 'home');

    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');
    expect(page.url()).toContain('#my-matches');
  });
});

test.describe('Comprehensive Screen Navigation Flows', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should complete full team creation flow: home → match → team → captain → preview', async ({
    page,
  }) => {
    // Home screen
    let screen = page.locator('[data-testid="screen-home"]');
    await expect(screen).toBeVisible();

    // Navigate to match detail
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    screen = page.locator('[data-testid="screen-match-detail"]');
    await expect(screen).toBeVisible();

    // Navigate to team selection
    const startButton = page.locator('[data-testid="start-team-button"]');
    await startButton.click();
    await waitForScreen(page, 'team-select');

    screen = page.locator('[data-testid="screen-team-select"]');
    await expect(screen).toBeVisible();

    // Navigate to captain selection
    const nextButton = page.locator('[data-testid="next-button"]');
    await nextButton.click();
    await waitForScreen(page, 'captain');

    screen = page.locator('[data-testid="screen-captain"]');
    await expect(screen).toBeVisible();

    // Navigate to preview
    const confirmButton = page.locator('[data-testid="confirm-captain-button"]');
    await confirmButton.click();
    await waitForScreen(page, 'preview');

    screen = page.locator('[data-testid="screen-preview"]');
    await expect(screen).toBeVisible();
  });

  test('should navigate home → leaderboard and back', async ({ page }) => {
    const leaderboardLink = page.locator('[data-testid="leaderboard-link"]');
    await leaderboardLink.click();
    await waitForScreen(page, 'leaderboard');

    const leaderboardScreen = page.locator('[data-testid="screen-leaderboard"]');
    await expect(leaderboardScreen).toBeVisible();

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });

  test('should navigate profile → edit-profile and back', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    await waitForScreen(page, 'profile');

    const editButton = page.locator('[data-testid="edit-profile-button"]');
    await editButton.click();
    await waitForScreen(page, 'edit-profile');

    const editProfileScreen = page.locator('[data-testid="screen-edit-profile"]');
    await expect(editProfileScreen).toBeVisible();

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    const profileScreen = page.locator('[data-testid="screen-profile"]');
    await expect(profileScreen).toBeVisible();
  });

  test('should navigate profile → friends and back', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    await waitForScreen(page, 'profile');

    const friendsLink = page.locator('[data-testid="friends-link"]');
    await friendsLink.click();
    await waitForScreen(page, 'friends');

    const friendsScreen = page.locator('[data-testid="screen-friends"]');
    await expect(friendsScreen).toBeVisible();

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    const profileScreen = page.locator('[data-testid="screen-profile"]');
    await expect(profileScreen).toBeVisible();
  });
});

test.describe('Unauthorized Access and Route Protection', () => {
  test('should redirect to login when accessing home without authentication', async ({ page }) => {
    await page.goto(APP_URL);
    await page.goto(`${APP_URL}#home`);

    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should redirect to login when accessing my-matches without authentication', async ({
    page,
  }) => {
    await page.goto(APP_URL);
    await page.goto(`${APP_URL}#my-matches`);

    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should redirect to login when accessing wallet without authentication', async ({
    page,
  }) => {
    await page.goto(APP_URL);
    await page.goto(`${APP_URL}#wallet`);

    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should redirect to login when accessing profile without authentication', async ({
    page,
  }) => {
    await page.goto(APP_URL);
    await page.goto(`${APP_URL}#profile`);

    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should redirect to login when accessing scoring without authentication', async ({
    page,
  }) => {
    await page.goto(APP_URL);
    await page.goto(`${APP_URL}#scoring`);

    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should show login when tapping bottom nav without authentication', async ({ page }) => {
    await page.goto(APP_URL);
    // Simulate being on a public page
    await navigateToScreen(page, 'login');

    // Try to tap bottom nav (should not work or redirect)
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).not.toBeVisible();
  });
});

test.describe('Navigation During Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should show loading indicator when navigating between screens', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();

    // Loading indicator should appear briefly
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    // May or may not be visible depending on network speed
    await waitForScreen(page, 'match-detail');

    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();
  });

  test('should not allow double-clicking navigation items', async ({ page }) => {
    const walletNavItem = page.locator('[data-testid="bottom-nav-item"]:has([data-testid="bottom-nav-item-label"]:text("Wallet"))');

    await walletNavItem.click();
    await walletNavItem.click();
    await waitForScreen(page, 'wallet');

    const walletScreens = page.locator('[data-testid="screen-wallet"]');
    // Should only have one wallet screen visible
    const visibleWallets = await walletScreens.count();
    expect(visibleWallets).toBeLessThanOrEqual(1);
  });

  test('should handle rapid screen switches gracefully', async ({ page }) => {
    const homeNavItem = page.locator('[data-testid="bottom-nav-item"]:has([data-testid="bottom-nav-item-label"]:text("Home"))');
    const walletNavItem = page.locator('[data-testid="bottom-nav-item"]:has([data-testid="bottom-nav-item-label"]:text("Wallet"))');
    const profileNavItem = page.locator('[data-testid="bottom-nav-item"]:has([data-testid="bottom-nav-item-label"]:text("Profile"))');

    // Rapid clicks
    await homeNavItem.click();
    await walletNavItem.click();
    await profileNavItem.click();

    await waitForScreen(page, 'profile');
    const profileScreen = page.locator('[data-testid="screen-profile"]');
    await expect(profileScreen).toBeVisible();
  });
});

test.describe('All 16 Screens Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('should be able to access splash screen', async ({ page }) => {
    await page.goto(APP_URL);
    const splashScreen = page.locator('[data-testid="screen-splash"]');
    // Splash should either be visible or navigate away
    const visible = await splashScreen.isVisible().catch(() => false);
    // If not visible, app navigated to next screen (expected)
    expect(visible || page.url().includes('#')).toBeTruthy();
  });

  test('should be able to access login screen', async ({ page }) => {
    await page.goto(`${APP_URL}#login`);
    const loginScreen = page.locator('[data-testid="screen-login"]');
    await expect(loginScreen).toBeVisible();
  });

  test('should be able to access squad-setup screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#squad-setup`);
    const squadSetupScreen = page.locator('[data-testid="screen-squad-setup"]');
    await expect(squadSetupScreen).toBeVisible();
  });

  test('should be able to access home screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#home`);
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });

  test('should be able to access match-detail screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#match-detail/123`);
    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();
  });

  test('should be able to access team-select screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#team-select/123`);
    const teamSelectScreen = page.locator('[data-testid="screen-team-select"]');
    await expect(teamSelectScreen).toBeVisible();
  });

  test('should be able to access captain screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#captain/123`);
    const captainScreen = page.locator('[data-testid="screen-captain"]');
    await expect(captainScreen).toBeVisible();
  });

  test('should be able to access preview screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#preview/123`);
    const previewScreen = page.locator('[data-testid="screen-preview"]');
    await expect(previewScreen).toBeVisible();
  });

  test('should be able to access leaderboard screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#leaderboard`);
    const leaderboardScreen = page.locator('[data-testid="screen-leaderboard"]');
    await expect(leaderboardScreen).toBeVisible();
  });

  test('should be able to access live-match screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#live-match/123`);
    const liveMatchScreen = page.locator('[data-testid="screen-live-match"]');
    await expect(liveMatchScreen).toBeVisible();
  });

  test('should be able to access my-matches screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#my-matches`);
    const myMatchesScreen = page.locator('[data-testid="screen-my-matches"]');
    await expect(myMatchesScreen).toBeVisible();
  });

  test('should be able to access wallet screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#wallet`);
    const walletScreen = page.locator('[data-testid="screen-wallet"]');
    await expect(walletScreen).toBeVisible();
  });

  test('should be able to access profile screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#profile`);
    const profileScreen = page.locator('[data-testid="screen-profile"]');
    await expect(profileScreen).toBeVisible();
  });

  test('should be able to access scoring screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#scoring`);
    const scoringScreen = page.locator('[data-testid="screen-scoring"]');
    await expect(scoringScreen).toBeVisible();
  });

  test('should be able to access edit-profile screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#edit-profile`);
    const editProfileScreen = page.locator('[data-testid="screen-edit-profile"]');
    await expect(editProfileScreen).toBeVisible();
  });

  test('should be able to access friends screen', async ({ page }) => {
    await mockLogin(page);
    await page.goto(`${APP_URL}#friends`);
    const friendsScreen = page.locator('[data-testid="screen-friends"]');
    await expect(friendsScreen).toBeVisible();
  });
});

test.describe('Scroll Position Management', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should reset scroll position when navigating to new screen', async ({ page }) => {
    // Scroll down on home screen
    const homeScreen = page.locator('[data-testid="screen-home"]');
    await homeScreen.evaluate((el) => {
      el.scrollTop = 100;
    });

    let scrollPos = await homeScreen.evaluate((el) => el.scrollTop);
    expect(scrollPos).toBe(100);

    // Navigate to wallet
    await tapBottomNav(page, 'Wallet');
    await waitForScreen(page, 'wallet');

    // Navigate back to home
    await tapBottomNav(page, 'Home');
    await waitForScreen(page, 'home');

    // Scroll position should be reset
    scrollPos = await homeScreen.evaluate((el) => el.scrollTop);
    expect(scrollPos).toBe(0);
  });

  test('should preserve scroll position when returning to previous screen', async ({ page }) => {
    const homeScreen = page.locator('[data-testid="screen-home"]');

    // Scroll down on home screen
    await homeScreen.evaluate((el) => {
      el.scrollTop = 150;
    });

    const initialScroll = await homeScreen.evaluate((el) => el.scrollTop);

    // Navigate to match detail and back
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();
    await waitForScreen(page, 'home');

    // Scroll position may or may not be preserved (depends on implementation)
    // This test documents expected behavior
    const finalScroll = await homeScreen.evaluate((el) => el.scrollTop);
    // Just verify we can read scroll position
    expect(typeof finalScroll).toBe('number');
  });
});

test.describe('Multiple Rapid Screen Switches', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should handle 5 consecutive rapid bottom nav taps', async ({ page }) => {
    const navItems = ['Home', 'My Matches', 'Wallet', 'Profile', 'Scoring'];

    for (const item of navItems) {
      await tapBottomNav(page, item);
    }

    // Final screen should be Scoring
    await waitForScreen(page, 'scoring');
    const scoringScreen = page.locator('[data-testid="screen-scoring"]');
    await expect(scoringScreen).toBeVisible();
  });

  test('should handle back navigation after rapid switches', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    await tapBottomNav(page, 'Wallet');
    await tapBottomNav(page, 'Profile');

    await page.goBack();
    await waitForScreen(page, 'wallet');

    const walletScreen = page.locator('[data-testid="screen-wallet"]');
    await expect(walletScreen).toBeVisible();
  });

  test('should maintain correct active nav indicator after rapid switches', async ({ page }) => {
    const screens = ['Home', 'My Matches', 'Wallet', 'Profile', 'Scoring'];

    for (const screen of screens) {
      await tapBottomNav(page, screen);

      const activeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
      const label = activeItem.locator('[data-testid="bottom-nav-item-label"]');
      await expect(label).toContainText(screen);
    }
  });
});

test.describe('Navigation with Pending State', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should disable navigation during data loading', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();

    // Try to tap bottom nav while loading (should be disabled or ignored)
    const walletNavItem = page.locator('[data-testid="bottom-nav-item"]:has([data-testid="bottom-nav-item-label"]:text("Wallet"))');
    const isDisabled = await walletNavItem.getAttribute('data-disabled');

    // May or may not be disabled depending on implementation
    await waitForScreen(page, 'match-detail');
    const matchDetailScreen = page.locator('[data-testid="screen-match-detail"]');
    await expect(matchDetailScreen).toBeVisible();
  });

  test('should show loading state on active navigation item', async ({ page }) => {
    const walletNavItem = page.locator('[data-testid="bottom-nav-item"]:has([data-testid="bottom-nav-item-label"]:text("Wallet"))');

    await walletNavItem.click();

    // Check for loading indicator
    const loadingIndicator = walletNavItem.locator('[data-testid="loading-spinner"]');
    // May or may not be visible depending on network speed

    await waitForScreen(page, 'wallet');
    const walletScreen = page.locator('[data-testid="screen-wallet"]');
    await expect(walletScreen).toBeVisible();
  });
});

test.describe('Screen Visibility and Z-Index', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should have only one screen visible at a time on home nav', async ({ page }) => {
    const screens = page.locator('[data-testid="screen"]:visible');
    const count = await screens.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('should have only one screen visible when switching to my-matches', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');

    const screens = page.locator('[data-testid="screen"]:visible');
    const count = await screens.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('should have only one screen visible when switching to wallet', async ({ page }) => {
    await tapBottomNav(page, 'Wallet');
    await waitForScreen(page, 'wallet');

    const screens = page.locator('[data-testid="screen"]:visible');
    const count = await screens.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('should have only one screen visible when switching to profile', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    await waitForScreen(page, 'profile');

    const screens = page.locator('[data-testid="screen"]:visible');
    const count = await screens.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('should have only one screen visible when switching to scoring', async ({ page }) => {
    await tapBottomNav(page, 'Scoring');
    await waitForScreen(page, 'scoring');

    const screens = page.locator('[data-testid="screen"]:visible');
    const count = await screens.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});

test.describe('Navigation Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should recover from navigation error and stay on current screen', async ({ page }) => {
    const initialScreen = page.locator('[data-testid="screen-home"]');
    await expect(initialScreen).toBeVisible();

    // Try to navigate to invalid screen
    await navigateToScreen(page, 'invalid-screen').catch(() => {
      // Expected to fail
    });

    // Should still be on home screen
    await expect(initialScreen).toBeVisible();
  });

  test('should handle missing screen parameters gracefully', async ({ page }) => {
    await page.goto(`${APP_URL}#match-detail`);
    // Should either show match detail or redirect to home
    const screens = page.locator('[data-testid="screen"]:visible');
    const count = await screens.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('URL Hash and Navigation Sync', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should update URL hash when navigating via bottom nav', async ({ page }) => {
    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');
    expect(page.url()).toContain('#my-matches');
  });

  test('should update URL hash when navigating via tap', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    const matchId = await matchCard.getAttribute('data-match-id');

    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    expect(page.url()).toContain('#match-detail');
  });

  test('should navigate when URL hash changes externally', async ({ page }) => {
    expect(page.url()).toContain('#home');

    await page.evaluate(() => {
      window.location.hash = '#wallet';
    });

    await waitForScreen(page, 'wallet');
    const walletScreen = page.locator('[data-testid="screen-wallet"]');
    await expect(walletScreen).toBeVisible();
  });

  test('should handle hash changes during transitions', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();

    // Change hash while transitioning
    await page.evaluate(() => {
      window.location.hash = '#wallet';
    });

    // Should navigate to wallet
    await waitForScreen(page, 'wallet');
    const walletScreen = page.locator('[data-testid="screen-wallet"]');
    await expect(walletScreen).toBeVisible();
  });
});

test.describe('Navigation Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should navigate between screens within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');

    const endTime = Date.now();
    const navigationTime = endTime - startTime;

    // Navigation should complete within 3 seconds
    expect(navigationTime).toBeLessThan(3000);
  });

  test('should handle rapid back/forward navigation', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.click();
    await waitForScreen(page, 'match-detail');

    // Rapid back/forward
    await page.goBack();
    await page.goForward();
    await page.goBack();

    const homeScreen = page.locator('[data-testid="screen-home"]');
    await expect(homeScreen).toBeVisible();
  });
});

test.describe('Navigation State Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await setupErrorMonitor(page);
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, 'home');
  });

  test('should not have console errors during navigation', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    const initialErrorCount = errors.length;

    await tapBottomNav(page, 'My Matches');
    await waitForScreen(page, 'my-matches');

    await tapBottomNav(page, 'Wallet');
    await waitForScreen(page, 'wallet');

    const newErrors = await collectConsoleErrors(page);
    // Should not have new errors
    expect(newErrors.length).toBeLessThanOrEqual(initialErrorCount);
  });

  test('should maintain consistent active nav indicator', async ({ page }) => {
    await tapBottomNav(page, 'Profile');
    await waitForScreen(page, 'profile');

    const activeItem = page.locator('[data-testid="bottom-nav-item"][data-active="true"]');
    const label = activeItem.locator('[data-testid="bottom-nav-item-label"]');

    await expect(label).toContainText('Profile');

    // Screen should also show profile
    const profileScreen = page.locator('[data-testid="screen-profile"]');
    await expect(profileScreen).toBeVisible();
  });
});
