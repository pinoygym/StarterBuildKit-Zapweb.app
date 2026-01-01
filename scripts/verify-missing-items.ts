
import { prisma } from "../lib/prisma";

async function main() {
    const adjustment = await prisma.inventoryAdjustment.findFirst({
        where: {
            OR: [
                { adjustmentNumber: "ADJ-20251224-0001" },
                { referenceNumber: "ADJ-01" }
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

    const itemsToCheck = [
        "Sunflour",
        "Sunshine",
        "CF Redbowl",
        "Bensdorp",
        "Butter Oil",
        "Cano",
        "Ultra Soft",
        "Alaska Evaporada"
    ];

    console.log("Checking for items in DB Adjustment:");

    itemsToCheck.forEach(checkName => {
        const found = adjustment.items.find(item =>
            item.Product.name.toLowerCase().includes(checkName.toLowerCase())
        );

        if (found) {
            console.log(`[FOUND] ${checkName} -> ${found.Product.name} (Qty: ${found.quantity} ${found.uom})`);
        } else {
            console.log(`[MISSING] ${checkName}`);
        }
    });

    // Also check specific discrepancies
    const bambi = adjustment.items.find(item => item.Product.name.toLowerCase().includes("bambi"));
    if (bambi) {
        console.log(`[CHECK] Bambi Butter -> ${bambi.Product.name} (Qty: ${bambi.quantity} ${bambi.uom})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
