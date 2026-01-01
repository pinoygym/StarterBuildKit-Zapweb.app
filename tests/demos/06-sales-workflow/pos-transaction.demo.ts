import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { NarrationHelper } from '../helpers/narration.helper';
import { DemoActions } from '../helpers/demo-actions.helper';
import { MouseTracker } from '../helpers/mouse-tracker.helper';
import { AnnotationHelper } from '../helpers/annotation.helper';

test.describe('POS Transaction Demo', () => {
  test('process a complete point of sale transaction', async ({ page }) => {
    const narration = new NarrationHelper('POS Transaction Processing');
    const demo = new DemoActions(page);
    const mouseTracker = new MouseTracker();
    const annotation = new AnnotationHelper();

    // Create output directory
    const outputDir = 'demo-recordings/06-sales-workflow';
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Intro
    await narration.narrate(
      'In this video, we will learn how to process a complete point of sale transaction in InventoryPro.',
      5000
    );

    // Navigate to POS page
    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for page to fully load and render products

    // Inject interactive elements
    await mouseTracker.inject(page);

    await narration.narrate(
      'This is the Point of Sale interface where you can quickly process customer transactions.',
      4000
    );

    await demo.screenshot('pos-interface', 'POS system main screen');

    // Product grid
    await narration.narrate(
      'The product grid displays all available products with current stock levels. You can search or filter products by category.',
      5000
    );

    // Select first product
    await narration.narrate(
      'Let\'s add our first item to the cart. Click on a product to add it.',
      4000,
      'Select product'
    );

    // Find and click first product card (adjust selector based on your UI)
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await demo.click(firstProduct);
    } else {
      // Fallback: try to find any product button or card
      const productButton = page.getByRole('button').filter({ hasText: /absolute|coca|pepsi/i }).first();
      if (await productButton.isVisible()) {
        await demo.click(productButton);
      }
    }

    await demo.wait(2000);

    await narration.narrate(
      'The product is now added to the shopping cart. You can see the item details, quantity, and price.',
      4000
    );

    // Add second product
    await narration.narrate(
      'Let\'s add another item to the cart.',
      3000,
      'Add second product'
    );

    const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
    if (await secondProduct.isVisible()) {
      await demo.click(secondProduct);
    }

    await demo.wait(2000);

    // Show cart
    await narration.narrate(
      'The cart now displays multiple items. You can adjust quantities, remove items, or apply discounts as needed.',
      5000
    );

    await demo.screenshot('cart-with-items', 'Shopping cart with products');

    // Cart totals
    await narration.narrate(
      'The system automatically calculates the subtotal, applies twelve percent tax, and shows the total amount due.',
      5000
    );

    // Proceed to checkout
    await narration.narrate(
      'When ready to complete the sale, click the Checkout button.',
      3000,
      'Click Checkout'
    );

    const checkoutButton = page.getByRole('button', { name: /checkout|proceed/i });
    if (await checkoutButton.isVisible()) {
      await demo.click(checkoutButton);
    }

    await demo.wait(2000);

    // Payment method selection
    await narration.narrate(
      'Select the payment method. InventoryPro supports cash, card, check, GCash, online transfer, and credit options.',
      5000,
      'Select payment method'
    );

    // Select Cash payment (use first match to avoid strict mode violation)
    const cashOption = page.getByRole('button', { name: 'Cash', exact: true }).first();
    if (await cashOption.isVisible()) {
      await demo.click(cashOption);
    }

    await demo.wait(1500);

    // Enter amount paid
    await narration.narrate(
      'Enter the amount paid by the customer. For cash transactions, the system will calculate the change automatically.',
      5000,
      'Enter amount paid'
    );

    const amountField = page.getByLabel(/amount paid|cash received/i);
    if (await amountField.isVisible()) {
      await amountField.click(); // Ensure field is focused
      await demo.wait(500);
      await demo.fill(amountField, '500');
      await demo.wait(1000); // Wait for input to register
    }

    await demo.wait(3000); // Longer wait for validation and change calculation

    // Show change calculation
    await narration.narrate(
      'The system displays the change to return to the customer.',
      3000
    );

    // Complete transaction
    await narration.narrate(
      'Click Complete Sale to finalize the transaction.',
      3000,
      'Complete transaction'
    );

    // Find and click "Complete Sale" button (exact text match)
    const completeSaleButton = page.getByRole('button', { name: 'Complete Sale' });

    // Wait for button to be visible
    await page.waitForTimeout(1000);

    // Wait up to 10 seconds for button to become enabled
    let attempts = 0;
    while (attempts < 20) {
      try {
        const isVisible = await completeSaleButton.isVisible();
        const isEnabled = await completeSaleButton.isEnabled();

        if (isVisible && isEnabled) {
          await demo.click(completeSaleButton);
          break;
        }
      } catch (e) {
        // Button not found yet, continue waiting
      }

      await page.waitForTimeout(500);
      attempts++;
    }

    // Wait for receipt dialog/modal to appear
    await demo.wait(5000);

    // Receipt generated
    await narration.narrate(
      'The transaction is complete! A receipt is generated with a unique receipt number and all transaction details.',
      5000
    );

    await demo.screenshot('receipt-preview', 'Generated receipt');
    await demo.wait(2000);

    // Inventory updated
    await narration.narrate(
      'Behind the scenes, the system has automatically deducted stock using first-in-first-out batch logic and updated inventory values using weighted average cost.',
      6000
    );

    await demo.wait(2000);

    // Outro
    await narration.narrate(
      'You have successfully processed a point of sale transaction. The system handles all inventory updates, cost calculations, and sales recording automatically. This concludes our proof of concept demo videos.',
      8000
    );

    // Wait for outro narration to finish before ending recording
    await demo.wait(3000);

    // Export narration script and subtitles
    const scriptJSON = narration.exportScript();
    const scriptSRT = narration.exportSRT();

    writeFileSync(`${outputDir}/pos-transaction-script.json`, scriptJSON);
    writeFileSync(`${outputDir}/pos-transaction-subtitles.srt`, scriptSRT);

    console.log(`\n✅ Demo completed! Files saved to ${outputDir}/`);
  });
});
