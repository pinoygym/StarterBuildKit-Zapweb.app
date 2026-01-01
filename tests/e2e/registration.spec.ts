import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import * as crypto from 'crypto';
import { RegisterPage } from './pages/register-page';
import { createTestUserInDb, cleanupTestUsers } from './helpers/api-helpers';

test.describe('Registration Page E2E Tests', () => {
  // Ensure registration tests run in an unauthenticated state
  test.use({ storageState: { cookies: [], origins: [] } });
  test.describe.configure({ mode: 'serial' });

  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    console.log('DEBUG TEST: URL:', page.url());
    console.log('DEBUG TEST: DATABASE_URL:', process.env.DATABASE_URL?.split('@')[1] || 'NOT SET');
    await registerPage.goto();
  });

  test.afterEach(async () => {
    await cleanupTestUsers();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Check page title
    await expect(page.getByText('Create an account', { exact: false }).first()).toBeVisible();

    // Check all form fields are present via POM properties
    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();

    // Check login link
    await expect(registerPage.signInLink).toBeVisible();
  });

  test('should successfully register a new user and redirect to login/dashboard', async ({ page }) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_${timestamp}_${randomStr}@example.com`;

    await registerPage.fillRegistrationForm({
      firstName: 'John',
      lastName: 'Doe',
      email: testEmail,
      password: 'TestPassword123!'
    });

    await registerPage.submit();

    // Verify redirection
    await registerPage.verifyRedirectionToDashboardOrLogin();
    console.log('DEBUG TEST: URL after redirection:', page.url());

    console.log('DEBUG TEST: Verifying user in DB:', testEmail);
    // Give database a moment to settle
    await page.waitForTimeout(5000);

    // Verify user was created in database
    const createdUser = await prisma.user.findFirst({
      where: { email: { equals: testEmail, mode: 'insensitive' } }
    });
    console.log('DEBUG TEST: User found in DB:', createdUser ? 'YES' : 'NO');
    if (createdUser) {
      console.log('DEBUG TEST: Created user ID:', createdUser.id);
    }

    expect(createdUser).toBeTruthy();
    expect(createdUser?.email).toBe(testEmail);
  });

  test('should show error for duplicate email', async ({ page }) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_duplicate_${timestamp}_${randomStr}@example.com`;

    // Create a user first using API helper
    await createTestUserInDb({
      email: testEmail,
      firstName: 'Existing',
      lastName: 'User',
      roleName: 'Cashier'
    });

    // Try to register with same email
    await registerPage.fillRegistrationForm({
      firstName: 'John',
      lastName: 'Doe',
      email: testEmail,
      password: 'TestPassword123!'
    });

    // Wait for the response to ensure the backend actually processed it
    const responsePromise = page.waitForResponse(resp => resp.url().includes('/api/auth/register') && resp.status() === 400);
    await registerPage.submit();
    await responsePromise;

    // Should show error message
    await expect(registerPage.alreadyRegisteredError).toBeVisible({ timeout: 10000 });
  });

  test('should show error for short password', async ({ page }) => {
    await registerPage.fillRegistrationForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      password: 'short'
    });

    await registerPage.submit();

    // Should show error message
    await registerPage.verifyErrorVisible(/at least 8 characters/i);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await registerPage.fillRegistrationForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      password: 'TestPassword123!'
    });

    await registerPage.submit();

    // HTML5 validation or custom error should appear
    const isInvalid = await registerPage.emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should disable submit button while form is submitting', async ({ page }) => {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const testEmail = `e2e_test_loading_${timestamp}_${randomStr}@example.com`;

    // Intercept the registration request and delay it to ensure the loading state is visible
    await page.route('**/api/auth/register', async route => {
      // Sleep for 1 second before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await registerPage.fillRegistrationForm({
      firstName: 'John',
      lastName: 'Doe',
      email: testEmail,
      password: 'TestPassword123!'
    });

    // Start waiting for the button to be disabled BEFORE clicking (or immediately after)
    // To be safe, we check expect after click, but the delay ensures it stays disabled.
    await registerPage.submitButton.click();

    // Button should be disabled or show loading state
    await expect(registerPage.submitButton).toBeDisabled({ timeout: 5000 });
  });

  test('should navigate to login page when clicking sign in link', async ({ page }) => {
    await registerPage.signInLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
