import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const inventoryAdjustmentService = new InventoryAdjustmentService();

async function main() {
    const id = 'f368a2cf-a423-4dc3-9c97-f732bfc653f0';

    try {
        console.log('Finding user...');
        const user = await prisma.user.findFirst({
            where: { role: { name: 'ADMIN' } }
        });

        if (!user) {
            console.error('No admin user found');
            return;
        }

        console.log('Using User:', user.email);

        console.log('Attempting reversal...');
        const result = await inventoryAdjustmentService.reverse(id, user.id);
        console.log('Reversal Success:', result.adjustmentNumber);
    } catch (error: any) {
        console.error('Reversal Failed:');
        console.error('Message:', error.message);
        if (error.statusCode) console.error('Status Code:', error.statusCode);
        if (error.details) {
            console.error('Details:', JSON.stringify(error.details, null, 2));
        }
        if (error.stack) console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();
