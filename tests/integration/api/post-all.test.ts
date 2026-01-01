
import { describe, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import fs from 'fs';

describe('Execution: Post All Draft Adjustments', () => {
    it('should post all draft adjustments', async () => {
        // 1. Find all draft adjustments
        const drafts = await prisma.inventoryAdjustment.findMany({
            where: { status: 'DRAFT' },
            select: { id: true, adjustmentNumber: true, createdById: true }
        });

        console.log(`Found ${drafts.length} draft adjustments to post.`);
        const results = [];

        // 2. Post each one
        for (const draft of drafts) {
            try {
                console.log(`Posting ${draft.adjustmentNumber}...`);
                const result = await inventoryAdjustmentService.post(draft.id, draft.createdById);
                results.push({
                    id: draft.id,
                    adjustmentNumber: draft.adjustmentNumber,
                    status: 'POSTED',
                    itemCount: result.items.length
                });
                console.log(`Successfully posted ${draft.adjustmentNumber}.`);
            } catch (error: any) {
                console.error(`Failed to post ${draft.adjustmentNumber}:`, error.message);
                results.push({
                    id: draft.id,
                    adjustmentNumber: draft.adjustmentNumber,
                    status: 'FAILED',
                    error: error.message
                });
            }
        }

        // 3. Verify movements for at least one adjustment
        const verification: any = {};
        if (results.some(r => r.status === 'POSTED')) {
            const postedId = results.find(r => r.status === 'POSTED')?.id;
            if (postedId) {
                const movements = await prisma.stockMovement.findMany({
                    where: { referenceId: postedId }
                });
                verification.movements = movements;
            }
        }

        fs.writeFileSync('posting-results.json', JSON.stringify({ results, verification }, null, 2));
        console.log('Posting results written to posting-results.json');
    }, 60000); // Higher timeout for batch posting
});
