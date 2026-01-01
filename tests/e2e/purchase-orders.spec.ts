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
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();
        await expect(page).toHaveURL(/\/purchase-orders\/new/);
        await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();
    });

    test('should filter purchase orders', async ({ page }) => {
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Branch')).toBeVisible();

        // Test status filter interaction
        // Assuming it's a combobox or trigger
        await page.getByRole('combobox', { name: 'Status' }).click();
        await expect(page.getByRole('option', { name: 'Pending' })).toBeVisible();
    });
});
