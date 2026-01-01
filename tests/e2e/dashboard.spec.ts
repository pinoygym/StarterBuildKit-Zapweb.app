import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
    });

    test('should display dashboard overview', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByText('Welcome to Softdrinks Distributions Corporation')).toBeVisible();
    });

    test('should display all KPI cards', async ({ page }) => {
        const kpiTitles = [
            'Total Products',
            'Total Stock',
            'Inventory Value',
            "Today's Sales",
            'Outstanding AR',
            'Outstanding AP',
            'Month Expenses',
            'Active Sales Orders'
        ];

        for (const title of kpiTitles) {
            await expect(page.locator(`text=${title}`)).toBeVisible();
        }
    });

    test('should display charts sections', async ({ page }) => {
        // These components usually have internal headers or structure, 
        // checking for their presence in the grid layout
        await expect(page.locator('.grid').first()).toBeVisible();
    });
});
