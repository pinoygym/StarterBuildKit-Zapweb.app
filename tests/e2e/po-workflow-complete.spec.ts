import { test, expect } from '@playwright/test';

test.describe('Purchase Order Complete Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // No specific navigation needed here
    });

    test('should handle custom UOMs and calculate average cost correctly', async ({ page }) => {
        test.setTimeout(180000);
        const productName = `000 Brayan Item ${Date.now()}`;
        let productId = '';

        // --- 1. Ensure Product Exists ---
        console.log('--- Step 1: Ensure Product Exists ---');
        await page.goto('/products');
        await page.waitForTimeout(2000);
        await page.getByPlaceholder('Search products...').fill(productName);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);

        const productRow = page.getByRole('cell', { name: productName });

        if (await productRow.count() === 0) {
            console.log('Product not found, creating...');
            await page.getByRole('button', { name: 'Add Product' }).click();

            await page.getByLabel('Product Name').fill(productName);
            await page.getByLabel('Category').click();
            await page.getByRole('option').first().click();
            await page.getByLabel('Base Price').fill('100');
            await page.getByLabel('Average Cost Price').fill('0');
            await page.getByLabel('Base UOM').fill('piece');

            await page.getByRole('button', { name: 'Create', exact: true }).click();

            try {
                await expect(page.getByText('Product created successfully').first()).toBeVisible({ timeout: 5000 });
            } catch (e) {
                console.log('Success toast missed, proceeding...');
            }

            console.log('Product created, waiting for propagation...');
            await page.waitForTimeout(5000);

            // Verify via API
            try {
                const apiResponse = await page.request.get('/api/products?search=' + productName);
                const apiJson = await apiResponse.json();

                if (apiJson.data && apiJson.data.length > 0) {
                    productId = apiJson.data[0].id;
                } else {
                    throw new Error('Product not found via API after creation');
                }
            } catch (err) {
                console.error('API Verification Failed', err);
                throw err;
            }
        } else {
            console.log('Product already exists.');
            const apiResponse = await page.request.get('/api/products?search=' + productName);
            const apiJson = await apiResponse.json();
            productId = apiJson.data[0].id;
        }

        // --- Add Custom UOM via API ---
        console.log('Adding Custom UOM via API...');
        const uomResponse = await page.request.put(`/api/products/${productId}`, {
            data: {
                alternateUOMs: [
                    { name: 'kabo', conversionFactor: 10, sellingPrice: 1000 }
                ]
            }
        });
        expect(uomResponse.ok()).toBeTruthy();
        console.log('UOM added.');

        // --- 2. First PO (1 kabo @ 50) ---
        console.log('--- Step 2: First PO ---');
        await page.goto('/purchase-orders/new');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        console.log('Filling PO Header...');
        await page.locator('button', { hasText: /Search supplier/i }).first().click();
        await page.waitForTimeout(500);
        await page.getByRole('option').nth(1).click();

        await page.locator('button', { hasText: /Select warehouse/i }).first().click();
        await page.waitForTimeout(500);
        await page.getByRole('option').first().click();

        await page.locator('button', { hasText: /Select branch/i }).first().click();
        await page.getByRole('option').first().click();

        console.log('Selecting Product (' + productName + ')...');
        const productTrigger = page.locator('button').filter({ hasText: /^Search product...$/ }).first();
        await expect(productTrigger).toBeVisible({ timeout: 10000 });
        await productTrigger.click();

        await page.waitForTimeout(1000);
        await page.keyboard.type(productName);
        await page.waitForTimeout(3000);
        await page.getByRole('option', { name: productName }).first().click();

        await page.waitForTimeout(3000);

        console.log('Setting Quantity/UOM/Price...');
        await page.getByLabel('Quantity').fill('1');
        await page.getByLabel('UOM').click();

        await expect(page.getByRole('option', { name: 'piece' }).first()).toBeVisible({ timeout: 5000 });
        await page.getByRole('option', { name: 'kabo' }).first().click();

        await page.getByLabel('Unit Price').fill('50');

        await page.waitForTimeout(1000);
        console.log('Submitting PO Creation...');
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        console.log('Waiting for Navigation to List...');
        await expect(page).toHaveURL(/\/purchase-orders$/, { timeout: 15000 });

        console.log('Navigated. Opening First PO details...');
        await page.waitForTimeout(2000);
        const firstRow = page.locator('tbody tr').first();
        // Check if row exists
        await expect(firstRow).toBeVisible({ timeout: 5000 });

        await firstRow.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'View Details' }).click();

        console.log('Submitting Order...');
        const submitBtn = page.getByRole('button', { name: 'Submit Order' });
        await expect(submitBtn).toBeVisible({ timeout: 10000 });
        await submitBtn.click();

        const confirmBtn = page.locator('div[role="alertdialog"] button:has-text("Submit Order")');
        await expect(confirmBtn).toBeVisible({ timeout: 5000 });
        await confirmBtn.click();

        // Wait for dialog to close
        await expect(confirmBtn).not.toBeVisible({ timeout: 10000 });

        // Wait for status update
        console.log('Waiting for status Ordered...');
        try {
            await expect(page.getByText('Ordered').first()).toBeVisible({ timeout: 15000 });
        } catch (e) {
            console.log('Status "Ordered" not visible, reloading page...');
            await page.reload();
            await expect(page.getByText('Ordered').first()).toBeVisible({ timeout: 10000 });
        }

        console.log('Receiving Order...');
        await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
        await page.getByRole('button', { name: 'Receive' }).click();
        await page.getByLabel('Receiver Name').fill('Test Receiver');
        await page.getByRole('button', { name: 'Create Receiving Voucher' }).click();

        // Wait for status update
        console.log('Waiting for status Received...');
        await expect(page.getByText('Received').first()).toBeVisible({ timeout: 10000 });

        console.log('Receiving Voucher Created.');

        // --- Verify Inventory (Batch 1) ---
        console.log('Verifying Inventory (Batch 1)...');
        await page.waitForTimeout(3000); // Increased sync wait

        const invResponse1 = await page.request.get(`/api/inventory?productId=${productId}`);
        const invJson1 = await invResponse1.json();
        const totalQty1 = invJson1.data ? invJson1.data.reduce((sum: any, item: any) => sum + Number(item.quantity), 0) : 0;
        console.log('Current Inventory Qty (API):', totalQty1);
        expect(totalQty1).toBe(10);

        // --- 3. Second PO (1 kabo @ 100) ---
        console.log('--- Step 3: Second PO ---');
        await page.goto('/purchase-orders/new');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        console.log('Filling PO Header (2nd)...');
        await page.locator('button', { hasText: /Search supplier/i }).first().click();
        await page.waitForTimeout(500);
        await page.getByRole('option').nth(1).click();
        await page.locator('button', { hasText: /Select warehouse/i }).first().click();
        await page.waitForTimeout(500);
        await page.getByRole('option').first().click();
        await page.locator('button', { hasText: /Select branch/i }).first().click();
        await page.getByRole('option').first().click();

        console.log('Selecting Product (2nd)...');
        const productTrigger2 = page.locator('button').filter({ hasText: /^Search product...$/ }).first();
        await expect(productTrigger2).toBeVisible({ timeout: 10000 });
        await productTrigger2.click();

        await page.waitForTimeout(1000);
        await page.keyboard.type(productName);
        await page.waitForTimeout(3000);
        await page.getByRole('option', { name: productName }).first().click();

        await page.waitForTimeout(3000);

        await page.getByLabel('Quantity').fill('1');
        await page.getByLabel('UOM').click();
        await expect(page.getByRole('option', { name: 'piece' }).first()).toBeVisible({ timeout: 5000 });
        await page.getByRole('option', { name: 'kabo' }).first().click();

        await page.getByLabel('Unit Price').fill('100');

        await page.waitForTimeout(1000);
        console.log('Submitting PO (2nd)...');
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        await expect(page).toHaveURL(/\/purchase-orders$/, { timeout: 15000 });
        console.log('Navigated. Processing 2nd PO...');
        const secondPORow = page.locator('tbody tr').first();
        await secondPORow.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'View Details' }).click();

        await page.getByRole('button', { name: 'Submit Order' }).click();
        await page.locator('div[role="alertdialog"] button:has-text("Submit Order")').click();
        await expect(page.getByText('Ordered').first()).toBeVisible({ timeout: 10000 });

        await page.getByRole('button', { name: 'Receive' }).click();
        await page.getByLabel('Receiver Name').fill('Test Receiver');
        await page.getByRole('button', { name: 'Create Receiving Voucher' }).click();
        await expect(page.getByText('Received').first()).toBeVisible({ timeout: 10000 });

        // --- Verify Inventory (Batch 2) ---
        console.log('Verifying Inventory (Batch 2)...');
        await page.waitForTimeout(3000);

        const invResponse2 = await page.request.get(`/api/inventory?productId=${productId}`);
        const invJson2 = await invResponse2.json();

        let totalQty2 = 0;
        let avgCost = 0;
        if (invJson2.success && invJson2.data && invJson2.data.length > 0) {
            totalQty2 = invJson2.data.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
            avgCost = Number(invJson2.data[0].Product.averageCostPrice);
        }

        console.log('Final Inventory Qty (API):', totalQty2);
        console.log('Final Inventory Cost (API):', avgCost);

        expect(totalQty2).toBe(20);
        expect(avgCost).toBe(7.5);

        // --- Cleanup ---
        if (productId) {
            console.log('Cleaning up product (setting to inactive):', productId);
            await page.request.put(`/api/products/${productId}`, {
                data: { status: 'inactive' }
            });
            // Avoid deleting to prevent FK constraint violations with POs created in this test
        }
    });
});
