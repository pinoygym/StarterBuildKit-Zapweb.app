import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplierService } from '@/services/supplier.service';
import { supplierRepository } from '@/repositories/supplier.repository';

// Mock dependencies
vi.mock('@/repositories/supplier.repository', () => ({
  supplierRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn(),
    findByCompanyName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    updateStatus: vi.fn(),
    searchByCompanyName: vi.fn(),
    count: vi.fn(),
  },
}));

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SupplierService();
  });

  describe('getAllSuppliers', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers = [{ id: '1', companyName: 'Supplier 1' }, { id: '2', companyName: 'Supplier 2' }];
      vi.mocked(supplierRepository.findAll).mockResolvedValue(mockSuppliers as any);

      const result = await service.getAllSuppliers();

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepository.findAll).toHaveBeenCalledWith(undefined, { skip: undefined, take: undefined });
    });

    it('should apply filters and pagination', async () => {
      const filters = { status: 'active' };
      const options = { skip: 10, limit: 20 };
      vi.mocked(supplierRepository.findAll).mockResolvedValue([]);

      await service.getAllSuppliers(filters as any, options);

      expect(supplierRepository.findAll).toHaveBeenCalledWith(filters, { skip: 10, take: 20 });
    });
  });

  describe('getSupplierCount', () => {
    it('should return supplier count', async () => {
      vi.mocked(supplierRepository.count).mockResolvedValue(42);

      const result = await service.getSupplierCount();

      expect(result).toBe(42);
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier by id', async () => {
      const mockSupplier = { id: '1', companyName: 'Test Supplier' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);

      const result = await service.getSupplierById('1');

      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundError if supplier not found', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(null);

      await expect(service.getSupplierById('non-existent')).rejects.toThrow('Supplier');
    });
  });

  describe('getActiveSuppliers', () => {
    it('should return only active suppliers', async () => {
      const mockSuppliers = [{ id: '1', status: 'active' }];
      vi.mocked(supplierRepository.findActive).mockResolvedValue(mockSuppliers as any);

      const result = await service.getActiveSuppliers();

      expect(result).toEqual(mockSuppliers);
    });
  });

  describe('searchSuppliers', () => {
    it('should return all suppliers if search term is empty', async () => {
      const mockSuppliers = [{ id: '1' }];
      vi.mocked(supplierRepository.findAll).mockResolvedValue(mockSuppliers as any);

      const result = await service.searchSuppliers('');

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepository.findAll).toHaveBeenCalled();
    });

    it('should search by company name', async () => {
      const mockSuppliers = [{ id: '1', companyName: 'ABC Corp' }];
      vi.mocked(supplierRepository.searchByCompanyName).mockResolvedValue(mockSuppliers as any);

      const result = await service.searchSuppliers('ABC');

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepository.searchByCompanyName).toHaveBeenCalledWith('ABC');
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier successfully', async () => {
      const existingSupplier = { id: '1', companyName: 'Old Name' };
      const updateData = { companyName: 'New Name' };

      vi.mocked(supplierRepository.findById).mockResolvedValue(existingSupplier as any);
      vi.mocked(supplierRepository.findByCompanyName).mockResolvedValue(null);
      vi.mocked(supplierRepository.update).mockResolvedValue({ ...existingSupplier, ...updateData } as any);

      const result = await service.updateSupplier('1', updateData);

      expect(result.companyName).toBe('New Name');
    });

    it('should throw error if company name already exists', async () => {
      const existingSupplier = { id: '1', companyName: 'Old Name' };
      const updateData = { companyName: 'Existing Name' };

      vi.mocked(supplierRepository.findById).mockResolvedValue(existingSupplier as any);
      vi.mocked(supplierRepository.findByCompanyName).mockResolvedValue({ id: '2' } as any);

      await expect(service.updateSupplier('1', updateData)).rejects.toThrow('Supplier company name already exists');
    });

    it('should throw NotFoundError if supplier not found', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(null);

      await expect(service.updateSupplier('1', {})).rejects.toThrow('Supplier');
    });
  });

  describe('deleteSupplier', () => {
    it('should soft delete supplier', async () => {
      const mockSupplier = { id: '1', companyName: 'Test' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);

      await service.deleteSupplier('1');

      expect(supplierRepository.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError if supplier not found', async () => {
      vi.mocked(supplierRepository.findById).mockResolvedValue(null);

      await expect(service.deleteSupplier('1')).rejects.toThrow('Supplier');
    });
  });

  describe('toggleSupplierStatus', () => {
    it('should toggle active to inactive', async () => {
      const mockSupplier = { id: '1', status: 'active' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
      vi.mocked(supplierRepository.updateStatus).mockResolvedValue({ ...mockSupplier, status: 'inactive' } as any);

      const result = await service.toggleSupplierStatus('1');

      expect(supplierRepository.updateStatus).toHaveBeenCalledWith('1', 'inactive');
      expect(result.status).toBe('inactive');
    });

    it('should toggle inactive to active', async () => {
      const mockSupplier = { id: '1', status: 'inactive' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);
      vi.mocked(supplierRepository.updateStatus).mockResolvedValue({ ...mockSupplier, status: 'active' } as any);

      const result = await service.toggleSupplierStatus('1');

      expect(supplierRepository.updateStatus).toHaveBeenCalledWith('1', 'active');
    });
  });

  describe('validateSupplierActive', () => {
    it('should pass validation for active supplier', async () => {
      const mockSupplier = { id: '1', status: 'active' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);

      await expect(service.validateSupplierActive('1')).resolves.toBeUndefined();
    });

    it('should throw error for inactive supplier', async () => {
      const mockSupplier = { id: '1', status: 'inactive' };
      vi.mocked(supplierRepository.findById).mockResolvedValue(mockSupplier as any);

      await expect(service.validateSupplierActive('1')).rejects.toThrow('Supplier is not active');
    });
  });
});