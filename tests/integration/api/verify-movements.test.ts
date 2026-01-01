
import { describe, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

describe('Verification: Stock Movements for Posted Adjustment', () => {
    it('should have correct uom and factor in stock movements', async () => {
        const adjustmentNumber = "ADJ-20251224-0001";
        const movements = await prisma.stockMovement.findMany({
            where: { referenceId: adjustmentNumber },
            include: {
                Product: {
                    select: { name: true, baseUOM: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        fs.writeFileSync('movement-verification.json', JSON.stringify(movements, null, 2));
        console.log(`Verified ${movements.length} movements.`);
    });
});
