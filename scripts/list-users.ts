
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Listing users:');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            Role: {
                select: {
                    name: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main();
