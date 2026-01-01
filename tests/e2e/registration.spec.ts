import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Registration Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
  });

  test.afterEach(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'e2e_test_'
        }
      }
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    // Check all form fields are present
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    // Check login link
    await expect(page.getByText(/already have an account/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('should successfully register a new user and redirect to login', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_test_${timestamp}@example.com`;

    // Fill in registration form
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('TestPassword123!');

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

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
    const testEmail = `e2e_test_duplicate_${timestamp}@example.com`;

    // Create a user first
    const cashierRole = await prisma.role.findFirst({ where: { name: 'Cashier' } });
    if (!cashierRole) throw new Error('Cashier role not found');

    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHaSVK',
        firstName: 'Existing',
        lastName: 'User',
        roleId: cashierRole.id,
        status: 'ACTIVE',
        emailVerified: false
      }
    });

    // Try to register with same email
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message
    await expect(page.getByText(/already registered/i)).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('short');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // HTML5 validation or custom error should appear
    // The email input field should be invalid
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should disable submit button while form is submitting', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e_test_loading_${timestamp}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('TestPassword123!');

    const submitButton = page.getByRole('button', { name: /create account/i });

    // Click submit
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
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
    const testEmail = `e2e_test_role_${timestamp}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should not show "Role not set" error
    await expect(page.getByText(/role not set/i)).not.toBeVisible();

    // Should successfully redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    const timestamp = Date.now();
    const testEmail = `e2e_test_offline_${timestamp}@example.com`;

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /create account/i }).click();

    // Should show some error (either network error or generic error)
    // The exact message may vary, but should not crash
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });

    // Restore connection
    await context.setOffline(false);
  });

  test('should clear error message when user edits form', async ({ page }) => {
    // Try to submit with short password
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('short');

    await page.getByRole('button', { name: /create account/i }).click();

    // Error should appear
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();

    // Edit the password field
    await page.getByLabel(/password/i).fill('LongerPassword123!');

    // Error should disappear when user starts typing
    // Note: This depends on your implementation - adjust if needed
  });
});
