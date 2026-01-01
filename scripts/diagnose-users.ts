import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('--- User Diagnosis ---');

    const emails = ['cybergada@gmail.com', 'pinoygym@gmail.com'];

    for (const email of emails) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { Role: true }
        });

        console.log(`\nUser: ${email}`);
        if (user) {
            console.log(`- ID: ${user.id}`);
            console.log(`- isSuperMegaAdmin: ${user.isSuperMegaAdmin}`);
            console.log(`- Role: ${user.Role.name}`);
        } else {
            console.log('- Not found');
        }
    }
}

main().finally(() => prisma.$disconnect());
