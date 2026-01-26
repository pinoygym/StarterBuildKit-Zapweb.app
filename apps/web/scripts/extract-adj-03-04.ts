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
    const references = ['ADJ-06', 'ADJ-07'];

    for (const ref of references) {
        console.log(`\n--- Searching for ${ref} ---`);
        const adjustments = await prisma.inventoryAdjustment.findMany({
            where: {
                OR: [
                    { adjustmentNumber: { contains: ref, mode: 'insensitive' } },
                    { referenceNumber: { contains: ref, mode: 'insensitive' } },
                    { reason: { contains: ref, mode: 'insensitive' } },
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
            console.log(`No record found for ${ref}`);
            continue;
        }

        adjustments.forEach(adj => {
            console.log(`\nADJUSTMENT FOUND:`);
            console.log(`Number: ${adj.adjustmentNumber}`);
            console.log(`Reference: ${adj.referenceNumber}`);
            console.log(`Reason: ${adj.reason}`);
            console.log(`Status: ${adj.status}`);
            console.log('Items:');
            adj.items.forEach(item => {
                console.log(`  - ${item.Product.name} (${item.Product.id}): ${item.quantity} ${item.uom}`);
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
