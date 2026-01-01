import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  setup.setTimeout(120000); // Increase test timeout to 2 minutes

  // Seed data
  const seedRes = await page.request.post('/api/dev/seed', {
    headers: { 'Content-Type': 'application/json' },
    data: {}
  });

  if (!seedRes.ok()) {
    console.error('Seed failed:', await seedRes.text());
  }

  // Go to login page
  await page.goto('/login');

  // Fill in login credentials
  await page.getByLabel('Email').fill('cybergada@gmail.com');
  await page.locator('input[name="password"]').fill('Qweasd145698@');

  // Click login button
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for navigation to dashboard (indicating successful login)
  await page.waitForURL('**/dashboard', { timeout: 120000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});