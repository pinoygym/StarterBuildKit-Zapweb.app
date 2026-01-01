const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Backup production schema before migration
async function backupProductionSchema() {
  // Temporarily set production URL
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const prisma = new PrismaClient();

  try {
    console.log('📦 Backing up production database schema...\n');

    // Get all table names
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log('Tables found:', tables.map(t => t.tablename).join(', '));

    // Get schema information for each table
    const schemaInfo = {};
    for (const table of tables) {
      const tableName = table.tablename;

      // Get column information
      const columns = await prisma.$queryRaw`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_name = ${tableName} AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;

      // Get indexes
      const indexes = await prisma.$queryRaw`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = ${tableName} AND schemaname = 'public';
      `;

      schemaInfo[tableName] = {
        columns,
        indexes
      };
    }

    // Save backup
    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'production',
      tables: schemaInfo
    };

    fs.writeFileSync(
      'production-schema-backup.json',
      JSON.stringify(backupData, null, 2)
    );

    console.log('✅ Production schema backup saved to production-schema-backup.json');

  } catch (error) {
    console.error('❌ Error backing up production schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    // Restore original URL
    process.env.DATABASE_URL = originalUrl;
  }
}

backupProductionSchema();