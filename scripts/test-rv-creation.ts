
import { PrismaClient } from '@prisma/client';
import { receivingVoucherService } from '../services/receiving-voucher.service';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Finding an ordered Purchase Order...');
        const po = await prisma.purchaseOrder.findFirst({
            where: { status: 'ordered' },
            include: { PurchaseOrderItem: true }
        });

        if (!po) {
            console.log('No ordered PO found. Creating one...');
            // Create a dummy PO if none exists
            // For now, just exit if no PO found, or I'd have to create all dependencies
            console.log('Please ensure there is an ordered PO in the database.');
            return;
        }

        console.log(`Found PO: ${po.id} (${po.poNumber})`);

        const input = {
            purchaseOrderId: po.id,
            receiverName: 'Test Receiver',
            deliveryNotes: 'Test Notes',
            items: po.PurchaseOrderItem.map(item => ({
                productId: item.productId,
                orderedQuantity: Number(item.quantity),
                receivedQuantity: Number(item.quantity), // Receive full amount
                unitPrice: Number(item.unitPrice),
                varianceReason: undefined
            }))
        };

        console.log('Attempting to create Receiving Voucher...');
        const rv = await receivingVoucherService.createReceivingVoucher(input);
        console.log('Success! RV Created:', rv.id);

    } catch (error) {
        console.error('Error creating RV:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
