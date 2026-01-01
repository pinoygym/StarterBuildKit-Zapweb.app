
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL is not defined');
        return;
    }

    console.log('Using connection string:', connectionString.replace(/:[^:@]*@/, ':****@')); // masking password

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('Fetching adjustment ADJ-20251224-0009...');
        const adjustments = await prisma.inventoryAdjustment.findMany({
            where: {
                adjustmentNumber: 'ADJ-20251224-0009'
            },
            include: {
                items: {
                    include: {
                        Product: {
                            include: {
                                productUOMs: true
                            }
                        },
                    },
                },
                Branch: true,
                Warehouse: true,
            },
        });

        console.log(`Found ${adjustments.length} adjustments.`);

        for (const adj of adjustments) {
            console.log('===================================================');
            console.log(`Adjustment Number: ${adj.adjustmentNumber}`);
            console.log(`Reference Number: ${adj.referenceNumber}`);
            console.log(`Date: ${adj.adjustmentDate}`);
            console.log(`Status: ${adj.status}`);
            console.log(`Reason: ${adj.reason}`);
            console.log(`Branch: ${adj.Branch.name}`);
            console.log(`Warehouse: ${adj.Warehouse.name}`);
            console.log('Items:');

            const items = adj.items.map(item => {
                const conversions = item.Product.productUOMs
                    .map(u => `${u.name}: ${u.conversionFactor}`)
                    .join(', ');

                return {
                    Product: item.Product.name + (item.Product.code ? ` (${item.Product.code})` : ''),
                    'System Qty': `${item.systemQuantity} ${item.Product.baseUOM}`,
                    'Adj Qty': `${item.quantity} ${item.uom}`,
                    'Actual Qty': `${item.actualQuantity} ${item.uom}`,
                    'UOM': item.uom,
                    'Base': item.Product.baseUOM,
                    'Conversions': conversions || 'None'
                };
            });

            console.table(items);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
