import 'dotenv/config';
import { userRepository } from '@/repositories/user.repository';
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('--- Verifying User Filter ---');

    // Ensure cybergada@gmail.com exists
    const adminEmail = 'cybergada@gmail.com';
    let admin = await userRepository.findByEmail(adminEmail);

    if (!admin) {
        console.warn(`User ${adminEmail} not found. Creating temporary one for test.`);
        const role = await prisma.role.findFirst();
        if (!role) {
            console.error('No roles found in database. Cannot create test user.');
            throw new Error('No roles found');
        }

        admin = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: 'temp',
                firstName: 'Admin',
                lastName: 'User',
                roleId: role.id,
                status: 'ACTIVE',
            } as any
        }) as any;
        console.log(`Created test user with ID: ${admin?.id}`);
    } else {
        console.log(`User ${adminEmail} exists.`);
    }

    const allUsers = await userRepository.findAll({ includeSuperMegaAdmin: true });
    const adminInAll = allUsers.data.find(u => u.email === adminEmail);
    console.log(`Admin present in all users: ${!!adminInAll}`);

    // Test 2: Fetch with exclude filter
    console.log('\nTest 2: Fetching users with excludeEmail filter');
    const filteredUsers = await userRepository.findAll({ excludeEmail: adminEmail });
    const adminInFiltered = filteredUsers.data.find(u => u.email === adminEmail);
    console.log(`Admin present in filtered users: ${!!adminInFiltered}`);

    if (adminInAll && !adminInFiltered) {
        console.log('\nSUCCESS: Admin user correctly filtered out.');
    } else {
        console.error('\nFAILURE: Filtering did not work as expected.');
        if (!adminInAll) console.error('Reason: Admin user was not found even in unfiltered list.');
        if (adminInFiltered) console.error('Reason: Admin user was found in filtered list.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
