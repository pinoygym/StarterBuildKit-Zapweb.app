import { test, expect } from '@playwright/test';

test.describe('Sales Agents Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/data-maintenance');
        // await page.waitForLoadState('networkidle'); // Removed to avoid flakiness

        // Check if redirected to login
        if (page.url().includes('/login')) {
            await page.getByLabel('Email').fill('cybergada@gmail.com');
            await page.getByLabel('Password').fill('Qweasd145698@');
            await page.getByRole('button', { name: 'Sign in' }).click();
            await page.waitForURL('**/data-maintenance');
        }

        await expect(page.getByRole('heading', { name: 'Data Maintenance' })).toBeVisible();
        await expect(page.getByRole('tablist')).toBeVisible();

        const tab = page.getByRole('tab', { name: 'Sales Agents' });
        await expect(tab).toBeVisible();
        await tab.click({ force: true });
        await expect(tab).toHaveAttribute('data-state', 'active');

        // Verify tab switch by checking for the Add button
        await expect(page.getByRole('button', { name: 'Add Sales Agent' })).toBeVisible();
    });

    test('should allow creating a sales agent with lowercase code', async ({ page }) => {
        const timestamp = Date.now();
        const agentName = `Test Agent ${timestamp}`;
        const agentCode = `ag${timestamp}`; // Lowercase code

        await page.waitForTimeout(1000); // Wait for animations
        await page.getByRole('button', { name: 'Add Sales Agent' }).click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Add Sales Agent' })).toBeVisible();

        // Use placeholders to be more robust
        await page.getByPlaceholder('e.g., John Doe').fill(agentName);
        await page.getByPlaceholder('e.g., AG001').fill(agentCode);

        // Submit form
        await page.getByRole('button', { name: 'Create' }).click();

        // Verify success toast or dialog closure
        await expect(page.getByRole('dialog')).not.toBeVisible();

        // Verify agent appears in the list
        await expect(page.getByText(agentName)).toBeVisible();
        await expect(page.getByText(agentCode)).toBeVisible();
    });

    test('should display validation errors for invalid inputs', async ({ page }) => {
        await page.waitForTimeout(1000); // Wait for animations
        await page.getByRole('button', { name: 'Add Sales Agent' }).click();

        await expect(page.getByRole('dialog')).toBeVisible();

        // Submit empty form to trigger validation
        await page.getByRole('button', { name: 'Create' }).click();

        // Verify validation errors are displayed

        // Name is required
        await expect(page.getByText('Agent name is required')).toBeVisible();

        // Code is required
        await expect(page.getByText('Code is required')).toBeVisible();

        // Test invalid email format
        await page.getByLabel('Email').fill('invalid-email');
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page.getByText('Invalid email format')).toBeVisible();
    });
});
