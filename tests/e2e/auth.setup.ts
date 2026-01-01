import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  setup.setTimeout(120000); // Increase test timeout to 2 minutes

  // Seed data
  const seedRes = await page.request.post('/api/dev/seed', {
    headers: { 'Content-Type': 'application/json' },
    data: {},
    timeout: 60000
  });

  if (!seedRes.ok()) {
    console.error('Seed failed:', await seedRes.text());
  }

  // Go to login page
  await page.goto('/login');

  // Fill in login credentials
  await page.getByLabel('Email').fill('cybergada@gmail.com');
  await page.getByLabel('Password').fill('Qweasd145698@');

  // Click login button - target the form submit button specifically to avoid OAuth buttons
  await page.locator('form button[type="submit"]').click();

  // Wait for navigation to dashboard (indicating successful login)
  await page.waitForURL('**/dashboard', { timeout: 120000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});