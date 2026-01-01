import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceivingVoucherService } from '@/services/receiving-voucher.service';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { purchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
vi.mock('@/repositories/receiving-voucher.repository');
vi.mock('@/repositories/purchase-order.repository');
vi.mock('@/services/inventory.service');

// Mock Prisma with proper transaction support
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    purchaseOrder: {
      findFirst: vi.fn(),
    },
    receivingVoucher: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('ReceivingVoucherService', () => {
  let service: ReceivingVoucherService;
  let lastTxMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReceivingVoucherService();
    lastTxMock = undefined;
  });

  describe('getReceivingVoucherById', () => {
    it('should return receiving voucher when found', async () => {
      const mockRV = {
        id: 'rv-1',
        rvNumber: 'RV-20241114-0001',
        purchaseOrderId: 'po-1',
        receiverName: 'John Doe',
        items: [],
      };

      vi.mocked(receivingVoucherRepository.findById).mockResolvedValue(mockRV as any);

      const result = await service.getReceivingVoucherById('rv-1');

      expect(result).toEqual(mockRV);
      expect(receivingVoucherRepository.findById).toHaveBeenCalledWith('rv-1');
    });

    it('should throw NotFoundError when RV not found', async () => {
      vi.mocked(receivingVoucherRepository.findById).mockResolvedValue(null);

      await expect(service.getReceivingVoucherById('invalid-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('createReceivingVoucher', () => {
    const validRVData = {
      purchaseOrderId: 'po-1',
      receiverName: 'John Doe',
      deliveryNotes: 'Good condition',
      items: [
        {
          productId: 'product-1',
          orderedQuantity: 100,
          receivedQuantity: 95,
          unitPrice: 10,
          varianceReason: 'Damaged items',
        },
        {
          productId: 'product-2',
          orderedQuantity: 50,
          receivedQuantity: 50,
          unitPrice: 20,
        },
      ],
    };

    it('should create receiving voucher successfully', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-001',
        status: 'ordered',
        warehouseId: 'warehouse-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        supplier: { paymentTerms: 'Net 30' },
        items: [
          { id: 'item-1', productId: 'product-1', quantity: new Decimal(100), product: { baseUOM: 'pcs' } },
          { id: 'item-2', productId: 'product-2', quantity: new Decimal(50), product: { baseUOM: 'pcs' } },
        ],
      };

      const mockCreatedRV = {
        id: 'rv-1',
        rvNumber: 'RV-20241114-0001',
        ...validRVData,
      };

      // Setup transaction mock
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(mockPO),
            update: vi.fn().mockResolvedValue({ ...mockPO, status: 'received' }),
          },
          purchaseOrderItem: {
            updateMany: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
          },
          accountsPayable: {
            create: vi.fn(),
          },
          receivingVoucher: {
            create: vi.fn().mockResolvedValue(mockCreatedRV),
            findUnique: vi.fn().mockResolvedValue(mockCreatedRV),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });

      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null);

      const result = await service.createReceivingVoucher(validRVData as any);

      expect(result).toBeDefined();
      expect(lastTxMock.receivingVoucher.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError when PO not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return callback(mockTx);
      });

      await expect(service.createReceivingVoucher(validRVData as any))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when PO not in ordered status', async () => {
      const draftPO = {
        id: 'po-1',
        status: 'draft',
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(draftPO),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });

      await expect(service.createReceivingVoucher(validRVData as any))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when no items have received quantity', async () => {
      const invalidData = {
        ...validRVData,
        items: [
          {
            productId: 'product-1',
            orderedQuantity: 100,
            receivedQuantity: 0,
            unitPrice: 10,
          },
        ],
      };

      const mockPO = { id: 'po-1', status: 'ordered', items: [] };
      
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(mockPO),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });

      await expect(service.createReceivingVoucher(invalidData as any))
        .rejects.toThrow(ValidationError);
    });

    it('should calculate variance correctly', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'ordered',
        warehouseId: 'warehouse-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        supplier: { paymentTerms: 'Net 30' },
        items: validRVData.items.map((item, index) => ({
          id: `item-${index}`,
          productId: item.productId,
          quantity: new Decimal(item.orderedQuantity),
          product: { baseUOM: 'pcs' },
        })),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(mockPO),
            update: vi.fn(),
          },
          purchaseOrderItem: {
            updateMany: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
          },
          accountsPayable: {
            create: vi.fn(),
          },
          receivingVoucher: {
            create: vi.fn().mockResolvedValue({}),
            findUnique: vi.fn().mockResolvedValue({}),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });
      
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null);

      await service.createReceivingVoucher(validRVData as any);

      const createCall = lastTxMock.receivingVoucher.create.mock.calls[0][0];
      const createData: any = createCall.data;
      const items = createData.items.create;
      
      // Check variance calculations
      const item1Variance = 95 - 100; // -5
      const item2Variance = 50 - 50;  // 0
      
      expect(items[0].varianceQuantity).toBe(item1Variance);
      expect(items[1].varianceQuantity).toBe(item2Variance);
    });

    it('should calculate total amounts correctly', async () => {
      const mockPO = {
        id: 'po-1',
        status: 'ordered',
        warehouseId: 'warehouse-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        supplier: { paymentTerms: 'Net 30' },
        items: validRVData.items.map((item, index) => ({
          id: `item-${index}`,
          productId: item.productId,
          quantity: new Decimal(item.orderedQuantity),
          product: { baseUOM: 'pcs' },
        })),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(mockPO),
            update: vi.fn(),
          },
          purchaseOrderItem: {
            updateMany: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
          },
          accountsPayable: {
            create: vi.fn(),
          },
          receivingVoucher: {
            create: vi.fn().mockResolvedValue({}),
            findUnique: vi.fn().mockResolvedValue({}),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });
      
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null);

      await service.createReceivingVoucher(validRVData as any);

      const createCall = lastTxMock.receivingVoucher.create.mock.calls[0][0];
      const createData: any = createCall.data;
      
      // totalOrderedAmount = 100*10 + 50*20 = 2000
      // totalReceivedAmount = 95*10 + 50*20 = 1950
      // varianceAmount = 1950 - 2000 = -50
      
      expect(createData.totalOrderedAmount).toBe(2000);
      expect(createData.totalReceivedAmount).toBe(1950);
      expect(createData.varianceAmount).toBe(-50);
    });
  });

  describe('getReceivingVouchersByPO', () => {
    it('should return all RVs for a purchase order', async () => {
      const mockRVs = [
        { id: 'rv-1', rvNumber: 'RV-001', purchaseOrderId: 'po-1' },
        { id: 'rv-2', rvNumber: 'RV-002', purchaseOrderId: 'po-1' },
      ];

      vi.mocked(receivingVoucherRepository.findByPurchaseOrderId).mockResolvedValue(mockRVs as any);

      const result = await service.getReceivingVouchersByPO('po-1');

      expect(result).toEqual(mockRVs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no RVs found', async () => {
      vi.mocked(receivingVoucherRepository.findByPurchaseOrderId).mockResolvedValue([]);

      const result = await service.getReceivingVouchersByPO('po-1');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('variance calculations', () => {
    it('should identify under-delivery correctly', async () => {
      const underDeliveryData = {
        purchaseOrderId: 'po-1',
        receiverName: 'John Doe',
        items: [
          {
            productId: 'product-1',
            orderedQuantity: 100,
            receivedQuantity: 90, // 10% under
            unitPrice: 10,
            varianceReason: 'Damaged',
          },
        ],
      };

      const mockPO = {
        id: 'po-1',
        status: 'ordered',
        warehouseId: 'warehouse-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        supplier: { paymentTerms: 'Net 30' },
        items: [{ id: 'item-1', productId: 'product-1', quantity: new Decimal(100), product: { baseUOM: 'pcs' } }],
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(mockPO),
            update: vi.fn(),
          },
          purchaseOrderItem: {
            updateMany: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
          },
          accountsPayable: {
            create: vi.fn(),
          },
          receivingVoucher: {
            create: vi.fn().mockResolvedValue({}),
            findUnique: vi.fn().mockResolvedValue({}),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });
      
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null);

      await service.createReceivingVoucher(underDeliveryData as any);

      const createCall = lastTxMock.receivingVoucher.create.mock.calls[0][0];
      const createData: any = createCall.data;
      const items = createData.items.create;

      expect(items[0].varianceQuantity).toBe(-10);
      expect(items[0].variancePercentage).toBeCloseTo(-10);
    });

    it('should identify over-delivery correctly', async () => {
      const overDeliveryData = {
        purchaseOrderId: 'po-1',
        receiverName: 'John Doe',
        items: [
          {
            productId: 'product-1',
            orderedQuantity: 100,
            receivedQuantity: 110, // 10% over
            unitPrice: 10,
            varianceReason: 'Bonus',
          },
        ],
      };

      const mockPO = {
        id: 'po-1',
        status: 'ordered',
        warehouseId: 'warehouse-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        supplier: { paymentTerms: 'Net 30' },
        items: [{ id: 'item-1', productId: 'product-1', quantity: new Decimal(100), product: { baseUOM: 'pcs' } }],
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          purchaseOrder: {
            findUnique: vi.fn().mockResolvedValue(mockPO),
            update: vi.fn(),
          },
          purchaseOrderItem: {
            updateMany: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
          },
          accountsPayable: {
            create: vi.fn(),
          },
          receivingVoucher: {
            create: vi.fn().mockResolvedValue({}),
            findUnique: vi.fn().mockResolvedValue({}),
          },
        };
        lastTxMock = mockTx;
        return callback(mockTx);
      });
      
      vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.receivingVoucher.findFirst).mockResolvedValue(null);

      await service.createReceivingVoucher(overDeliveryData as any);

      const createCall = lastTxMock.receivingVoucher.create.mock.calls[0][0];
      const createData: any = createCall.data;
      const items = createData.items.create;

      expect(items[0].varianceQuantity).toBe(10);
      expect(items[0].variancePercentage).toBeCloseTo(10);
    });
  });
});
