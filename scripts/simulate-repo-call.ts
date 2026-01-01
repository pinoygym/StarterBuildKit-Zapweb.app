import 'dotenv/config';
import { userRepository } from '@/repositories/user.repository';
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('--- Simulating Repository Call ---');

    const filters = {
        includeSuperMegaAdmin: false,
        excludeEmail: 'cybergada@gmail.com', // Expected logic
        // other filters empty
    };

    console.log('Filters:', JSON.stringify(filters, null, 2));

    const result = await userRepository.findAll(filters);

    console.log(`Total users found: ${result.total}`);

    const found = result.data.find(u => u.email === 'cybergada@gmail.com');
    console.log(`cybergada@gmail.com found? ${!!found}`);

    if (found) {
        console.log('User Details:', JSON.stringify(found, null, 2));
    }
}

main().finally(() => prisma.$disconnect());
