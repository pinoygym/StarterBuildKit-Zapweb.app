import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurchaseOrderService } from '@/services/purchase-order.service';
import { purchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { productRepository } from '@/repositories/product.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { inventoryService } from '@/services/inventory.service';
import { prisma } from '@/lib/prisma';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { mockSuppliers, mockProducts, mockWarehouses } from '../../fixtures/test-data';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    accountsPayable: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/repositories/purchase-order.repository');
vi.mock('@/repositories/product.repository');
vi.mock('@/repositories/supplier.repository');
vi.mock('@/services/inventory.service');

describe('PurchaseOrderService', () => {
  let purchaseOrderService: PurchaseOrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    purchaseOrderService = new PurchaseOrderService();
  });

  describe('calculateDueDate', () => {
    it('should add 15 days for Net 15 payment terms', () => {
      const receivedDate = new Date('2024-01-15T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('Net 15', receivedDate);

      const expected = new Date('2024-01-30T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should add 30 days for Net 30 payment terms', () => {
      const receivedDate = new Date('2024-01-15T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('Net 30', receivedDate);

      const expected = new Date('2024-02-14T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should add 60 days for Net 60 payment terms', () => {
      const receivedDate = new Date('2024-01-15T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('Net 60', receivedDate);

      const expected = new Date('2024-03-15T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should return same date for COD payment terms', () => {
      const receivedDate = new Date('2024-01-15T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('COD', receivedDate);

      expect(dueDate.toISOString()).toBe(receivedDate.toISOString());
    });

    it('should default to Net 30 for unknown payment terms', () => {
      const receivedDate = new Date('2024-01-15T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('Unknown', receivedDate);

      const expected = new Date('2024-02-14T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should use current date if no receivedDate is provided', () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const dueDate = purchaseOrderService.calculateDueDate('Net 30');

      const expected = new Date('2024-02-14T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());

      vi.useRealTimers();
    });

    it('should handle month boundary correctly', () => {
      const receivedDate = new Date('2024-01-25T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('Net 30', receivedDate);

      const expected = new Date('2024-02-24T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });

    it('should handle year boundary correctly', () => {
      const receivedDate = new Date('2023-12-20T10:00:00.000Z');
      const dueDate = purchaseOrderService.calculateDueDate('Net 30', receivedDate);

      const expected = new Date('2024-01-19T10:00:00.000Z');
      expect(dueDate.toISOString()).toBe(expected.toISOString());
    });
  });

  describe('createPurchaseOrder', () => {
    it('should throw NotFoundError when supplier does not exist', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(null);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'non-existent-supplier',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
          },
        ],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError when supplier is inactive', async () => {
      const inactiveSupplier = {
        ...mockSuppliers.supplier1,
        status: 'inactive' as const,
      };

      vi.mocked(supplierRepository.findById).mockResolvedValue(inactiveSupplier as any);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
          },
        ],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when no items are provided', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSuppliers.supplier1 as any);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw NotFoundError when product does not exist', async () => {
      const activeSupplier = {
        ...mockSuppliers.supplier1,
        status: 'active' as const,
      };

      vi.mocked(supplierRepository.findById).mockResolvedValue(activeSupplier as any);
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'non-existent-product',
            quantity: 100,
            unitPrice: 50,
          },
        ],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError when product is inactive', async () => {
      const inactiveProduct = {
        ...mockProducts.productA,
        status: 'inactive' as const,
      };

      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSuppliers.supplier1 as any);
      vi.mocked(productRepository.findById).mockResolvedValue(inactiveProduct as any);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
          },
        ],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when quantity is zero or negative', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSuppliers.supplier1 as any);
      vi.mocked(productRepository.findById).mockResolvedValue(mockProducts.productA as any);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'product-1',
            quantity: 0,
            unitPrice: 50,
          },
        ],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when unit price is zero or negative', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSuppliers.supplier1 as any);
      vi.mocked(productRepository.findById).mockResolvedValue(mockProducts.productA as any);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'product-1',
            quantity: 100,
            unitPrice: 0,
          },
        ],
      };

      await expect(purchaseOrderService.createPurchaseOrder(poData)).rejects.toThrow(
        ValidationError
      );
    });

    it('should calculate total amount correctly', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const activeSupplier = {
        ...mockSuppliers.supplier1,
        status: 'active' as const,
      };

      const activeProductA = {
        ...mockProducts.productA,
        status: 'active' as const,
      };

      const activeProductB = {
        ...mockProducts.productB,
        status: 'active' as const,
      };

      vi.mocked(supplierRepository.findById).mockResolvedValue(activeSupplier as any);
      vi.mocked(productRepository.findById)
        .mockResolvedValueOnce(activeProductA as any)
        .mockResolvedValueOnce(activeProductB as any);

      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);

      const createdPO = {
        id: 'po-1',
        poNumber: 'PO-20240115-0001',
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        totalAmount: 8000, // (100 * 50) + (50 * 60)
        status: 'draft',
      };

      vi.mocked(purchaseOrderRepository.create).mockResolvedValue(createdPO as any);

      const poData = {
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: new Date('2024-02-15'),
        items: [
          {
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
          },
          {
            productId: 'product-2',
            quantity: 50,
            unitPrice: 60,
          },
        ],
      };

      await purchaseOrderService.createPurchaseOrder(poData);

      expect(purchaseOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 8000,
        })
      );

      vi.useRealTimers();
    });
  });

  describe('cancelPurchaseOrder', () => {
    it('should throw NotFoundError when PO does not exist', async () => {
      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(null);

      await expect(
        purchaseOrderService.cancelPurchaseOrder('non-existent-id', {
          reason: 'Test cancellation',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when PO is already received', async () => {
      const receivedPO = {
        id: 'po-1',
        status: 'received',
        notes: null,
      };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(receivedPO as any);

      await expect(
        purchaseOrderService.cancelPurchaseOrder('po-1', {
          reason: 'Test cancellation',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when PO is already cancelled', async () => {
      const cancelledPO = {
        id: 'po-1',
        status: 'cancelled',
        notes: 'CANCELLED: Already cancelled',
      };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(cancelledPO as any);

      await expect(
        purchaseOrderService.cancelPurchaseOrder('po-1', {
          reason: 'Test cancellation',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should update status to cancelled and add reason to notes', async () => {
      const draftPO = {
        id: 'po-1',
        status: 'draft',
        notes: null,
      };

      const updatedPO = {
        ...draftPO,
        status: 'cancelled',
        notes: 'CANCELLED: Out of budget',
      };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(draftPO as any);
      vi.mocked(purchaseOrderRepository.updateStatus).mockResolvedValue(undefined as any);
      vi.mocked(purchaseOrderRepository.update).mockResolvedValue(updatedPO as any);

      await purchaseOrderService.cancelPurchaseOrder('po-1', {
        reason: 'Out of budget',
      });

      expect(purchaseOrderRepository.updateStatus).toHaveBeenCalledWith('po-1', 'cancelled');
      expect(purchaseOrderRepository.update).toHaveBeenCalledWith(
        'po-1',
        expect.objectContaining({
          notes: expect.stringContaining('CANCELLED: Out of budget'),
        })
      );
    });
  });

  describe('receivePurchaseOrder', () => {
    it('should throw NotFoundError when PO does not exist', async () => {
      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await expect(
        purchaseOrderService.receivePurchaseOrder('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when PO is already received', async () => {
      const receivedPO = {
        id: 'po-1',
        status: 'received',
        items: [],
        supplier: mockSuppliers.supplier1,
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(receivedPO),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await expect(purchaseOrderService.receivePurchaseOrder('po-1')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when PO is cancelled', async () => {
      const cancelledPO = {
        id: 'po-1',
        status: 'cancelled',
        items: [],
        supplier: mockSuppliers.supplier1,
      };

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(cancelledPO),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await expect(purchaseOrderService.receivePurchaseOrder('po-1')).rejects.toThrow(
        ValidationError
      );
    });

    it('should create inventory batches for each item', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const pendingPO = {
        id: 'po-1',
        poNumber: 'PO-20240115-0001',
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        status: 'pending',
        totalAmount: 8000,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
            product: {
              ...mockProducts.productA,
              baseUOM: 'PIECE',
            },
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 50,
            unitPrice: 60,
            product: {
              ...mockProducts.productB,
              baseUOM: 'KILOGRAM',
            },
          },
        ],
        supplier: {
          ...mockSuppliers.supplier1,
          paymentTerms: 'Net 30',
        },
      };

      const updatedPO = {
        ...pendingPO,
        status: 'received',
        actualDeliveryDate: mockDate,
      };

      vi.mocked(inventoryService.addStock).mockResolvedValue(undefined as any);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(pendingPO)
              .mockResolvedValueOnce(updatedPO),
            update: vi.fn().mockResolvedValue(updatedPO),
          },
          accountsPayable: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await purchaseOrderService.receivePurchaseOrder('po-1');

      // Verify inventory service was called for each item
      expect(inventoryService.addStock).toHaveBeenCalledTimes(2);
      expect(inventoryService.addStock).toHaveBeenNthCalledWith(1, {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 100,
        uom: 'PIECE',
        unitCost: 50,
        referenceId: 'po-1',
        referenceType: 'PO',
        reason: 'Received from PO PO-20240115-0001',
      });
      expect(inventoryService.addStock).toHaveBeenNthCalledWith(2, {
        productId: 'product-2',
        warehouseId: 'warehouse-1',
        quantity: 50,
        uom: 'KILOGRAM',
        unitCost: 60,
        referenceId: 'po-1',
        referenceType: 'PO',
        reason: 'Received from PO PO-20240115-0001',
      });

      vi.useRealTimers();
    });

    it('should create accounts payable record with correct due date', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const pendingPO = {
        id: 'po-1',
        poNumber: 'PO-20240115-0001',
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        status: 'pending',
        totalAmount: 8000,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
            product: {
              ...mockProducts.productA,
              baseUOM: 'PIECE',
            },
          },
        ],
        supplier: {
          ...mockSuppliers.supplier1,
          paymentTerms: 'Net 30',
        },
      };

      const updatedPO = {
        ...pendingPO,
        status: 'received',
        actualDeliveryDate: mockDate,
      };

      vi.mocked(inventoryService.addStock).mockResolvedValue(undefined as any);

      let apCreateData: any = null;

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(pendingPO)
              .mockResolvedValueOnce(updatedPO),
            update: vi.fn().mockResolvedValue(updatedPO),
          },
          accountsPayable: {
            create: vi.fn((data) => {
              apCreateData = data;
              return Promise.resolve({});
            }),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await purchaseOrderService.receivePurchaseOrder('po-1');

      // Verify AP was created with correct due date (Net 30 = +30 days)
      expect(apCreateData).toBeTruthy();
      expect(apCreateData.data).toMatchObject({
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        purchaseOrderId: 'po-1',
        totalAmount: 8000,
        paidAmount: 0,
        balance: 8000,
        status: 'pending',
      });

      const expectedDueDate = new Date('2024-02-14T10:00:00.000Z');
      expect(apCreateData.data.dueDate.toISOString()).toBe(expectedDueDate.toISOString());

      vi.useRealTimers();
    });

    it('should update PO status to received and set actualDeliveryDate', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const pendingPO = {
        id: 'po-1',
        poNumber: 'PO-20240115-0001',
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        status: 'pending',
        totalAmount: 5000,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
            product: {
              ...mockProducts.productA,
              baseUOM: 'PIECE',
            },
          },
        ],
        supplier: {
          ...mockSuppliers.supplier1,
          paymentTerms: 'COD',
        },
      };

      const updatedPO = {
        ...pendingPO,
        status: 'received',
        actualDeliveryDate: mockDate,
      };

      vi.mocked(inventoryService.addStock).mockResolvedValue(undefined as any);

      let poUpdateData: any = null;

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(pendingPO)
              .mockResolvedValueOnce(updatedPO),
            update: vi.fn((params) => {
              poUpdateData = params;
              return Promise.resolve(updatedPO);
            }),
          },
          accountsPayable: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await purchaseOrderService.receivePurchaseOrder('po-1');

      expect(poUpdateData).toBeTruthy();
      expect(poUpdateData.data.status).toBe('received');
      expect(poUpdateData.data.actualDeliveryDate.toISOString()).toBe(mockDate.toISOString());

      vi.useRealTimers();
    });

    it('should perform all operations in a single transaction', async () => {
      const mockDate = new Date('2024-01-15T10:00:00.000Z');
      vi.setSystemTime(mockDate);

      const pendingPO = {
        id: 'po-1',
        poNumber: 'PO-20240115-0001',
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        supplierId: 'supplier-1',
        status: 'pending',
        totalAmount: 5000,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 100,
            unitPrice: 50,
            product: {
              ...mockProducts.productA,
              baseUOM: 'PIECE',
            },
          },
        ],
        supplier: {
          ...mockSuppliers.supplier1,
          paymentTerms: 'Net 30',
        },
      };

      const updatedPO = {
        ...pendingPO,
        status: 'received',
        actualDeliveryDate: mockDate,
      };

      vi.mocked(inventoryService.addStock).mockResolvedValue(undefined as any);

      const mockTransaction = vi.fn(async (callback) => {
        return await callback({
          purchaseOrder: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(pendingPO)
              .mockResolvedValueOnce(updatedPO),
            update: vi.fn().mockResolvedValue(updatedPO),
          },
          accountsPayable: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction);

      await purchaseOrderService.receivePurchaseOrder('po-1');

      expect(mockTransaction).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('getPurchaseOrderById', () => {
    it('should throw NotFoundError when PO does not exist', async () => {
      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(null);

      await expect(
        purchaseOrderService.getPurchaseOrderById('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should return PO when it exists', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-20240115-0001',
      };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(mockPO as any);

      const result = await purchaseOrderService.getPurchaseOrderById('po-1');

      expect(result).toEqual(mockPO);
    });
  });
});
