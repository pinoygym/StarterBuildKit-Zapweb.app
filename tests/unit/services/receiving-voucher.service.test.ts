import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceivingVoucherService } from '@/services/receiving-voucher.service';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock repository
vi.mock('@/repositories/receiving-voucher.repository');

describe('ReceivingVoucherService', () => {
  let rvService: ReceivingVoucherService;
  let dbTestBase: DatabaseTestBase;
  let testRVId: string;
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
    testRVId = TestUtils.generate.id();
    testPOId = TestUtils.generate.id();
    testSupplierId = TestUtils.generate.id();
    testProductId = TestUtils.generate.id();
    testWarehouseId = TestUtils.generate.id();
    testBranchId = TestUtils.generate.id();

    // Initialize service
    rvService = new ReceivingVoucherService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('generateRVNumber', () => {
    it('should generate RV number for new day', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindFirst = vi.mocked(prisma.receivingVoucher.findFirst);
      mockFindFirst.mockResolvedValue(null);

      const result = await rvService.generateRVNumber();

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(result).toMatch(new RegExp(`^RV-${today}-0001$`));
    });

    it('should increment sequence for existing RVs on same day', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockFindFirst = vi.mocked(prisma.receivingVoucher.findFirst);

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      mockFindFirst.mockResolvedValue({
        rvNumber: `RV-${today}-0005`,
      } as any);

      const result = await rvService.generateRVNumber();

      expect(result).toBe(`RV-${today}-0006`);
    });
  });

  describe('createReceivingVoucher', () => {
    const createRVData = {
      purchaseOrderId: testPOId,
      receiverName: 'John Doe',
      deliveryNotes: 'Delivered on time',
      items: [
        {
          productId: testProductId,
          orderedQuantity: 100,
          receivedQuantity: 95,
          unitPrice: 15.50,
          varianceReason: 'Damaged during transport',
        },
      ],
    };

    it('should create receiving voucher successfully', async () => {
      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        status: 'ordered',
        warehouseId: testWarehouseId,
        branchId: testBranchId,
        Supplier: {
          id: testSupplierId,
          paymentTerms: 'Net 30',
        },
        Warehouse: { id: testWarehouseId, name: 'Main Warehouse' },
        Branch: { id: testBranchId, name: 'Main Branch' },
        PurchaseOrderItem: [
          {
            id: 'po-item-1',
            productId: testProductId,
            quantity: 100,
            unitPrice: 15.50,
            receivedQuantity: 0,
            Product: {
              id: testProductId,
              name: 'Test Product',
              shelfLifeDays: 365,
            },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockCreateRV = vi.mocked(prisma.receivingVoucher.create);
      const mockCreateMany = vi.mocked(prisma.receivingVoucherItem.createMany);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);
      const mockUpdatePOItem = vi.mocked(prisma.purchaseOrderItem.update);
      const mockFindMany = vi.mocked(prisma.purchaseOrderItem.findMany);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);
      const mockCount = vi.mocked(prisma.inventoryBatch.count);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockCreateRV.mockResolvedValue({
          id: testRVId,
          rvNumber: 'RV-20241201-0001',
          ...createRVData,
          status: 'complete',
          totalOrderedAmount: 1550.00,
          totalReceivedAmount: 1472.50,
          varianceAmount: -77.50,
        } as any);
        mockCreateMany.mockResolvedValue({ count: 1 });
        mockCount.mockResolvedValue(0);
        mockCreateBatch.mockResolvedValue({ id: 'batch-1' } as any);
        mockCreateMovement.mockResolvedValue({} as any);
        mockUpdatePOItem.mockResolvedValue({} as any);
        mockFindMany.mockResolvedValue([
          { id: 'po-item-1', receivedQuantity: 95, quantity: 100 },
        ] as any);
        mockUpdatePO.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      const result = await rvService.createReceivingVoucher(createRVData);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: testPOId },
        include: {
          PurchaseOrderItem: { include: { Product: true } },
          Supplier: true,
          Warehouse: true,
          Branch: true,
        },
      });

      expect(mockCreateRV).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rvNumber: expect.stringMatching(/^RV-\d{8}-\d{4}$/),
          purchaseOrderId: testPOId,
          warehouseId: testWarehouseId,
          branchId: testBranchId,
          receiverName: 'John Doe',
          deliveryNotes: 'Delivered on time',
          status: 'complete',
          totalOrderedAmount: 1550.00,
          totalReceivedAmount: 1472.50,
          varianceAmount: -77.50,
        }),
      });

      expect(mockCreateBatch).toHaveBeenCalledWith({
        data: expect.objectContaining({
          batchNumber: 'BATCH-000001',
          productId: testProductId,
          warehouseId: testWarehouseId,
          quantity: 95,
          unitCost: 15.50,
          status: 'active',
        }),
      });

      expect(mockCreateMovement).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'IN',
          quantity: 95,
          reason: expect.stringContaining('RV-'),
          referenceType: 'RV',
        }),
      });
    });

    it('should calculate variance correctly', async () => {
      const varianceData = {
        ...createRVData,
        items: [
          {
            productId: testProductId,
            orderedQuantity: 100,
            receivedQuantity: 105, // Over delivery
            unitPrice: 10.00,
            varianceReason: 'Bonus quantity',
          },
        ],
      };

      const mockPO = {
        id: testPOId,
        status: 'ordered',
        warehouseId: testWarehouseId,
        branchId: testBranchId,
        Supplier: { id: testSupplierId, paymentTerms: 'Net 30' },
        Warehouse: { id: testWarehouseId },
        Branch: { id: testBranchId },
        PurchaseOrderItem: [
          {
            id: 'po-item-1',
            productId: testProductId,
            quantity: 100,
            unitPrice: 10.00,
            receivedQuantity: 0,
            Product: { id: testProductId, name: 'Test Product', shelfLifeDays: 365 },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockCreateRV = vi.mocked(prisma.receivingVoucher.create);
      const mockCreateMany = vi.mocked(prisma.receivingVoucherItem.createMany);
      const mockCount = vi.mocked(prisma.inventoryBatch.count);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);
      const mockUpdatePOItem = vi.mocked(prisma.purchaseOrderItem.update);
      const mockFindMany = vi.mocked(prisma.purchaseOrderItem.findMany);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockCreateRV.mockResolvedValue({
          id: testRVId,
          rvNumber: 'RV-20241201-0001',
          ...varianceData,
          status: 'complete',
          totalOrderedAmount: 1000.00,
          totalReceivedAmount: 1050.00,
          varianceAmount: 50.00,
        } as any);
        mockCreateMany.mockResolvedValue({ count: 1 });
        mockCount.mockResolvedValue(0);
        mockCreateBatch.mockResolvedValue({ id: 'batch-1' } as any);
        mockCreateMovement.mockResolvedValue({} as any);
        mockUpdatePOItem.mockResolvedValue({} as any);
        mockFindMany.mockResolvedValue([
          { id: 'po-item-1', receivedQuantity: 105, quantity: 100 },
        ] as any);
        mockUpdatePO.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await rvService.createReceivingVoucher(varianceData);

      expect(mockCreateRV).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalOrderedAmount: 1000.00,
          totalReceivedAmount: 1050.00,
          varianceAmount: 50.00,
        }),
      });

      expect(mockCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            orderedQuantity: 100,
            receivedQuantity: 105,
            varianceQuantity: 5,
            variancePercentage: 5.00,
            varianceReason: 'Bonus quantity',
            unitPrice: 10.00,
            lineTotal: 1050.00,
          }),
        ]),
      });
    });

    it('should handle partial receiving correctly', async () => {
      const partialData = {
        ...createRVData,
        items: [
          {
            productId: testProductId,
            orderedQuantity: 100,
            receivedQuantity: 50, // Partial receipt
            unitPrice: 10.00,
          },
        ],
      };

      const mockPO = {
        id: testPOId,
        status: 'ordered',
        warehouseId: testWarehouseId,
        branchId: testBranchId,
        Supplier: { id: testSupplierId, paymentTerms: 'Net 30' },
        Warehouse: { id: testWarehouseId },
        Branch: { id: testBranchId },
        PurchaseOrderItem: [
          {
            id: 'po-item-1',
            productId: testProductId,
            quantity: 100,
            unitPrice: 10.00,
            receivedQuantity: 0,
            Product: { id: testProductId, name: 'Test Product', shelfLifeDays: 365 },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockCreateRV = vi.mocked(prisma.receivingVoucher.create);
      const mockCreateMany = vi.mocked(prisma.receivingVoucherItem.createMany);
      const mockCount = vi.mocked(prisma.inventoryBatch.count);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);
      const mockUpdatePOItem = vi.mocked(prisma.purchaseOrderItem.update);
      const mockFindMany = vi.mocked(prisma.purchaseOrderItem.findMany);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockCreateRV.mockResolvedValue({ id: testRVId } as any);
        mockCreateMany.mockResolvedValue({ count: 1 });
        mockCount.mockResolvedValue(0);
        mockCreateBatch.mockResolvedValue({ id: 'batch-1' } as any);
        mockCreateMovement.mockResolvedValue({} as any);
        mockUpdatePOItem.mockResolvedValue({} as any);
        mockFindMany.mockResolvedValue([
          { id: 'po-item-1', receivedQuantity: 50, quantity: 100 },
        ] as any);
        mockUpdatePO.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await rvService.createReceivingVoucher(partialData);

      expect(mockUpdatePO).toHaveBeenCalledWith({
        where: { id: testPOId },
        data: {
          receivingStatus: 'partially_received',
          status: 'ordered', // Not fully received yet
          actualDeliveryDate: null,
        },
      });
    });

    it('should handle full receiving and create AP record', async () => {
      const fullData = {
        ...createRVData,
        items: [
          {
            productId: testProductId,
            orderedQuantity: 100,
            receivedQuantity: 100, // Full receipt
            unitPrice: 10.00,
          },
        ],
      };

      const mockPO = {
        id: testPOId,
        status: 'ordered',
        warehouseId: testWarehouseId,
        branchId: testBranchId,
        Supplier: { id: testSupplierId, paymentTerms: 'Net 30' },
        Warehouse: { id: testWarehouseId },
        Branch: { id: testBranchId },
        PurchaseOrderItem: [
          {
            id: 'po-item-1',
            productId: testProductId,
            quantity: 100,
            unitPrice: 10.00,
            receivedQuantity: 0,
            Product: { id: testProductId, name: 'Test Product', shelfLifeDays: 365 },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockCreateRV = vi.mocked(prisma.receivingVoucher.create);
      const mockCreateMany = vi.mocked(prisma.receivingVoucherItem.createMany);
      const mockCount = vi.mocked(prisma.inventoryBatch.count);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);
      const mockUpdatePOItem = vi.mocked(prisma.purchaseOrderItem.update);
      const mockFindMany = vi.mocked(prisma.purchaseOrderItem.findMany);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockCreateRV.mockResolvedValue({ id: testRVId } as any);
        mockCreateMany.mockResolvedValue({ count: 1 });
        mockCount.mockResolvedValue(0);
        mockCreateBatch.mockResolvedValue({ id: 'batch-1' } as any);
        mockCreateMovement.mockResolvedValue({} as any);
        mockUpdatePOItem.mockResolvedValue({} as any);
        mockFindMany.mockResolvedValue([
          { id: 'po-item-1', receivedQuantity: 100, quantity: 100 },
        ] as any);
        mockUpdatePO.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await rvService.createReceivingVoucher(fullData);

      expect(mockUpdatePO).toHaveBeenCalledWith({
        where: { id: testPOId },
        data: {
          receivingStatus: 'fully_received',
          status: 'received',
          actualDeliveryDate: expect.any(Date),
        },
      });

      expect(mockCreateAP).toHaveBeenCalledWith({
        data: expect.objectContaining({
          branchId: testBranchId,
          supplierId: testSupplierId,
          purchaseOrderId: testPOId,
          totalAmount: 1000.00,
          paidAmount: 0,
          balance: 1000.00,
          status: 'pending',
        }),
      });
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
        rvService.createReceivingVoucher(createRVData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error for PO not in ordered status', async () => {
      const mockPO = {
        id: testPOId,
        status: 'draft',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        return await callback(prisma);
      });

      await expect(
        rvService.createReceivingVoucher(createRVData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error when no items received', async () => {
      const noItemsData = {
        ...createRVData,
        items: [
          {
            productId: testProductId,
            orderedQuantity: 100,
            receivedQuantity: 0, // No items received
            unitPrice: 15.50,
          },
        ],
      };

      const mockPO = {
        id: testPOId,
        status: 'ordered',
        PurchaseOrderItem: [],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        return await callback(prisma);
      });

      await expect(
        rvService.createReceivingVoucher(noItemsData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate Net 15 due date', () => {
      const fromDate = new Date('2024-01-01');
      const expectedDueDate = new Date('2024-01-16');

      const result = (rvService as any).calculateDueDate('Net 15', fromDate);

      expect(result.toISOString().slice(0, 10)).toBe(expectedDueDate.toISOString().slice(0, 10));
    });

    it('should calculate Net 30 due date', () => {
      const fromDate = new Date('2024-01-01');
      const expectedDueDate = new Date('2024-01-31');

      const result = (rvService as any).calculateDueDate('Net 30', fromDate);

      expect(result.toISOString().slice(0, 10)).toBe(expectedDueDate.toISOString().slice(0, 10));
    });

    it('should handle COD payment terms', () => {
      const fromDate = new Date('2024-01-01');

      const result = (rvService as any).calculateDueDate('COD', fromDate);

      expect(result.toISOString().slice(0, 10)).toBe(fromDate.toISOString().slice(0, 10));
    });
  });

  describe('getReceivingVoucherById', () => {
    it('should return receiving voucher by ID', async () => {
      const mockRV = {
        id: testRVId,
        rvNumber: 'RV-20241201-0001',
        status: 'complete',
      };

      const mockFindById = vi.mocked(receivingVoucherRepository.findById);
      mockFindById.mockResolvedValue(mockRV as any);

      const result = await rvService.getReceivingVoucherById(testRVId);

      expect(mockFindById).toHaveBeenCalledWith(testRVId);
      expect(result).toEqual(mockRV);
    });

    it('should throw error for non-existent RV', async () => {
      const mockFindById = vi.mocked(receivingVoucherRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        rvService.getReceivingVoucherById(testRVId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getReceivingVoucherByNumber', () => {
    it('should return receiving voucher by RV number', async () => {
      const mockRV = {
        id: testRVId,
        rvNumber: 'RV-20241201-0001',
        status: 'complete',
      };

      const mockFindByRVNumber = vi.mocked(receivingVoucherRepository.findByRVNumber);
      mockFindByRVNumber.mockResolvedValue(mockRV as any);

      const result = await rvService.getReceivingVoucherByNumber('RV-20241201-0001');

      expect(mockFindByRVNumber).toHaveBeenCalledWith('RV-20241201-0001');
      expect(result).toEqual(mockRV);
    });

    it('should throw error for non-existent RV number', async () => {
      const mockFindByRVNumber = vi.mocked(receivingVoucherRepository.findByRVNumber);
      mockFindByRVNumber.mockResolvedValue(null);

      await expect(
        rvService.getReceivingVoucherByNumber('RV-20241201-9999')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('listReceivingVouchers', () => {
    it('should return filtered receiving vouchers', async () => {
      const mockRVs = [
        {
          id: testRVId,
          rvNumber: 'RV-20241201-0001',
          status: 'complete',
        },
      ];

      const mockFindMany = vi.mocked(receivingVoucherRepository.findMany);
      mockFindMany.mockResolvedValue(mockRVs as any);

      const filters = { branchId: testBranchId, status: 'complete' };
      const result = await rvService.listReceivingVouchers(filters);

      expect(mockFindMany).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockRVs);
    });
  });

  describe('getReceivingVouchersByPO', () => {
    it('should return RVs for a purchase order', async () => {
      const mockRVs = [
        {
          id: testRVId,
          rvNumber: 'RV-20241201-0001',
          purchaseOrderId: testPOId,
        },
      ];

      const mockFindByPurchaseOrderId = vi.mocked(receivingVoucherRepository.findByPurchaseOrderId);
      mockFindByPurchaseOrderId.mockResolvedValue(mockRVs as any);

      const result = await rvService.getReceivingVouchersByPO(testPOId);

      expect(mockFindByPurchaseOrderId).toHaveBeenCalledWith(testPOId);
      expect(result).toEqual(mockRVs);
    });
  });

  describe('generateVarianceReport', () => {
    it('should generate variance report by supplier', async () => {
      const mockRVs = [
        {
          PurchaseOrder: {
            Supplier: {
              id: testSupplierId,
              companyName: 'Test Supplier',
            },
          },
          ReceivingVoucherItem: [
            {
              productId: testProductId,
              orderedQuantity: 100,
              receivedQuantity: 95,
              varianceQuantity: -5,
              Product: { name: 'Test Product' },
            },
            {
              productId: 'prod2',
              orderedQuantity: 50,
              receivedQuantity: 52,
              varianceQuantity: 2,
              Product: { name: 'Product 2' },
            },
          ],
        },
      ];

      const mockFindMany = vi.mocked(receivingVoucherRepository.findMany);
      mockFindMany.mockResolvedValue(mockRVs as any);

      const result = await rvService.generateVarianceReport({
        branchId: testBranchId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        supplierId: testSupplierId,
        supplierName: 'Test Supplier',
        totalPOs: 1,
        averageVariancePercentage: 100.00, // 2 out of 2 items have variance
        overDeliveryCount: 1,
        underDeliveryCount: 1,
        exactMatchCount: 0,
        products: expect.arrayContaining([
          expect.objectContaining({
            productId: testProductId,
            productName: 'Test Product',
            totalOrdered: 100,
            totalReceived: 95,
            totalVariance: -5,
            varianceFrequency: 1,
          }),
          expect.objectContaining({
            productId: 'prod2',
            productName: 'Product 2',
            totalOrdered: 50,
            totalReceived: 52,
            totalVariance: 2,
            varianceFrequency: 1,
          }),
        ]),
      });
    });

    it('should handle multiple suppliers and aggregate data', async () => {
      const mockRVs = [
        {
          PurchaseOrder: {
            Supplier: {
              id: 'supplier1',
              companyName: 'Supplier 1',
            },
          },
          ReceivingVoucherItem: [
            {
              productId: testProductId,
              orderedQuantity: 100,
              receivedQuantity: 100,
              varianceQuantity: 0,
              Product: { name: 'Test Product' },
            },
          ],
        },
        {
          PurchaseOrder: {
            Supplier: {
              id: 'supplier2',
              companyName: 'Supplier 2',
            },
          },
          ReceivingVoucherItem: [
            {
              productId: 'prod2',
              orderedQuantity: 50,
              receivedQuantity: 45,
              varianceQuantity: -5,
              Product: { name: 'Product 2' },
            },
          ],
        },
      ];

      const mockFindMany = vi.mocked(receivingVoucherRepository.findMany);
      mockFindMany.mockResolvedValue(mockRVs as any);

      const result = await rvService.generateVarianceReport({
        branchId: testBranchId,
      });

      expect(result).toHaveLength(2);

      const supplier1Report = result.find(r => r.supplierId === 'supplier1');
      const supplier2Report = result.find(r => r.supplierId === 'supplier2');

      expect(supplier1Report?.averageVariancePercentage).toBe(0.00); // No variance
      expect(supplier2Report?.averageVariancePercentage).toBe(100.00); // 1 out of 1 item has variance
    });

    it('should aggregate product variances across multiple RVs', async () => {
      const mockRVs = [
        {
          PurchaseOrder: {
            Supplier: {
              id: testSupplierId,
              companyName: 'Test Supplier',
            },
          },
          ReceivingVoucherItem: [
            {
              productId: testProductId,
              orderedQuantity: 100,
              receivedQuantity: 95,
              varianceQuantity: -5,
              Product: { name: 'Test Product' },
            },
          ],
        },
        {
          PurchaseOrder: {
            Supplier: {
              id: testSupplierId,
              companyName: 'Test Supplier',
            },
          },
          ReceivingVoucherItem: [
            {
              productId: testProductId,
              orderedQuantity: 50,
              receivedQuantity: 52,
              varianceQuantity: 2,
              Product: { name: 'Test Product' },
            },
          ],
        },
      ];

      const mockFindMany = vi.mocked(receivingVoucherRepository.findMany);
      mockFindMany.mockResolvedValue(mockRVs as any);

      const result = await rvService.generateVarianceReport({});

      expect(result).toHaveLength(1);
      const supplierReport = result[0];
      const productVariance = supplierReport.products.find(p => p.productId === testProductId);

      expect(productVariance).toEqual({
        productId: testProductId,
        productName: 'Test Product',
        totalOrdered: 150, // 100 + 50
        totalReceived: 147, // 95 + 52
        totalVariance: -3, // -5 + 2
        varianceFrequency: 2,
      });
    });
  });

  describe('Business Logic Integration', () => {
    it('should handle complete receiving workflow with inventory integration', async () => {
      const workflowData = {
        purchaseOrderId: testPOId,
        receiverName: 'Jane Smith',
        deliveryNotes: 'All items in good condition',
        items: [
          {
            productId: 'prod1',
            orderedQuantity: 100,
            receivedQuantity: 98,
            unitPrice: 25.00,
            varianceReason: 'Minor damage',
          },
          {
            productId: 'prod2',
            orderedQuantity: 50,
            receivedQuantity: 50,
            unitPrice: 15.00,
          },
        ],
      };

      const mockPO = {
        id: testPOId,
        poNumber: 'PO-20241201-0001',
        status: 'ordered',
        warehouseId: testWarehouseId,
        branchId: testBranchId,
        Supplier: { id: testSupplierId, paymentTerms: 'Net 15' },
        Warehouse: { id: testWarehouseId },
        Branch: { id: testBranchId },
        PurchaseOrderItem: [
          {
            id: 'po-item-1',
            productId: 'prod1',
            quantity: 100,
            unitPrice: 25.00,
            receivedQuantity: 0,
            Product: { id: 'prod1', name: 'Product 1', shelfLifeDays: 180 },
          },
          {
            id: 'po-item-2',
            productId: 'prod2',
            quantity: 50,
            unitPrice: 15.00,
            receivedQuantity: 0,
            Product: { id: 'prod2', name: 'Product 2', shelfLifeDays: 365 },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockCreateRV = vi.mocked(prisma.receivingVoucher.create);
      const mockCreateMany = vi.mocked(prisma.receivingVoucherItem.createMany);
      const mockCount = vi.mocked(prisma.inventoryBatch.count);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);
      const mockUpdatePOItem = vi.mocked(prisma.purchaseOrderItem.update);
      const mockFindMany = vi.mocked(prisma.purchaseOrderItem.findMany);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);
      const mockCreateAP = vi.mocked(prisma.accountsPayable.create);

      let batchCounter = 0;
      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockCreateRV.mockResolvedValue({
          id: testRVId,
          rvNumber: 'RV-20241201-0001',
        } as any);
        mockCreateMany.mockResolvedValue({ count: 2 });
        mockCount.mockResolvedValue(0);
        mockCreateBatch.mockImplementation(() => {
          batchCounter++;
          return Promise.resolve({ id: `batch-${batchCounter}` } as any);
        });
        mockCreateMovement.mockResolvedValue({} as any);
        mockUpdatePOItem.mockResolvedValue({} as any);
        mockFindMany.mockResolvedValue([
          { id: 'po-item-1', receivedQuantity: 98, quantity: 100 },
          { id: 'po-item-2', receivedQuantity: 50, quantity: 50 },
        ] as any);
        mockUpdatePO.mockResolvedValue({} as any);
        mockCreateAP.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await rvService.createReceivingVoucher(workflowData);

      // Verify RV creation
      expect(mockCreateRV).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rvNumber: expect.stringMatching(/^RV-\d{8}-\d{4}$/),
          totalOrderedAmount: 3750.00, // (100*25) + (50*15) = 2500 + 750 = 3750
          totalReceivedAmount: 3690.00, // (98*25) + (50*15) = 2450 + 750 = 3690
          varianceAmount: -60.00, // 3690 - 3750 = -60
        }),
      });

      // Verify inventory batches created for each item
      expect(mockCreateBatch).toHaveBeenCalledTimes(2);
      expect(mockCreateBatch).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          batchNumber: 'BATCH-000001',
          productId: 'prod1',
          warehouseId: testWarehouseId,
          quantity: 98,
          unitCost: 25.00,
          status: 'active',
        }),
      });
      expect(mockCreateBatch).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          batchNumber: 'BATCH-000002',
          productId: 'prod2',
          warehouseId: testWarehouseId,
          quantity: 50,
          unitCost: 15.00,
          status: 'active',
        }),
      });

      // Verify stock movements recorded
      expect(mockCreateMovement).toHaveBeenCalledTimes(2);

      // Verify PO items updated
      expect(mockUpdatePOItem).toHaveBeenCalledTimes(2);

      // Verify PO status updated to partially received (not all items fully received)
      expect(mockUpdatePO).toHaveBeenCalledWith({
        where: { id: testPOId },
        data: {
          receivingStatus: 'partially_received',
          status: 'ordered',
          actualDeliveryDate: null,
        },
      });

      // AP should not be created for partial receipt
      expect(mockCreateAP).not.toHaveBeenCalled();
    });

    it('should handle quality control and variance analysis', async () => {
      const qualityData = {
        purchaseOrderId: testPOId,
        receiverName: 'Quality Inspector',
        deliveryNotes: 'Quality inspection completed',
        items: [
          {
            productId: 'prod1',
            orderedQuantity: 100,
            receivedQuantity: 85,
            unitPrice: 20.00,
            varianceReason: 'Failed quality inspection - 15 units rejected',
          },
          {
            productId: 'prod2',
            orderedQuantity: 50,
            receivedQuantity: 52,
            unitPrice: 30.00,
            varianceReason: 'Bonus quantity from supplier',
          },
          {
            productId: 'prod3',
            orderedQuantity: 25,
            receivedQuantity: 25,
            unitPrice: 40.00,
          },
        ],
      };

      const mockPO = {
        id: testPOId,
        status: 'ordered',
        warehouseId: testWarehouseId,
        branchId: testBranchId,
        Supplier: { id: testSupplierId, paymentTerms: 'Net 30' },
        Warehouse: { id: testWarehouseId },
        Branch: { id: testBranchId },
        PurchaseOrderItem: [
          {
            id: 'po-item-1',
            productId: 'prod1',
            quantity: 100,
            unitPrice: 20.00,
            receivedQuantity: 0,
            Product: { id: 'prod1', name: 'Product 1', shelfLifeDays: 90 },
          },
          {
            id: 'po-item-2',
            productId: 'prod2',
            quantity: 50,
            unitPrice: 30.00,
            receivedQuantity: 0,
            Product: { id: 'prod2', name: 'Product 2', shelfLifeDays: 180 },
          },
          {
            id: 'po-item-3',
            productId: 'prod3',
            quantity: 25,
            unitPrice: 40.00,
            receivedQuantity: 0,
            Product: { id: 'prod3', name: 'Product 3', shelfLifeDays: 365 },
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.purchaseOrder.findUnique);
      const mockCreateRV = vi.mocked(prisma.receivingVoucher.create);
      const mockCreateMany = vi.mocked(prisma.receivingVoucherItem.createMany);
      const mockCount = vi.mocked(prisma.inventoryBatch.count);
      const mockCreateBatch = vi.mocked(prisma.inventoryBatch.create);
      const mockCreateMovement = vi.mocked(prisma.stockMovement.create);
      const mockUpdatePOItem = vi.mocked(prisma.purchaseOrderItem.update);
      const mockFindMany = vi.mocked(prisma.purchaseOrderItem.findMany);
      const mockUpdatePO = vi.mocked(prisma.purchaseOrder.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockPO as any);
        mockCreateRV.mockResolvedValue({
          id: testRVId,
          rvNumber: 'RV-20241201-0001',
        } as any);
        mockCreateMany.mockResolvedValue({ count: 3 });
        mockCount.mockResolvedValue(0);
        mockCreateBatch.mockResolvedValue({ id: 'batch-1' } as any);
        mockCreateMovement.mockResolvedValue({} as any);
        mockUpdatePOItem.mockResolvedValue({} as any);
        mockFindMany.mockResolvedValue([
          { id: 'po-item-1', receivedQuantity: 85, quantity: 100 },
          { id: 'po-item-2', receivedQuantity: 52, quantity: 50 },
          { id: 'po-item-3', receivedQuantity: 25, quantity: 25 },
        ] as any);
        mockUpdatePO.mockResolvedValue({} as any);
        return await callback(prisma);
      });

      await rvService.createReceivingVoucher(qualityData);

      // Verify variance calculations
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            productId: 'prod1',
            orderedQuantity: 100,
            receivedQuantity: 85,
            varianceQuantity: -15,
            variancePercentage: -15.00,
            varianceReason: 'Failed quality inspection - 15 units rejected',
            unitPrice: 20.00,
            lineTotal: 1700.00,
          }),
          expect.objectContaining({
            productId: 'prod2',
            orderedQuantity: 50,
            receivedQuantity: 52,
            varianceQuantity: 2,
            variancePercentage: 4.00,
            varianceReason: 'Bonus quantity from supplier',
            unitPrice: 30.00,
            lineTotal: 1560.00,
          }),
          expect.objectContaining({
            productId: 'prod3',
            orderedQuantity: 25,
            receivedQuantity: 25,
            varianceQuantity: 0,
            variancePercentage: 0.00,
            varianceReason: null,
            unitPrice: 40.00,
            lineTotal: 1000.00,
          }),
        ]),
      });

      // Verify RV totals
      expect(mockCreateRV).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalOrderedAmount: 4500.00, // (100*20) + (50*30) + (25*40) = 2000 + 1500 + 1000 = 4500
          totalReceivedAmount: 4260.00, // (85*20) + (52*30) + (25*40) = 1700 + 1560 + 1000 = 4260
          varianceAmount: -240.00, // 4260 - 4500 = -240
        }),
      });

      // Verify inventory batches created only for received quantities > 0
      expect(mockCreateBatch).toHaveBeenCalledTimes(3);
      expect(mockCreateMovement).toHaveBeenCalledTimes(3);
    });
  });
});
