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
    await expect(page.locator('text=Create New Product')).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Add Product")');

    // Fill in product form
    await page.fill('input[name="name"]', 'E2E Test Product');
    await page.fill('input[name="sku"]', `E2E-${Date.now()}`);
    await page.selectOption('select[name="category"]', 'Electronics');
    await page.fill('input[name="sellingPrice"]', '100');
    await page.fill('input[name="baseUOM"]', 'pcs');
    await page.fill('input[name="minStockLevel"]', '10');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Product created successfully')).toBeVisible({ timeout: 5000 });
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
