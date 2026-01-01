import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing schema drift...');

    try {
        console.log('Adding isSuperMegaAdmin column...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuperMegaAdmin" BOOLEAN NOT NULL DEFAULT false;
    `);
        console.log('Added isSuperMegaAdmin');
    } catch (e: any) {
        console.log('Error adding isSuperMegaAdmin:', e.message);
    }

    try {
        console.log('Adding branchLockEnabled column...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchLockEnabled" BOOLEAN NOT NULL DEFAULT false;
    `);
        console.log('Added branchLockEnabled');
    } catch (e: any) {
        console.log('Error adding branchLockEnabled:', e.message);
    }

    console.log('Schema fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
