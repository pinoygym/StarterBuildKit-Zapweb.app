import { PrismaClient, UserStatus } from '@prisma/client';
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
    where: { email: 'admin@inventorypro.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Hash the default password
  const passwordHash = await bcrypt.hash('Admin@123456!', 12);

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@inventorypro.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      roleId: superAdminRole.id,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  console.log('Created default Super Admin user');
  console.log('Email: admin@inventorypro.com');
  console.log('Password: Admin@123456! (Please change on first login)');
}
