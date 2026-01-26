import { prisma } from './lib/prisma';

async function run() {
    try {
        console.log('Checking notifications model...');
        console.log('prisma.notification:', prisma.notification);
        const count = await prisma.notification.count();
        console.log('Success:', count, 'notifications found');
    } catch (error) {
        console.error('FAILED to access notifications:');
        console.error(error);
    }
}

run();
