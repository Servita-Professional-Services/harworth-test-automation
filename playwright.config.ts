import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load env from .env (override by setting ENV_FILE if you want a custom path)
dotenv.config({ path: process.env.ENV_FILE || '.env' });

const BASE_URL = process.env.QA_PORTAL_BASE_URL || 'https://delightful-water-0c0d0ba03.6.azurestaticapps.net/';
const API_BASE_URL = process.env.QA_API_BASE_URL || 'https://harworth-portal-api-service-qa.azurewebsites.net';

export default defineConfig({
  // ---- Where tests live
  testDir: './tests',

  // ---- Timeouts
  timeout: 60_000,
  expect: { timeout: 5_000 },

  // ---- Parallelism & CI safety
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  // ---- Reporting
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'results/test-results.xml', embedAnnotationsAsProperties: true }],
  ],

  // ---- Defaults for all projects
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // ---- Projects
  projects: [
    // === UI (runs across multiple browsers) ===
    {
      name: 'ui-chromium',
      testDir: 'tests/ui',
      grep: /@ui/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL,
      },
    },
    {
      name: 'ui-firefox',
      testDir: 'tests/ui',
      grep: /@ui/,
      use: {
        ...devices['Desktop Firefox'],
        baseURL: BASE_URL,
      },
    },
    {
      name: 'ui-webkit',
      testDir: 'tests/ui',
      grep: /@ui/,
      use: {
        ...devices['Desktop Safari'],
        baseURL: BASE_URL,
      },
    },
    // Optional: run in branded Chrome channel too
    {
      name: 'ui-chrome-channel',
      testDir: 'tests/ui',
      grep: /@ui/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        baseURL: BASE_URL,
      },
    },

    // === API (separate project) ===
    {
      name: 'api',
      testDir: 'tests/api',
      grep: /@api/,
      use: {
        baseURL: API_BASE_URL,
      },
    },
  ],

  // ---- Output
  outputDir: 'test-results',
});
