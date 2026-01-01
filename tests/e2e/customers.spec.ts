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
        await page.click('button:has-text("Add Customer")');
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Add New Customer')).toBeVisible();
    });

    test('should create a new customer', async ({ page }) => {
        const timestamp = Date.now();
        const customerName = `Test Customer ${timestamp}`;

        await page.click('button:has-text("Add Customer")');

        // Fill form
        await page.fill('input[name="name"]', customerName);
        await page.fill('input[name="email"]', `customer${timestamp}@example.com`);
        await page.fill('input[name="phone"]', '09123456789');
        await page.fill('input[name="address"]', 'Test Address');

        // Select type if needed, usually defaults or is a select
        // Assuming default is fine or we can select

        await page.click('button[type="submit"]');

        // Verify success
        await expect(page.getByText('Customer created successfully')).toBeVisible({ timeout: 5000 });

        // Verify in list
        await page.reload();
        await page.fill('input[placeholder*="Search"]', customerName);
        await page.keyboard.press('Enter');
        await expect(page.getByText(customerName)).toBeVisible();
    });

    test('should filter customers', async ({ page }) => {
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Type')).toBeVisible();

        // Just verify the filter dropdowns are clickable
        await page.click('text=Status');
        await expect(page.getByRole('option', { name: 'Active' }).first()).toBeVisible();
    });
});
