
import { prisma } from '../lib/prisma';

async function main() {
    const targetAdjs = [
        'ADJ-20251224-0001',
        'ADJ-20251224-0002',
        'ADJ-20251224-0003',
        'ADJ-20251224-0005',
        'ADJ-20251224-0006'
    ];

    const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
            adjustmentNumber: { in: targetAdjs }
        },
        include: {
            items: {
                include: {
                    Product: {
                        include: {
                            productUOMs: true
                        }
                    }
                },
                orderBy: {
                    Product: { name: 'asc' }
                }
            }
        },
        orderBy: { adjustmentNumber: 'asc' }
    });

    console.log("Checking Conversion Factors for ADJ-01, 02, 03, 05, 06...\n");
    console.log("Format: Product | Adj Qty (UOM) -> Base Qty (Base UOM) [Factor]");

    for (const adj of adjustments) {
        console.log(`\n=== ${adj.adjustmentNumber} ===`);
        // Filter for items where UOM needs conversion logic or verification
        const itemsToCheck = adj.items.filter(i => true); // Check all for completeness, but highlight conversions

        if (itemsToCheck.length === 0) {
            console.log("No items found.");
            continue;
        }

        console.log(`${"Product".padEnd(40)} | ${"Adj Qty".padStart(10)} ${"UOM".padEnd(10)} | ${"Factor".padStart(8)} | ${"Base Qty".padStart(10)} ${"Base".padEnd(5)}`);
        console.log("-".repeat(100));

        for (const item of itemsToCheck) {
            const p = item.Product;
            let factor = 1;
            let note = "";

            if (item.uom.toLowerCase() === p.baseUOM.toLowerCase()) {
                factor = 1;
                note = "(Base)";
            } else {
                const uomDef = p.productUOMs.find(u => u.name.toLowerCase() === item.uom.toLowerCase());
                if (uomDef) {
                    factor = uomDef.conversionFactor;
                } else {
                    factor = 0;
                    note = "MISSING UOM DEF";
                }
            }

            const baseQty = item.quantity * factor;

            // Only show items with conversion or specific interest
            // If factor is 1 and it matches base, strictly speaking it's correct but boring.
            // But user wants to verify "is conversion correct", so let's show all that HAVE a factor != 1
            if (factor !== 1 || note.includes("MISSING")) {
                console.log(
                    `${p.name.substring(0, 40).padEnd(40)} | ` +
                    `${item.quantity.toString().padStart(10)} ${item.uom.padEnd(10)} | ` +
                    `${factor.toString().padStart(8)} | ` +
                    `${baseQty.toFixed(2).padStart(10)} ${p.baseUOM.padEnd(5)} ${note}`
                );
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
