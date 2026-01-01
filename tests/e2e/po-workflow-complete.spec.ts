import { test, expect } from '@playwright/test';

test.describe('Purchase Order Complete Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // No specific navigation needed here
    });

    test('should handle custom UOMs and calculate average cost correctly', async ({ page }) => {
        test.setTimeout(180000);
        // Use '000' prefix to ensure it appears at the top of the list (since default sort is likely alphabetical and limit is 50)
        const productName = `000 Brayan Item ${Date.now()}`;
        let productId = '';

        // --- 1. Ensure Product Exists ---
        await page.goto('/products');
        await page.waitForTimeout(2000);
        await page.getByPlaceholder('Search products...').fill(productName);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);

        const productRow = page.getByRole('cell', { name: productName });

        if (await productRow.count() === 0) {
            console.log('Product not found, creating...');
            await page.getByRole('button', { name: 'Add Product' }).click(); // Open Form

            await page.getByLabel('Product Name').fill(productName);
            await page.getByLabel('Category').click();
            await page.getByRole('option').first().click();
            await page.getByLabel('Base Price').fill('100');
            await page.getByLabel('Average Cost Price').fill('0');
            await page.getByLabel('Base UOM').fill('piece');

            await page.getByRole('button', { name: 'Create', exact: true }).click(); // Save Form
            await expect(page.getByText('Product created successfully').first()).toBeVisible();
            console.log('Product created, waiting for propagation...');
            await page.waitForTimeout(5000);

            // Verify via API
            const apiResponse = await page.request.get('/api/products?search=' + productName);
            const apiJson = await apiResponse.json();
            console.log('API Search Result:', JSON.stringify(apiJson, null, 2));

            if (apiJson.data && apiJson.data.length > 0) {
                productId = apiJson.data[0].id;
                console.log('Product created with ID:', productId);
            } else {
                throw new Error('Product not found via API after creation');
            }
        } else {
            console.log('Product already exists.');
            // Verify via API
            const apiResponse = await page.request.get('/api/products?search=' + productName);
            const apiJson = await apiResponse.json();
            if (apiJson.data && apiJson.data.length > 0) {
                productId = apiJson.data[0].id;
            } else {
                // Should not happen if row count > 0
                throw new Error('Product found in UI but not in API');
            }
        }

        // --- Add Custom UOM via API ---
        console.log('Adding Custom UOM via API...');
        const uomResponse = await page.request.put(`/api/products/${productId}`, {
            data: {
                alternateUOMs: [
                    {
                        name: 'kabo',
                        conversionFactor: 10,
                        sellingPrice: 1000
                    }
                ]
            }
        });

        const uomJson = await uomResponse.json();
        console.log('UOM Add Response:', JSON.stringify(uomJson, null, 2));
        expect(uomResponse.ok()).toBeTruthy();

        // --- 2. First PO (1 kabo @ 50) ---
        await page.goto('/purchase-orders');
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        await page.getByLabel('Supplier').click();
        await page.getByRole('option').nth(1).click();
        await page.getByLabel('Warehouse').click();
        await page.getByRole('option').first().click();
        await page.getByLabel('Branch').click();
        await page.getByRole('option').first().click();

        await page.getByLabel('Product').click();
        await page.waitForTimeout(1000);
        await page.keyboard.type(productName);
        await page.waitForTimeout(2000);
        await page.getByRole('option', { name: productName }).click();

        await page.getByLabel('Quantity').fill('1');
        await page.getByLabel('UOM').click();
        await page.getByRole('option', { name: 'kabo' }).click();
        await page.getByLabel('Unit Price').fill('50');

        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        await expect(page).toHaveURL(/\/purchase-orders$/);
        const firstRow = page.locator('tbody tr').first();
        await firstRow.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'View Details' }).click();

        await page.getByRole('button', { name: 'Submit Order' }).click();
        await page.locator('div[role="alertdialog"] button:has-text("Submit Order")').click();

        await page.getByRole('button', { name: 'Receive' }).click();
        await page.getByLabel('Receiver Name').fill('Test Receiver');
        await page.getByRole('button', { name: 'Create Receiving Voucher' }).click();

        // --- Verify Inventory (Batch 1) ---
        console.log('Verifying Inventory (Batch 1) via API...');
        await page.waitForTimeout(2000);

        const invResponse1 = await page.request.get(`/api/inventory?productId=${productId}`);
        const invJson1 = await invResponse1.json();
        console.log('Inventory API Response 1:', JSON.stringify(invJson1, null, 2));

        let totalQty1 = 0;
        if (invJson1.success && invJson1.data) {
            totalQty1 = invJson1.data.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
        }
        console.log('Current Inventory Qty (API):', totalQty1);
        expect(totalQty1).toBe(10); // 1 kabo * 10

        // --- 3. Second PO (1 kabo @ 100) ---
        await page.goto('/purchase-orders');
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        await page.getByLabel('Supplier').click();
        await page.getByRole('option').nth(1).click();
        await page.getByLabel('Warehouse').click();
        await page.getByRole('option').first().click();
        await page.getByLabel('Branch').click();
        await page.getByRole('option').first().click();

        await page.getByLabel('Product').click();
        await page.waitForTimeout(1000);
        await page.keyboard.type(productName);
        await page.waitForTimeout(2000);
        await page.getByRole('option', { name: productName }).click();

        await page.getByLabel('Quantity').fill('1');
        await page.getByLabel('UOM').click();
        await page.getByRole('option', { name: 'kabo' }).click();
        await page.getByLabel('Unit Price').fill('100');

        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Create Purchase Order' }).click();

        await expect(page).toHaveURL(/\/purchase-orders$/);
        const secondPORow = page.locator('tbody tr').first();
        await secondPORow.locator('button').last().click();
        await page.getByRole('menuitem', { name: 'View Details' }).click();

        await page.getByRole('button', { name: 'Submit Order' }).click();
        await page.locator('div[role="alertdialog"] button:has-text("Submit Order")').click();

        await page.getByRole('button', { name: 'Receive' }).click();
        await page.getByLabel('Receiver Name').fill('Test Receiver');
        await page.getByRole('button', { name: 'Create Receiving Voucher' }).click();

        // --- Verify Inventory (Batch 2) ---
        console.log('Verifying Inventory (Batch 2) via API...');
        await page.waitForTimeout(2000);

        const invResponse2 = await page.request.get(`/api/inventory?productId=${productId}`);
        const invJson2 = await invResponse2.json();
        console.log('Inventory API Response 2:', JSON.stringify(invJson2, null, 2));

        let totalQty2 = 0;
        let avgCost = 0;
        if (invJson2.success && invJson2.data && invJson2.data.length > 0) {
            totalQty2 = invJson2.data.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
            avgCost = Number(invJson2.data[0].Product.averageCostPrice);
        }

        console.log('Final Inventory Qty (API):', totalQty2);
        console.log('Final Inventory Cost (API):', avgCost);

        expect(totalQty2).toBe(20); // 10 + 10
        expect(avgCost).toBe(7.5);

        // --- Cleanup ---
        if (productId) {
            console.log('Cleaning up product:', productId);
            await page.request.put(`/api/products/${productId}`, {
                data: { status: 'inactive' }
            });
            await page.request.delete(`/api/products/${productId}`);
        }
    });
});
