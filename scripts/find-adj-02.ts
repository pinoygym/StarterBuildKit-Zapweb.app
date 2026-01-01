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
    console.log('--- Searching for Adjustment containing Plastics ---');
    const adjustments = await prisma.inventoryAdjustment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    Product: true
                }
            }
        }
    });

    adjustments.forEach(adj => {
        const hasCorrectItem = adj.items.some(i => i.Product.name.includes('Excellent 2x3 (02)') && (i.quantity === 45 || i.quantity === 450));
        if (hasCorrectItem) {
            console.log(`\nMATCH FOUND: Adj Number: ${adj.adjustmentNumber}, Ref: ${adj.referenceNumber}, Reason: ${adj.reason}`);
            adj.items.forEach(item => {
                console.log(`  - ${item.Product.name}: ${item.quantity} ${item.uom}`);
            });
        }
    });
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
