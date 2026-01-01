import { test, expect } from '@playwright/test';

test.describe('Purchase Orders', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/purchase-orders');
        await page.waitForLoadState('networkidle');
        // Wait for potential skeletons to disappear
        await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 15000 });
    });

    test('should display purchase orders page', async ({ page }) => {
        // PageHeader renders title as h1
        await expect(page.getByRole('heading', { name: 'Purchase Orders', level: 1 }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: /Create Purchase Order/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to create page', async ({ page }) => {
        await page.getByRole('button', { name: /Create Purchase Order/i }).first().click();
        await expect(page).toHaveURL(/\/purchase-orders\/new/);
        // Check for heading on new page
        await expect(page.getByRole('heading', { name: /Purchase Order|Create/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter purchase orders', async ({ page }) => {
        // Wait for page to load and skeleton to disappear
        await expect(page.getByRole('heading', { name: 'Purchase Orders', level: 1 }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 15000 });

        // Verify filter selects are visible - target the placeholder text to be sure
        const statusSelect = page.getByRole('combobox').filter({ hasText: /Status/i });
        await expect(statusSelect).toBeVisible();

        // Test status filter interaction
        await statusSelect.click();
        await expect(page.getByRole('option', { name: /Draft|Pending|Ordered|Received|Cancelled/i }).first()).toBeVisible({ timeout: 10000 });
    });
});
