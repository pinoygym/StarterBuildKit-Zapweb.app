import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestDatabase() {
    console.log('🌱 Seeding test database...\n');

    try {
        // Create default roles
        const roles = [
            {
                name: 'Super Admin',
                description: 'Super Administrator with full access',
            },
            {
                name: 'Admin',
                description: 'Administrator with limited access',
            },
            {
                name: 'Manager',
                description: 'Branch/Warehouse Manager',
            },
            {
                name: 'Cashier',
                description: 'POS Cashier',
            },
        ];

        for (const roleData of roles) {
            const role = await prisma.role.upsert({
                where: { name: roleData.name },
                update: {},
                create: roleData,
            });
            console.log(`✓ Role: ${role.name}`);
        }

        console.log('\n✅ Test database seeded successfully!');
    } catch (error) {
        console.error('\n❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedTestDatabase();
