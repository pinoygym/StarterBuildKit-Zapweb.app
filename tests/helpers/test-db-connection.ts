import { PrismaClient } from '@prisma/client';

/**
 * Quick script to test database connection
 * Run with: DATABASE_URL="your_test_db_url" bun run tests/helpers/test-db-connection.ts
 */

async function testConnection() {
    console.log('\n🔍 Testing database connection...\n');

    const dbUrl = process.env.DATABASE_URL;
    console.log('Database URL:', dbUrl?.replace(/:[^:@]+@/, ':****@'));

    const prisma = new PrismaClient();

    try {
        // Try to connect
        await prisma.$connect();
        console.log('✅ Successfully connected to database!');

        // Try a simple query
        const result = await prisma.$queryRaw`SELECT current_database(), version()`;
        console.log('\n📊 Database info:', result);

        // Check if tables exist
        const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      LIMIT 5
    `;

        console.log('\n📋 Sample tables:', tables.map(t => t.tablename).join(', ') || 'No tables yet');

    } catch (error: any) {
        console.error('\n❌ Connection failed:', error.message);

        if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.log('\n💡 The database does not exist yet. Please create it first:');
            console.log('   1. Go to: https://console.neon.tech');
            console.log('   2. Select your project');
            console.log('   3. Create database: neondb_test');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
