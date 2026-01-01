
import { describe, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

describe('Diagnostic: Inspect Specific Draft', () => {
    it('should list items of a specific draft', async () => {
        const draft = await prisma.inventoryAdjustment.findFirst({
            where: { status: 'DRAFT' },
            include: {
                items: {
                    include: {
                        Product: {
                            include: { productUOMs: true }
                        }
                    }
                }
            }
        });

        fs.writeFileSync('draft-inspection.json', JSON.stringify(draft, null, 2));
    });
});
