
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { inventoryService } from '@/services/inventory.service';
import { posService } from '@/services/pos.service';
import { randomUUID } from 'crypto';

describe('End-to-End UOM Traceability Test', () => {
    let testProductId: string;
    let testWarehouseId: string;
    let testBranchId: string;

    beforeAll(async () => {
        // Setup test data
        const product = await prisma.product.findFirst({
            where: { productUOMs: { some: {} } }, // Find a product with at least one alternate UOM
            include: { productUOMs: true }
        });

        if (!product) throw new Error('No product with alternate UOMs found for testing');
        testProductId = product.id;

        const warehouse = await prisma.warehouse.findFirst({
            include: { Branch: true }
        });
        if (!warehouse) throw new Error('No warehouse found for testing');
        testWarehouseId = warehouse.id;
        testBranchId = warehouse.branchId;
    });

    it('should track UOM correctly for both Adjustments and POS Sales', async () => {
        const product = await prisma.product.findUnique({
            where: { id: testProductId },
            include: { productUOMs: true }
        });
        const altUOM = product!.productUOMs[0];
        const baseUOM = product!.baseUOM;

        // 1. Test Adjustment
        const adjNumber = `TEST-ADJ-${Date.now()}`;
        await inventoryService.adjustStockBatch({
            warehouseId: testWarehouseId,
            referenceNumber: adjNumber,
            items: [{
                productId: testProductId,
                quantity: 10,
                uom: altUOM.name,
                adjustmentType: 'ABSOLUTE'
            }]
        });

        const adjMovements = await prisma.stockMovement.findMany({
            where: { referenceId: adjNumber }
        });

        expect(adjMovements.length).toBeGreaterThan(0);
        expect(adjMovements[0].uom).toBe(altUOM.name);
        expect(adjMovements[0].conversionFactor).toBe(Number(altUOM.conversionFactor));

        // 2. Test POS Sale
        const receiptNumber = `TEST-RCP-${Date.now()}`;
        await posService.processSale({
            warehouseId: testWarehouseId,
            branchId: testBranchId,
            receiptNumber: receiptNumber,
            paymentMethod: 'cash',
            amountReceived: 10000,
            items: [{
                productId: testProductId,
                quantity: 1,
                uom: altUOM.name,
                unitPrice: Number(altUOM.sellingPrice || 100)
            }]
        });

        const posMovements = await prisma.stockMovement.findMany({
            where: { referenceId: receiptNumber }
        });

        // POS Service might store sale ID as referenceId instead of receipt number, 
        // let's check by reason or referenceType
        const posMovementsById = await prisma.stockMovement.findMany({
            where: { referenceType: 'POS', reason: { contains: receiptNumber } }
        });

        const movement = posMovementsById[0];
        expect(movement.uom).toBe(altUOM.name);
        expect(movement.conversionFactor).toBe(Number(altUOM.conversionFactor));

        console.log(`Successfully verified UOM traceability for Adjustment (${adjNumber}) and POS Sale (${receiptNumber})`);
    });
});
