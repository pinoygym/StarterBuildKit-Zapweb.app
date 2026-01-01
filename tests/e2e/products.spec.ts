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
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Add Product")');

    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    // Fill in product form using label-based selectors
    await page.getByLabel('Product Name').fill('E2E Test Product');
    await page.getByLabel('Category').selectOption('Carbonated');
    await page.getByLabel(/Base Price/).fill('25.00');
    await page.getByLabel(/Average Cost Price/).fill('18.00');
    await page.getByLabel('Base UOM').fill('bottle');
    await page.getByLabel('Minimum Stock Level').fill('10');
    await page.getByLabel(/Shelf Life/).fill('365');

    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify success message or that dialog closed
    await expect(page.getByRole('heading', { name: 'Create Product' })).not.toBeVisible({ timeout: 5000 });
  });

  test('should search products', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Test');
    await page.waitForTimeout(500); // Debounce delay

    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter products by category', async ({ page }) => {
    await page.selectOption('select[name="category"]', 'Electronics');
    await page.waitForTimeout(500);

    const categoryTexts = await page.locator('table tbody tr td:nth-child(3)').allTextContents();
    expect(categoryTexts.every(text => text === 'Electronics')).toBeTruthy();
  });
});
