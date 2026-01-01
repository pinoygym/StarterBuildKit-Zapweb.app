import { prisma } from '../lib/prisma';
import { inventoryAdjustmentService } from '../services/inventory-adjustment.service';
import { inventoryService } from '../services/inventory.service';

async function massPostAndVerify() {
    const userId = '485d9ed3-dea0-46d9-ad7b-3c22526df1d8'; // Valid admin ID

    const drafts = await prisma.inventoryAdjustment.findMany({
        where: { status: 'DRAFT' },
        include: {
            items: true
        }
    });

    console.log(`Starting mass post for ${drafts.length} adjustments...`);

    for (const draft of drafts) {
        console.log(`\n--- Posting ${draft.adjustmentNumber} (${draft.id}) ---`);

        try {
            // 1. Record pre-post inventory levels
            const preLevels = new Map<string, number>();
            for (const item of draft.items) {
                const stock = await inventoryService.getCurrentStockLevel(item.productId, draft.warehouseId);
                preLevels.set(item.productId, stock);
            }

            // 2. Post the adjustment
            const result = await inventoryAdjustmentService.post(draft.id, userId);
            console.log(`Post status: SUCCESS`);

            // 3. Verify post-post levels
            console.log(`Verifying items...`);
            let allCorrect = true;
            for (const item of draft.items) {
                const initial = preLevels.get(item.productId) || 0;
                const expected = item.type === 'ABSOLUTE'
                    ? await inventoryService.convertToBaseUOM(item.productId, item.quantity, item.uom)
                    : initial + await inventoryService.convertToBaseUOM(item.productId, item.quantity, item.uom);

                const final = await inventoryService.getCurrentStockLevel(item.productId, draft.warehouseId);

                if (Math.abs(final - expected) < 0.0001) {
                    // console.log(`  - Product ${item.productId.substring(0,8)}: Correct (${final})`);
                } else {
                    console.error(`  - ERROR: Product ${item.productId.substring(0, 8)} MISMATCH! Expected: ${expected}, Got: ${final}`);
                    allCorrect = false;
                }
            }
            if (allCorrect) console.log(`All ${draft.items.length} items verified correctly.`);

        } catch (error: any) {
            console.error(`Post status: FAILED - ${error.message}`);
            if (error.details) console.error(`Details: ${error.details}`);
        }
    }
}

massPostAndVerify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
