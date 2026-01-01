import { test as setup, expect } from '@playwright/test';
import { seedDemoData } from '../../scripts/demo/seed-demo-data';

const authFile = 'tests/demos/.auth/demo-user.json';

setup('setup demo environment', async ({ page }) => {
  setup.setTimeout(300000); // 5 minutes

  console.log('\n🎬 Setting up demo environment...\n');

  // Seed comprehensive demo data
  try {
    await seedDemoData();
    console.log('\n✅ Demo data seeded successfully\n');
  } catch (error) {
    console.error('\n❌ Failed to seed demo data:', error);
    throw error;
  }

  // Navigate to login
  await page.goto('/login');

  // Wait for page to load - check for the email field instead of heading
  await expect(page.getByLabel(/email/i)).toBeVisible({
    timeout: 30000,
  });

  console.log('🔐 Logging in as super admin...');

  // Login as super admin
  await page.getByLabel(/email/i).fill('cybergada@gmail.com');
  await page.getByLabel(/password/i).fill('Qweasd145698@');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 60000 });

  // Verify we're on the dashboard
  await expect(page).toHaveURL(/.*dashboard/);

  console.log('✅ Login successful');

  // Save auth state
  await page.context().storageState({ path: authFile });

  console.log(`✅ Auth state saved to ${authFile}`);
  console.log('\n✨ Demo setup completed successfully!\n');
});
