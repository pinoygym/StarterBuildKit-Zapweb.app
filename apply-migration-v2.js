const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying migration to add missing columns...\n');

    // Add columns to POSSale table
    console.log('1. Adding discount column to POSSale...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSale"
      ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `;
    console.log('✓ Success\n');

    console.log('2. Adding discountType column to POSSale...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSale"
      ADD COLUMN IF NOT EXISTS "discountType" TEXT;
    `;
    console.log('✓ Success\n');

    console.log('3. Adding discountValue column to POSSale...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSale"
      ADD COLUMN IF NOT EXISTS "discountValue" DOUBLE PRECISION;
    `;
    console.log('✓ Success\n');

    console.log('4. Adding discountReason column to POSSale...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSale"
      ADD COLUMN IF NOT EXISTS "discountReason" TEXT;
    `;
    console.log('✓ Success\n');

    // Add columns to POSSaleItem table
    console.log('5. Adding discount column to POSSaleItem...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSaleItem"
      ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `;
    console.log('✓ Success\n');

    console.log('6. Adding discountType column to POSSaleItem...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSaleItem"
      ADD COLUMN IF NOT EXISTS "discountType" TEXT;
    `;
    console.log('✓ Success\n');

    console.log('7. Adding discountValue column to POSSaleItem...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSaleItem"
      ADD COLUMN IF NOT EXISTS "discountValue" DOUBLE PRECISION;
    `;
    console.log('✓ Success\n');

    console.log('8. Adding originalPrice column to POSSaleItem...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSaleItem"
      ADD COLUMN IF NOT EXISTS "originalPrice" DOUBLE PRECISION;
    `;
    console.log('✓ Success\n');

    // Add columns to CompanySettings table
    console.log('9. Adding VAT and discount columns to CompanySettings...');
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "vatEnabled" BOOLEAN NOT NULL DEFAULT false;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "vatRegistrationNumber" TEXT;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "taxInclusive" BOOLEAN NOT NULL DEFAULT false;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "requireDiscountApproval" BOOLEAN NOT NULL DEFAULT false;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "maxDiscountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "CompanySettings"
      ADD COLUMN IF NOT EXISTS "discountApprovalThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `;
    console.log('✓ Success\n');

    console.log('10. Setting default for tax column...');
    await prisma.$executeRaw`
      ALTER TABLE "POSSale" ALTER COLUMN "tax" SET DEFAULT 0;
    `;
    console.log('✓ Success\n');

    console.log('\n✅ All migrations applied successfully!\n');

    // Verify the changes
    console.log('Verifying POSSale discount column...');
    const check = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'POSSale' AND column_name = 'discount';
    `;

    if (check.length > 0) {
      console.log('✅ POSSale.discount column verified:');
      console.table(check);
    } else {
      console.log('❌ POSSale.discount column NOT found');
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
