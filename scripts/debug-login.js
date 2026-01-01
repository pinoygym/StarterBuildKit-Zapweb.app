
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'cybergada@gmail.com';
    const password = 'Qweasd145698@';

    console.log(`Checking user: ${email}`);

    try {
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

            // Generate a new hash to be sure
            const newHash = await bcrypt.hash(password, 12);
            console.log(`Generated new hash for '${password}': ${newHash.substring(0, 10)}...`);

            console.log('Attempting to fix password...');
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash }
            });
            console.log('✅ Password has been forcibly reset to the correct value.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
