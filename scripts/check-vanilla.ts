import { prisma } from '../lib/prisma';

async function checkVanilla() {
    const products = await prisma.product.findMany({
        where: { name: { contains: 'Vanilla' } },
        include: { productUOMs: true }
    });

    products.forEach(p => {
        console.log(`${p.name} | Base: ${p.baseUOM} | Alts: ${p.productUOMs.map(u => u.name).join(', ')}`);
    });
}

checkVanilla().finally(() => prisma.$disconnect());
