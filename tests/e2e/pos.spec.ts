import { test, expect } from '@playwright/test';

test.describe('POS System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pos');
  });

  test('should display POS page with product grid', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible();
    await expect(page.locator('text=Product Grid')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Click first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Verify cart has items
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1);
  });

  test('should update product quantity in cart', async ({ page }) => {
    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Increase quantity
    await page.click('[data-testid="increase-quantity"]');
    
    const quantityInput = page.locator('[data-testid="quantity-input"]');
    await expect(quantityInput).toHaveValue('2');
  });

  test('should remove product from cart', async ({ page }) => {
    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Remove from cart
    await page.click('[data-testid="remove-from-cart"]');

    // Verify cart is empty
    const emptyMessage = page.locator('text=Cart is empty');
    await expect(emptyMessage).toBeVisible();
  });

  test('should calculate correct total', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Add multiple products
    const products = page.locator('[data-testid="product-card"]');
    await products.nth(0).click();
    await products.nth(1).click();

    // Verify total is calculated
    const total = page.locator('[data-testid="cart-total"]');
    await expect(total).toBeVisible();
    
    const totalText = await total.textContent();
    expect(parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);
  });

  test('should complete checkout process', async ({ page }) => {
    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Click checkout
    await page.click('button:has-text("Checkout")');

    // Select payment method
    await page.click('button:has-text("Cash")');

    // Enter payment amount
    await page.fill('input[name="amountReceived"]', '1000');

    // Complete payment
    await page.click('button:has-text("Complete Payment")');

    // Verify success
    await expect(page.locator('text=Transaction completed')).toBeVisible({ timeout: 10000 });
  });
});
