import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from '@/services/customer.service';
import { customerRepository } from '@/repositories/customer.repository';

// Mock dependencies
vi.mock('@/repositories/customer.repository', () => ({
  customerRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    softDelete: vi.fn(),
    updateStatus: vi.fn(),
    getStats: vi.fn(),
    findByEmail: vi.fn(),
    getNextCustomerCode: vi.fn(),
  },
}));

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerService();
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const input = {
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        phone: '09171234567',
        email: 'test@example.com',
        taxId: 'TAX-123',
        paymentTerms: 'Net 30' as const,
        customerType: 'regular' as const,
      };

      vi.mocked(customerRepository.getNextCustomerCode).mockResolvedValue('CUST-001');
      vi.mocked(customerRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(customerRepository.create).mockResolvedValue({ id: 'customer-1', ...input, customerCode: 'CUST-001', status: 'active' } as any);

      const result = await service.createCustomer(input);

      expect(customerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: input.companyName,
          contactPerson: input.contactPerson,
          phone: input.phone,
          email: input.email,
          taxId: input.taxId,
          paymentTerms: input.paymentTerms,
          customerType: input.customerType,
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateCustomer', () => {
    it('should update a customer successfully', async () => {
      const id = 'customer-1';
      const input = {
        companyName: 'Updated Company',
      };

      vi.mocked(customerRepository.findById).mockResolvedValue({ id, companyName: 'Old Company' } as any);
      vi.mocked(customerRepository.update).mockResolvedValue({ id, ...input } as any);

      const result = await service.updateCustomer(id, input);

      expect(customerRepository.update).toHaveBeenCalledWith(id, input);
      expect(result.companyName).toBe('Updated Company');
    });
  });

  describe('getCustomerById', () => {
    it('should return customer if found', async () => {
      const customer = { id: 'customer-1', companyName: 'Test Co' };
      vi.mocked(customerRepository.findById).mockResolvedValue(customer as any);

      const result = await service.getCustomerById('customer-1');
      expect(result).toEqual(customer);
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(customerRepository.findById).mockResolvedValue(null);
      await expect(service.getCustomerById('non-existent')).rejects.toThrow();
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer', async () => {
      const customer = { id: 'customer-1' };
      vi.mocked(customerRepository.findById).mockResolvedValue(customer as any);

      await service.deleteCustomer('customer-1');

      expect(customerRepository.softDelete).toHaveBeenCalledWith('customer-1');
    });
  });
});
