
import { userService } from '@/services/user.service';
import { prisma } from '@/lib/prisma';
import { alertService } from '@/services/alert.service'; // Assuming export

async function main() {
    try {
        console.log('Fetching a user to test userService...');
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No user found in DB to test.');
            return;
        }
        console.log('Testing userService.getUserById for user:', user.email);
        const fetchedUser = await userService.getUserById(user.id);
        console.log('User fetched successfully:', fetchedUser ? 'YES' : 'NO');
        if (fetchedUser) {
            console.log('isSuperMegaAdmin:', (fetchedUser as any).isSuperMegaAdmin);
        }

        console.log('Testing alertService.checkLowStock()...');
        // Check if alertService exists and has the method
        if (alertService && typeof alertService.checkLowStock === 'function') {
            await alertService.checkLowStock();
            console.log('alertService.checkLowStock() completed successfully.');
        } else {
            console.log('alertService.checkLowStock not available or not a function.');
        }

    } catch (error) {
        console.error('Error during debug-user-service:');
        console.error(error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
