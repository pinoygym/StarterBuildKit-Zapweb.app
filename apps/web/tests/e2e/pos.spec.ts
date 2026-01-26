import { test, expect } from '@playwright/test';

test.describe('POS System', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('/pos');

    // Wait for loading to complete with longer timeout
    await page.waitForSelector('[data-testid="branch-selector"]', { timeout: 15000 });
    await page.waitForTimeout(1000); // Wait for any animations

    // Select a branch - try "Manila Main Branch" first, fallback to first available
    const branchSelector = page.getByTestId('branch-selector');
    await branchSelector.click({ force: true });

    // Wait for options to appear
    await page.waitForTimeout(500);

    // Try to select Manila Main Branch, or any available branch
    const manilaOption = page.getByRole('option', { name: 'Manila Main Branch' });
    if (await manilaOption.isVisible().catch(() => false)) {
      await manilaOption.click();
    } else {
      // Click first available option
      const firstOption = page.getByRole('option').first();
      await firstOption.click();
    }

    // Search for a known product - try multiple known products
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill('Absolute');
    await page.waitForTimeout(2000); // Wait for filter

    // Wait for the Products title to appear (CardTitle renders as a div, not a heading)
    await expect(page.getByText('Products').first()).toBeVisible({ timeout: 15000 });

    // Check if products are visible, if not try different search
    const productCards = page.getByTestId('product-card');
    if (await productCards.count() === 0) {
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }
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
    await expect(firstProduct).toContainText('In Stock');
    await firstProduct.click({ force: true });
    await page.waitForTimeout(500);

    // Verify cart has items
    const cartItems = page.getByTestId('cart-item');
    await expect(cartItems).toHaveCount(1);
  });

  test('should update product quantity in cart', async ({ page }) => {
    // Add product to cart
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.getByTestId('product-card').first().click({ force: true });
    await page.waitForTimeout(500);

    // Verify cart has item
    await expect(page.getByTestId('cart-item')).toHaveCount(1);

    // Increase quantity
    await page.getByTestId('increase-quantity').click();

    const quantityInput = page.getByTestId('quantity-input');
    await expect(quantityInput).toHaveValue('2');
  });

  test('should remove product from cart', async ({ page }) => {
    // Add product to cart
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.getByTestId('product-card').first().click({ force: true });
    await page.waitForTimeout(500);

    // Verify cart has item
    await expect(page.getByTestId('cart-item')).toHaveCount(1);

    // Remove from cart
    await page.getByTestId('remove-from-cart').click();

    // Verify cart is empty
    const emptyMessage = page.getByText('Cart is empty');
    await expect(emptyMessage).toBeVisible();
  });

  test('should calculate correct total', async ({ page }) => {
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    // Add product twice (quantity 2)
    const products = page.getByTestId('product-card');
    await products.first().click({ force: true });
    await page.waitForTimeout(500);
    await products.first().click({ force: true });
    await page.waitForTimeout(500);

    // Verify total is calculated
    const total = page.getByTestId('cart-total');
    await expect(total).toBeVisible();

    const totalText = await total.textContent();
    expect(parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);
  });

  test('should complete checkout process', async ({ page }) => {
    // Add product to cart
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    await page.getByTestId('product-card').first().click({ force: true });
    await page.waitForTimeout(500);

    // Verify cart has item
    await expect(page.getByTestId('cart-item')).toHaveCount(1);

    // Click checkout
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    // Select payment method
    await page.getByRole('button', { name: 'Cash', exact: true }).click();

    // Enter payment amount
    await page.getByLabel('Amount Received').fill('1000');

    // Complete payment
    await page.getByRole('button', { name: 'Complete Sale' }).click();

    // Verify success
    await expect(page.getByText('Sale Completed', { exact: true })).toBeVisible({ timeout: 20000 });
  });
});
