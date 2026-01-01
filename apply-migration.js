const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Reading migration SQL...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma', 'migrations', '20251122000000_fix_pos_discount_fields', 'migration.sql'),
      'utf8'
    );

    console.log('Applying migration...\n');
    console.log(migrationSQL);
    console.log('\n---\n');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await prisma.$executeRawUnsafe(statement + ';');
        console.log('✓ Success\n');
      }
    }

    console.log('\n✓ All migration statements executed successfully!');

    // Verify the changes
    console.log('\nVerifying POSSale discount column...');
    const check = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'POSSale' AND column_name IN ('discount', 'discountType', 'discountValue', 'discountReason')
      ORDER BY column_name;
    `;
    console.table(check);

  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
