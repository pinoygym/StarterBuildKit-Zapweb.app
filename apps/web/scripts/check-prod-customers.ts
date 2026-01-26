import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Production database URL
const PROD_DB_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString: PROD_DB_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('🔍 Checking Production Database');
        console.log('Database: ep-floral-silence-a1jm7mgz (Production)');
        console.log('');

        // Get total customer count
        const totalCount = await prisma.customer.count();
        console.log(`📊 Total Customers: ${totalCount}`);
        console.log('');

        // Check for naval customers
        const navalCustomers = await prisma.customer.findMany({
            where: {
                OR: [
                    { companyName: { contains: 'Naval', mode: 'insensitive' } },
                    { companyName: { contains: 'VMJR', mode: 'insensitive' } },
                    { companyName: { contains: 'BIG BC', mode: 'insensitive' } },
                    { companyName: { contains: 'Billy Gervacio', mode: 'insensitive' } },
                ]
            },
            orderBy: { customerCode: 'asc' }
        });

        console.log(`🔎 Naval Customers Found: ${navalCustomers.length}`);
        if (navalCustomers.length > 0) {
            console.log('');
            console.log('Naval Customers:');
            navalCustomers.forEach(c => {
                console.log(`  - ${c.customerCode}: ${c.companyName}`);
            });
        }
        console.log('');

        // Get last 10 customers by code
        const lastCustomers = await prisma.customer.findMany({
            orderBy: { customerCode: 'desc' },
            take: 10,
            select: {
                customerCode: true,
                companyName: true,
                createdAt: true
            }
        });

        console.log('📋 Last 10 Customers (by code):');
        lastCustomers.forEach(c => {
            console.log(`  ${c.customerCode}: ${c.companyName} (Created: ${c.createdAt.toISOString()})`);
        });
        console.log('');

        // Check customer code range
        const customers = await prisma.customer.findMany({
            select: { customerCode: true },
            orderBy: { customerCode: 'asc' }
        });

        if (customers.length > 0) {
            console.log(`📈 Customer Code Range: ${customers[0].customerCode} to ${customers[customers.length - 1].customerCode}`);
        }

    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
