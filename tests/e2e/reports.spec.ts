import { test, expect } from '@playwright/test';

test.describe('Reports', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/reports');
    });

    test('should display reports page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    });

    test('should display report tabs', async ({ page }) => {
        await expect(page.getByRole('tab', { name: 'Inventory' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Sales' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Financial' })).toBeVisible();
    });

    test('should switch to sales reports', async ({ page }) => {
        await page.getByRole('tab', { name: 'Sales' }).click();
        await expect(page.getByText('Daily Sales Summary')).toBeVisible();
        await expect(page.getByText('Top 10 Best Selling Products')).toBeVisible();
    });

    test('should switch to financial reports', async ({ page }) => {
        await page.getByRole('tab', { name: 'Financial' }).click();
        await expect(page.getByText('Balance Sheet')).toBeVisible();
        await expect(page.getByText('Profit & Loss Statement')).toBeVisible();
    });
});
