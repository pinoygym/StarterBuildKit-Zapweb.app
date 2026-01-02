import { prisma } from '../lib/prisma';

async function main() {
    try {
        console.log('Updating company name to Super Shop...');
        await prisma.companySettings.updateMany({
            data: {
                companyName: 'Super Shop',
            },
        });
        console.log('Update successful.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
