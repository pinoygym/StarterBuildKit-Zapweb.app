import { prisma } from '../lib/prisma';

async function getUserId() {
    const user = await prisma.user.findFirst();
    console.log(user?.id);
}

getUserId().finally(() => prisma.$disconnect());
