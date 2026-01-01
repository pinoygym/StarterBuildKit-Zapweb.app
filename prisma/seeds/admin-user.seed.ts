import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedAdminUser() {
  console.log('Seeding default admin user...');

  // Get Super Admin role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found. Please run seed roles first.');
  }

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'cybergada@gmail.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Hash the default password
  const passwordHash = await bcrypt.hash('Qweasd145698@', 12);

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'cybergada@gmail.com',
      passwordHash,
      firstName: 'Cyber',
      lastName: 'Gada',
      roleId: superAdminRole.id,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('Created default Super Admin user');
  console.log('Email: cybergada@gmail.com');
  console.log('Password: Qweasd145698@ (Demo account)');
}
