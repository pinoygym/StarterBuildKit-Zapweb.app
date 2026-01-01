import 'dotenv/config';
import { userRepository } from '@/repositories/user.repository';
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('--- Debugging User Visibility ---');

    const targetEmail = 'cybergada@gmail.com'; // User to hide
    const viewerEmail = 'pinoygym@gmail.com'; // User looking at the list

    // 1. Check DB state of target user
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    console.log(`\nTarget User (${targetEmail}):`);
    if (targetUser) {
        console.log(`- ID: ${targetUser.id}`);
        console.log(`- isSuperMegaAdmin: ${targetUser.isSuperMegaAdmin}`);
        console.log(`- RoleId: ${targetUser.roleId}`);
    } else {
        console.log('- Not found in DB');
    }

    // 2. Check DB state of viewer user
    const viewerUser = await prisma.user.findUnique({ where: { email: viewerEmail } });
    console.log(`\nViewer User (${viewerEmail}):`);
    if (viewerUser) {
        console.log(`- ID: ${viewerUser.id}`);
        console.log(`- isSuperMegaAdmin: ${viewerUser.isSuperMegaAdmin}`);
    } else {
        console.log('- Not found in DB');
    }

    if (!targetUser || !viewerUser) {
        console.warn('One or both users not found. Synthesizing test context...');
        // If users don't exist, we can't fully reproduce, but we can test the repository logic.
        // We'll rely on my previous verification script logic if they don't exist.
    }

    // 3. Simulate Logic from API route
    // currentUser = viewerUser
    const isSuperMegaAdmin = viewerUser?.isSuperMegaAdmin || false;
    const filterParams = {
        includeSuperMegaAdmin: isSuperMegaAdmin,
        excludeEmail: viewerUser?.email !== targetEmail ? targetEmail : undefined
    };

    console.log('\nSimulated Filter Params:', filterParams);

    // 4. Run Repository FindAll
    const result = await userRepository.findAll(filterParams);

    // 5. Check results
    const foundTarget = result.data.find(u => u.email === targetEmail);

    console.log(`\nRepository Result:`);
    console.log(`- Total found: ${result.total}`);
    console.log(`- Target user found in list? ${!!foundTarget}`);

    if (foundTarget) {
        console.log('ISSUE REPRODUCED: Target user is visible despite filter.');
    } else {
        console.log('Local reproduction successful (Target user HIDDEN). Issue might be in API/Auth layer.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
