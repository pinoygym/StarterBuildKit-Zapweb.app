import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function count() {
    const productCount = await prisma.product.count();
    console.log(`Total products in database: ${productCount}`);
}

count()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
