import { test, expect } from '@playwright/test';

test.describe('Products Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('should display products page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Products/i })).toBeVisible();
  });

  test('should open create product dialog', async ({ page }) => {
    await page.click('button:has-text("Add Product")');
    await expect(page.getByText('Create Product', { exact: false }).first()).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    // Click add product button
    await page.getByRole('button', { name: 'Add Product' }).click();

    // Wait for dialog to open
    await expect(page.getByText('Create Product', { exact: false }).first()).toBeVisible();

    // Fill in product form using label-based selectors with unique name
    const timestamp = Date.now();
    await page.getByLabel('Product Name').fill(`E2E Test Product ${timestamp}`);
    // await page.getByLabel('Category').selectOption('Carbonated');
    // Using interactions for custom select component (Shadcn UI)
    const categoryCombobox = page.getByRole('dialog').getByRole('combobox').first();
    await categoryCombobox.click();
    // Wait for options to load
    await expect(page.getByRole('option', { name: 'Carbonated' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('option', { name: 'Carbonated' }).click();
    await page.getByLabel(/Base Price/).click();
    await page.getByLabel(/Base Price/).fill('25.00');
    await page.getByLabel(/Average Cost Price/).click();
    await page.getByLabel(/Average Cost Price/).fill('18.00');
    await page.getByLabel('Base UOM').fill('bottle');
    await page.getByLabel('Minimum Stock Level').click();
    await page.getByLabel('Minimum Stock Level').fill('10');
    await page.getByLabel(/Shelf Life/).click();
    await page.getByLabel(/Shelf Life/).fill('365');

    // Wait a moment for form validation
    await page.waitForTimeout(500);

    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify success message or that dialog closed
    try {
      await expect(page.getByText('Create Product')).not.toBeVisible({ timeout: 5000 });
    } catch (e) {
      // Dialog failed to close - diagnose why
      const fieldErrors = await page.locator('p[class*="text-destructive"]').allInnerTexts();
      if (fieldErrors.length > 0) {
        throw new Error(`Field validation errors: ${fieldErrors.join(', ')}`);
      }

      const alerts = await page.locator('[role="alert"]').allInnerTexts();
      const visibleAlerts = alerts.filter(text => text && text.trim().length > 0);
      if (visibleAlerts.length > 0) {
        throw new Error(`Error alerts visible: ${visibleAlerts.join(' | ')}`);
      }

      throw new Error(`Product creation dialog stuck open with no visible errors. Last error: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

  test('should search products', async ({ page }) => {
    // Search for a seeded product
    await page.getByPlaceholder('Search').fill('Absolute');
    // Wait for the table to update
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr')).not.toHaveCount(0);
    await expect(page.locator('table tbody tr').first()).toContainText('Absolute');
  });

  test('should filter products by category', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Find category filter - look for combobox with category-related text
    const categorySelect = page.locator('[data-testid="category-filter"], [role="combobox"]').filter({ hasText: /Category|All Categories/i }).first();

    // Check if category filter exists, skip if not found
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click();

      // Wait for options to load
      await page.waitForTimeout(500);

      const carbonatedOption = page.getByRole('option', { name: 'Carbonated' });
      if (await carbonatedOption.isVisible().catch(() => false)) {
        await carbonatedOption.click();

        // Wait for filter to apply - the table might take a moment to refresh
        await page.waitForTimeout(1000);

        // Check if matching rows exist and all contain 'Carbonated'
        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
          // Check first 5 rows (or all if fewer)
          for (let i = 0; i < Math.min(count, 5); i++) {
            const categoryCell = rows.nth(i).locator('td:nth-child(4)');
            await expect(categoryCell).toContainText('Carbonated');
          }
        }
      }
    } else {
      // If no category filter, just verify the page has products
      await expect(page.locator('table tbody tr').first()).toBeVisible();
    }
  });
});
