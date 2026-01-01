import { prisma } from "../lib/prisma";

async function main() {
    const adjustment = await prisma.inventoryAdjustment.findFirst({
        where: {
            OR: [
                { adjustmentNumber: "ADJ-20251224-0002" },
                { referenceNumber: "ADJ-02" }
            ]
        },
        include: {
            items: {
                include: {
                    Product: true,
                }
            },
        },
    });

    if (!adjustment) {
        console.log("Adjustment not found");
        return;
    }

    console.log("=== ADJ-02 Database Items ===\n");

    // Group by category for easier comparison
    const itemsByCategory: Record<string, any[]> = {};

    adjustment.items.forEach(item => {
        const category = item.Product.category || "UNCATEGORIZED";
        if (!itemsByCategory[category]) {
            itemsByCategory[category] = [];
        }
        itemsByCategory[category].push({
            name: item.Product.name,
            quantity: item.quantity,
            uom: item.uom
        });
    });

    // Print organized by category
    Object.keys(itemsByCategory).sort().forEach(category => {
        console.log(`\n${category}:`);
        itemsByCategory[category].forEach(item => {
            console.log(`  - ${item.name}: ${item.quantity} ${item.uom}`);
        });
    });

    console.log(`\n\nTotal Items: ${adjustment.items.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
