import { prisma } from './lib/prisma';

async function checkReceivingVoucherFunctionality() {
    try {
        console.log('🔍 Checking Receiving Voucher & Inventory Functionality\n');
        console.log('='.repeat(60));

        // 1. Check if there are any recent receiving vouchers
        console.log('\n📦 Recent Receiving Vouchers:');
        const recentRVs = await prisma.receivingVoucher.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                PurchaseOrder: {
                    select: { poNumber: true, status: true, receivingStatus: true }
                },
                Warehouse: {
                    select: { name: true }
                },
                ReceivingVoucherItem: {
                    include: {
                        Product: {
                            select: { name: true, baseUOM: true }
                        }
                    }
                }
            }
        });

        if (recentRVs.length === 0) {
            console.log('   ⚠️  No receiving vouchers found yet');
        } else {
            for (const rv of recentRVs) {
                console.log(`\n   RV: ${rv.rvNumber}`);
                console.log(`   Date: ${rv.createdAt.toLocaleString()}`);
                console.log(`   PO: ${rv.PurchaseOrder.poNumber} (${rv.PurchaseOrder.receivingStatus})`);
                console.log(`   Warehouse: ${rv.Warehouse.name}`);
                console.log(`   Items: ${rv.ReceivingVoucherItem.length}`);
                console.log(`   Total: ₱${Number(rv.totalReceivedAmount).toFixed(2)}`);
            }
        }

        // 2. Check stock movements from RVs
        console.log('\n\n📊 Stock Movements from Receiving Vouchers:');
        const rvMovements = await prisma.stockMovement.findMany({
            where: { referenceType: 'RV' },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                Product: { select: { name: true } },
                Warehouse: { select: { name: true } }
            }
        });

        if (rvMovements.length === 0) {
            console.log('   ⚠️  No stock movements from RVs found');
        } else {
            for (const movement of rvMovements) {
                console.log(`\n   Product: ${movement.Product.name}`);
                console.log(`   Warehouse: ${movement.Warehouse.name}`);
                console.log(`   Type: ${movement.type} | Qty: ${movement.quantity}`);
                console.log(`   Date: ${movement.createdAt.toLocaleString()}`);
                console.log(`   Reason: ${movement.reason}`);
            }
        }

        // 3. Check for POs ready to receive
        console.log('\n\n📋 Purchase Orders Ready to Receive:');
        const orderedPOs = await prisma.purchaseOrder.findMany({
            where: { status: 'ordered' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                Supplier: { select: { companyName: true } },
                Warehouse: { select: { name: true } },
                PurchaseOrderItem: {
                    include: {
                        Product: { select: { name: true, baseUOM: true } }
                    }
                }
            }
        });

        if (orderedPOs.length === 0) {
            console.log('   ℹ️  No POs with "ordered" status found');
            console.log('   Create a PO and mark it as "ordered" to test receiving');
        } else {
            for (const po of orderedPOs) {
                console.log(`\n   PO: ${po.poNumber}`);
                console.log(`   Supplier: ${po.Supplier.companyName}`);
                console.log(`   Warehouse: ${po.Warehouse.name}`);
                console.log(`   Expected: ${po.expectedDeliveryDate.toLocaleDateString()}`);
                console.log(`   Items: ${po.PurchaseOrderItem.length}`);
                console.log(`   Total: ₱${Number(po.totalAmount).toFixed(2)}`);

                // Show a sample item
                if (po.PurchaseOrderItem.length > 0) {
                    const item = po.PurchaseOrderItem[0];
                    console.log(`   Sample: ${item.Product.name} - ${item.quantity} ${item.uom}`);
                }
            }
        }

        // 4. Summary and recommendations
        console.log('\n\n' + '='.repeat(60));
        console.log('📝 Summary:');
        console.log(`   Total RVs: ${recentRVs.length}`);
        console.log(`   Total Stock Movements: ${rvMovements.length}`);
        console.log(`   POs ready to receive: ${orderedPOs.length}`);

        console.log('\n✅ Next Steps:');
        if (orderedPOs.length > 0) {
            console.log('   1. Open your app at http://localhost:3000');
            console.log('   2. Go to Purchase Orders');
            console.log(`   3. Find PO: ${orderedPOs[0].poNumber}`);
            console.log('   4. Create a receiving voucher for it');
            console.log('   5. Check if inventory is updated');
        } else {
            console.log('   1. Create a new Purchase Order');
            console.log('   2. Mark it as "ordered"');
            console.log('   3. Then create a receiving voucher');
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkReceivingVoucherFunctionality();
