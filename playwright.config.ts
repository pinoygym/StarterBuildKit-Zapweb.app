import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables BEFORE any other configuration
// This ensures E2E tests run against the test database (neondb_test), not production
dotenv.config({ path: '.env.test' });

console.log('🧪 Playwright loading .env.test - Database:', process.env.DATABASE_URL?.includes('neondb_test') ? 'neondb_test ✅' : 'WARNING: Not using test DB!');

export default defineConfig({
  testDir: './tests/e2e',
  /* Maximum time one test can run for. */
  timeout: 120 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toBeVisible();`
     */
    timeout: 15000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3007',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'reseed',
      testMatch: '**/reseed.setup.ts',
      dependencies: ['chromium'], // Run after all Chromium tests complete
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['reseed'], // Run after database is reseeded
    },

  ],

  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'bun run dev:test',
    url: 'http://localhost:3007',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      IS_PLAYWRIGHT: 'true',
      DATABASE_URL: process.env.DATABASE_URL || '',
      PORT: '3007'
    },
  },
});
