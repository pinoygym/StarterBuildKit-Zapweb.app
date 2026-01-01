
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
    const products = await prisma.product.findMany({
        include: {
            productUOMs: true,
        },
        orderBy: {
            name: 'asc'
        }
    });

    const results = [];
    for (const p of products) {
        if (['Alaska', 'Angel', 'Baking', 'Bambi', 'Bensdorp', 'Blueberry'].some(k => p.name.includes(k))) {
            results.push({
                name: p.name,
                baseUOM: p.baseUOM,
                basePrice: p.basePrice,
                uoms: p.productUOMs.map(u => ({
                    name: u.name,
                    conversionFactor: u.conversionFactor,
                    sellingPrice: u.sellingPrice
                }))
            });
        }
    }
    fs.writeFileSync('verify_output.json', JSON.stringify(results, null, 2));
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
