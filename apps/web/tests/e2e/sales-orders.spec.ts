import { test, expect } from '@playwright/test';

test.describe('Sales Orders', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/sales-orders');
        await page.waitForLoadState('networkidle');
    });

    test('should display sales orders page', async ({ page }) => {
        // PageHeader renders title as h1
        await expect(page.locator('h1').filter({ hasText: 'Sales Orders' })).toBeVisible({ timeout: 10000 });

        // Wait for loading to finish
        await expect(page.locator('div.animate-pulse')).not.toBeVisible({ timeout: 20000 });

        // Use first() to handle cases where both header and empty state buttons are present
        await expect(page.getByRole('button', { name: /Create Order/i }).first()).toBeVisible({ timeout: 20000 });
    });

    test('should open create sales order dialog', async ({ page }) => {
        // Wait for loading to finish
        await expect(page.locator('div.animate-pulse')).not.toBeVisible({ timeout: 20000 });
        await page.getByRole('button', { name: /Create Order/i }).first().click();
        // This navigates to /sales-orders/new, not a dialog
        await expect(page).toHaveURL(/\/sales-orders\/new/);
    });

    test('should filter sales orders', async ({ page }) => {
        // Wait for page to load
        await expect(page.locator('h1').filter({ hasText: 'Sales Orders' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('div.animate-pulse')).not.toBeVisible({ timeout: 20000 });

        // Verify filter selects are visible
        const statusSelect = page.getByRole('combobox').filter({ hasText: 'Status' });
        await expect(statusSelect).toBeVisible();

        // Test status filter interaction
        await statusSelect.click();
        await expect(page.getByRole('option', { name: /Draft/i })).toBeVisible();
    });
});
