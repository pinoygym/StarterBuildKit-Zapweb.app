import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { prisma } from '@/lib/prisma';

async function main() {
    const userId = (await prisma.user.findFirst())?.id;
    if (!userId) {
        console.error('No admin user found');
        return;
    }

    const warehouse = await prisma.warehouse.findFirst();
    const branch = await prisma.branch.findFirst();
    const product = await prisma.product.findFirst({
        where: { status: 'active' }
    });

    if (!warehouse || !branch || !product) {
        console.error('Missing prereqs:', { warehouse: !!warehouse, branch: !!branch, product: !!product });
        return;
    }

    console.log('Creating draft adjustment...');
    const adj = await inventoryAdjustmentService.create({
        warehouseId: warehouse.id,
        branchId: branch.id,
        reason: 'Debug Post',
        items: [
            {
                productId: product.id,
                quantity: 1,
                uom: product.baseUOM,
                type: 'RELATIVE'
            }
        ]
    }, userId);

    console.log('Created:', adj.id);

    try {
        console.log('Posting adjustment...');
        const result = await inventoryAdjustmentService.post(adj.id, userId);
        console.log('Post Success!');
    } catch (error: any) {
        console.error('Post Failed!');
        console.error('Error:', error.message);
        if (error.details) console.error('Details:', JSON.stringify(error.details, null, 2));
        if (error.stack) console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();
