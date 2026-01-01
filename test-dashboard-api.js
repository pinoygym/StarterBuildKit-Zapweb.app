const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
  try {
    console.log('Testing database connection...');

    // Test basic query
    const branchCount = await prisma.branch.count();
    console.log('✓ Database connection successful. Branches:', branchCount);

    // Test a dashboard query
    console.log('\nTesting dashboard queries...');

    const products = await prisma.product.count({ where: { status: 'active' } });
    console.log('✓ Active products:', products);

    const batches = await prisma.inventoryBatch.findMany({
      where: { status: 'active' },
      take: 5
    });
    console.log('✓ Found', batches.length, 'inventory batches');

    const sales = await prisma.pOSSale.findMany({
      take: 5,
      include: {
        POSSaleItem: true
      }
    });
    console.log('✓ Found', sales.length, 'POS sales');

    // Test AccountsReceivable
    const arCount = await prisma.accountsReceivable.count();
    console.log('✓ Accounts Receivable records:', arCount);

    // Test AccountsPayable
    const apCount = await prisma.accountsPayable.count();
    console.log('✓ Accounts Payable records:', apCount);

    console.log('\n✓ All tests passed!');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboard();
