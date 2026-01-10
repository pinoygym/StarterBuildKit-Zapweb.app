import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
    try {
        const tables: any[] = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables found:', tables.length);
        const names = tables.map(t => t.table_name);
        console.log('User table exists:', names.includes('User'));
        console.log('All tables:', names.join(', '));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
