import { test, expect } from '@playwright/test';

test.describe('Suppliers Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/suppliers');
    });

    test('should display suppliers page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Supplier' })).toBeVisible();
    });

    test('should open create supplier dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Supplier' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Add New Supplier' })).toBeVisible();
    });

    test('should create a new supplier', async ({ page }) => {
        const timestamp = Date.now();
        const supplierName = `Test Supplier ${timestamp}`;

        await page.getByRole('button', { name: 'Add Supplier' }).click();

        // Fill form
        await page.getByLabel('Name').fill(supplierName);
        await page.getByLabel('Contact Person').fill('John Doe');
        await page.getByLabel('Email').fill(`supplier${timestamp}@example.com`);
        await page.getByLabel('Phone').fill('09123456789');

        await page.getByRole('button', { name: 'Create' }).click();

        // Verify success
        await expect(page.getByText('Supplier created successfully')).toBeVisible({ timeout: 5000 });

        // Verify in list
        await page.reload();
        await page.getByPlaceholder('Search').fill(supplierName);
        await expect(page.getByText(supplierName)).toBeVisible();
    });
});
