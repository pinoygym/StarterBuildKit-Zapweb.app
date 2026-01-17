import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/demos',
  testMatch: '**/*.demo.ts', // Match .demo.ts files
  fullyParallel: false, // Sequential for consistent video recording
  retries: 0,
  workers: 1, // Single worker for demos
  timeout: 300000, // 5 minutes per demo

  reporter: [
    ['html', { outputFolder: 'demo-reports' }],
    ['json', { outputFile: 'demo-reports/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.DEMO_BASE_URL || 'http://localhost:3000',

    // Video recording configuration
    video: {
      mode: 'on', // Always record
      size: { width: 1920, height: 1080 }, // Full HD
    },

    // Screenshot configuration
    screenshot: 'on',

    // Trace for debugging
    trace: 'retain-on-failure',

    // Slower action speed for visibility
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Custom viewport
    viewport: { width: 1920, height: 1080 },

    // Locale
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
  },

  projects: [
    {
      name: 'demo-setup',
      testMatch: '**/demo.setup.ts',
    },
    {
      name: 'login-demo',
      testMatch: '**/01-authentication/**/*.demo.ts',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState for login demo - start fresh

        // Demo-specific settings
        launchOptions: {
          slowMo: 500, // 500ms delay between actions
          args: ['--start-maximized', '--start-fullscreen'], // Start browser fullscreen
        },
        viewport: { width: 1920, height: 1080 }, // Full HD viewport
      },
      dependencies: ['demo-setup'], // Still need setup for data seeding
    },
    {
      name: 'chrome-demo',
      testMatch: '**/*.demo.ts',
      testIgnore: '**/01-authentication/**/*.demo.ts', // Login demo handled separately
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/demos/.auth/demo-user.json',

        // Demo-specific settings
        launchOptions: {
          slowMo: 500, // 500ms delay between actions
          args: ['--start-maximized', '--start-fullscreen'], // Start browser fullscreen
        },
        viewport: { width: 1920, height: 1080 }, // Full HD viewport
      },
      dependencies: ['demo-setup'],
    },
  ],

  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },

  // Output folders
  outputDir: 'demo-recordings',
});
