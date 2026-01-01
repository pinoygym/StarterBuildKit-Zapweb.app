import { test, expect } from '@playwright/test';

test.describe('Purchase Orders', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/purchase-orders');
    });

    test('should display purchase orders page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Purchase Orders' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Purchase Order' })).toBeVisible();
    });

    test('should navigate to create page', async ({ page }) => {
        await page.click('button:has-text("Create Purchase Order")');
        await expect(page).toHaveURL(/\/purchase-orders\/new/);
        await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();
    });

    test('should filter purchase orders', async ({ page }) => {
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Branch')).toBeVisible();

        // Test status filter interaction
        await page.click('text=Status');
        await expect(page.getByRole('option', { name: 'Pending' })).toBeVisible();
    });
});
