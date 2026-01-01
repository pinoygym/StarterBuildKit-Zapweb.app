import { prisma } from './lib/prisma';
import { receivingVoucherService } from './services/receiving-voucher.service';

async function testReceivingVoucherAndInventory() {
    try {
        console.log('🔍 Testing Receiving Voucher Save & Inventory Update...\n');

        // 1. Find an existing PO with 'ordered' status
        const po = await prisma.purchaseOrder.findFirst({
            where: { status: 'ordered' },
            include: {
                PurchaseOrderItem: {
                    include: { Product: true }
                },
                Supplier: true,
                Warehouse: true,
            },
        });

        if (!po) {
            console.log('❌ No purchase orders with "ordered" status found.');
            console.log('   Create a PO first to test receiving vouchers.\n');
            return;
        }

        console.log(`✅ Found PO: ${po.poNumber}`);
        console.log(`   Supplier: ${po.Supplier.companyName}`);
        console.log(`   Warehouse: ${po.Warehouse.name}`);
        console.log(`   Items: ${po.PurchaseOrderItem.length}\n`);

        // 2. Check inventory BEFORE receiving
        console.log('📊 Inventory BEFORE Receiving:');
        const inventoryBefore: { [key: string]: number } = {};

        for (const item of po.PurchaseOrderItem) {
            const inventory = await prisma.inventory.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: item.productId,
                        warehouseId: po.warehouseId,
                    },
                },
            });

            const currentQty = inventory ? Number(inventory.quantity) : 0;
            inventoryBefore[item.productId] = currentQty;

            console.log(`   ${item.Product.name}: ${currentQty} ${item.Product.baseUOM}`);
        }

        // 3. Prepare and create receiving voucher
        const receivedQty = 10; // Receive 10 units of each item
        const rvData = {
            purchaseOrderId: po.id,
            receiverName: 'Test Receiver',
            deliveryNotes: 'Test receiving - checking save and inventory update',
            items: po.PurchaseOrderItem.map(item => ({
                productId: item.productId,
                uom: item.uom,
                orderedQuantity: Number(item.quantity),
                receivedQuantity: receivedQty,
                unitPrice: Number(item.unitPrice),
            })),
        };

        console.log(`\n💾 Creating receiving voucher (receiving ${receivedQty} units each)...`);
        const rv = await receivingVoucherService.createReceivingVoucher(rvData);

        console.log(`\n✅ Receiving Voucher Created: ${rv.rvNumber}`);
        console.log(`   Status: ${rv.status}`);
        console.log(`   Total Received: ₱${rv.totalReceivedAmount.toFixed(2)}`);

        // 4. Check inventory AFTER receiving
        console.log('\n📊 Inventory AFTER Receiving:');
        let allInventoryUpdated = true;

        for (const item of po.PurchaseOrderItem) {
            const inventory = await prisma.inventory.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: item.productId,
                        warehouseId: po.warehouseId,
                    },
                },
            });

            const newQty = inventory ? Number(inventory.quantity) : 0;
            const previousQty = inventoryBefore[item.productId];
            const expected = previousQty + receivedQty;
            const difference = newQty - previousQty;

            const status = newQty === expected ? '✅' : '❌';
            console.log(`   ${status} ${item.Product.name}:`);
            console.log(`      Before: ${previousQty} ${item.Product.baseUOM}`);
            console.log(`      After:  ${newQty} ${item.Product.baseUOM}`);
            console.log(`      Change: +${difference} ${item.Product.baseUOM}`);
            console.log(`      Expected: ${expected} (${newQty === expected ? 'CORRECT' : 'INCORRECT'})`);

            if (newQty !== expected) {
                allInventoryUpdated = false;
            }
        }

        // 5. Check stock movements
        console.log('\n📝 Stock Movements Created:');
        const movements = await prisma.stockMovement.findMany({
            where: {
                referenceId: rv.id,
                referenceType: 'RV',
            },
            include: {
                Product: { select: { name: true } },
            },
        });

        if (movements.length > 0) {
            for (const movement of movements) {
                console.log(`   ✅ ${movement.Product.name}: +${movement.quantity} (${movement.type})`);
                console.log(`      Reason: ${movement.reason}`);
            }
        } else {
            console.log('   ❌ No stock movements found!');
            allInventoryUpdated = false;
        }

        // 6. Final verdict
        console.log('\n' + '='.repeat(60));
        if (allInventoryUpdated && movements.length > 0) {
            console.log('✅ SUCCESS: Both RV save and inventory update working correctly!');
        } else {
            console.log('❌ FAILED: Issues detected with RV save or inventory update');
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error(error);

        if (error instanceof Error) {
            console.error('\nDetails:');
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

testReceivingVoucherAndInventory();
