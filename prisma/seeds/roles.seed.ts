import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRoles() {
  console.log('Seeding roles...');

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      isSystem: true,
    },
    {
      name: 'Branch Manager',
      description: 'Manage branch operations and staff',
      isSystem: true,
    },
    {
      name: 'Cashier',
      description: 'Handle POS transactions and customer sales',
      isSystem: true,
    },
    {
      name: 'Warehouse Staff',
      description: 'Manage inventory and stock movements',
      isSystem: true,
    },
    {
      name: 'Accountant',
      description: 'Manage financial operations and reporting',
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log(`Created ${roles.length} system roles`);
}
