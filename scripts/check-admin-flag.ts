import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'cybergada@gmail.com' }
    });
    console.log('User email:', user?.email);
    console.log('isSuperMegaAdmin:', user?.isSuperMegaAdmin);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
