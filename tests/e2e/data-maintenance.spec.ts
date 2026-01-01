import { test, expect } from '@playwright/test';

test.describe('Data Maintenance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/data-maintenance');
        await page.waitForLoadState('networkidle');

        // Check if redirected to login
        if (page.url().includes('/login')) {
            await page.getByLabel('Email').fill('cybergada@gmail.com');
            await page.getByLabel('Password').fill('Qweasd145698@');
            await page.getByRole('button', { name: 'Sign in' }).click();
            await page.waitForURL('**/data-maintenance');
        }

        // Use h1 for main page heading
        await expect(page.locator('h1').filter({ hasText: 'Data Maintenance' })).toBeVisible();
    });

    test('should display all reference data tabs', async ({ page }) => {
        const tabs = [
            'Product Categories',
            'Expense Categories',
            'Payment Methods',
            'Units of Measure',
            'Expense Vendors',
            'Sales Agents'
        ];

        for (const tab of tabs) {
            await expect(page.getByRole('tab', { name: tab })).toBeVisible();
        }
    });

    test('should switch tabs and load data', async ({ page }) => {
        // Switch to Expense Categories
        await page.getByRole('tab', { name: 'Expense Categories' }).click();
        await page.waitForTimeout(500);
        // Just verify the tab content is visible by finding the add button
        await expect(page.getByRole('button', { name: /Add Expense Category/i })).toBeVisible({ timeout: 10000 });

        // Switch to Payment Methods
        await page.getByRole('tab', { name: 'Payment Methods' }).click();
        await page.waitForTimeout(500);
        await expect(page.getByRole('button', { name: /Add Payment Method/i })).toBeVisible({ timeout: 10000 });
    });

    test('should open add dialog', async ({ page }) => {
        // Wait for Product Categories tab content to load
        await expect(page.getByRole('button', { name: /Add Product Category/i })).toBeVisible({ timeout: 10000 });

        // Click Add button
        await page.getByRole('button', { name: /Add Product Category/i }).click();

        // Verify dialog opens
        await expect(page.getByRole('dialog')).toBeVisible();
        // Dialog title is visible
        await expect(page.getByRole('dialog').getByText(/Add|Create/i)).toBeVisible();

        // Close dialog
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });
});
