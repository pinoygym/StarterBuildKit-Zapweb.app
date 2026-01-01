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

        // Fill form
        await page.getByLabel('Name').fill(customerName);
        await page.getByLabel('Email').fill(`customer${timestamp}@example.com`);
        await page.getByLabel('Phone').fill('09123456789');
        await page.getByLabel('Address').fill('Test Address');

        // Select type if needed, usually defaults or is a select
        // Assuming default is fine or we can select

        await page.getByRole('button', { name: 'Create' }).click();

        // Verify success
        await expect(page.getByText('Customer created successfully')).toBeVisible({ timeout: 5000 });

        // Verify in list
        await page.reload();
        await page.getByPlaceholder('Search').fill(customerName);
        await page.keyboard.press('Enter');
        await expect(page.getByText(customerName)).toBeVisible();
    });

    test('should filter customers', async ({ page }) => {
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Type')).toBeVisible();

        // Just verify the filter dropdowns are clickable
        // Assuming these are popover triggers or selects
        await page.getByRole('combobox', { name: 'Status' }).click();
        await expect(page.getByRole('option', { name: 'Active' }).first()).toBeVisible();
    });
});
