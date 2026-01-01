
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('--- Connecting to Prisma Client ---');
        const users = await prisma.user.findMany();

        console.log(`\nTotal Users Found: ${users.length}`);

        if (users.length > 0) {
            console.log('\nList of Users:');
            users.forEach(u => {
                console.log(`- ID: ${u.id}`);
                console.log(`  Email: ${u.email}`);
                console.log(`  RoleID: ${u.roleId}`);
                console.log(`  Status: ${u.status}`);
                console.log('---');
            });
        } else {
            console.log('⚠️  No users found in the "User" table.');
        }

        // Check Roles as well, as they are dependencies
        const roles = await prisma.role.findMany();
        console.log(`\nTotal Roles Found: ${roles.length}`);
        roles.forEach(r => console.log(`- ${r.name} (${r.id})`));

    } catch (error) {
        console.error('❌ Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
