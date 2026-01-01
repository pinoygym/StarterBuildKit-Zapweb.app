import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { prisma } from '@/lib/prisma';
import { inventoryService } from '@/services/inventory.service';
import { NotFoundError, ValidationError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/lib/prisma', () => {
    const mockPrisma = {
        inventoryAdjustment: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        inventoryAdjustmentItem: {
            update: vi.fn(),
        },
        inventory: {
            findMany: vi.fn(),
        },
        product: {
            findMany: vi.fn(),
        },
        unitOfMeasure: {
            findMany: vi.fn(),
        },
        $transaction: vi.fn(),
    };

    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));

    return { prisma: mockPrisma };
});

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        adjustStockBatch: vi.fn(),
        convertToBaseUOM: vi.fn((productId, quantity, uom) => Promise.resolve(quantity)),
    },
}));

vi.mock('@/services/audit.service', () => ({
    auditService: {
        log: vi.fn(),
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
            (prisma.product.findMany as any).mockResolvedValue([
                { id: 'prod-1', baseUOM: 'PCS', productUOMs: [] }
            ]);
            (prisma.inventoryAdjustment.create as any).mockResolvedValue({
                id: 'adj-1',
                adjustmentNumber: expectedAdjustmentNumber,
                ...createInput,
                status: 'DRAFT',
                items: createInput.items.map(item => ({
                    ...item,
                    Product: {
                        id: item.productId,
                        name: 'Test Product',
                        baseUOM: item.uom,
                        productUOMs: []
                    }
                }))
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
                items: [{
                    Product: {
                        id: 'p1',
                        name: 'Test Product',
                        baseUOM: 'PCS',
                        productUOMs: []
                    }
                }]
            } as any);

            const result = await inventoryAdjustmentService.update('adj-1', updateInput);

            expect(prisma.inventoryAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'adj-1' },
                data: expect.objectContaining(updateInput),
            }));
            expect(result.reason).toBe(updateInput.reason);
        });

        it('should update warehouse and branch for a draft adjustment', async () => {
            const existingAdjustment = {
                id: 'adj-1',
                status: 'DRAFT',
                warehouseId: 'old-w',
                branchId: 'old-b'
            };
            const updateInput = {
                warehouseId: 'new-w',
                branchId: 'new-b'
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(existingAdjustment as any);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...existingAdjustment,
                ...updateInput,
                items: []
            } as any);

            const result = await inventoryAdjustmentService.update('adj-1', updateInput);

            expect(prisma.inventoryAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'adj-1' },
                data: expect.objectContaining(updateInput),
            }));
            expect(result.warehouseId).toBe(updateInput.warehouseId);
            expect(result.branchId).toBe(updateInput.branchId);
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
        it('should post an adjustment, update inventory records with system quantities, and update stock', async () => {
            const draftAdjustment = {
                id: 'adj-1',
                status: 'DRAFT',
                warehouseId: 'warehouse-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-001',
                reason: 'Test',
                items: [
                    { id: 'item-1', productId: 'p1', quantity: 10, uom: 'PCS', type: 'RELATIVE' },
                    { id: 'item-2', productId: 'p2', quantity: 100, uom: 'PCS', type: 'ABSOLUTE' }
                ],
            };

            // Mock finding the draft
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment as any);

            // Mock inventory levels for batch fetch
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'p1', quantity: 50 },
                { productId: 'p2', quantity: 80 }
            ]);

            // Mock current stock level helper in service (if it's used, but we optimized it)
            // Actually our optimized code uses inventoryMap from findMany

            (prisma.inventoryAdjustment.update as any).mockImplementation(({ data }: any) => ({
                ...draftAdjustment,
                ...data,
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: {
                        id: item.productId,
                        name: 'Test Product',
                        baseUOM: item.uom,
                        productUOMs: []
                    }
                }))
            }));

            await inventoryAdjustmentService.post('adj-1', mockUserId);

            // Verify system quantities were recorded
            // Item 1: RELATIVE 10, current 50 -> system 50, actual 60
            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'item-1' },
                data: { systemQuantity: 50, actualQuantity: 60 }
            }));

            // Item 2: ABSOLUTE 100, current 80 -> system 80, actual 100
            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'item-2' },
                data: { systemQuantity: 80, actualQuantity: 100 }
            }));

            // Verify stock update via inventory service
            expect(inventoryService.adjustStockBatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    warehouseId: draftAdjustment.warehouseId,
                    referenceNumber: draftAdjustment.adjustmentNumber,
                    items: expect.arrayContaining([
                        expect.objectContaining({ productId: 'p1', quantity: 10, adjustmentType: 'RELATIVE' }),
                        expect.objectContaining({ productId: 'p2', quantity: 100, adjustmentType: 'ABSOLUTE' })
                    ])
                }),
                expect.anything() // Transaction client parameter
            );

            // Verify status update to POSTED
            expect(prisma.inventoryAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'adj-1' },
                data: expect.objectContaining({ status: 'POSTED', postedById: mockUserId })
            }));
        });

        it('should throw error if posting non-draft adjustment', async () => {
            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue({
                id: 'adj-1',
                status: 'POSTED',
                items: [{ productId: 'p1', quantity: 1, uom: 'PCS', type: 'RELATIVE' }]
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
            const mockAdj = {
                id: 'adj-1',
                items: [{
                    Product: {
                        id: 'p1',
                        name: 'Test Product',
                        baseUOM: 'PCS',
                        productUOMs: []
                    }
                }]
            };
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
            (prisma.product.findMany as any).mockResolvedValue([
                { id: 'p1', baseUOM: 'PCS', productUOMs: [] }
            ]);
            (prisma.inventoryAdjustment.create as any).mockResolvedValue({
                id: 'adj-2',
                status: 'DRAFT',
                items: [{
                    Product: {
                        id: 'p1',
                        name: 'Test Product',
                        baseUOM: 'PCS',
                        productUOMs: []
                    }
                }]
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
        it('should create a reversal adjustment and automatically post it', async () => {
            const original = {
                id: 'adj-1',
                adjustmentNumber: 'ADJ-001',
                status: 'POSTED',
                warehouseId: 'w1',
                branchId: 'b1',
                items: [
                    {
                        productId: 'p1',
                        quantity: 10,
                        uom: 'PCS',
                        type: 'RELATIVE',
                        Product: { id: 'p1', baseUOM: 'PCS' }
                    },
                    {
                        productId: 'p2',
                        quantity: 150,
                        uom: 'PCS',
                        type: 'ABSOLUTE',
                        systemQuantity: 100,
                        actualQuantity: 150,
                        Product: { id: 'p2', baseUOM: 'PCS' }
                    }
                ]
            };

            const reversalDraft = {
                id: 'adj-reversal',
                status: 'DRAFT',
                warehouseId: 'w1',
                items: [{ productId: 'p1', quantity: 1, uom: 'PCS', type: 'RELATIVE' }]
            };

            (prisma.inventoryAdjustment.findUnique as any).mockImplementation(({ where }: any) => {
                if (where.id === 'adj-1') return Promise.resolve(original);
                if (where.id === 'adj-reversal') return Promise.resolve(reversalDraft);
                return Promise.resolve(null);
            });
            (prisma.inventoryAdjustment.count as any).mockResolvedValue(2);
            (prisma.product.findMany as any).mockResolvedValue([
                { id: 'p1', baseUOM: 'PCS', productUOMs: [] },
                { id: 'p2', baseUOM: 'PCS', productUOMs: [] }
            ]);
            (prisma.inventoryAdjustment.create as any).mockResolvedValue(reversalDraft as any);

            // Mock post() call - since it's the same service, we can spy on it or just mock the prisma for it
            // In unit test, it's better to ensure post's internals are mocked if we are testing through reverse()
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({ ...reversalDraft, status: 'POSTED' });
            (prisma.inventory.findMany as any).mockResolvedValue([]); // For post() batch fetch

            const result = await inventoryAdjustmentService.reverse('adj-1', mockUserId);

            // Verify reversal items calculation
            expect(prisma.inventoryAdjustment.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    reason: expect.stringContaining('Reversal of ADJ-001'),
                    items: {
                        create: expect.arrayContaining([
                            expect.objectContaining({ productId: 'p1', quantity: -10 }), // -10 for RELATIVE 10
                            expect.objectContaining({ productId: 'p2', quantity: -50 })  // - (150-100) = -50 for ABSOLUTE
                        ])
                    }
                })
            }));

            // Verify it was posted
            expect(prisma.inventoryAdjustment.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: reversalDraft.id },
                data: expect.objectContaining({ status: 'POSTED' })
            }));

            expect(result.status).toBe('POSTED');
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
