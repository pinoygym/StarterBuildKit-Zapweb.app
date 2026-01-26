import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

function getPrisma() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

/**
 * Truncate all tables in the database except system tables
 * This is used to reset the database between test runs
 */
export async function truncateAllTables() {
    const client = getPrisma();

    const tables = await client.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations'
  `;

    // Disable foreign key checks temporarily
    await client.$executeRawUnsafe('SET session_replication_role = replica;');

    try {
        // Truncate each table
        for (const { tablename } of tables) {
            try {
                await client.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
            } catch (error) {
                console.warn(`Warning: Could not truncate ${tablename}:`, error);
            }
        }
    } finally {
        // Re-enable foreign key checks
        await client.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    }
}

/**
 * Reset all sequences in the database
 */
export async function resetSequences() {
    const client = getPrisma();

    const sequences = await client.$queryRaw<Array<{ sequence_name: string }>>`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  `;

    for (const { sequence_name } of sequences) {
        try {
            await client.$executeRawUnsafe(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`);
        } catch (error) {
            console.warn(`Warning: Could not reset sequence ${sequence_name}:`, error);
        }
    }
}

/**
 * Seed essential data required for tests
 * This includes roles and a test admin user
 */
export async function seedEssentialData() {
    const client = getPrisma();

    // Create default roles if they don't exist
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
        await client.role.upsert({
            where: { name: roleData.name },
            update: {},
            create: roleData,
        });
    }

    console.log('✓ Essential roles seeded');
}

/**
 * Complete database reset: truncate, reset sequences, and seed
 */
export async function resetDatabase() {
    console.log('Resetting test database...');

    await truncateAllTables();
    console.log('✓ Tables truncated');

    await resetSequences();
    console.log('✓ Sequences reset');

    await seedEssentialData();
    console.log('✓ Essential data seeded');

    console.log('Database reset complete!');
}

/**
 * Close database connection
 */
export async function disconnectDatabase() {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

export { prisma };
