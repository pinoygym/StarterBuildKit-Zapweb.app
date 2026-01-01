
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        },
    },
});

async function main() {
    try {
        console.log('Testing connection to Production DB...');
        await prisma.$connect();
        console.log('✅ Connection successful!');

        const count = await prisma.user.count();
        console.log(`✅ successfully queried database. found ${count} users.`);

    } catch (error) {
        console.error('❌ Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
