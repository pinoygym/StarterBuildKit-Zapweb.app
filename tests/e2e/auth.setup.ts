import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login');

  // Fill in login credentials
  await page.fill('input[type="email"]', 'cybergada@gmail.com');
  await page.fill('input[type="password"]', 'Qweasd145698@');

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard (indicating successful login)
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});