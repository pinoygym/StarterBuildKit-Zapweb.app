import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const PROD_DB_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEV_DB_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// 1. Instantiate Prod Client (Target)
const poolProd = new Pool({ connectionString: PROD_DB_URL });
const adapterProd = new PrismaPg(poolProd);
const prismaProd = new PrismaClient({ adapter: adapterProd });

// 2. Instantiate Dev Client (Source)
const poolDev = new Pool({ connectionString: DEV_DB_URL });
const adapterDev = new PrismaPg(poolDev);
const prismaDev = new PrismaClient({ adapter: adapterDev });

async function main() {
  console.log('Starting sync from DEV to PROD (Promotion)...');

  try {
    // Check Counts
    const devUserCount = await prismaDev.user.count();
    console.log(`Source (DEV) Users: ${devUserCount}`);

    if (devUserCount === 0) {
      console.log('No users in Dev to sync.');
      return;
    }

    // 1. Sync Roles (Dependencies for User)
    console.log('Fetching Roles from Dev...');
    const roles = await prismaDev.role.findMany();
    console.log(`Found ${roles.length} roles in Dev.`);

    for (const role of roles) {
      await prismaProd.role.upsert({
        where: { id: role.id },
        update: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          updatedAt: new Date(),
        },
        create: {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Roles synced to Prod.');

    // 2. Sync Branches (Dependencies for User)
    console.log('Fetching Branches from Dev...');
    const branches = await prismaDev.branch.findMany();
    console.log(`Found ${branches.length} branches in Dev.`);

    for (const branch of branches) {
      await prismaProd.branch.upsert({
        where: { id: branch.id },
        update: {
          name: branch.name,
          code: branch.code,
          location: branch.location,
          manager: branch.manager,
          phone: branch.phone,
          status: branch.status,
          updatedAt: new Date(),
        },
        create: {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          location: branch.location,
          manager: branch.manager,
          phone: branch.phone,
          status: branch.status,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Branches synced to Prod.');

    // 3. Sync Users
    console.log('Fetching Users from Dev...');
    const users = await prismaDev.user.findMany();
    console.log(`Found ${users.length} users in Dev.`);

    for (const user of users) {
      console.log(`Syncing user to Prod: ${user.email}`);

      await prismaProd.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roleId: user.roleId,
          branchId: user.branchId,
          status: user.status,
          emailVerified: user.emailVerified,
          isSuperMegaAdmin: user.isSuperMegaAdmin,
          lastLoginAt: user.lastLoginAt,
          passwordChangedAt: user.passwordChangedAt,
          branchLockEnabled: user.branchLockEnabled,
          updatedAt: new Date(),
        },
        create: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roleId: user.roleId,
          branchId: user.branchId,
          status: user.status,
          emailVerified: user.emailVerified,
          isSuperMegaAdmin: user.isSuperMegaAdmin,
          lastLoginAt: user.lastLoginAt,
          passwordChangedAt: user.passwordChangedAt,
          branchLockEnabled: user.branchLockEnabled,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Users promoted to Prod successfully.');

    // 4. Sync UserBranchAccess
    console.log('Fetching UserBranchAccess from Dev...');
    const userBranchAccesses = await prismaDev.userBranchAccess.findMany();
    console.log(`Found ${userBranchAccesses.length} user branch access records in Dev.`);

    for (const access of userBranchAccesses) {
      // Ensure User and Branch exist in Prod (they should by now)
      await prismaProd.userBranchAccess.upsert({
        where: { id: access.id },
        update: {
          userId: access.userId,
          branchId: access.branchId,
          createdAt: access.createdAt,
        },
        create: {
          id: access.id,
          userId: access.userId,
          branchId: access.branchId,
          createdAt: access.createdAt,
        },
      });
    }
    console.log('UserBranchAccess synced to Prod.');

  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    await prismaProd.$disconnect();
    await prismaDev.$disconnect();
  }
}

main();
