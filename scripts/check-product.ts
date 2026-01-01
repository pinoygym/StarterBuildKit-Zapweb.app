import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const searchTerm = "Others - LEATHER Maruyama Black/Black";
    console.log(`Searching for product: "${searchTerm}"`);

    const product = await prisma.product.findFirst({
        where: {
            name: {
                contains: searchTerm,
                mode: 'insensitive'
            }
        },
        include: {
            Supplier: true,
            ProductCategory: true,
            productUOMs: true
        }
    });

    if (product) {
        console.log("Found Product:", JSON.stringify(product, null, 2));
    } else {
        console.log("Product NOT found.");
        // List some "Other" products to help debug
        const others = await prisma.product.findMany({
            where: { name: { startsWith: 'Other' } },
            take: 5
        });
        console.log("Sample 'Other' products:", others.map(p => p.name));
    }
}

main().finally(() => prisma.$disconnect());
