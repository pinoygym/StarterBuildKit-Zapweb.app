import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceivingVoucherService } from '@/services/receiving-voucher.service';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { prisma } from '@/lib/prisma';
import { convertUOMQuantity, calculateUnitCostInBaseUOM } from '@/lib/uom-conversion';

// Mock dependencies
vi.mock('@/repositories/receiving-voucher.repository', () => ({
    receivingVoucherRepository: {
        findById: vi.fn(),
        findByRVNumber: vi.fn(),
        findMany: vi.fn(),
        findByPurchaseOrderId: vi.fn(),
    },
}));

vi.mock('@/lib/uom-conversion', () => ({
    convertUOMQuantity: vi.fn(),
    calculateUnitCostInBaseUOM: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        receivingVoucher: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        receivingVoucherItem: {
            createMany: vi.fn(),
        },
        purchaseOrder: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        purchaseOrderItem: {
            update: vi.fn(),
            findMany: vi.fn(),
        },
        inventory: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            upsert: vi.fn(),
            aggregate: vi.fn(),
            update: vi.fn(),
        },
        product: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        stockMovement: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        accountsPayable: {
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('ReceivingVoucherService', () => {
    let service: ReceivingVoucherService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ReceivingVoucherService();
    });

    describe('createReceivingVoucher', () => {
        it('should create a receiving voucher successfully', async () => {
            const input = {
                purchaseOrderId: 'po-1',
                receiverName: 'John Doe',
                items: [
                    {
                        productId: 'product-1',
                        poItemId: 'po-item-1',
                        uom: 'Box',
                        orderedQuantity: 10,
                        receivedQuantity: 10,
                        unitPrice: 100,
                    },
                ],
            };

            const po = {
                id: 'po-1',
                status: 'ordered',
                warehouseId: 'warehouse-1',
                branchId: 'branch-1',
                supplierId: 'supplier-1',
                Supplier: { id: 'supplier-1', paymentTerms: 'Net 30' },
                Warehouse: { id: 'warehouse-1' },
                Branch: { id: 'branch-1' },
                PurchaseOrderItem: [
                    {
                        id: 'po-item-1',
                        productId: 'product-1',
                        quantity: 10,
                        receivedQuantity: 0,
                        Product: { id: 'product-1', baseUOM: 'Piece', averageCostPrice: 10 },
                    },
                ],
            };

            vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(po as any);
            vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null); // For RV number
            vi.mocked(prisma.receivingVoucher.create).mockResolvedValue({ id: 'rv-1', ...input } as any);
            vi.mocked(convertUOMQuantity).mockReturnValue({ success: true, convertedQuantity: 100 } as any);
            vi.mocked(calculateUnitCostInBaseUOM).mockReturnValue({ success: true, unitCostInBaseUOM: 10 } as any);
            vi.mocked(prisma.inventory.findUnique).mockResolvedValue({ quantity: 50 } as any);
            vi.mocked(prisma.inventory.findMany).mockResolvedValue([{ quantity: 50 }] as any);
            vi.mocked(prisma.inventory.aggregate).mockResolvedValue({ _sum: { quantity: 50 } } as any);
            vi.mocked(prisma.purchaseOrderItem.findMany).mockResolvedValue([{ receivedQuantity: 10, quantity: 10 }] as any);
            vi.mocked(prisma.receivingVoucher.findUnique).mockResolvedValue({ id: 'rv-1' } as any);
            vi.mocked(prisma.product.findUnique).mockResolvedValue({
                id: 'product-1',
                name: 'Test Product',
                baseUOM: 'Piece',
                averageCostPrice: 10,
                productUOMs: [
                    { name: 'Box', conversionFactor: 10 }
                ],
            } as any);

            const result = await service.createReceivingVoucher(input as any);
            expect(prisma.receivingVoucher.create).toHaveBeenCalled();
            expect(prisma.inventory.upsert).toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalled();
            expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'po-1' },
                data: expect.objectContaining({ status: 'received' }),
            }));
            expect(result).toBeDefined();
        });

        it('should create a receiving voucher with alternate UOM successfully', async () => {
            const input = {
                purchaseOrderId: 'po-1',
                receiverName: 'John Doe',
                items: [
                    {
                        productId: 'product-1',
                        poItemId: 'po-item-1',
                        uom: 'Box', // Alternate UOM
                        orderedQuantity: 1,
                        receivedQuantity: 1,
                        unitPrice: 100,
                    },
                ],
            };

            const po = {
                id: 'po-1',
                status: 'ordered',
                warehouseId: 'warehouse-1',
                branchId: 'branch-1',
                supplierId: 'supplier-1',
                Supplier: { id: 'supplier-1', paymentTerms: 'Net 30' },
                Warehouse: { id: 'warehouse-1' },
                Branch: { id: 'branch-1' },
                PurchaseOrderItem: [
                    {
                        id: 'po-item-1',
                        productId: 'product-1',
                        quantity: 1,
                        receivedQuantity: 0,
                        uom: 'Box',
                        Product: {
                            id: 'product-1',
                            baseUOM: 'Piece',
                            averageCostPrice: 10
                        },
                    },
                ],
            };

            vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(po as any);
            vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.receivingVoucher.create).mockResolvedValue({ id: 'rv-1', ...input } as any);

            vi.mocked(convertUOMQuantity).mockReturnValue({ success: true, convertedQuantity: 10 } as any);
            vi.mocked(calculateUnitCostInBaseUOM).mockReturnValue({ success: true, unitCostInBaseUOM: 10 } as any);

            vi.mocked(prisma.inventory.findUnique).mockResolvedValue({ quantity: 50 } as any);
            vi.mocked(prisma.inventory.findMany).mockResolvedValue([{ quantity: 50 }] as any);
            vi.mocked(prisma.inventory.aggregate).mockResolvedValue({ _sum: { quantity: 50 } } as any);
            vi.mocked(prisma.purchaseOrderItem.findMany).mockResolvedValue([{ receivedQuantity: 1, quantity: 1 }] as any);
            vi.mocked(prisma.receivingVoucher.findUnique).mockResolvedValue({ id: 'rv-1' } as any);

            vi.mocked(prisma.product.findUnique).mockResolvedValue({
                id: 'product-1',
                name: 'Test Product',
                baseUOM: 'Piece',
                averageCostPrice: 10,
                productUOMs: [
                    { name: 'Box', conversionFactor: 10, sellingPrice: 100 }
                ],
            } as any);

            const result = await service.createReceivingVoucher(input as any);

            expect(prisma.receivingVoucher.create).toHaveBeenCalled();
            expect(prisma.inventory.upsert).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw error if PO not found', async () => {
            const input = {
                purchaseOrderId: 'po-1',
                items: [],
            };

            vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(null);

            await expect(service.createReceivingVoucher(input as any)).rejects.toThrow('Purchase Order');
        });
    });

    describe('cancelReceivingVoucher', () => {
        it('should cancel receiving voucher successfully', async () => {
            const id = 'rv-1';
            const reason = 'Mistake';
            const rv = {
                id,
                status: 'complete',
                warehouseId: 'warehouse-1',
                branchId: 'branch-1',
                purchaseOrderId: 'po-1',
                createdAt: new Date(),
                PurchaseOrder: {
                    id: 'po-1',
                    status: 'received',
                    PurchaseOrderItem: [
                        { id: 'po-item-1', productId: 'product-1', receivedQuantity: 10 },
                    ],
                },
                ReceivingVoucherItem: [
                    {
                        productId: 'product-1',
                        receivedQuantity: 10,
                        uom: 'Box',
                        Product: { id: 'product-1', baseUOM: 'Piece' },
                    },
                ],
            };

            vi.mocked(prisma.receivingVoucher.findUnique).mockResolvedValue(rv as any);
            vi.mocked(prisma.stockMovement.findMany).mockResolvedValue([]); // No sales
            vi.mocked(convertUOMQuantity).mockReturnValue({ success: true, convertedQuantity: 100 } as any);
            vi.mocked(prisma.purchaseOrderItem.findMany).mockResolvedValue([{ receivedQuantity: 0, quantity: 10 }] as any);
            vi.mocked(receivingVoucherRepository.findById).mockResolvedValue(rv as any);
            vi.mocked(prisma.inventory.findUnique).mockResolvedValue({ quantity: 100 } as any);
            vi.mocked(prisma.product.findUnique).mockResolvedValue({
                id: 'product-1',
                name: 'Test Product',
                baseUOM: 'Piece',
                averageCostPrice: 10,
                productUOMs: [
                    { name: 'Box', conversionFactor: 10, sellingPrice: 100 }
                ],
            } as any);

            await service.cancelReceivingVoucher(id, { reason });
            expect(prisma.inventory.update).toHaveBeenCalled(); // deductStock uses update
            expect(prisma.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ type: 'OUT' })
            }));
            expect(prisma.purchaseOrderItem.update).toHaveBeenCalled();
            expect(prisma.purchaseOrder.update).toHaveBeenCalled();
            expect(prisma.receivingVoucher.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id },
                data: expect.objectContaining({ status: 'cancelled' }),
            }));
        });

        it('should throw error if RV already cancelled', async () => {
            const id = 'rv-1';
            const rv = { id, status: 'cancelled' };

            vi.mocked(prisma.receivingVoucher.findUnique).mockResolvedValue(rv as any);

            await expect(service.cancelReceivingVoucher(id, { reason: 'test' })).rejects.toThrow('already cancelled');
        });
    });
});
