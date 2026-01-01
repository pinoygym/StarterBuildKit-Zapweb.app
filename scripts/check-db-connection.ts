
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Connection Check ---');

    // masked url check
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('❌ DATABASE_URL is not set in environment!');
    } else {
        const masked = url.replace(/:([^:@]+)@/, ':****@');
        console.log(`DATABASE_URL (masked): ${masked}`);

        // Parsing to show host
        try {
            const dbUrl = new URL(url);
            console.log(`Host: ${dbUrl.hostname}`);
            console.log(`Database: ${dbUrl.pathname}`);
        } catch (e) {
            console.log('Could not parse URL standardly.');
        }
    }

    try {
        const userCount = await prisma.user.count();
        console.log(`\nUser Count in DB: ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({
                select: { email: true, status: true, isSuperMegaAdmin: true, roleId: true }
            });
            console.log('\nUsers found:');
            console.table(users);
        } else {
            console.log('❌ No users found in the database. Seeding did NOT persist to this connection.');
        }

    } catch (e) {
        console.error('❌ Error Querying DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
