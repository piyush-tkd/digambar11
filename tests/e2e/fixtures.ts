import { test as base, expect, Page } from '@playwright/test';

// ============================================================
// Shared Test Fixtures & Helpers for Digambar 11 E2E Tests
// ============================================================

export const APP_URL = process.env.BASE_URL || 'https://digambar11.vercel.app';

// Screen IDs used in the app
export const SCREENS = {
  SPLASH: 'screen-splash',
  LOGIN: 'screen-login',
  SQUAD_SETUP: 'screen-squad-setup',
  HOME: 'screen-home',
  MATCH_DETAIL: 'screen-match-detail',
  TEAM_SELECT: 'screen-team-select',
  CAPTAIN: 'screen-captain',
  PREVIEW: 'screen-preview',
  LEADERBOARD: 'screen-leaderboard',
  LIVE_MATCH: 'screen-live-match',
  MY_MATCHES: 'screen-my-matches',
  WALLET: 'screen-wallet',
  PROFILE: 'screen-profile',
  SCORING: 'screen-scoring',
  EDIT_PROFILE: 'screen-edit-profile',
  FRIENDS: 'screen-friends',
} as const;

// IPL Teams
export const IPL_TEAMS = ['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'GT', 'LSG'];

// Player roles
export const ROLES = ['WK', 'BAT', 'AR', 'BWL'] as const;

// Team composition rules
export const TEAM_RULES = {
  TOTAL_PLAYERS: 11,
  MAX_CREDITS: 100,
  MIN_WK: 1,
  MAX_WK: 4,
  MIN_BAT: 3,
  MAX_BAT: 6,
  MIN_AR: 1,
  MAX_AR: 4,
  MIN_BWL: 3,
  MAX_BWL: 6,
  MAX_OVERSEAS: 4,
  MAX_PER_TEAM: 7,
};

// Helper: wait for a specific screen to be visible
export async function waitForScreen(page: Page, screenId: string) {
  await page.waitForSelector(`#${screenId}`, { state: 'visible', timeout: 10000 });
}

// Helper: check if screen is visible
export async function isScreenVisible(page: Page, screenId: string): Promise<boolean> {
  const el = page.locator(`#${screenId}`);
  return await el.isVisible().catch(() => false);
}

// Helper: navigate to app and wait for initial load
export async function loadApp(page: Page) {
  await page.goto(APP_URL);
  // Wait for splash or login screen
  await page.waitForSelector('#screen-splash, #screen-login, #screen-home', {
    state: 'visible',
    timeout: 15000,
  });
}

// Helper: bypass login (mock auth via localStorage/sessionStorage)
export async function mockLogin(page: Page, name = 'TestUser') {
  await page.evaluate((userName) => {
    sessionStorage.setItem('d11_user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      name: userName,
      squad_name: `${userName} XI`,
    }));
    sessionStorage.setItem('d11_auth', 'true');
  }, name);
}

// Helper: navigate to a screen via showScreen
export async function navigateToScreen(page: Page, screenId: string) {
  await page.evaluate((id) => {
    (window as any).showScreen(id);
  }, screenId);
  await waitForScreen(page, screenId);
}

// Helper: get all visible players on team select screen
export async function getVisiblePlayers(page: Page) {
  return page.locator('.player-row:visible').all();
}

// Helper: count selected players
export async function getSelectedPlayerCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('#selected-count, .selected-count');
    return parseInt(el?.textContent || '0', 10);
  });
}

// Helper: get credits remaining
export async function getCreditsRemaining(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.getElementById('credits-left');
    return parseFloat(el?.textContent || '100');
  });
}

// Helper: tap bottom nav item
export async function tapBottomNav(page: Page, index: number) {
  const navItems = page.locator('.bottom-nav .nav-item, .bottom-nav > div');
  await navItems.nth(index).click();
}

// Helper: check if element has specific CSS property
export async function getCSSProperty(page: Page, selector: string, property: string) {
  return page.evaluate(
    ({ sel, prop }) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).getPropertyValue(prop) : null;
    },
    { sel: selector, prop: property }
  );
}

// Helper: simulate slow network
export async function simulateSlowNetwork(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 50 * 1024, // 50kb/s
    uploadThroughput: 20 * 1024,
    latency: 2000,
  });
}

// Helper: simulate offline
export async function goOffline(page: Page) {
  await page.context().setOffline(true);
}

export async function goOnline(page: Page) {
  await page.context().setOffline(false);
}

// Helper: take and compare screenshot
export async function screenshotAndCompare(page: Page, name: string) {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0.05,
  });
}

// Helper: check for console errors
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Helper: check no JS errors
export function setupErrorMonitor(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', (err) => errors.push(err));
  return errors;
}

// Extended test fixture with common setup
export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    await loadApp(page);
    await use(page);
  },
});

export { expect };
