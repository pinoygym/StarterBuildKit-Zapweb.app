import { test, expect } from '@playwright/test';

test.describe('Inventory Adjustment Workflow', () => {

    test('should create a new inventory adjustment', async ({ page }) => {
        const uniqueReason = 'E2E Test Adjustment ' + Date.now();

        // 1. Navigate to Adjustments List
        await page.goto('/inventory/adjustments');
        await expect(page).toHaveURL(/\/inventory\/adjustments/);
        await expect(page.getByText('Inventory Adjustments', { exact: true }).first()).toBeVisible();

        // 2. Click "New Adjustment Slip"
        await page.getByRole('button', { name: 'New Adjustment Slip' }).click();
        await expect(page).toHaveURL(/\/inventory\/adjustments\/new/);
        await expect(page.getByText('New Adjustment Slip', { exact: true }).first()).toBeVisible();

        // 3. Fill Form
        // Wait for form to be interactive (one of the selects)
        await expect(page.getByLabel('Branch')).toBeVisible();

        // Select Branch
        await page.getByLabel('Branch').click();
        await page.getByRole('option').first().click();

        // Select Warehouse
        await page.getByLabel('Warehouse').click();
        await page.getByRole('option').first().click();

        // Enter Reason
        await page.getByLabel('Reason').fill(uniqueReason);

        // Add Item
        // Product Search
        // Use the placeholder to find the trigger
        const productCombobox = page.getByPlaceholder('Search product...');
        await productCombobox.click();

        // Wait for at least one option and click it
        const firstOption = page.getByRole('option').first();
        await expect(firstOption).toBeVisible();
        await firstOption.click();

        // Set Quantity
        await page.getByLabel('Quantity').fill('10');

        // Set Type to ABSOLUTE
        await page.getByLabel('Type').click();
        await page.getByRole('option', { name: 'Absolute' }).click();

        // Select UOM (ensure one is selected)
        await page.getByLabel('UOM').click();
        await page.getByRole('option').first().click();

        // 4. Save
        await page.getByRole('button', { name: 'Save Adjustment' }).click();

        // 5. Verify Redirect
        await expect(page).toHaveURL(/\/inventory\/adjustments$/);

        // 6. Verify Persistence
        // The specific adjustment should be visible in the table
        // Depending on pagination/sorting, it might be at the top.
        await expect(page.getByText(uniqueReason)).toBeVisible();
    });

});
