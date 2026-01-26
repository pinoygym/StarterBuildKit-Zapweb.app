import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = 'cybergada@gmail.com';
    const password = 'Qweasd145698@';

    console.log(`\n--- DATABASE AUTH DIAGNOSTICS for ${email} ---\n`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { Role: true }
    });

    if (!user) {
        console.error('❌ CRITICAL: User not found in database!');
        return;
    }

    console.log('1. User Fields:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Status: ${user.status} (Expected: ACTIVE)`);
    console.log(`   - Email Verified: ${user.emailVerified} (Expected: true)`);
    console.log(`   - Role: ${user.Role?.name} (Expected: Super Admin)`);
    console.log(`   - isSuperMegaAdmin: ${user.isSuperMegaAdmin}`);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`\n2. Password Verification:`);
    console.log(`   - Provided Password: ${password}`);
    console.log(`   - Hash Match: ${isMatch}`);

    if (!isMatch) {
        console.log(`\n3. Fixing Password Hash...`);
        const newHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { email },
            data: { passwordHash: newHash }
        });
        console.log(`   ✅ Password hash updated to match "${password}"`);

        // Verify again
        const updatedUser = await prisma.user.findUnique({ where: { email } });
        const isNowMatch = await bcrypt.compare(password, updatedUser!.passwordHash);
        console.log(`   - Second Verification Match: ${isNowMatch}`);
    }

    // Ensure status and verification are correct
    if (user.status !== 'ACTIVE' || !user.emailVerified) {
        console.log(`\n4. Fixing Status/Verification...`);
        await prisma.user.update({
            where: { email },
            data: { status: 'ACTIVE', emailVerified: true }
        });
        console.log(`   ✅ status set to ACTIVE and emailVerified set to true`);
    }

    console.log('\n--- DIAGNOSTICS COMPLETE ---\n');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
