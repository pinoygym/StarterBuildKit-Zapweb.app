import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-wandering-breeze-a1di0pei-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkData() {
  try {
    console.log('Checking for potentially lost data...');
    
    // Check InventoryBatch
    try {
        const batchCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "InventoryBatch"`;
        console.log(`InventoryBatch count: ${batchCount[0].count}`);
    } catch (e) {
        console.log('InventoryBatch table does not exist or is not accessible.');
    }

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
