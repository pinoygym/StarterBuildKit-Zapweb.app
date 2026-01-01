
import { prisma } from "../lib/prisma";

async function main() {
    const referenceNumber = "ADJ-20251224-0002";
    console.log(`Fetching adjustment with reference: ${referenceNumber}`);

    const adjustment = await prisma.inventoryAdjustment.findFirst({
        where: {
            OR: [
                { adjustmentNumber: referenceNumber },
                { referenceNumber: referenceNumber },
                { adjustmentNumber: "ADJ-01" } // Try ADJ-01 too just in case
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

    console.log(JSON.stringify(adjustment, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
