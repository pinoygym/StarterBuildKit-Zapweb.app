import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export async function seedAdminUser(prisma: PrismaClient) {
  console.log('Seeding default admin user...');

  // Get Super Admin role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found. Please run seed roles first.');
  }

  // Check if Super Mega Admin user already exists
  const existingSuperMegaAdmin = await prisma.user.findFirst({
    where: { isSuperMegaAdmin: true },
  });

  if (existingSuperMegaAdmin) {
    console.log('Super Mega Admin user already exists, skipping...');
    return;
  }

  // Check if regular admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'cybergada@gmail.com' },
  });

  if (existingAdmin) {
    console.log('Regular admin user already exists, skipping...');
    return;
  }

  // Hash the default password
  const passwordHash = await bcrypt.hash('Qweasd145698@', 12);

  // Create Super Mega Admin user (master key account)
  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: 'cybergada@gmail.com',
      passwordHash,
      firstName: 'Cyber',
      lastName: 'Gada',
      roleId: superAdminRole.id,
      status: 'ACTIVE',
      emailVerified: true,
      isSuperMegaAdmin: true, // Master admin account - cannot be deleted
      updatedAt: new Date(),
    },
  });

  console.log('Created default admin user');
}
