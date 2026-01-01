import { test, expect } from '@playwright/test';

test.describe('Customers Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/customers');
    });

    test('should display customers page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Customer' })).toBeVisible();
    });

    test('should open create customer dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Customer' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Add New Customer' })).toBeVisible();
    });

    test('should create a new customer', async ({ page }) => {
        const timestamp = Date.now();
        const customerName = `Test Customer ${timestamp}`;

        await page.getByRole('button', { name: 'Add Customer' }).click();

        // Fill form - use actual label names from CustomerDialog
        await page.getByLabel(/Contact Person/i).fill(customerName);
        await page.getByLabel(/Phone/i).first().fill('09123456789');
        await page.getByLabel(/Email/i).fill(`customer${timestamp}@example.com`);
        await page.getByLabel(/Address/i).first().fill('Test Address');

        // Submit - button text is 'Create Customer' not 'Create'
        await page.getByRole('button', { name: /Create Customer/i }).click();

        // Verify success
        await expect(page.getByText(/Customer created successfully|success/i)).toBeVisible({ timeout: 10000 });

        // Verify in list
        await page.reload();
        await page.getByPlaceholder('Search').fill(customerName);
        await page.keyboard.press('Enter');
        await expect(page.getByText(customerName)).toBeVisible({ timeout: 10000 });
    });

    test('should filter customers', async ({ page }) => {
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();

        // Just verify the filter dropdowns are clickable
        // Assuming these are popover triggers or selects
        // await page.getByRole('combobox', { name: 'Status' }).click();
        await page.getByRole('combobox').filter({ hasText: 'Status' }).click();
        await expect(page.getByRole('option', { name: 'Active' }).first()).toBeVisible();
    });
});
