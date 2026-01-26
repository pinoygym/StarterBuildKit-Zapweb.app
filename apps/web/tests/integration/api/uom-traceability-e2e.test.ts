
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
        // 1. Create Branch
        const branch = await prisma.branch.create({
            data: {
                id: randomUUID(),
                name: 'UOM Test Branch',
                code: `UTB-${Date.now()}`,
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '123456789',
                status: 'active',
                updatedAt: new Date(),
            }
        });
        testBranchId = branch.id;

        // 2. Create Warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                id: randomUUID(),
                name: 'UOM Test Warehouse',
                location: 'Test Location',
                branchId: testBranchId,
                manager: 'Test Manager',
                maxCapacity: 1000,
                updatedAt: new Date(),
            }
        });
        testWarehouseId = warehouse.id;

        // 3. Create Product with alternate UOM
        const product = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: `UOM Test Product ${Date.now()}`,
                description: 'Test Description',
                category: 'Test Category',
                baseUOM: 'pcs',
                basePrice: 100,
                minStockLevel: 10,
                shelfLifeDays: 365,
                status: 'active',
                updatedAt: new Date(),
                productUOMs: {
                    create: [
                        {
                            id: randomUUID(),
                            name: 'box',
                            conversionFactor: 10,
                            sellingPrice: 1000
                        }
                    ]
                }
            },
            include: { productUOMs: true }
        });
        testProductId = product.id;
    });

    afterAll(async () => {
        try {
            await prisma.stockMovement.deleteMany({ where: { productId: testProductId } });
            await prisma.inventory.deleteMany({ where: { productId: testProductId } });
            await prisma.pOSSaleItem.deleteMany({ where: { productId: testProductId } });
            await prisma.pOSSale.deleteMany({ where: { branchId: testBranchId } });
            await prisma.inventoryAdjustmentItem.deleteMany({ where: { productId: testProductId } });
            await prisma.productUOM.deleteMany({ where: { productId: testProductId } });
            await prisma.product.delete({ where: { id: testProductId } });
            await prisma.warehouse.delete({ where: { id: testWarehouseId } });
            await prisma.branch.delete({ where: { id: testBranchId } });
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
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
