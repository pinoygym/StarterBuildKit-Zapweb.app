import { test, expect } from '@playwright/test';

test.describe('POS System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pos');

    // Wait for loading to complete and branch to be auto-selected
    await page.waitForSelector('[data-testid="branch-selector"]', { timeout: 10000 });

    // Wait for the Products title to appear (CardTitle renders as a div, not a heading)
    await expect(page.getByText('Products').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display POS page with product grid', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible();
    // Products is a CardTitle (div), not a heading
    await expect(page.getByText('Products').first()).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products to load
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 10000 });

    // Click first product
    const firstProduct = page.getByTestId('product-card').first();
    await firstProduct.click();

    // Verify cart has items
    const cartItems = page.getByTestId('cart-item');
    await expect(cartItems).toHaveCount(1);
  });

  test('should update product quantity in cart', async ({ page }) => {
    // Add product to cart
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.getByTestId('product-card').first().click();

    // Increase quantity
    await page.getByTestId('increase-quantity').click();

    const quantityInput = page.getByTestId('quantity-input');
    await expect(quantityInput).toHaveValue('2');
  });

  test('should remove product from cart', async ({ page }) => {
    // Add product to cart
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.getByTestId('product-card').first().click();

    // Remove from cart
    await page.getByTestId('remove-from-cart').click();

    // Verify cart is empty
    const emptyMessage = page.getByText('Cart is empty');
    await expect(emptyMessage).toBeVisible();
  });

  test('should calculate correct total', async ({ page }) => {
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    // Add multiple products
    const products = page.getByTestId('product-card');
    await products.nth(0).click();
    await products.nth(1).click();

    // Verify total is calculated
    const total = page.getByTestId('cart-total');
    await expect(total).toBeVisible();

    const totalText = await total.textContent();
    expect(parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);
  });

  test('should complete checkout process', async ({ page }) => {
    // Add product to cart
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.getByTestId('product-card').first().click();

    // Click checkout
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Select payment method
    await page.getByRole('button', { name: 'Cash' }).click();

    // Enter payment amount
    await page.getByLabel('Amount Received').fill('1000');

    // Complete payment
    await page.getByRole('button', { name: 'Complete Payment' }).click();

    // Verify success
    await expect(page.getByText('Transaction completed')).toBeVisible({ timeout: 10000 });
  });
});
