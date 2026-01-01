/**
 * Script to seed the production database with admin user and essential data
 * 
 * IMPORTANT: Set DATABASE_URL environment variable before running:
 * Windows: set DATABASE_URL=postgresql://...
 * PowerShell: $env:DATABASE_URL='postgresql://...'
 * Bash: export DATABASE_URL='postgresql://...'
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('\nPlease set it before running this script.');
    process.exit(1);
}

console.log('\n🔍 Connecting to database...');
console.log(`   URL: ${process.env.DATABASE_URL.split('@')[1]?.split('?')[0] || 'hidden'}\n`);

async function seedProduction() {
    console.log('🌱 SEEDING PRODUCTION DATABASE\n');

    const prisma = new PrismaClient();

    try {
        // Test connection
        await prisma.$connect();
        console.log('✅ Connected to database\n');

        // Check if admin user already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'cybergada@gmail.com' }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   ID: ${existingAdmin.id}`);
            console.log('\nDatabase is already seeded. Exiting.\n');
            return;
        }

        console.log('Creating admin user and essential data...\n');

        // 1. Create Admin Role with all permissions
        console.log('1️⃣  Creating Admin role...');
        const adminRole = await prisma.role.upsert({
            where: { name: 'Admin' },
            update: {},
            create: {
                name: 'Admin',
                description: 'System Administrator with full access',
                permissions: {
                    create: [
                        // User Management
                        { resource: 'USERS', action: 'CREATE' },
                        { resource: 'USERS', action: 'READ' },
                        { resource: 'USERS', action: 'UPDATE' },
                        { resource: 'USERS', action: 'DELETE' },

                        // Role Management
                        { resource: 'ROLES', action: 'CREATE' },
                        { resource: 'ROLES', action: 'READ' },
                        { resource: 'ROLES', action: 'UPDATE' },
                        { resource: 'ROLES', action: 'DELETE' },

                        // Product Management
                        { resource: 'PRODUCTS', action: 'CREATE' },
                        { resource: 'PRODUCTS', action: 'READ' },
                        { resource: 'PRODUCTS', action: 'UPDATE' },
                        { resource: 'PRODUCTS', action: 'DELETE' },

                        // Inventory Management
                        { resource: 'INVENTORY', action: 'CREATE' },
                        { resource: 'INVENTORY', action: 'READ' },
                        { resource: 'INVENTORY', action: 'UPDATE' },
                        { resource: 'INVENTORY', action: 'DELETE' },

                        // Branch Management
                        { resource: 'BRANCHES', action: 'CREATE' },
                        { resource: 'BRANCHES', action: 'READ' },
                        { resource: 'BRANCHES', action: 'UPDATE' },
                        { resource: 'BRANCHES', action: 'DELETE' },

                        // Warehouse Management
                        { resource: 'WAREHOUSES', action: 'CREATE' },
                        { resource: 'WAREHOUSES', action: 'READ' },
                        { resource: 'WAREHOUSES', action: 'UPDATE' },
                        { resource: 'WAREHOUSES', action: 'DELETE' },

                        // Purchase Orders
                        { resource: 'PURCHASE_ORDERS', action: 'CREATE' },
                        { resource: 'PURCHASE_ORDERS', action: 'READ' },
                        { resource: 'PURCHASE_ORDERS', action: 'UPDATE' },
                        { resource: 'PURCHASE_ORDERS', action: 'DELETE' },

                        // Sales Orders
                        { resource: 'SALES_ORDERS', action: 'CREATE' },
                        { resource: 'SALES_ORDERS', action: 'READ' },
                        { resource: 'SALES_ORDERS', action: 'UPDATE' },
                        { resource: 'SALES_ORDERS', action: 'DELETE' },

                        // Reports
                        { resource: 'REPORTS', action: 'READ' },

                        // Settings
                        { resource: 'SETTINGS', action: 'READ' },
                        { resource: 'SETTINGS', action: 'UPDATE' },
                    ]
                }
            }
        });
        console.log(`   ✅ Admin role created (ID: ${adminRole.id})`);

        // 2. Create Main Branch
        console.log('\n2️⃣  Creating main branch...');
        const mainBranch = await prisma.branch.upsert({
            where: { code: 'MAIN' },
            update: {},
            create: {
                code: 'MAIN',
                name: 'Main Branch',
                address: 'Head Office',
                contactNumber: '+63 123 456 7890',
                status: 'ACTIVE'
            }
        });
        console.log(`   ✅ Main branch created (ID: ${mainBranch.id})`);

        // 3. Create Admin User
        console.log('\n3️⃣  Creating admin user...');
        const hashedPassword = await bcrypt.hash('Qweasd145698@', 10);

        const adminUser = await prisma.user.create({
            data: {
                email: 'cybergada@gmail.com',
                name: 'System Administrator',
                password: hashedPassword,
                roleId: adminRole.id,
                branchId: mainBranch.id,
                status: 'ACTIVE',
                emailVerified: new Date()
            }
        });
        console.log(`   ✅ Admin user created (ID: ${adminUser.id})`);
        console.log(`   📧 Email: ${adminUser.email}`);
        console.log(`   🔑 Password: Qweasd145698@`);

        // 4. Create UOM Categories
        console.log('\n4️⃣  Creating UOM categories...');
        const uomCategories = await Promise.all([
            prisma.uOMCategory.upsert({
                where: { name: 'Volume' },
                update: {},
                create: { name: 'Volume', description: 'Volume measurements' }
            }),
            prisma.uOMCategory.upsert({
                where: { name: 'Quantity' },
                update: {},
                create: { name: 'Quantity', description: 'Quantity measurements' }
            }),
            prisma.uOMCategory.upsert({
                where: { name: 'Weight' },
                update: {},
                create: { name: 'Weight', description: 'Weight measurements' }
            })
        ]);
        console.log(`   ✅ Created ${uomCategories.length} UOM categories`);

        // 5. Create Base UOMs
        console.log('\n5️⃣  Creating base UOMs...');
        const volumeCategory = uomCategories.find(c => c.name === 'Volume');
        const quantityCategory = uomCategories.find(c => c.name === 'Quantity');

        const uoms = await Promise.all([
            prisma.uOM.upsert({
                where: { code: 'PCS' },
                update: {},
                create: {
                    code: 'PCS',
                    name: 'Pieces',
                    categoryId: quantityCategory.id,
                    isBase: true
                }
            }),
            prisma.uOM.upsert({
                where: { code: 'CASE' },
                update: {},
                create: {
                    code: 'CASE',
                    name: 'Case',
                    categoryId: quantityCategory.id,
                    isBase: false
                }
            }),
            prisma.uOM.upsert({
                where: { code: 'LITER' },
                update: {},
                create: {
                    code: 'LITER',
                    name: 'Liter',
                    categoryId: volumeCategory.id,
                    isBase: true
                }
            })
        ]);
        console.log(`   ✅ Created ${uoms.length} UOMs`);

        console.log('\n✅ PRODUCTION DATABASE SEEDED SUCCESSFULLY!\n');
        console.log('You can now login with:');
        console.log('   Email: cybergada@gmail.com');
        console.log('   Password: Qweasd145698@\n');

    } catch (error) {
        console.error('\n❌ Error seeding production database:');
        console.error(error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedProduction()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
