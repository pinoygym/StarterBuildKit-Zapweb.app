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

  // Generate password hash for superadmin and regular admin
  const passwordHash = await bcrypt.hash('12345678', 12);

  if (existingSuperMegaAdmin) {
    console.log('Super Mega Admin user already exists, ensuring password is correct...');
    await prisma.user.update({
      where: { id: existingSuperMegaAdmin.id },
      data: { passwordHash },
    });
    // Continue without creating a new user
  }

  // Check if regular admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'cybergada@gmail.com' },
  });

  if (existingAdmin) {
    console.log('Regular admin user exists, updating password...');
    await prisma.user.update({
      where: { email: 'cybergada@gmail.com' },
      data: {
        passwordHash,
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    console.log('✅ Admin password updated.');
    return;
  }

  // Hash the default password


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
