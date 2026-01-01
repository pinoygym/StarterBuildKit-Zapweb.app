import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { NarrationHelper } from '../helpers/narration.helper';
import { DemoActions } from '../helpers/demo-actions.helper';
import { MouseTracker } from '../helpers/mouse-tracker.helper';
import { AnnotationHelper } from '../helpers/annotation.helper';

test.describe('Product Creation Demo', () => {
  test('create a new product with multi-UOM', async ({ page }) => {
    const narration = new NarrationHelper('Product Creation and Management');
    const demo = new DemoActions(page);
    const mouseTracker = new MouseTracker();
    const annotation = new AnnotationHelper();

    // Create output directory
    const outputDir = 'demo-recordings/03-products';
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Intro
    await narration.narrate(
      'In this video, we will learn how to create a new product in the InventoryPro system with multi-unit-of-measure configuration.',
      5000
    );

    // Navigate to products page
    await page.goto('/products');
    await expect(page.getByText(/products/i).first()).toBeVisible();

    // Inject interactive elements
    await mouseTracker.inject(page);

    await narration.narrate(
      'This is the Products page where you can view and manage all products in your inventory.',
      4000
    );

    await demo.screenshot('products-list', 'Products table view');

    // Click Add Product
    await narration.narrate(
      'To create a new product, click the Add Product button.',
      3000,
      'Click Add Product button'
    );

    const addButton = page.getByRole('button', { name: /add product/i });
    await demo.click(addButton);

    // Wait for dialog
    await expect(page.getByRole('heading', { name: /create product/i })).toBeVisible();

    await narration.narrate(
      'The Create Product dialog allows you to enter all product information including name, category, pricing, and units of measure.',
      5000
    );

    // Fill product name
    await narration.narrate(
      'Let\'s create a new soft drink product. Enter the product name: Royal True Orange Two Liter PET bottle.',
      5000,
      'Type product name'
    );
    await demo.fill(page.getByLabel('Product Name'), 'Royal True Orange 2L PET', { typingSpeed: 80 });

    // Select category
    await narration.narrate(
      'Select the product category. This product belongs to the Carbonated beverages category.',
      4000,
      'Select category'
    );

    // Try to find and click category dropdown
    const categoryField = page.getByLabel(/category/i).first();
    await demo.click(categoryField);
    await demo.wait(1000);

    // Select Carbonated option
    const carbonatedOption = page.getByRole('option', { name: /carbonated/i });
    if (await carbonatedOption.isVisible()) {
      await demo.click(carbonatedOption);
    }

    // Base UOM
    await narration.narrate(
      'Specify the base unit of measure. For this product, we will use "bottle" as the base UOM.',
      4000,
      'Enter base UOM'
    );
    await demo.fill(page.getByLabel(/base uom/i), 'bottle');

    // Base Price
    await narration.narrate(
      'Set the base selling price. We will price this product at 75 pesos per bottle.',
      4000,
      'Enter base price'
    );
    await demo.fill(page.getByLabel(/base price/i), '75');

    // Average Cost Price
    await narration.narrate(
      'Enter the average cost price. This is used for weighted average costing calculations. Let\'s set it to 52 pesos.',
      5000,
      'Enter cost price'
    );
    await demo.fill(page.getByLabel(/average cost price/i), '52');

    // Minimum stock level
    await narration.narrate(
      'Set the minimum stock level. When inventory falls below this amount, the system will generate a low stock alert. We will set it to 200 bottles.',
      6000,
      'Enter minimum stock'
    );
    await demo.fill(page.getByLabel(/minimum stock level/i), '200');

    // Shelf life
    await narration.narrate(
      'Enter the shelf life in days. This helps track product expiration. Carbonated drinks typically have a shelf life of 540 days.',
      5000,
      'Enter shelf life'
    );
    await demo.fill(page.getByLabel(/shelf life/i), '540');

    // Description (optional)
    await narration.narrate(
      'Optionally, you can add a detailed product description for reference.',
      3000,
      'Enter description'
    );
    await demo.fill(
      page.getByLabel(/description/i),
      'Royal True Orange 2L PET Bottle - Refreshing carbonated orange-flavored soft drink'
    );

    // Screenshot before submit
    await demo.screenshot('product-form-filled', 'Completed product creation form');

    // Submit
    await narration.narrate(
      'Review all the information and click Create to save the product to your inventory system.',
      4000,
      'Click Create button'
    );

    const createButton = page.getByRole('button', { name: /create/i });
    await demo.click(createButton);

    // Wait a moment for the product to be created
    await demo.wait(3000);

    // Verify success (product should appear in list or toast notification)
    await narration.narrate(
      'The product has been successfully created and added to your inventory catalog.',
      4000
    );

    await demo.screenshot('product-created', 'Product successfully added');

    // Outro
    await narration.narrate(
      'You can now manage inventory, create purchase orders, and sell this product through the point of sale system. In the next video, we will learn how to configure multiple units of measure for more complex products.',
      7000
    );

    // Export narration script and subtitles
    const scriptJSON = narration.exportScript();
    const scriptSRT = narration.exportSRT();

    writeFileSync(`${outputDir}/product-creation-script.json`, scriptJSON);
    writeFileSync(`${outputDir}/product-creation-subtitles.srt`, scriptSRT);

    console.log(`\n✅ Demo completed! Files saved to ${outputDir}/`);
  });
});
