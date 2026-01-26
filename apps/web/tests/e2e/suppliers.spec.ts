import { test, expect } from '@playwright/test';

test.describe('Suppliers Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1000 });
        await page.goto('/suppliers');
    });

    test('should display suppliers page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Supplier' })).toBeVisible();
    });

    test('should open create supplier dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Supplier' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Create Supplier', { exact: false }).first()).toBeVisible();
    });

    test('should create a new supplier', async ({ page }) => {
        const timestamp = Date.now();
        const supplierName = `Test Supplier ${timestamp}`;

        await page.getByRole('button', { name: 'Add Supplier' }).click();

        // Fill form
        await page.getByLabel('Company Name').fill(supplierName);
        await page.getByLabel('Contact Person').fill('John Doe');
        await page.getByLabel('Email').fill(`supplier${timestamp}@example.com`);
        await page.getByLabel('Phone').fill('09123456789');

        // Select Payment Terms (usually the first combobox in form)
        const paymentTermsSelect = page.getByRole('dialog').getByRole('combobox').first();
        await page.getByLabel('Payment Terms').click();
        await page.getByRole('option', { name: /COD/i }).click();

        const createBtn = page.getByRole('button', { name: 'Create' });
        await createBtn.scrollIntoViewIfNeeded();
        await createBtn.dispatchEvent('click');

        // Verify success message or that dialog closed
        // First check if there's an error
        const dialogStillOpen = await page.getByText('Create Supplier').isVisible();
        if (dialogStillOpen) {
            const errorAlert = page.locator('div[role="alert"]').first();
            const hasError = await errorAlert.isVisible().catch(() => false);
            if (hasError) {
                const errorText = await errorAlert.innerText().catch(() => 'No error text');
                console.log(`Supplier creation failed with error: ${errorText}`);
            } else {
                console.log('Supplier creation dialog still open but no error alert visible');
            }
        }
        // Verify in list
        await expect(page.getByText('Create Supplier')).not.toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Supplier created successfully/i)).toBeVisible({ timeout: 10000 });

        await page.reload();
        await page.getByPlaceholder('Search by company name...').fill(supplierName);
        await expect(page.getByText(supplierName)).toBeVisible();
    });
});
