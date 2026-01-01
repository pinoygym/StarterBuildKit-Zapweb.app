import { prisma } from './lib/prisma';

async function verifyAdjustment() {
    try {
        console.log('Searching for adjustments...\n');

        // First, let's see what adjustments exist
        const allAdjustments = await prisma.inventoryAdjustment.findMany({
            select: {
                id: true,
                adjustmentNumber: true,
                referenceNumber: true,
                status: true,
                adjustmentDate: true
            },
            orderBy: {
                adjustmentDate: 'desc'
            },
            take: 20
        });

        console.log(`Found ${allAdjustments.length} adjustments:`);
        allAdjustments.forEach((adj, i) => {
            console.log(`${i + 1}. ${adj.adjustmentNumber} | Ref: ${adj.referenceNumber || 'N/A'} | Status: ${adj.status} | Date: ${adj.adjustmentDate.toISOString().split('T')[0]}`);
        });

        // Now try to find the specific one
        const adjustment = await prisma.inventoryAdjustment.findFirst({
            where: {
                OR: [
                    { referenceNumber: 'ADJ-20251224-0001' },
                    { adjustmentNumber: 'ADJ-20251224-0001' }
                ]
            },
            include: {
                items: {
                    include: {
                        Product: true,
                        InventoryAdjustment: false
                    },
                    orderBy: {
                        id: 'asc'
                    }
                },
                Warehouse: true,
                Branch: true,
                CreatedBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (!adjustment) {
            console.log('❌ Adjustment not found!');
            return;
        }

        console.log('📋 ADJUSTMENT DETAILS');
        console.log('='.repeat(80));
        console.log(`Reference: ${adjustment.referenceNumber}`);
        console.log(`Date: ${adjustment.adjustmentDate.toISOString().split('T')[0]}`);
        console.log(`Status: ${adjustment.status}`);
        console.log(`Branch: ${adjustment.Branch?.name || 'N/A'}`);
        console.log(`Warehouse: ${adjustment.Warehouse?.name || 'N/A'}`);
        console.log(`Created by: ${adjustment.CreatedBy ? `${adjustment.CreatedBy.firstName} ${adjustment.CreatedBy.lastName}` : 'N/A'}`);
        console.log(`Reason: ${adjustment.reason || 'N/A'}`);
        console.log(`Total Items: ${adjustment.items.length}`);
        console.log('='.repeat(80));
        console.log('\n📦 ADJUSTMENT ITEMS');
        console.log('='.repeat(80));

        adjustment.items.forEach((item, index) => {
            console.log(`\n${index + 1}. ${item.Product.name}`);
            console.log(`   System Quantity: ${item.systemQuantity || 'N/A'} ${item.Product.baseUOM}`);
            console.log(`   Actual Quantity: ${item.actualQuantity || 'N/A'} ${item.uom}`);
            console.log(`   UOM: ${item.uom}`);
            console.log(`   Type: ${item.type}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Query completed successfully!');
        console.log(`\nFound ${adjustment.items.length} items in adjustment ${adjustment.referenceNumber}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAdjustment();
