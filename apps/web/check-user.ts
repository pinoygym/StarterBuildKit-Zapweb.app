
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'cybergada@gmail.com' },
        include: { Role: true }
    });

    if (user) {
        console.log('User found:', user.email);
        console.log('Role:', user.Role?.name);
        console.log('Password Hash:', user.passwordHash.substring(0, 10) + '...');
    } else {
        console.log('User NOT found');
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
