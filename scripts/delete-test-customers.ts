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

    console.log('Starting deletion of customers with code containing "CUST-TEST-"...');

    try {
        // 1. Find customers to delete
        const customers = await prisma.customer.findMany({
            where: {
                customerCode: {
                    contains: 'CUST-TEST-',
                },
            },
            select: { id: true, customerCode: true },
        });

        if (customers.length === 0) {
            console.log('No customers found matching "CUST-TEST-".');
            return;
        }

        const customerIds = customers.map(c => c.id);
        console.log(`Found ${customers.length} customers to delete:`);
        customers.forEach(c => console.log(` - ${c.customerCode} (${c.id})`));

        // 2. Delete/Update related records for THESE customers only

        console.log('Deleting related CustomerPurchaseHistory...');
        await prisma.customerPurchaseHistory.deleteMany({
            where: { customerId: { in: customerIds } }
        });

        console.log('Deleting related PromotionUsage...');
        await prisma.promotionUsage.deleteMany({
            where: { customerId: { in: customerIds } }
        });

        console.log('Deleting related AccountsReceivable...');
        // ARPayment cascades
        await prisma.accountsReceivable.deleteMany({
            where: { customerId: { in: customerIds } }
        });

        console.log('Deleting related SalesOrders...');
        // SalesOrderItem cascades
        await prisma.salesOrder.deleteMany({
            where: { customerId: { in: customerIds } }
        });

        console.log('Updating related POSReceipts (setting customerId to null)...');
        await prisma.pOSReceipt.updateMany({
            where: { customerId: { in: customerIds } },
            data: { customerId: null }
        });

        // 3. Delete Customers
        console.log('Deleting customers...');
        const result = await prisma.customer.deleteMany({
            where: { id: { in: customerIds } }
        });

        console.log(`Successfully deleted ${result.count} customers.`);

    } catch (error) {
        console.error('Error deleting customers:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
