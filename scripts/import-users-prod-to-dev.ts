import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const PROD_DB_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEV_DB_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-noisy-mountain-a18wvzwi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// 1. Instantiate Prod Client
const poolProd = new Pool({ connectionString: PROD_DB_URL });
const adapterProd = new PrismaPg(poolProd);
const prismaProd = new PrismaClient({ adapter: adapterProd });

// 2. Instantiate Dev Client
const poolDev = new Pool({ connectionString: DEV_DB_URL });
const adapterDev = new PrismaPg(poolDev);
const prismaDev = new PrismaClient({ adapter: adapterDev });

const UNPOOLED_DB_URL = 'postgresql://neondb_owner:npg_Bok87uEFzrxO@ep-broad-darkness-a1hfk92l.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

// ... (previous instantiations)

// 3. Instantiate Unpooled Client (Potential Third Source)
const poolUnpooled = new Pool({ connectionString: UNPOOLED_DB_URL });
const adapterUnpooled = new PrismaPg(poolUnpooled);
const prismaUnpooled = new PrismaClient({ adapter: adapterUnpooled });

async function main() {
  console.log('Starting sync from PROD to DEV...');

  try {
    // Check Dev counts
    const devUserCount = await prismaDev.user.count();
    const devRoleCount = await prismaDev.role.count();
    const devBranchCount = await prismaDev.branch.count();
    console.log(`DEV DB Counts (Target?): Users=${devUserCount}, Roles=${devRoleCount}, Branches=${devBranchCount}`);

    // Check Prod counts
    const prodUserCount = await prismaProd.user.count();
    const prodRoleCount = await prismaProd.role.count();
    const prodBranchCount = await prismaProd.branch.count();
    console.log(`PROD DB Counts (Source?): Users=${prodUserCount}, Roles=${prodRoleCount}, Branches=${prodBranchCount}`);

    // Check Unpooled counts
    try {
        const unpooledUserCount = await prismaUnpooled.user.count();
        const unpooledRoleCount = await prismaUnpooled.role.count();
        const unpooledBranchCount = await prismaUnpooled.branch.count();
        console.log(`UNPOOLED DB Counts: Users=${unpooledUserCount}, Roles=${unpooledRoleCount}, Branches=${unpooledBranchCount}`);
    } catch (e) {
        console.log('Could not connect to Unpooled DB or it is empty/invalid.');
    }

    // 1. Sync Roles (Dependencies for User)
    console.log('Fetching Roles from Prod...');
    const roles = await prismaProd.role.findMany();
    console.log(`Found ${roles.length} roles in Prod.`);

    for (const role of roles) {
      await prismaDev.role.upsert({
        where: { id: role.id },
        update: {
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            updatedAt: new Date(), // Update timestamp
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
    console.log('Roles synced.');

    // 2. Sync Branches (Dependencies for User)
    console.log('Fetching Branches from Prod...');
    const branches = await prismaProd.branch.findMany();
    console.log(`Found ${branches.length} branches in Prod.`);

    for (const branch of branches) {
      await prismaDev.branch.upsert({
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
    console.log('Branches synced.');

    // 3. Sync Users
    console.log('Fetching Users from Prod...');
    const users = await prismaProd.user.findMany();
    console.log(`Found ${users.length} users in Prod.`);

    for (const user of users) {
      // Check if role exists in Dev (should exist now)
      // Check if branch exists in Dev (should exist now if not null)

      console.log(`Syncing user: ${user.email}`);
      
      await prismaDev.user.upsert({
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
    console.log('Users synced successfully.');

  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    await prismaProd.$disconnect();
    await prismaDev.$disconnect();
  }
}

main();
