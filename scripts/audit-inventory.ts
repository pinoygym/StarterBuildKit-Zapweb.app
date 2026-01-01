import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- Current Inventory ---');
    const inventory = await prisma.inventory.findMany({
        include: {
            Product: true,
            Warehouse: true
        },
        orderBy: {
            Product: {
                name: 'asc'
            }
        }
    });

    inventory.forEach(item => {
        console.log(`${item.Product.name}: ${item.quantity} ${item.Product.baseUOM} (${item.Warehouse.name})`);
    });

    console.log('\n--- Adjustments ---');
    const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
            OR: [
                { adjustmentNumber: { contains: 'ADJ-01', mode: 'insensitive' } },
                { referenceNumber: { contains: 'ADJ-01', mode: 'insensitive' } },
                { reason: { contains: 'ADJ-01', mode: 'insensitive' } },
                { adjustmentNumber: { contains: 'ADJ-02', mode: 'insensitive' } },
                { referenceNumber: { contains: 'ADJ-02', mode: 'insensitive' } },
                { reason: { contains: 'ADJ-02', mode: 'insensitive' } },
                { adjustmentNumber: { contains: 'ADJ-03', mode: 'insensitive' } },
                { referenceNumber: { contains: 'ADJ-03', mode: 'insensitive' } },
                { reason: { contains: 'ADJ-03', mode: 'insensitive' } },
                { adjustmentNumber: { contains: 'ADJ-04', mode: 'insensitive' } },
                { referenceNumber: { contains: 'ADJ-04', mode: 'insensitive' } },
                { reason: { contains: 'ADJ-04', mode: 'insensitive' } },
            ]
        },
        include: {
            items: {
                include: {
                    Product: true
                }
            }
        }
    });

    if (adjustments.length === 0) {
        console.log('No adjustment found with ADJ-01 or ADJ-02');
    } else {
        adjustments.forEach(adj => {
            console.log(`Adj Number: ${adj.adjustmentNumber}, Ref: ${adj.referenceNumber}, Reason: ${adj.reason}, Date: ${adj.adjustmentDate}, Status: ${adj.status}`);
            adj.items.forEach(item => {
                console.log(`  - ${item.Product.name}: ${item.quantity} ${item.uom} (System: ${item.systemQuantity}, Actual: ${item.actualQuantity})`);
            });
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
