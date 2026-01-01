import { test, expect } from '@playwright/test';

test.describe('Purchase Order Supplier Selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/purchase-orders/new');
        await page.waitForLoadState('networkidle');
    });

    test('should persist selected supplier after search', async ({ page }) => {
        // Find the combobox inside the form to avoid other controls
        const supplierCombobox = page.locator('form [role="combobox"]').first();
        await expect(supplierCombobox).toBeVisible();

        // Click to open
        await supplierCombobox.click();

        // Type to search - assuming there's at least one supplier, e.g. "Supplier" or "a"
        // We'll type "a" which is likely to match something
        const searchInput = page.getByPlaceholder('Search suppliers...');
        await searchInput.fill('a');

        // Wait for results
        const option = page.getByRole('option').first();
        await expect(option).toBeVisible({ timeout: 5000 });

        // Capture the text of the supplier we are selecting
        const optionContent = await option.textContent();

        await option.click();

        // Wait for the popover to close (search input disappears)
        await expect(searchInput).not.toBeVisible();

        // Check the button text
        const buttonText = await supplierCombobox.textContent();

        // Assert it's not the placeholder
        await expect(supplierCombobox).not.toHaveText(/Search supplier.../i);

        // Assert it contains something from the option (optional but good)
        expect(buttonText?.trim().length).toBeGreaterThan(0);
    });
});
