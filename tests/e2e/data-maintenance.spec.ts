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

        await expect(page.getByRole('heading', { name: 'Data Maintenance' })).toBeVisible();
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
        await expect(page.getByRole('heading', { name: 'Expense Categories' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Expense Category' })).toBeVisible();

        // Switch to Payment Methods
        await page.getByRole('tab', { name: 'Payment Methods' }).click();
        await expect(page.getByRole('heading', { name: 'Payment Methods' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Payment Method' })).toBeVisible();
    });

    test('should open add dialog', async ({ page }) => {
        // Ensure we are on Product Categories (default)
        await expect(page.getByRole('heading', { name: 'Product Categories' })).toBeVisible();

        // Click Add button
        await page.getByRole('button', { name: 'Add Product Category' }).click();

        // Verify dialog opens
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Add Product Category' })).toBeVisible();

        // Close dialog
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });
});
