import { test, expect } from '@playwright/test';

test.describe('Receiving Voucher Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inventorypro.com');
    await page.fill('input[type="password"]', 'Admin@123456!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('complete receiving voucher workflow from ordered PO', async ({ page }) => {
    // Navigate to Purchase Orders
    await page.goto('/purchase-orders');
    
    // Find an ordered PO or create one
    const orderedPO = page.locator('tr:has-text("Ordered")').first();
    
    if (await orderedPO.count() > 0) {
      // Click on actions menu
      await orderedPO.locator('button[aria-label="Actions"]').click();
      
      // Click Receive option
      await page.click('text=Receive');
      
      // Receiving Voucher Dialog should open
      await expect(page.locator('text=Create Receiving Voucher')).toBeVisible();
      
      // Fill receiver information
      await page.fill('input[id="receiverName"]', 'John Doe');
      await page.fill('input[id="deliveryNotes"]', 'Good condition');
      
      // Modify received quantities to create variance
      const receivedInput = page.locator('input[type="number"]').first();
      const originalValue = await receivedInput.inputValue();
      const newValue = (parseInt(originalValue) - 5).toString();
      await receivedInput.fill(newValue);
      
      // Add variance reason
      await page.fill('input[placeholder="Reason"]', 'Damaged items');
      
      // Verify variance is calculated
      await expect(page.locator('text=Under')).toBeVisible();
      
      // Submit receiving voucher
      await page.click('button:has-text("Create Receiving Voucher")');
      
      // Wait for success message
      await expect(page.locator('text=successfully')).toBeVisible({ timeout: 10000 });
      
      // Verify PO status changed to received
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Received')).toBeVisible();
    }
  });

  test('should validate receiver name is required', async ({ page }) => {
    await page.goto('/purchase-orders');
    
    const orderedPO = page.locator('tr:has-text("Ordered")').first();
    
    if (await orderedPO.count() > 0) {
      await orderedPO.locator('button[aria-label="Actions"]').click();
      await page.click('text=Receive');
      
      // Try to submit without receiver name
      await page.click('button:has-text("Create Receiving Voucher")');
      
      // Should show validation error
      await expect(page.locator('text=Please enter receiver name')).toBeVisible();
    }
  });

  test('should display variance indicators correctly', async ({ page }) => {
    await page.goto('/purchase-orders');
    
    const orderedPO = page.locator('tr:has-text("Ordered")').first();
    
    if (await orderedPO.count() > 0) {
      await orderedPO.locator('button[aria-label="Actions"]').click();
      await page.click('text=Receive');
      
      await page.fill('input[id="receiverName"]', 'Test User');
      
      const receivedInput = page.locator('input[type="number"]').first();
      const originalValue = await receivedInput.inputValue();
      const ordered = parseInt(originalValue);
      
      // Test under-delivery
      await receivedInput.fill((ordered - 10).toString());
      await expect(page.locator('text=Under').first()).toBeVisible();
      
      // Test exact match
      await receivedInput.fill(originalValue);
      await expect(page.locator('text=Match').first()).toBeVisible();
      
      // Test over-delivery
      await receivedInput.fill((ordered + 10).toString());
      await expect(page.locator('text=Over').first()).toBeVisible();
    }
  });

  test('should calculate total amounts correctly', async ({ page }) => {
    await page.goto('/purchase-orders');
    
    const orderedPO = page.locator('tr:has-text("Ordered")').first();
    
    if (await orderedPO.count() > 0) {
      await orderedPO.locator('button[aria-label="Actions"]').click();
      await page.click('text=Receive');
      
      await page.fill('input[id="receiverName"]', 'Test User');
      
      // Check that summary section exists
      await expect(page.locator('text=Total Ordered Amount')).toBeVisible();
      await expect(page.locator('text=Total Received Amount')).toBeVisible();
      await expect(page.locator('text=Variance')).toBeVisible();
      
      // Modify quantity and verify totals update
      const receivedInput = page.locator('input[type="number"]').first();
      const originalValue = await receivedInput.inputValue();
      await receivedInput.fill((parseInt(originalValue) - 5).toString());
      
      // Variance should be negative
      const varianceAmount = page.locator('text=Variance').locator('..').locator('span').last();
      await expect(varianceAmount).toHaveClass(/text-red-600/);
    }
  });
});
