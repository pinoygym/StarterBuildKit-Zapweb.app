import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

async function main() {
    const userId = (await prisma.user.findFirst())?.id;
    if (!userId) {
        console.error('No admin user found');
        return;
    }

    // 1. Setup Test Data
    const branch = await prisma.branch.findFirst();
    const warehouse = await prisma.warehouse.findFirst();
    const category = await prisma.productCategory.findFirst();

    if (!branch || !warehouse || !category) {
        console.error('Missing branch/warehouse/category');
        return;
    }

    const testProductId = randomUUID();
    const testProductName = `RevTest-${testProductId.substring(0, 8)}`;

    console.log(`Setting up test product: ${testProductName}...`);

    const product = await prisma.product.create({
        data: {
            id: testProductId,
            name: testProductName,
            baseUOM: 'PCS',
            category: 'Test',
            basePrice: 100,
            minStockLevel: 0,
            shelfLifeDays: 365,
            productCategoryId: category.id,
            updatedAt: new Date(),
            productUOMs: {
                create: [
                    { id: randomUUID(), name: 'CASE', conversionFactor: 24, sellingPrice: 2000 }
                ]
            }
        }
    });

    console.log(`Product created successfully.`);

    try {
        // 2. Initial Stock = 0
        console.log('\n--- Phase 1: Absolute Adjustment in Alternate UOM ---');
        console.log('Creating ABSOLUTE adjustment to 1 CASE (24 units)...');
        const adj1 = await inventoryAdjustmentService.create({
            warehouseId: warehouse.id,
            branchId: branch.id,
            reason: 'Test Phase 1',
            items: [
                {
                    productId: product.id,
                    quantity: 1,
                    uom: 'CASE',
                    type: 'ABSOLUTE'
                }
            ]
        }, userId);

        console.log(`Draft created: ${adj1.adjustmentNumber}. Posting...`);
        await inventoryAdjustmentService.post(adj1.id, userId);

        let inventory = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } }
        });
        console.log(`Current Stock: ${inventory?.quantity} PCS (Expected: 24)`);

        // 3. Reverse
        console.log('\n--- Phase 2: Reverse the Adjustment ---');
        console.log(`Reversing adjustment ${adj1.adjustmentNumber}...`);
        const reversal = await inventoryAdjustmentService.reverse(adj1.id, userId);
        console.log(`Reversal Posted: ${reversal.adjustmentNumber}`);

        inventory = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } }
        });
        console.log(`Current Stock after reversal: ${inventory?.quantity} PCS (Expected: 0)`);

        // 4. Verification
        if (Number(inventory?.quantity) === 0) {
            console.log('\n✅ SUCCESS: Reversal logic is correct!');
        } else {
            console.error(`\n❌ FAILURE: Quantity is ${inventory?.quantity}, expected 0.`);
        }

    } catch (error: any) {
        console.error('\n❌ TEST CRASHED!');
        console.error('Error:', error.message);
        if (error.details) console.error('Details:', JSON.stringify(error.details, null, 2));
        if (error.stack) console.error(error.stack);
    } finally {
        console.log('\nCleaning up...');
        await prisma.inventory.deleteMany({ where: { productId: testProductId } }).catch(() => { });
        await prisma.inventoryAdjustmentItem.deleteMany({ where: { productId: testProductId } }).catch(() => { });
        await prisma.productUOM.deleteMany({ where: { productId: testProductId } }).catch(() => { });
        await prisma.product.delete({ where: { id: testProductId } }).catch(() => { });
        console.log('Cleanup done.');
        await prisma.$disconnect();
    }
}

main();
