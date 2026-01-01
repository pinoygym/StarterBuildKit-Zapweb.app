
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
    const customers = await prisma.customer.findMany({
        select: { customerCode: true },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total customers: ${customers.length}`);
    console.log('Sample codes:', customers.map(c => c.customerCode).slice(0, 5));

    // Find max number
    let maxNum = 0;
    for (const c of customers) {
        const match = c.customerCode.match(/CUST-(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
        }
    }
    console.log(`Max Customer Code Number: ${maxNum}`);
}

main().finally(() => prisma.$disconnect());
