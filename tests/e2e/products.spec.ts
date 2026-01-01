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
    await page.getByRole('button', { name: 'Add Product' }).click();

    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();

    // Fill in product form using label-based selectors
    await page.getByLabel('Product Name').fill('E2E Test Product');
    // await page.getByLabel('Category').selectOption('Carbonated');
    // Using interactions for custom select component (Shadcn UI)
    await page.getByRole('combobox', { name: 'Category' }).click();
    // Wait for options to load
    await expect(page.getByRole('option', { name: 'Carbonated' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('option', { name: 'Carbonated' }).click();
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
    await page.getByPlaceholder('Search').fill('Test');
    // Wait for the table to update - assuming the table content changes or a loading state
    // Ideally we wait for a response or a specific element state
    await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  });

  test('should filter products by category', async ({ page }) => {
    // Assuming this is a select element based on previous code
    // await page.getByLabel('Category').selectOption('Electronics');
    // await page.getByLabel('Category').selectOption('Electronics');
    // Filter combobox doesn't have a label, so we find it by placeholder text
    const categorySelect = page.getByRole('combobox').filter({ hasText: 'Category' });
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    await categorySelect.click();
    await page.getByRole('option', { name: 'Electronics' }).click();

    // Wait for filter to apply
    // Check if the first row contains 'Electronics'
    await expect(page.locator('table tbody tr td:nth-child(3)').first()).toHaveText('Electronics');
  });
});
