
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Force Password Reset...');

    const email = 'cybergada@gmail.com';
    const newPassword = 'Qweasd145698@';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('❌ User not found!');
        process.exit(1);
    }

    console.log(`User found: ${user.id}`);

    // Hash with 12 rounds
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            status: 'ACTIVE',
            emailVerified: true
        }
    });

    console.log('✅ Password successfully reset.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
