
import { prisma } from './lib/prisma';

async function main() {
    const id = '2d206960-5128-4059-aa61-27a4f601043a';
    const adj = await prisma.inventoryAdjustment.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    Product: {
                        include: {
                            productUOMs: true
                        }
                    }
                }
            }
        }
    });

    if (!adj) {
        console.log('Adjustment not found');
        return;
    }

    console.log('--- Adjustment Info ---');
    console.log(`Number: ${adj.adjustmentNumber}`);
    console.log(`Warehouse: ${adj.warehouseId}`);
    console.log(`Status: ${adj.status}`);
    console.log('--- Items ---');

    for (const item of adj.items) {
        const inv = await prisma.inventory.findUnique({
            where: {
                productId_warehouseId: {
                    productId: item.productId,
                    warehouseId: adj.warehouseId
                }
            }
        });

        console.log(`Product: ${item.Product.name}`);
        console.log(`  Adj Qty: ${item.quantity} ${item.uom}`);
        console.log(`  Type: ${item.type}`);
        console.log(`  Current Stock: ${inv?.quantity || 0} ${item.Product.baseUOM}`);
        console.log(`  Available UOMs: [${item.Product.baseUOM}, ${item.Product.productUOMs.map(u => u.name).join(', ')}]`);

        // Check conversion if needed
        const uomName = item.uom.toLowerCase();
        if (uomName !== item.Product.baseUOM.toLowerCase()) {
            const uom = item.Product.productUOMs.find(u => u.name.toLowerCase() === uomName);
            if (uom) {
                const baseQty = item.quantity * Number(uom.conversionFactor);
                console.log(`  Equivalent Base Qty: ${baseQty} ${item.Product.baseUOM}`);
                if (item.type === 'RELATIVE' && (Number(inv?.quantity || 0) + baseQty < 0)) {
                    console.log(`  ⚠️ NEGATIVE STOCK DETECTED: ${Number(inv?.quantity || 0)} + (${baseQty}) < 0`);
                }
            } else {
                console.log(`  ❌ UOM "${item.uom}" NOT FOUND in product definitions`);
            }
        } else {
            if (item.type === 'RELATIVE' && (Number(inv?.quantity || 0) + item.quantity < 0)) {
                console.log(`  ⚠️ NEGATIVE STOCK DETECTED: ${Number(inv?.quantity || 0)} + (${item.quantity}) < 0`);
            }
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
