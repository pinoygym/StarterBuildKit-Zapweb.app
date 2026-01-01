import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
    const email = 'cybergada@gmail.com';
    const password = 'Qweasd145698@';

    console.log(`Testing login for ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found');
        console.log(`   ID: ${user.id}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Is Super Mega Admin: ${user.isSuperMegaAdmin}`);
        console.log(`   Password Hash: ${user.passwordHash.substring(0, 10)}...`);

        if (user.status !== 'ACTIVE') {
            console.log('❌ User is not ACTIVE');
        }

        if (!user.emailVerified) {
            console.log('❌ Email is not verified');
        }

        console.log('Verifying password...');
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (isValid) {
            console.log('✅ Password is VALID');
        } else {
            console.log('❌ Password is INVALID');

            // Try to re-hash and see if it matches (it won't because of salt, but just to test hashing)
            const newHash = await bcrypt.hash(password, 12);
            console.log(`   New hash would be: ${newHash.substring(0, 10)}...`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
