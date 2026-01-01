import { test, expect } from '@playwright/test';

test.describe('Sales Orders', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/sales-orders');
    });

    test('should display sales orders page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Sales Orders' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Order' })).toBeVisible();
    });

    test('should open create sales order dialog', async ({ page }) => {
        await page.click('button:has-text("Create Order")');
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Create Sales Order')).toBeVisible();
    });

    test('should filter sales orders', async ({ page }) => {
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Conversion')).toBeVisible();

        // Test status filter interaction
        await page.click('text=Status');
        await expect(page.getByRole('option', { name: 'Draft' })).toBeVisible();
    });
});
