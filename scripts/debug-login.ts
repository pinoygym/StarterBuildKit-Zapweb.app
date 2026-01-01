
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'cybergada@gmail.com';
    const password = 'Qweasd145698@';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ User not found in database!');
        return;
    }

    console.log('✅ User found.');
    console.log(`Stored Hash: ${user.passwordHash.substring(0, 10)}...`);
    console.log(`Status: ${user.status}`);
    console.log(`Email Verified: ${user.emailVerified}`);

    console.log('Verifying password...');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (isValid) {
        console.log('✅ Password Match! The credentials are correct.');
    } else {
        console.error('❌ Password Mismatch! The stored hash does NOT match the provided password.');

        // Test with a new hash to see if we can generate one that works
        const newHash = await bcrypt.hash(password, 12);
        console.log(`Generated new hash for '${password}': ${newHash.substring(0, 10)}...`);
        console.log('Suggest running a forced password reset if this persists.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
