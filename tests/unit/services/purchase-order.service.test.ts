import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseOrderService } from '@/services/purchase-order.service';
import { purchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { productRepository } from '@/repositories/product.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { inventoryService } from '@/services/inventory.service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/repositories/purchase-order.repository', () => ({
    purchaseOrderRepository: {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateStatus: vi.fn(),
    },
}));

vi.mock('@/repositories/product.repository', () => ({
    productRepository: {
        findById: vi.fn(),
    },
}));

vi.mock('@/repositories/supplier.repository', () => ({
    supplierRepository: {
        findById: vi.fn(),
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        addStock: vi.fn(),
    },
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        purchaseOrder: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        purchaseOrderItem: {
            update: vi.fn(),
        },
        accountsPayable: {
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    },
}));

describe('PurchaseOrderService', () => {
    let service: PurchaseOrderService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PurchaseOrderService();
    });

    describe('createPurchaseOrder', () => {
        it('should create a purchase order successfully', async () => {
            const input = {
                supplierId: 'supplier-1',
                warehouseId: 'warehouse-1',
                branchId: 'branch-1',
                items: [
                    {
                        productId: 'product-1',
                        quantity: 10,
                        uom: 'Box',
                        unitPrice: 100,
                    },
                ],
                paymentTerms: 'Net 30',
            };

            vi.mocked(supplierRepository.findById).mockResolvedValue({ id: 'supplier-1', status: 'active' } as any);
            vi.mocked(productRepository.findById).mockResolvedValue({ id: 'product-1', status: 'active', name: 'Product 1' } as any);
            vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null); // For PO number generation
            vi.mocked(purchaseOrderRepository.create).mockResolvedValue({ id: 'po-1', ...input } as any);

            const result = await service.createPurchaseOrder(input as any);

            expect(purchaseOrderRepository.create).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw error if supplier is inactive', async () => {
            const input = {
                supplierId: 'supplier-1',
                items: [],
            };

            vi.mocked(supplierRepository.findById).mockResolvedValue({ id: 'supplier-1', status: 'inactive' } as any);

            await expect(service.createPurchaseOrder(input as any)).rejects.toThrow('Cannot create PO with inactive supplier');
        });
    });

    describe('updatePurchaseOrder', () => {
        it('should update purchase order successfully', async () => {
            const id = 'po-1';
            const updateData = { status: 'ordered' };
            const existingPO = { id, status: 'draft' };

            vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);
            vi.mocked(purchaseOrderRepository.update).mockResolvedValue({ ...existingPO, ...updateData } as any);

            const result = await service.updatePurchaseOrder(id, updateData as any);

            expect(purchaseOrderRepository.update).toHaveBeenCalledWith(id, { status: 'ordered' });
            expect(result.status).toBe('ordered');
        });

        it('should throw error for invalid status transition', async () => {
            const id = 'po-1';
            const updateData = { status: 'ordered' };
            const existingPO = { id, status: 'received' };

            vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);

            await expect(service.updatePurchaseOrder(id, updateData as any)).rejects.toThrow('Invalid status transition');
        });
    });

    describe('receivePurchaseOrder', () => {
        it('should receive purchase order successfully', async () => {
            const id = 'po-1';
            const po = {
                id,
                status: 'ordered',
                warehouseId: 'warehouse-1',
                supplierId: 'supplier-1',
                branchId: 'branch-1',
                poNumber: 'PO-001',
                Supplier: { paymentTerms: 'Net 30' },
                PurchaseOrderItem: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        quantity: 10,
                        receivedQuantity: 0,
                        unitPrice: 100,
                        uom: 'Box',
                    },
                ],
            };

            vi.mocked(prisma.purchaseOrder.findUnique).mockResolvedValue(po as any);
            vi.mocked(prisma.purchaseOrder.update).mockResolvedValue({ ...po, status: 'received' } as any);

            await service.receivePurchaseOrder(id);

            expect(inventoryService.addStock).toHaveBeenCalledWith(expect.objectContaining({
                productId: 'product-1',
                quantity: 10,
                referenceId: id,
            }));
            expect(prisma.purchaseOrderItem.update).toHaveBeenCalled();
            expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id },
                data: expect.objectContaining({ status: 'received' }),
            }));
            expect(prisma.accountsPayable.create).toHaveBeenCalled();
        });
    });
});
