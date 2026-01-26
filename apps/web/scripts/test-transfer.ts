import { inventoryTransferService } from '../services/inventory-transfer.service';
import { prisma } from '../lib/prisma';



async function test() {
    try {
        console.log('Finding prerequisites...');
        const user = await prisma.user.findFirst();
        if (!user) throw new Error('No user found');

        const products = await prisma.product.findMany({ take: 1, include: { productUOMs: true } });
        if (products.length === 0) throw new Error('No product found');
        const product = products[0];

        const warehouses = await prisma.warehouse.findMany({ take: 2, include: { Branch: true } });
        if (warehouses.length < 2) throw new Error('Need at least 2 warehouses');

        const source = warehouses[0];
        const dest = warehouses[1];

        console.log(`Creating transfer from ${source.name} to ${dest.name} with product ${product.name}`);

        const result = await inventoryTransferService.create({
            sourceWarehouseId: source.id,
            destinationWarehouseId: dest.id,
            branchId: source.branchId, // Assuming source branch
            reason: 'Test Script Transfer',
            items: [{
                productId: product.id,
                quantity: 1,
                uom: product.baseUOM
            }]
        }, user.id);

        console.log('Transfer created:', result.id, result.transferNumber);

    } catch (error: any) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

test();
