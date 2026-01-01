import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { prisma } from '@/lib/prisma';
import { inventoryService } from '@/services/inventory.service';
import { NotFoundError, ValidationError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        inventoryAdjustment: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        adjustStockBatch: vi.fn(),
    },
}));

describe('InventoryAdjustmentService', () => {
    const mockUserId = 'user-123';
    const mockDate = new Date('2024-01-01');

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ now: mockDate });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('create', () => {
        const createInput = {
            warehouseId: 'warehouse-1',
            branchId: 'branch-1',
            reason: 'Test Adjustment',
            items: [
                {
                    productId: 'prod-1',
                    quantity: 10,
                    uom: 'PCS',
                    type: 'RELATIVE' as const,
                    systemQuantity: 5,
                    actualQuantity: 15,
                },
            ],
        };

        it('should create a draft adjustment successfully', async () => {
            const mockCount = 0;
            const expectedAdjustmentNumber = 'ADJ-20240101-0001';

            (prisma.inventoryAdjustment.count as any).mockResolvedValue(mockCount);
            (prisma.inventoryAdjustment.create as any).mockResolvedValue({
                id: 'adj-1',
                adjustmentNumber: expectedAdjustmentNumber,
                ...createInput,
                status: 'DRAFT',
            } as any);

            const result = await inventoryAdjustmentService.create(createInput, mockUserId);

            expect(prisma.inventoryAdjustment.count).toHaveBeenCalled();
            expect(prisma.inventoryAdjustment.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    warehouseId: createInput.warehouseId,
                    status: 'DRAFT',
                    adjustmentNumber: expectedAdjustmentNumber,
                }),
            }));
            expect(result).toBeDefined();
        });
    });

    describe('update', () => {
        const updateInput = {
            reason: 'Updated Reason',
        };

        it('should update a draft adjustment', async () => {
            const existingAdjustment = {
                id: 'adj-1',
                status: 'DRAFT',
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(existingAdjustment as any);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...existingAdjustment,
                ...updateInput,
            } as any);

            const result = await inventoryAdjustmentService.update('adj-1', updateInput);

            expect(prisma.inventoryAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'adj-1' },
                data: expect.objectContaining(updateInput),
            }));
            expect(result.reason).toBe(updateInput.reason);
        });

        it('should throw ValidationError if updating non-draft adjustment', async () => {
            const existingAdjustment = {
                id: 'adj-1',
                status: 'POSTED',
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(existingAdjustment as any);

            await expect(inventoryAdjustmentService.update('adj-1', updateInput))
                .rejects.toThrow(ValidationError);
        });

        it('should throw NotFoundError if adjustment does not exist', async () => {
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(null);

            await expect(inventoryAdjustmentService.update('adj-1', updateInput))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('post', () => {
        it('should post an adjustment and update stock', async () => {
            const draftAdjustment = {
                id: 'adj-1',
                status: 'DRAFT',
                warehouseId: 'warehouse-1',
                items: [
                    { productId: 'p1', quantity: 10, uom: 'PCS', type: 'RELATIVE' }
                ],
                adjustmentNumber: 'ADJ-001'
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment as any);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED'
            } as any);

            await inventoryAdjustmentService.post('adj-1', mockUserId);

            // Verify stock update
            expect(inventoryService.adjustStockBatch).toHaveBeenCalledWith(expect.objectContaining({
                warehouseId: draftAdjustment.warehouseId,
                referenceNumber: draftAdjustment.adjustmentNumber,
                items: expect.arrayContaining([
                    expect.objectContaining({ productId: 'p1', quantity: 10 })
                ])
            }));

            // Verify status update
            expect(prisma.inventoryAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'adj-1' },
                data: expect.objectContaining({ status: 'POSTED', postedById: mockUserId })
            }));
        });

        it('should throw error if posting non-draft adjustment', async () => {
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue({
                id: 'adj-1',
                status: 'POSTED'
            } as any);

            await expect(inventoryAdjustmentService.post('adj-1', mockUserId))
                .rejects.toThrow(ValidationError);
        });
    });

    describe('findAll', () => {
        it('should return adjustments with filters', async () => {
            (prisma.inventoryAdjustment.findMany as any).mockResolvedValue([]);

            await inventoryAdjustmentService.findAll({ status: 'POSTED' });

            expect(prisma.inventoryAdjustment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'POSTED' })
            }));
        });
    });

    describe('findById', () => {
        it('should return adjustment if found', async () => {
            const mockAdj = { id: 'adj-1' };
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(mockAdj as any);

            const result = await inventoryAdjustmentService.findById('adj-1');
            expect(result).toEqual(mockAdj);
        });

        it('should throw NotFoundError if not found', async () => {
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(null);
            await expect(inventoryAdjustmentService.findById('adj-1')).rejects.toThrow(NotFoundError);
        });
    });

    describe('copy', () => {
        it('should create a copy of an adjustment', async () => {
            const original = {
                id: 'adj-1',
                adjustmentNumber: 'ADJ-001',
                warehouseId: 'w1',
                branchId: 'b1',
                reason: 'Reason',
                items: [{ productId: 'p1', quantity: 10, uom: 'PCS', type: 'RELATIVE' }]
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(original as any);
            // Mock transaction/create for the new one (simplified, assuming create internals mocked)
            (prisma.inventoryAdjustment.count as any).mockResolvedValue(1);
            (prisma.inventoryAdjustment.create as any).mockResolvedValue({
                id: 'adj-2',
                status: 'DRAFT'
            } as any);

            await inventoryAdjustmentService.copy('adj-1', mockUserId);

            expect(prisma.inventoryAdjustment.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    reason: expect.stringContaining('Copy of ADJ-001'),
                    items: {
                        create: expect.arrayContaining([
                            expect.objectContaining({ productId: 'p1', quantity: 10 })
                        ])
                    }
                })
            }));
        });
    });

    describe('reverse', () => {
        it('should create a reversal adjustment', async () => {
            const original = {
                id: 'adj-1',
                adjustmentNumber: 'ADJ-001',
                status: 'POSTED',
                items: [{ productId: 'p1', quantity: 10, uom: 'PCS', type: 'RELATIVE' }]
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(original as any);
            (prisma.inventoryAdjustment.count as any).mockResolvedValue(2);
            (prisma.inventoryAdjustment.create as any).mockResolvedValue({ id: 'adj-3' } as any);

            await inventoryAdjustmentService.reverse('adj-1', mockUserId);

            expect(prisma.inventoryAdjustment.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    reason: expect.stringContaining('Reversal of ADJ-001'),
                    referenceNumber: 'ADJ-001',
                    items: {
                        create: expect.arrayContaining([
                            expect.objectContaining({ productId: 'p1', quantity: -10 })
                        ])
                    }
                })
            }));
        });

        it('should throw error if reversing non-posted adjustment', async () => {
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue({
                id: 'adj-1',
                status: 'DRAFT'
            } as any);

            await expect(inventoryAdjustmentService.reverse('adj-1', mockUserId))
                .rejects.toThrow(ValidationError);
        });
    });
});
