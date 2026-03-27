import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://digambar11.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: '../test-results/html-report' }],
    ['json', { outputFile: '../test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    // Mobile-first (primary target)
    {
      name: 'Mobile Chrome',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'], browserName: 'webkit' },
    },
    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro 11'] },
    },
    // Desktop (secondary)
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  outputDir: '../test-results/artifacts',
});
