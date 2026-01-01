const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCashiers() {
  try {
    const cashierRole = await prisma.role.findFirst({
      where: { name: 'Cashier' }
    });

    if (!cashierRole) {
      console.log('No Cashier role found');
      return;
    }

    const cashiers = await prisma.user.findMany({
      where: { roleId: cashierRole.id },
      include: {
        Role: true,
        Branch: true
      }
    });

    console.log(`Found ${cashiers.length} Cashier users:`);
    cashiers.forEach(user => {
      console.log(`  - ${user.email}`);
      console.log(`    Name: ${user.firstName} ${user.lastName}`);
      console.log(`    Role: ${user.Role?.name}`);
      console.log(`    Branch: ${user.Branch?.name || 'No branch assigned'} (ID: ${user.branchId || 'null'})`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCashiers();
