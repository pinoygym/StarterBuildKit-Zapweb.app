import { prisma } from '../lib/prisma';

async function findMessyUOMs() {
    const uoms = await prisma.productUOM.findMany({
        where: { name: { contains: ' ' } }, // Likely messy if it contains spaces
        include: { Product: true }
    });

    uoms.forEach(u => {
        console.log(`[${u.Product.name}] Messy UOM: "${u.name}" (ID: ${u.id})`);
    });
}

findMessyUOMs().finally(() => prisma.$disconnect());
