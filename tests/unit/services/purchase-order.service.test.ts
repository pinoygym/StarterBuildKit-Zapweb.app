import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PurchaseOrderService } from '@/services/purchase-order.service';
import { purchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { productRepository } from '@/repositories/product.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { inventoryService } from '@/services/inventory.service';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock repositories and services
vi.mock('@/repositories/purchase-order.repository');
vi.mock('@/repositories/product.repository');
vi.mock('@/repositories/supplier.repository');
vi.mock('@/services/inventory.service');

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    purchaseOrder: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    accountsPayable: {
      create: vi.fn(),
    },
  },
}));

describe('PurchaseOrderService', () => {
  let poService: PurchaseOrderService;
  let dbTestBase: DatabaseTestBase;
  let testPOId: string;
  let testSupplierId: string;
  let testProductId: string;
  let testWarehouseId: string;
  let testBranchId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test IDs
    testPOId = TestUtils.generate.id();
    testSupplierId = TestUtils.generate.id();
    testProductId = TestUtils.generate.id();
    testWarehouseId = TestUtils.generate.id();
    testBranchId = TestUtils.generate.id();

    // Initialize service
    poService = new PurchaseOrderService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('generatePONumber', () => {
    it('should generate PO number for new day', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindFirst = vi.mocked(prisma.purchaseOrder.findFirst);
      mockFindFirst.mockResolvedValue(null);

      const result = await (poService as any).generatePONumber();

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(result).toMatch(new RegExp(`^PO-${today}-0001$`));
    });

    it('should increment sequence for existing POs on same day', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindFirst = vi.mocked(prisma.purchaseOrder.findFirst);

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      mockFindFirst.mockResolvedValue({
        poNumber: `PO-${today}-0005`,
      } as any);

      const result = await (poService as any).generatePONumber();

      expect(result).toBe(`PO-${today}-0006`);
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate Net 15 due date', () => {
      const receivedDate = new Date('2024-01-01');
      const expectedDueDate = new Date('2024-01-16');

      const result = poService.calculateDueDate('Net 15', receivedDate);

      expect(result.toISOString().slice(0, 10)).toBe(expectedDueDate.toISOString().slice(0, 10));
    });

    it('should calculate Net 30 due date', () => {
      const receivedDate = new Date('2024-01-01');
      const expectedDueDate = new Date('2024-01-31');

      const result = poService.calculateDueDate('Net 30', receivedDate);

      expect(result.toISOString().slice(0, 10)).toBe(expectedDueDate.toISOString().slice(0, 10));
    });

    it('should calculate Net 60 due date', () => {
      const receivedDate = new Date('2024-01-01');
      const expectedDueDate = new Date('2024-03-01');

      const result = poService.calculateDueDate('Net 60', receivedDate);

      expect(result.toISOString().slice(0, 10)).toBe(expectedDueDate.toISOString().slice(0, 10));
    });

    it('should handle COD payment terms', () => {
      const receivedDate = new Date('2024-01-01');

      const result = poService.calculateDueDate('COD', receivedDate);

      expect(result.toISOString().slice(0, 10)).toBe(receivedDate.toISOString().slice(0, 10));
    });

    it('should default to Net 30 for unknown payment terms', () => {
      const receivedDate = new Date('2024-01-01');
      const expectedDueDate = new Date('2024-01-31');

      const result = poService.calculateDueDate('Unknown Terms', receivedDate);

      expect(result.toISOString().slice(0, 10)).toBe(expectedDueDate.toISOString().slice(0, 10));
    });
  });

  describe('createPurchaseOrder', () => {
    const createPOData = {
      branchId: testBranchId,
      supplierId: testSupplierId,
      warehouseId: testWarehouseId,
      expectedDeliveryDate: new Date(),
      items: [
        {
          productId: testProductId,
          quantity: 100,
          unitPrice: 15.50,
          uom: 'PCS',
        },
      ],
      notes: 'Test purchase order',
    };

    it('should create purchase order successfully', async () => {
      const mockSupplier = {
        id: testSupplierId,
        status: 'active',
        companyName: 'Test Supplier',
      };

      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        status: 'active',
        baseUOM: 'PCS',
      };

      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        ...createPOData,
        totalAmount: 1550.00,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockResolvedValue(mockProduct as any);

      const mockCreate = vi.mocked(purchaseOrderRepository.create);
      mockCreate.mockResolvedValue(mockPO as any);

      const result = await poService.createPurchaseOrder(createPOData);

      expect(mockFindByIdSupplier).toHaveBeenCalledWith(testSupplierId);
      expect(mockFindByIdProduct).toHaveBeenCalledWith(testProductId);
      expect(mockCreate).toHaveBeenCalledWith({
        ...createPOData,
        poNumber: expect.stringMatching(/^PO-\d{8}-\d{4}$/),
        totalAmount: 1550.00,
      });
      expect(result).toEqual(mockPO);
    });

    it('should calculate total amount correctly', async () => {
      const multiItemData = {
        ...createPOData,
        items: [
          { productId: testProductId, quantity: 10, unitPrice: 20.00, uom: 'PCS' },
          { productId: TestUtils.generate.id(), quantity: 5, unitPrice: 50.00, uom: 'BOX' },
        ],
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProduct1 = { id: testProductId, name: 'Product 1', status: 'active' };
      const mockProduct2 = { id: multiItemData.items[1].productId, name: 'Product 2', status: 'active' };

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockImplementation((id: string) => {
        if (id === testProductId) return Promise.resolve(mockProduct1 as any);
        if (id === multiItemData.items[1].productId) return Promise.resolve(mockProduct2 as any);
        return Promise.resolve(null);
      });

      const mockCreate = vi.mocked(purchaseOrderRepository.create);
      mockCreate.mockResolvedValue({
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        ...multiItemData,
        totalAmount: 350.00, // (10 * 20) + (5 * 50) = 350
        status: 'draft',
      } as any);

      await poService.createPurchaseOrder(multiItemData);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 350.00,
        })
      );
    });

    it('should throw error for inactive supplier', async () => {
      const mockSupplier = {
        id: testSupplierId,
        status: 'inactive',
        companyName: 'Inactive Supplier',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(mockSupplier as any);

      await expect(
        poService.createPurchaseOrder(createPOData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for non-existent supplier', async () => {
      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        poService.createPurchaseOrder(createPOData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error for inactive product', async () => {
      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProduct = {
        id: testProductId,
        name: 'Inactive Product',
        status: 'inactive',
      };

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockResolvedValue(mockProduct as any);

      await expect(
        poService.createPurchaseOrder(createPOData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for empty items', async () => {
      const emptyItemsData = {
        ...createPOData,
        items: [],
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(mockSupplier as any);

      await expect(
        poService.createPurchaseOrder(emptyItemsData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid quantity', async () => {
      const invalidQuantityData = {
        ...createPOData,
        items: [
          { productId: testProductId, quantity: 0, unitPrice: 15.50 },
        ],
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProduct = { id: testProductId, status: 'active' };

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockResolvedValue(mockProduct as any);

      await expect(
        poService.createPurchaseOrder(invalidQuantityData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid unit price', async () => {
      const invalidPriceData = {
        ...createPOData,
        items: [
          { productId: testProductId, quantity: 100, unitPrice: 0 },
        ],
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProduct = { id: testProductId, status: 'active' };

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockResolvedValue(mockProduct as any);

      await expect(
        poService.createPurchaseOrder(invalidPriceData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updatePurchaseOrder', () => {
    const updateData = {
      notes: 'Updated notes',
      items: [
        {
          productId: testProductId,
          quantity: 150,
          unitPrice: 16.00,
          uom: 'PCS',
        },
      ],
    };

    it('should update purchase order successfully', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'draft',
        supplierId: testSupplierId,
        items: [],
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProduct = { id: testProductId, status: 'active' };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockResolvedValue(mockProduct as any);

      const mockUpdate = vi.mocked(purchaseOrderRepository.update);
      mockUpdate.mockResolvedValue({
        id: testPOId,
        ...mockExistingPO,
        ...updateData,
        totalAmount: 2400.00, // 150 * 16.00
      } as any);

      const result = await poService.updatePurchaseOrder(testPOId, updateData);

      expect(mockUpdate).toHaveBeenCalledWith(testPOId, {
        ...updateData,
        totalAmount: 2400.00,
      });
      expect(result.totalAmount).toBe(2400.00);
    });

    it('should allow status-only update from draft to ordered', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'draft',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockUpdate = vi.mocked(purchaseOrderRepository.update);
      mockUpdate.mockResolvedValue({
        ...mockExistingPO,
        status: 'ordered',
      } as any);

      const result = await poService.updatePurchaseOrder(testPOId, { status: 'ordered' });

      expect(mockUpdate).toHaveBeenCalledWith(testPOId, { status: 'ordered' });
      expect(result.status).toBe('ordered');
    });

    it('should allow status-only update from pending to ordered', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'pending',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockUpdate = vi.mocked(purchaseOrderRepository.update);
      mockUpdate.mockResolvedValue({
        ...mockExistingPO,
        status: 'ordered',
      } as any);

      const result = await poService.updatePurchaseOrder(testPOId, { status: 'pending' });

      expect(mockUpdate).toHaveBeenCalledWith(testPOId, { status: 'pending' });
    });

    it('should throw error for invalid status transition', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'ordered',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      await expect(
        poService.updatePurchaseOrder(testPOId, { status: 'draft' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error when updating non-draft/pending PO', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'ordered',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      await expect(
        poService.updatePurchaseOrder(testPOId, { notes: 'New notes' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for non-existent PO', async () => {
      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        poService.updatePurchaseOrder(testPOId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should allow any status change for Super Admin', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'draft',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockUpdate = vi.mocked(purchaseOrderRepository.update);
      mockUpdate.mockResolvedValue({
        ...mockExistingPO,
        status: 'received',
      } as any);

      const result = await poService.updatePurchaseOrder(testPOId, { status: 'received' }, true);

      expect(mockUpdate).toHaveBeenCalledWith(testPOId, { status: 'received' });
      expect(result.status).toBe('received');
    });
  });

  describe('cancelPurchaseOrder', () => {
    const cancelData = {
      reason: 'Supplier out of stock',
    };

    it('should cancel purchase order successfully', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'pending',
        notes: 'Original notes',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockUpdateStatus = vi.mocked(purchaseOrderRepository.updateStatus);
      const mockUpdate = vi.mocked(purchaseOrderRepository.update);

      mockUpdateStatus.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue({
        ...mockExistingPO,
        status: 'cancelled',
        notes: 'CANCELLED: Supplier out of stock\n\nOriginal Notes: Original notes',
      } as any);

      const result = await poService.cancelPurchaseOrder(testPOId, cancelData);

      expect(mockUpdateStatus).toHaveBeenCalledWith(testPOId, 'cancelled');
      expect(mockUpdate).toHaveBeenCalledWith(testPOId, {
        notes: 'CANCELLED: Supplier out of stock\n\nOriginal Notes: Original notes',
      });
      expect(result.status).toBe('cancelled');
      expect(result.notes).toContain('CANCELLED: Supplier out of stock');
    });

    it('should handle PO without original notes', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'draft',
        notes: null,
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockUpdateStatus = vi.mocked(purchaseOrderRepository.updateStatus);
      const mockUpdate = vi.mocked(purchaseOrderRepository.update);

      mockUpdateStatus.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue({
        ...mockExistingPO,
        status: 'cancelled',
        notes: 'CANCELLED: Supplier out of stock',
      } as any);

      await poService.cancelPurchaseOrder(testPOId, cancelData);

      expect(mockUpdate).toHaveBeenCalledWith(testPOId, {
        notes: 'CANCELLED: Supplier out of stock',
      });
    });

    it('should throw error when cancelling received PO', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'received',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      await expect(
        poService.cancelPurchaseOrder(testPOId, cancelData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error when cancelling already cancelled PO', async () => {
      const mockExistingPO = {
        id: testPOId,
        status: 'cancelled',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      await expect(
        poService.cancelPurchaseOrder(testPOId, cancelData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('receivePurchaseOrder', () => {
    it('should receive purchase order successfully', async () => {
      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        branchId: testBranchId,
        supplierId: testSupplierId,
        warehouseId: testWarehouseId,
        status: 'ordered',
        totalAmount: 1550.00,
        Supplier: {
          paymentTerms: 'Net 30',
        },
        PurchaseOrderItem: [
          {
            productId: testProductId,
            quantity: 100,
            unitPrice: 15.50,
            uom: 'PCS',
            Product: {
              id: testProductId,
              name: 'Test Product',
              baseUOM: 'PCS',
            },
          },
        ],
      };

      const mockAddStock = vi.mocked(inventoryService.addStock);
      mockAddStock.mockResolvedValue({} as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockUpdate = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockUpdate.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      const result = await poService.receivePurchaseOrder(testPOId);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: testPOId },
        include: {
          PurchaseOrderItem: {
            include: {
              Product: true,
            },
          },
          Supplier: true,
        },
      });

      expect(mockAddStock).toHaveBeenCalledWith({
        productId: testProductId,
        warehouseId: testWarehouseId,
        quantity: 100,
        uom: 'PCS',
        unitCost: 15.50,
        referenceId: testPOId,
        referenceType: 'PO',
        reason: `Received from PO PO-20241201-0001`,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: testPOId },
        data: {
          status: 'received',
          actualDeliveryDate: expect.any(Date),
        },
      });

      expect(mockCreateAP).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          branchId: testBranchId,
          supplierId: testSupplierId,
          purchaseOrderId: testPOId,
          totalAmount: 1550.00,
          paidAmount: 0,
          balance: 1550.00,
          dueDate: expect.any(Date),
          status: 'pending',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should calculate correct due date based on supplier payment terms', async () => {
      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        branchId: testBranchId,
        supplierId: testSupplierId,
        warehouseId: testWarehouseId,
        status: 'ordered',
        totalAmount: 1000.00,
        Supplier: {
          paymentTerms: 'Net 15',
        },
        PurchaseOrderItem: [
          {
            productId: testProductId,
            quantity: 50,
            unitPrice: 20.00,
            uom: 'PCS',
            Product: {
              id: testProductId,
              name: 'Test Product',
              baseUOM: 'PCS',
            },
          },
        ],
      };

      const mockAddStock = vi.mocked(inventoryService.addStock);
      mockAddStock.mockResolvedValue({} as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockUpdate = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockUpdate.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await poService.receivePurchaseOrder(testPOId);

      // Verify due date is calculated as Net 15 from received date
      const callArgs = mockCreateAP.mock.calls[0][0].data;
      const receivedDate = new Date();
      const expectedDueDate = new Date(receivedDate);
      expectedDueDate.setDate(expectedDueDate.getDate() + 15);

      expect(callArgs.dueDate.toDateString()).toBe(expectedDueDate.toDateString());
    });

    it('should throw error for already received PO', async () => {
      const mockPO = {
        id: testPOId,
        status: 'received',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        return await callback(prisma);
      });

      await expect(
        poService.receivePurchaseOrder(testPOId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for cancelled PO', async () => {
      const mockPO = {
        id: testPOId,
        status: 'cancelled',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        return await callback(prisma);
      });

      await expect(
        poService.receivePurchaseOrder(testPOId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for non-existent PO', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(null);
        return await callback(prisma);
      });

      await expect(
        poService.receivePurchaseOrder(testPOId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPurchaseOrderById', () => {
    it('should return purchase order by ID', async () => {
      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        status: 'draft',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockPO as any);

      const result = await poService.getPurchaseOrderById(testPOId);

      expect(mockFindById).toHaveBeenCalledWith(testPOId);
      expect(result).toEqual(mockPO);
    });

    it('should throw error for non-existent PO', async () => {
      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        poService.getPurchaseOrderById(testPOId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllPurchaseOrders', () => {
    it('should return all purchase orders with filters', async () => {
      const mockPOs = [
        {
          id: testPOId,
          poNumber: 'PO-20241201-0001',
          status: 'draft',
        },
      ];

      const mockFindAll = vi.mocked(purchaseOrderRepository.findAll);
      mockFindAll.mockResolvedValue(mockPOs as any);

      const filters = { branchId: testBranchId, status: 'draft' };
      const result = await poService.getAllPurchaseOrders(filters);

      expect(mockFindAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockPOs);
    });
  });

  describe('Business Logic Integration', () => {
    it('should handle complex multi-item PO creation', async () => {
      const complexPOData = {
        branchId: testBranchId,
        supplierId: testSupplierId,
        warehouseId: testWarehouseId,
        items: [
          { productId: TestUtils.generate.id(), quantity: 25, unitPrice: 12.50 },
          { productId: TestUtils.generate.id(), quantity: 40, unitPrice: 8.75 },
          { productId: TestUtils.generate.id(), quantity: 15, unitPrice: 22.00 },
        ],
        notes: 'Bulk order for Q4',
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProducts = [
        { id: complexPOData.items[0].productId, name: 'Product A', status: 'active' },
        { id: complexPOData.items[1].productId, name: 'Product B', status: 'active' },
        { id: complexPOData.items[2].productId, name: 'Product C', status: 'active' },
      ];

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockImplementation((id: string) => {
        const product = mockProducts.find(p => p.id === id);
        return Promise.resolve(product as any);
      });

      const mockCreate = vi.mocked(purchaseOrderRepository.create);
      mockCreate.mockResolvedValue({
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        ...complexPOData,
        totalAmount: 1020.00, // (25*12.50) + (40*8.75) + (15*22.00) = 312.5 + 350 + 330 = 992.5
        status: 'draft',
      } as any);

      await poService.createPurchaseOrder(complexPOData);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 992.50,
        })
      );
    });

    it('should handle PO receiving with multiple inventory batches', async () => {
      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        branchId: testBranchId,
        supplierId: testSupplierId,
        warehouseId: testWarehouseId,
        status: 'ordered',
        totalAmount: 2000.00,
        Supplier: {
          paymentTerms: 'Net 30',
        },
        PurchaseOrderItem: [
          {
            productId: TestUtils.generate.id(),
            quantity: 100,
            unitPrice: 10.00,
            Product: { id: 'prod1', name: 'Product 1', baseUOM: 'PCS' },
          },
          {
            productId: TestUtils.generate.id(),
            quantity: 50,
            unitPrice: 20.00,
            Product: { id: 'prod2', name: 'Product 2', baseUOM: 'BOX' },
          },
        ],
      };

      const mockAddStock = vi.mocked(inventoryService.addStock);
      mockAddStock.mockResolvedValue({} as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockUpdate = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockUpdate.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await poService.receivePurchaseOrder(testPOId);

      expect(mockAddStock).toHaveBeenCalledTimes(2);
      expect(mockAddStock).toHaveBeenNthCalledWith(1, {
        productId: 'prod1',
        warehouseId: testWarehouseId,
        quantity: 100,
        uom: 'PCS',
        unitCost: 10.00,
        referenceId: testPOId,
        referenceType: 'PO',
        reason: `Received from PO PO-20241201-0001`,
      });
      expect(mockAddStock).toHaveBeenNthCalledWith(2, {
        productId: 'prod2',
        warehouseId: testWarehouseId,
        quantity: 50,
        uom: 'BOX',
        unitCost: 20.00,
        referenceId: testPOId,
        referenceType: 'PO',
        reason: `Received from PO PO-20241201-0001`,
      });
    });

    it('should handle status transition workflow correctly', async () => {
      // Test the complete workflow: draft -> ordered -> received

      // 1. Create draft PO
      const createData = {
        branchId: testBranchId,
        supplierId: testSupplierId,
        warehouseId: testWarehouseId,
        items: [{ productId: testProductId, quantity: 100, unitPrice: 15.00 }],
      };

      const mockSupplier = { id: testSupplierId, status: 'active' };
      const mockProduct = { id: testProductId, status: 'active' };

      const mockFindByIdSupplier = vi.mocked(supplierRepository.findById);
      mockFindByIdSupplier.mockResolvedValue(mockSupplier as any);

      const mockFindByIdProduct = vi.mocked(productRepository.findById);
      mockFindByIdProduct.mockResolvedValue(mockProduct as any);

      const mockCreate = vi.mocked(purchaseOrderRepository.create);
      mockCreate.mockResolvedValue({
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        ...createData,
        totalAmount: 1500.00,
        status: 'draft',
      } as any);

      await poService.createPurchaseOrder(createData);

      // 2. Update to ordered
      const mockExistingPO = {
        id: testPOId,
        status: 'draft',
      };

      const mockFindById = vi.mocked(purchaseOrderRepository.findById);
      mockFindById.mockResolvedValue(mockExistingPO as any);

      const mockUpdate = vi.mocked(purchaseOrderRepository.update);
      mockUpdate.mockResolvedValue({
        ...mockExistingPO,
        status: 'ordered',
      } as any);

      await poService.updatePurchaseOrder(testPOId, { status: 'ordered' });

      // 3. Receive the PO
      const mockReceivedPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        branchId: testBranchId,
        supplierId: testSupplierId,
        warehouseId: testWarehouseId,
        status: 'ordered',
        totalAmount: 1500.00,
        Supplier: { paymentTerms: 'Net 30' },
        PurchaseOrderItem: [{
          productId: testProductId,
          quantity: 100,
          unitPrice: 15.00,
          Product: { id: testProductId, name: 'Test Product', baseUOM: 'PCS' },
        }],
      };

      const mockAddStock = vi.mocked(inventoryService.addStock);
      mockAddStock.mockResolvedValue({} as any);

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockReceivedPO as any);
        mockUpdatePO.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await poService.receivePurchaseOrder(testPOId);

      // Verify the complete workflow
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          poNumber: expect.stringMatching(/^PO-\d{8}-\d{4}$/),
          status: 'draft',
        })
      );

      expect(mockUpdate).toHaveBeenCalledWith(testPOId, { status: 'ordered' });

      expect(mockUpdatePO).toHaveBeenCalledWith({
        where: { id: testPOId },
        data: {
          status: 'received',
          actualDeliveryDate: expect.any(Date),
        },
      });

      expect(mockCreateAP).toHaveBeenCalledWith({
        data: expect.objectContaining({
          purchaseOrderId: testPOId,
          totalAmount: 1500.00,
          status: 'pending',
        }),
      });
    });
  });
});
