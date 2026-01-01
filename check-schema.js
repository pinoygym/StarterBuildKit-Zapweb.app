const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Query the database directly to check column structure
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'POSSale'
      ORDER BY ordinal_position;
    `;

    console.log('POSSale table columns:');
    console.log(result);

    const hasDiscount = result.some(col => col.column_name === 'discount');
    console.log('\nDiscount column exists:', hasDiscount);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
