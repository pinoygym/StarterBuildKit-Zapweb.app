/**
 * Simple script to check a database for admin user
 * Uses DATABASE_URL from environment
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'cybergada@gmail.com';

async function check() {
    try {
        await prisma.$connect();

        const adminUser = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        const userCount = await prisma.user.count();
        const roleCount = await prisma.role.count();
        const branchCount = await prisma.branch.count();
        const productCount = await prisma.product.count();

        return {
            hasAdmin: !!adminUser,
            adminUser: adminUser ? {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role?.name,
                status: adminUser.status,
                permissions: adminUser.role?.permissions.length || 0
            } : null,
            stats: {
                users: userCount,
                roles: roleCount,
                branches: branchCount,
                products: productCount
            }
        };

    } catch (error) {
        return {
            error: error.message
        };
    } finally {
        await prisma.$disconnect();
    }
}

check().then(result => {
    console.log(JSON.stringify(result, null, 2));
}).catch(error => {
    console.error(JSON.stringify({ error: error.message }, null, 2));
    process.exit(1);
});
