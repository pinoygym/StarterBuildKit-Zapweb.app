import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurchaseOrderService } from '@/services/purchase-order.service';
import { purchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { productRepository } from '@/repositories/product.repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Mock repositories
vi.mock('@/repositories/purchase-order.repository');
vi.mock('@/repositories/supplier.repository');
vi.mock('@/repositories/product.repository');
vi.mock('@/services/inventory.service');

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Prisma findFirst to return null (no existing PO today)
    vi.mocked(prisma.purchaseOrder.findFirst).mockResolvedValue(null);
    service = new PurchaseOrderService();
  });

  describe('getPurchaseOrderById', () => {
    it('should return purchase order when found', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-20241114-0001',
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        branchId: 'branch-1',
        totalAmount: new Decimal(1000),
        status: 'draft',
        items: [],
      };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(mockPO as any);

      const result = await service.getPurchaseOrderById('po-1');

      expect(result).toEqual(mockPO);
      expect(purchaseOrderRepository.findById).toHaveBeenCalledWith('po-1');
    });

    it('should throw NotFoundError when PO not found', async () => {
      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(null);

      await expect(service.getPurchaseOrderById('invalid-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('createPurchaseOrder', () => {
    const validPOData = {
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      branchId: 'branch-1',
      expectedDeliveryDate: new Date('2024-12-31'),
      notes: 'Test PO',
      items: [
        { productId: 'product-1', quantity: 10, unitPrice: 50 },
        { productId: 'product-2', quantity: 5, unitPrice: 100 },
      ],
    };

    it('should create purchase order successfully', async () => {
      const mockSupplier = { id: 'supplier-1', status: 'active' };
      const mockProduct1 = { id: 'product-1', name: 'Product 1', status: 'active' };
      const mockProduct2 = { id: 'product-2', name: 'Product 2', status: 'active' };
      const mockCreatedPO = {
        id: 'po-1',
        poNumber: 'PO-20241114-0001',
        totalAmount: new Decimal(1000),
        status: 'draft',
        ...validPOData,
      };

      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
      vi.mocked(productRepository.findById)
        .mockResolvedValueOnce(mockProduct1 as any)
        .mockResolvedValueOnce(mockProduct2 as any);
      vi.mocked(purchaseOrderRepository.create).mockResolvedValue(mockCreatedPO as any);

      const result = await service.createPurchaseOrder(validPOData as any);

      expect(result.totalAmount).toEqual(new Decimal(1000)); // 10*50 + 5*100
      expect(purchaseOrderRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError when supplier not found', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(null);

      await expect(service.createPurchaseOrder(validPOData as any))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when supplier is inactive', async () => {
      const inactiveSupplier = { id: 'supplier-1', status: 'inactive' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(inactiveSupplier as any);

      await expect(service.createPurchaseOrder(validPOData as any))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when product not found', async () => {
      const mockSupplier = { id: 'supplier-1', status: 'active' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(service.createPurchaseOrder(validPOData as any))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when product is inactive', async () => {
      const mockSupplier = { id: 'supplier-1', status: 'active' };
      const inactiveProduct = { id: 'product-1', status: 'inactive', name: 'Product 1' };
      
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
      vi.mocked(productRepository.findById).mockResolvedValue(inactiveProduct as any);

      await expect(service.createPurchaseOrder(validPOData as any))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when no items provided', async () => {
      const invalidData = { ...validPOData, items: [] };
      const mockSupplier = { id: 'supplier-1', status: 'active' };
      
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);

      await expect(service.createPurchaseOrder(invalidData as any))
        .rejects.toThrow(ValidationError);
    });

    it('should calculate total amount correctly', async () => {
      const mockSupplier = { id: 'supplier-1', status: 'active' };
      const mockProduct = { id: 'product-1', status: 'active' };
      
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
      vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
      
      const createSpy = vi.mocked(purchaseOrderRepository.create).mockResolvedValue({} as any);

      await service.createPurchaseOrder(validPOData as any);

      const createCallArg = createSpy.mock.calls[0][0];
      expect(createCallArg.totalAmount).toBe(1000); // 10*50 + 5*100
    });
  });

  describe('updatePurchaseOrder', () => {
    it('should update PO in draft status', async () => {
      const existingPO = {
        id: 'po-1',
        status: 'draft',
        supplierId: 'supplier-1',
      };
      const updateData = { notes: 'Updated notes' };
      const updatedPO = { ...existingPO, ...updateData };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);
      vi.mocked(purchaseOrderRepository.update).mockResolvedValue(updatedPO as any);

      const result = await service.updatePurchaseOrder('po-1', updateData as any);

      expect(result.notes).toBe('Updated notes');
    });

    it('should allow status-only update from draft to ordered', async () => {
      const existingPO = { id: 'po-1', status: 'draft' };
      const updateData = { status: 'ordered' };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);
      vi.mocked(purchaseOrderRepository.update).mockResolvedValue({ ...existingPO, status: 'ordered' } as any);

      const result = await service.updatePurchaseOrder('po-1', updateData as any);

      expect(result.status).toBe('ordered');
    });

    it('should throw ValidationError when updating ordered PO', async () => {
      const existingPO = { id: 'po-1', status: 'ordered' };
      const updateData = { notes: 'Cannot update' };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);

      await expect(service.updatePurchaseOrder('po-1', updateData as any))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status transition', async () => {
      const existingPO = { id: 'po-1', status: 'ordered' };
      const updateData = { status: 'draft' };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);

      await expect(service.updatePurchaseOrder('po-1', updateData as any))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('cancelPurchaseOrder', () => {
    it('should cancel PO successfully', async () => {
      const existingPO = {
        id: 'po-1',
        poNumber: 'PO-001',
        status: 'draft',
        notes: 'Original notes',
      };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);
      vi.mocked(purchaseOrderRepository.updateStatus).mockResolvedValue({} as any);
      vi.mocked(purchaseOrderRepository.update).mockResolvedValue({
        ...existingPO,
        status: 'cancelled',
      } as any);

      const result = await service.cancelPurchaseOrder('po-1', { reason: 'Test cancellation' });

      expect(purchaseOrderRepository.updateStatus).toHaveBeenCalledWith('po-1', 'cancelled');
      expect(purchaseOrderRepository.update).toHaveBeenCalled();
    });

    it('should throw ValidationError when cancelling received PO', async () => {
      const existingPO = { id: 'po-1', status: 'received' };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);

      await expect(service.cancelPurchaseOrder('po-1', { reason: 'Test' }))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when PO already cancelled', async () => {
      const existingPO = { id: 'po-1', status: 'cancelled' };

      vi.mocked(purchaseOrderRepository.findById).mockResolvedValue(existingPO as any);

      await expect(service.cancelPurchaseOrder('po-1', { reason: 'Test' }))
        .rejects.toThrow(ValidationError);
    });
  });
});
