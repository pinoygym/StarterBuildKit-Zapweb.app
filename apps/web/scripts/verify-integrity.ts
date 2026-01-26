import { prisma } from '../lib/prisma';

async function verifyIntegrity() {
    console.log('--- Comprehensive Inventory Integrity Check ---');

    // 1. Get all inventories that have any stock movements
    const inventories = await prisma.inventory.findMany({
        include: {
            Product: true,
            Warehouse: true
        }
    });

    let totalChecked = 0;
    let totalErrors = 0;

    for (const inv of inventories) {
        // 2. Sum up all movements for this product/warehouse
        const movements = await prisma.stockMovement.findMany({
            where: {
                productId: inv.productId,
                warehouseId: inv.warehouseId
            }
        });

        if (movements.length === 0 && inv.quantity === 0) continue;

        let calculatedSum = 0;
        for (const m of movements) {
            // Adjustments/Purchases lead to + or -
            // We need to know if the movement 'quantity' is signed or if we use 'type'
            // Looking at services/inventory.service.ts, it seems quantities in StockMovement are usually positive 
            // and 'type' defines the direction (IN vs OUT) or (ADJUSTMENT).

            // Wait, let's verify how StockMovement stores quantity.
            // If it's an adjustment, it stores the difference.

            if (m.type === 'IN' || m.type === 'PURCHASE' || m.type === 'ADJUSTMENT_IN') {
                calculatedSum += m.quantity;
            } else if (m.type === 'OUT' || m.type === 'SALE' || m.type === 'ADJUSTMENT_OUT') {
                calculatedSum -= m.quantity;
            } else if (m.type === 'ADJUSTMENT') {
                // If it's just 'ADJUSTMENT', it might be signed already? 
                // Let's check inventory.service.ts
                calculatedSum += m.quantity;
            }
        }

        if (Math.abs(calculatedSum - inv.quantity) > 0.001) {
            console.error(`Mismatch for [${inv.Product.name}] at [${inv.Warehouse.name}]`);
            console.error(`  - Current Inventory: ${inv.quantity}`);
            console.error(`  - Calculated from Movements: ${calculatedSum}`);
            totalErrors++;
        }
        totalChecked++;
    }

    console.log(`\nIntegrity Check Finished.`);
    console.log(`Total Inventories Checked: ${totalChecked}`);
    console.log(`Total Errors Found: ${totalErrors}`);
}

verifyIntegrity().finally(() => prisma.$disconnect());
