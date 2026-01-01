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
        await page.click('button:has-text("Add Supplier")');
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Add New Supplier')).toBeVisible();
    });

    test('should create a new supplier', async ({ page }) => {
        const timestamp = Date.now();
        const supplierName = `Test Supplier ${timestamp}`;

        await page.click('button:has-text("Add Supplier")');

        // Fill form
        await page.fill('input[name="name"]', supplierName);
        await page.fill('input[name="contactPerson"]', 'John Doe');
        await page.fill('input[name="email"]', `supplier${timestamp}@example.com`);
        await page.fill('input[name="phone"]', '09123456789');

        await page.click('button[type="submit"]');

        // Verify success
        await expect(page.getByText('Supplier created successfully')).toBeVisible({ timeout: 5000 });

        // Verify in list
        await page.reload();
        await page.fill('input[placeholder*="Search"]', supplierName);
        await expect(page.getByText(supplierName)).toBeVisible();
    });
});
