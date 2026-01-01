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
  },
}));

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SupplierService();
  });

  describe('createSupplier', () => {
    it('should create a supplier successfully', async () => {
      const input = {
        companyName: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'test@example.com',
        phone: '09171234567',
        address: '123 Main St',
        paymentTerms: 'Net 30' as const,
      };

      vi.mocked(supplierRepository.findByCompanyName).mockResolvedValue(null);
      vi.mocked(supplierRepository.create).mockResolvedValue({ id: 'supp-1', ...input, status: 'active' } as any);

      const result = await service.createSupplier(input as any);

      expect(supplierRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if company name exists', async () => {
      const input = {
        companyName: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'test@example.com',
        phone: '09171234567',
        paymentTerms: 'Net 30' as const,
      };

      vi.mocked(supplierRepository.findByCompanyName).mockResolvedValue({ id: 'existing' } as any);

      await expect(service.createSupplier(input as any)).rejects.toThrow('Supplier company name already exists');
    });
  });
});