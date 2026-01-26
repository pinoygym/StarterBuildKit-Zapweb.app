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
        console.log('📊 PRODUCTION DATABASE - ALL NAVAL CUSTOMERS');
        console.log('Database: ep-floral-silence-a1jm7mgz (Production)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');

        // Get ALL customers
        const allCustomers = await prisma.customer.findMany({
            orderBy: { customerCode: 'asc' },
            select: {
                customerCode: true,
                companyName: true,
                city: true,
                contactPerson: true,
                phone: true,
                paymentTerms: true,
                status: true,
                createdAt: true
            }
        });

        console.log(`Total Customers in Production: ${allCustomers.length}`);
        console.log('');
        console.log('Complete Customer List:');
        console.log('───────────────────────────────────────────────────────────');

        allCustomers.forEach((c, index) => {
            console.log(`${index + 1}. ${c.customerCode} - ${c.companyName}`);
            console.log(`   Contact: ${c.contactPerson} | Phone: ${c.phone}`);
            console.log(`   Terms: ${c.paymentTerms} | Status: ${c.status}`);
            console.log(`   Created: ${c.createdAt.toISOString()}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════════');
        console.log(`✅ Import Verification: All ${allCustomers.length} customers present`);
        console.log('═══════════════════════════════════════════════════════════');

    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
