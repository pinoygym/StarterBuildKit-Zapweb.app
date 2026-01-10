import { PrismaClient } from '@prisma/client';

const url = 'postgresql://neondb_owner:npg_JngWbhwd5H3q@ep-odd-waterfall-a1jyuyy8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url
        }
    }
});

async function main() {
    console.log('Explicitly checking ep-odd-waterfall-a1jyuyy8-pooler');
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
