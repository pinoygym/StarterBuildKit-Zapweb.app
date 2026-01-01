import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    let dbUrl = process.env.DATABASE_URL;
    console.log('Raw DATABASE_URL:', dbUrl ? 'Found' : 'Missing');

    if (!dbUrl) {
        console.error('DATABASE_URL is missing from environment variables');
        process.exit(1);
    }

    if (dbUrl.includes('localhost')) {
        console.log('Replacing localhost with 127.0.0.1 in DATABASE_URL');
        dbUrl = dbUrl.replace('localhost', '127.0.0.1');
    }

    const connectionString = dbUrl;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log('Starting deletion of "Test Product" data...');

    try {
        // 1. Find products to delete
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: 'Test Product',
                    mode: 'insensitive',
                },
            },
            select: { id: true, name: true },
        });

        if (products.length === 0) {
            console.log('No products found matching "Test Product".');
            return;
        }

        const productIds = products.map(p => p.id);
        console.log(`Found ${products.length} products to delete:`);
        products.forEach(p => console.log(` - ${p.name} (${p.id})`));

        // 2. Delete related records in correct order (child -> parent)

        console.log('Deleting related StockMovements...');
        await prisma.stockMovement.deleteMany({
            where: { productId: { in: productIds } },
        });

        console.log('Deleting related Inventory...');
        await prisma.inventory.deleteMany({
            where: { productId: { in: productIds } },
        });

        console.log('Deleting related POSSaleItems...');
        await prisma.pOSSaleItem.deleteMany({
            where: { productId: { in: productIds } },
        });

        console.log('Deleting related SalesOrderItems...');
        await prisma.salesOrderItem.deleteMany({
            where: { productId: { in: productIds } },
        });

        console.log('Deleting related ReceivingVoucherItems...');
        await prisma.receivingVoucherItem.deleteMany({
            where: { productId: { in: productIds } },
        });

        console.log('Deleting related PurchaseOrderItems...');
        await prisma.purchaseOrderItem.deleteMany({
            where: { productId: { in: productIds } },
        });

        // ProductUOM is set to Cascade delete in schema, but let's be safe
        console.log('Deleting related ProductUOMs...');
        await prisma.productUOM.deleteMany({
            where: { productId: { in: productIds } },
        });

        // 3. Delete the products
        console.log('Deleting products...');
        const result = await prisma.product.deleteMany({
            where: { id: { in: productIds } },
        });

        console.log(`Successfully deleted ${result.count} products and their related data.`);

    } catch (error) {
        console.error('Error deleting test products:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
