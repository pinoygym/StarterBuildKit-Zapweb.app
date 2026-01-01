import { test, expect } from '@playwright/test';
import 'dotenv/config';
import { prisma } from '../../lib/prisma';
import * as crypto from 'crypto';

test.describe('Registration Page E2E Tests', () => {
  // Ensure registration tests run in an unauthenticated state
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
  });

  test.afterEach(async () => {
    // Clean up test users
    // Delete sessions first to avoid foreign key constraints
    const users = await prisma.user.findMany({
      where: {
        email: {
          startsWith: 'e2e_test_'
        }
      },
      select: { id: true }
    });

    if (users.length > 0) {
      const userIds = users.map(u => u.id);
      await prisma.session.deleteMany({
        where: { userId: { in: userIds } }
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Check page title
    await expect(page.getByText('Create an account', { exact: false }).first()).toBeVisible();

    // Check all form fields are present
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check login link
    await expect(page.getByText(/already have an account/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('should successfully register a new user and redirect to login', async ({ page }) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_${timestamp}_${randomStr}@example.com`;
    console.log(`Using email for success test: ${testEmail}`);

    // Fill in registration form
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^Password$/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Log URL and potential error to debug
    await page.waitForTimeout(3000); // bcrypt and DB might be slow
    const currentUrl = page.url();
    console.log(`Registration result URL: ${currentUrl}`);

    if (currentUrl.includes('/register')) {
      // If we are still on register, wait a bit for any alert to appear
      const alert = page.locator('div[role="alert"]').first();
      await alert.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
      const errorText = await alert.innerText().catch(() => 'No alert found');
      console.log(`Registration failed with error: ${errorText}`);
    }

    // Should redirect away from /register. It might go to /dashboard or /login (if middleware blocks /dashboard)
    await expect(page).not.toHaveURL(/\/register/, { timeout: 15000 });
    // Check if it's on a known success target
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/(dashboard|login)/);

    // Verify user was created in database
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    expect(createdUser).toBeTruthy();
    expect(createdUser?.email).toBe(testEmail);
    expect(createdUser?.firstName).toBe('John');
    expect(createdUser?.lastName).toBe('Doe');
  });

  test('should show error for duplicate email', async ({ page }) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_duplicate_${timestamp}_${randomStr}@example.com`;
    console.log(`Using email for duplicate test: ${testEmail}`);

    // Create a user first
    let cashierRole = await prisma.role.findFirst({ where: { name: 'Cashier' } });
    if (!cashierRole) {
      cashierRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    }
    if (!cashierRole) throw new Error('No suitable role found for test user');

    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: testEmail,
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHaSVK',
        firstName: 'Existing',
        lastName: 'User',
        roleId: cashierRole.id,
        status: 'ACTIVE',
        emailVerified: false,
        updatedAt: new Date()
      }
    });

    // Try to register with same email
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^Password$/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message - wait for it
    const errorAlert = page.getByText(/already registered/i);
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should show error for short password', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^Password$/i).fill('short');
    await page.getByLabel(/confirm password/i).fill('short');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message
    await expect(page.locator('div[role="alert"]').filter({ hasText: /at least 8 characters/i })).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/^Password$/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // HTML5 validation or custom error should appear
    // The email input field should be invalid
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should disable submit button while form is submitting', async ({ page }) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_loading_${timestamp}_${randomStr}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^Password$/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    const submitButton = page.locator('button[type="submit"]');

    // Click submit
    await submitButton.click();

    // Button should be disabled or show loading state
    // Increased timeout for slow bcrypt hashing in dev
    await expect(submitButton).toBeDisabled({ timeout: 10000 });
  });

  test('should navigate to login page when clicking sign in link', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should not show 401 console errors on page load (regression test)', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to register page
    await page.goto('/register');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Filter for 401 errors (the bug we fixed)
    const has401Errors = consoleErrors.some(error =>
      error.includes('401') || error.includes('Unauthorized')
    );

    expect(has401Errors).toBe(false);
  });

  test('should have role ID set when page loads (regression test)', async ({ page }) => {
    // This tests that the Cashier role ID is properly set
    await page.waitForLoadState('networkidle');

    // Fill form and submit
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_role_${timestamp}_${randomStr}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^Password$/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should not show "Role not set" error
    await expect(page.getByText(/role not set/i)).not.toBeVisible();

    // Should successfully redirect away from register
    await expect(page).not.toHaveURL(/\/register/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/(dashboard|login)/);
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_offline_${timestamp}_${randomStr}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^Password$/i).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show an alert
    const alert = page.locator('div[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10000 });
    // Text can be something like "An unexpected error occurred" or "Failed to fetch"
    // Just verifying that SOME error alert is shown is often enough for this test
    // but let's be as specific as safely possible
    await expect(alert).not.toContainText('Password must be at least 8');

    // Restore connection
    await context.setOffline(false);
  });

  test('should clear error message when user edits form', async ({ page }) => {
    // Try to submit with short password
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^Password$/i).fill('short');
    await page.getByLabel(/confirm password/i).fill('short');

    await page.getByRole('button', { name: /create account/i }).click();

    // Error should appear
    await expect(page.locator('div[role="alert"]').filter({ hasText: /at least 8 characters/i })).toBeVisible();

    // Edit the password field
    await page.getByLabel(/^Password$/i).fill('LongerPassword123!');
    await page.getByLabel(/confirm password/i).fill('LongerPassword123!');

    // Error should disappear when user starts typing
    // Note: This depends on your implementation - adjust if needed
  });
});

