import { test, expect } from './test-helpers';

test.describe('Purchase Order - Large Unit (Sacks) Flow', () => {
    test('should allow creating product with alternate UOM, ordering in that UOM, and verify inventory conversion', async ({ page }) => {
        // 1. Create Product with Alternate UOM
        console.log('Step 1: Creating Product');
        await page.goto('/products');
        await page.getByRole('button', { name: 'Add Product' }).click();

        const timestamp = Date.now();
        const productName = `Rice Sack Test ${timestamp}`;
        const supplierName = `Grain Supplier ${timestamp}`;

        // Fill Product Basics
        await page.getByLabel('Product Name').fill(productName);

        // Use keyboard to interact with the category combobox
        const categoryCombobox = page.getByRole('dialog').getByRole('combobox').first();
        await categoryCombobox.click();

        // Wait for and click the "Rice" option (assuming it exists or choose any valid one)
        // If "Rice" doesn't exist, we pick the first one or a known one like 'Grain' or similar. 
        // Based on previous contexts, 'Kitchen' or similar might exist. 
        // Let's safe pick first option if specific one not found, or just type and hit enter if it allows custom
        // Actually, let's pick a known existing category if possible. "Others" is often safe.
        // Assuming seeded data has some categories.
        await page.waitForTimeout(500); // Wait for options
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        await page.getByLabel('Base Price').fill('50'); // 50/kg
        await page.getByLabel('Average Cost Price').fill('40'); // 40/kg
        await page.getByLabel('Base UOM').fill('kg');
        await page.getByLabel('Minimum Stock Level').fill('10');
        await page.getByLabel('Shelf Life').fill('365');

        // Add Alternate UOM
        await page.getByRole('button', { name: 'Add UOM' }).click();

        // Wait for UOM section to appear
        await expect(page.getByText('UOM #1')).toBeVisible();

        // Fill UOM #0 (First alternate UOM)
        // Locate the container for UOM #1 to scope our checks
        const uomSection = page.locator('.border.rounded-lg').filter({ hasText: 'UOM #1' });

        await uomSection.getByLabel('UOM Name').fill('Sack');
        await uomSection.getByLabel('Conversion Factor').fill('50'); // 50kg per sack
        await uomSection.getByLabel('Selling Price (₱)').fill('3000'); // Selling Price

        await page.getByRole('button', { name: 'Create' }).click({ force: true });
        await expect(page.getByText('Create Product')).not.toBeVisible({ timeout: 10000 });

        // 2. Create Supplier
        console.log('Step 2: Creating Supplier');
        await page.goto('/suppliers');
        await page.getByRole('button', { name: 'Add Supplier' }).click();
        await page.getByLabel('Company Name').fill(supplierName);
        await page.getByLabel('Contact Person').fill('John Doe');
        await page.getByLabel('Email').fill(`supplier${timestamp}@example.com`);
        await page.getByLabel('Phone').fill('09171234567');
        await page.getByLabel('Phone').fill('09171234567');

        // Use dispatchEvent for robustness as per existing supplier tests
        const createSupplierBtn = page.getByRole('button', { name: 'Create', exact: true });
        await createSupplierBtn.scrollIntoViewIfNeeded();
        await createSupplierBtn.dispatchEvent('click');

        await expect(page.getByText('Create Supplier')).not.toBeVisible();

        // 3. Create Purchase Order
        console.log('Step 3: Creating Purchase Order');
        await page.goto('/purchase-orders');
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        // Wait for form
        await expect(page.getByText('Purchase Order Information')).toBeVisible();

        // Select Supplier
        // Use locator to find the combobox button with specific placeholder text
        const supplierParams = page.locator('button[role="combobox"]', { hasText: 'Search supplier...' });
        await supplierParams.click();
        await page.getByPlaceholder('Search suppliers...').fill(supplierName);
        await page.getByRole('option', { name: supplierName }).click();

        // Select Warehouse & Branch (Select first available)
        // These are standard Select components
        await page.locator('button:has-text("Select warehouse")').click();
        await page.getByRole('option').first().click();

        await page.locator('button:has-text("Select branch")').click();
        await page.getByRole('option').first().click();

        // Add Item
        const itemRow = page.locator('.space-y-4 .flex.gap-4').first();

        // Select Product
        const productParams = itemRow.locator('button[role="combobox"]', { hasText: 'Search product...' });
        await productParams.click();
        await page.getByPlaceholder('Search products...').fill(productName);
        await page.getByRole('option', { name: productName }).click();

        // Wait for UOM select to load/update
        await page.waitForTimeout(1000);

        // Select UOM "Sack"
        // The default might be 'kg'. We want to change it.
        await itemRow.locator('button[role="combobox"]').nth(1).click(); // 0 is product search, 1 is UOM? 
        // Product search is a Popover/Command, UOM is Select.
        // Let's be precise.
        await page.getByRole('option', { name: /Sack/i }).click();

        // Quantity: 2
        await itemRow.getByRole('spinbutton', { name: 'Quantity' }).fill('2');

        // Unit Price: 2000 (Cost per Sack)
        await itemRow.getByRole('spinbutton', { name: 'Unit Price' }).fill('2000');

        // Create PO
        await page.getByRole('button', { name: 'Create Purchase Order' }).click({ force: true });
        // Use first() to avoid strict mode if multiple toasts/messages appear
        await expect(page.getByText('Purchase order created successfully').first()).toBeVisible();
        console.log('PO Created');
        // Expect redirection to list page
        await expect(page).toHaveURL(/.*\/purchase-orders/);
        await expect(page.getByRole('heading', { name: 'Purchase Orders' })).toBeVisible();

        // Find and open the created PO
        // Assuming it's the most recent one at the top.
        // Wait for table to load
        await page.waitForTimeout(1000);
        const firstRowDropdown = page.locator('table tbody tr').first().locator('button').first();
        await firstRowDropdown.click();

        // Click View Details
        await page.getByRole('menuitem', { name: 'View Details' }).click();

        // Now we should be on the viewer page
        await expect(page.getByText('Purchase Order Information')).toBeVisible();

        // 3a. Submit Order (Transition from Draft to Ordered)
        console.log('Step 3a: Submitting Order');
        await page.getByRole('button', { name: 'Submit Order' }).click();

        // Confirm in dialog
        await expect(page.getByRole('alertdialog')).toBeVisible();
        await page.getByRole('button', { name: 'Submit Order' }).last().click();

        // Wait for success toast or status change
        // Wait for Receive button to appear (it replaces Submit button)
        await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();

        // 4. Receive PO
        console.log('Step 4: Receiving PO');
        await page.getByRole('button', { name: 'Receive' }).click();

        // In Receiving Voucher form:
        await expect(page.getByRole('heading', { name: 'Receiving Voucher' })).toBeVisible();

        // Fill Receiver Name (Required)
        await page.getByLabel('Receiver Name').fill('Test Receiver');

        // Complete Receiving
        await page.getByRole('button', { name: 'Create Receiving Voucher' }).click({ force: true });

        // Wait for success
        // Typically redirects or shows success toast
        await page.waitForTimeout(2000);

        // 5. Verify Inventory
        console.log('Step 5: Verifying Inventory');
        await page.goto('/inventory');

        // Search for product
        await page.getByPlaceholder('Search products...').fill(productName);
        await page.waitForTimeout(1000);

        // Check row
        // Expected: 2 Sacks * 50kg/Sack = 100 kg total stock.
        // The table likely shows "Total Stock" in Base UOM or Base UOM + Name.
        // Let's look for "100" in the row.
        const row = page.locator('table tbody tr').first();
        await expect(row).toContainText(productName);

        // Get the stock cell text. 
        // Based on column definitions usually Quantity is one of the columns.
        await expect(row).toContainText('100');
        console.log('Inventory Verified: 100 found');

        // Verification of Unit Cost
        // 2 Sacks @ 2000 each = 4000 total value.
        // 100 kg total qty.
        // Average Cost = 4000 / 100 = 40 / kg.
        // We might not see avg cost in the list, but it's good value to check if visible.
    });
});
