import { prisma } from '../lib/prisma';

async function fixVanillaUOM() {
    await prisma.productUOM.update({
        where: { id: '21808e3e-0ac9-4370-a310-e70284db6065' },
        data: { name: 'BOX' }
    });
    console.log('Fixed Vanilla - 120ml UOM name to BOX');
}

fixVanillaUOM().finally(() => prisma.$disconnect());
