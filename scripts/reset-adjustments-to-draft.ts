import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function resetAdjustmentsToDraft() {
    try {
        console.log('Starting to reset all adjustments to DRAFT status...');

        // Get count of adjustments before update
        const totalAdjustments = await prisma.inventoryAdjustment.count();
        console.log(`Total adjustments found: ${totalAdjustments}`);

        // Get count of non-draft adjustments
        const nonDraftCount = await prisma.inventoryAdjustment.count({
            where: {
                status: {
                    not: 'DRAFT'
                }
            }
        });
        console.log(`Non-DRAFT adjustments: ${nonDraftCount}`);

        // Update all adjustments to DRAFT status
        const result = await prisma.inventoryAdjustment.updateMany({
            data: {
                status: 'DRAFT',
                postedById: null // Clear posted by user since it's draft now
            }
        });

        console.log(`✅ Successfully updated ${result.count} adjustments to DRAFT status`);

        // Verify the update
        const draftCount = await prisma.inventoryAdjustment.count({
            where: {
                status: 'DRAFT'
            }
        });
        console.log(`Total DRAFT adjustments after update: ${draftCount}`);

    } catch (error) {
        console.error('❌ Error resetting adjustments:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
resetAdjustmentsToDraft()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
