
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Attempt to include CreatedBy to see if it's valid
        const po = await prisma.purchaseOrder.findFirst({
            take: 1
        });
        console.log('PO Found:', po ? po.id : 'None');

        // This block triggers the type error if CreatedBy is invalid
        const poWithUser = await prisma.purchaseOrder.findFirst({
            take: 1,
            include: {
                CreatedBy: true
            }
        });

        console.log('PO With User:', poWithUser ? 'Found' : 'None');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
