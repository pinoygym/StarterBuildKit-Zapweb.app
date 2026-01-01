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
    const productCount = await prisma.product.count();
    const catCount = await prisma.productCategory.count();
    const suppCount = await prisma.supplier.count();
    const uomCount = await prisma.productUOM.count(); // actually productUOMs table
    const uomRef = await prisma.unitOfMeasure.count();

    console.log(`Products: ${productCount}`);
    console.log(`Categories: ${catCount}`);
    console.log(`Suppliers: ${suppCount}`);
    console.log(`Product UOMs: ${uomCount}`);
    console.log(`UOM Definitions: ${uomRef}`);
}

main().finally(() => prisma.$disconnect());
