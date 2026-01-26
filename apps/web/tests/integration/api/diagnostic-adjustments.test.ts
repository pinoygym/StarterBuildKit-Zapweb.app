
import { describe, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

describe('Diagnostic: List Adjustments', () => {
    it('should list draft and recently posted adjustments', async () => {
        const drafts = await prisma.inventoryAdjustment.findMany({
            where: { status: 'DRAFT' },
            select: { id: true, adjustmentNumber: true, reason: true }
        });

        const recentlyPosted = await prisma.inventoryAdjustment.findMany({
            where: { status: 'POSTED' },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: {
                items: {
                    include: {
                        Product: {
                            select: { name: true, baseUOM: true, productUOMs: true }
                        }
                    }
                }
            }
        });

        const results: any = {
            drafts,
            recentlyPosted,
            movements: []
        };

        // Also check StockMovements for the first recently posted adjustment
        if (recentlyPosted.length > 0) {
            const first = recentlyPosted[0];
            const movements = await prisma.stockMovement.findMany({
                where: { referenceId: first.id },
                include: { Product: { select: { name: true, baseUOM: true } } }
            });
            results.movements = movements;
        }

        fs.writeFileSync('diagnostic-results.json', JSON.stringify(results, null, 2));
        console.log('Diagnostic results written to diagnostic-results.json');
    });
});
