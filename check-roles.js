const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const roles = await prisma.role.findMany();
    console.log('Roles in database:');
    roles.forEach(r => {
      console.log(`  - ID: ${r.id}, Name: "${r.name}"`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
