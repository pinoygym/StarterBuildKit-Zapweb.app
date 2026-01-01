import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedAdminUser } from '../prisma/seeds/admin-user.seed';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting admin user seed...');
    try {
        await seedAdminUser(prisma);
        console.log('Admin user seed completed.');
    } catch (e) {
        console.error('Error seeding admin user:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
