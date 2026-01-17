import { prisma } from './lib/prisma';
import { receivingVoucherService } from './services/receiving-voucher.service';

async function testReceivingVoucherSave() {
    try {
        console.log('🔍 Testing Receiving Voucher Save Functionality...\n');

        // 1. Find an existing PO with 'ordered' status
        const po = await prisma.purchaseOrder.findFirst({
            where: { status: 'ordered' },
            include: {
                PurchaseOrderItem: {
                    include: { Product: true }
                },
                Supplier: true,
            },
        });

        if (!po) {
            console.log('❌ No purchase orders with "ordered" status found.');
            console.log('   Create a PO first to test receiving vouchers.');
            return;
        }

        console.log(`✅ Found PO: ${po.poNumber}`);
        console.log(`   Supplier: ${po.Supplier.companyName}`);
        console.log(`   Items: ${po.PurchaseOrderItem.length}`);
        console.log(`   Status: ${po.status}\n`);

        // 2. Prepare receiving voucher data
        const rvData = {
            purchaseOrderId: po.id,
            receiverName: 'Test Receiver',
            deliveryNotes: 'Test receiving voucher',
            items: po.PurchaseOrderItem.map(item => ({
                productId: item.productId,
                poItemId: item.id,
                uom: item.uom,
                orderedQuantity: Number(item.quantity),
                receivedQuantity: Number(item.quantity), // Receive full quantity
                unitPrice: Number(item.unitPrice),
            })),
        };

        console.log('📦 Receiving Voucher Data:');
        console.log(JSON.stringify(rvData, null, 2));
        console.log('');

        // 3. Attempt to create receiving voucher
        console.log('💾 Creating receiving voucher...');
        const rv = await receivingVoucherService.createReceivingVoucher(rvData);

        console.log(`\n✅ SUCCESS! Receiving Voucher Created:`);
        console.log(`   RV Number: ${rv.rvNumber}`);
        console.log(`   Status: ${rv.status}`);
        console.log(`   Total Ordered: ₱${rv.totalOrderedAmount.toFixed(2)}`);
        console.log(`   Total Received: ₱${rv.totalReceivedAmount.toFixed(2)}`);
        console.log(`   Variance: ₱${rv.varianceAmount.toFixed(2)}`);
        console.log(`   Items: ${rv.ReceivingVoucherItem.length}`);

    } catch (error) {
        console.error('\n❌ ERROR creating receiving voucher:');
        console.error(error);

        if (error instanceof Error) {
            console.error('\nError details:');
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testReceivingVoucherSave();
