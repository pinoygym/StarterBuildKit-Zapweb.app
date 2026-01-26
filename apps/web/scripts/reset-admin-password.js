const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'cybergada@gmail.com';
    const newPassword = 'Qweasd145698@';

    console.log(`Resetting password for ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found');
        console.log(`   Current Hash: ${user.passwordHash.substring(0, 15)}...`);

        const newHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: newHash,
                status: 'ACTIVE',
                emailVerified: true,
                isSuperMegaAdmin: true
            }
        });

        console.log('✅ Password updated successfully!');
        console.log(`   New Hash: ${newHash.substring(0, 15)}...`);
        console.log(`   Password: ${newPassword}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
