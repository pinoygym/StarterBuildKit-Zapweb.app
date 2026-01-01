import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupplierService } from '@/services/supplier.service';
import { supplierRepository } from '@/repositories/supplier.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock repository
vi.mock('@/repositories/supplier.repository');

describe('SupplierService', () => {
  let supplierService: SupplierService;
  let dbTestBase: DatabaseTestBase;
  let testSupplierId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test IDs
    testSupplierId = TestUtils.generate.id();

    // Initialize service
    supplierService = new SupplierService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('getAllSuppliers', () => {
    it('should return all suppliers with filters', async () => {
      const mockSuppliers = [
        {
          id: testSupplierId,
          companyName: 'Test Supplier',
          contactPerson: 'John Doe',
          email: 'john@test.com',
          phone: '+1234567890',
          status: 'active',
        },
      ];

      const mockFindAll = vi.mocked(supplierRepository.findAll);
      mockFindAll.mockResolvedValue(mockSuppliers as any);

      const filters = { status: 'active' };
      const result = await supplierService.getAllSuppliers(filters);

      expect(mockFindAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockSuppliers);
    });

    it('should return all suppliers without filters', async () => {
      const mockSuppliers = [
        {
          id: testSupplierId,
          companyName: 'Test Supplier',
          status: 'active',
        },
      ];

      const mockFindAll = vi.mocked(supplierRepository.findAll);
      mockFindAll.mockResolvedValue(mockSuppliers as any);

      const result = await supplierService.getAllSuppliers();

      expect(mockFindAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockSuppliers);
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier by ID', async () => {
      const mockSupplier = {
        id: testSupplierId,
        companyName: 'Test Supplier',
        contactPerson: 'John Doe',
        email: 'john@test.com',
        phone: '+1234567890',
        status: 'active',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(mockSupplier as any);

      const result = await supplierService.getSupplierById(testSupplierId);

      expect(mockFindById).toHaveBeenCalledWith(testSupplierId);
      expect(result).toEqual(mockSupplier);
    });

    it('should throw error for non-existent supplier', async () => {
      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        supplierService.getSupplierById(testSupplierId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActiveSuppliers', () => {
    it('should return only active suppliers', async () => {
      const mockActiveSuppliers = [
        {
          id: testSupplierId,
          companyName: 'Active Supplier',
          status: 'active',
        },
        {
          id: 'supplier2',
          companyName: 'Another Active Supplier',
          status: 'active',
        },
      ];

      const mockFindActive = vi.mocked(supplierRepository.findActive);
      mockFindActive.mockResolvedValue(mockActiveSuppliers as any);

      const result = await supplierService.getActiveSuppliers();

      expect(mockFindActive).toHaveBeenCalled();
      expect(result).toEqual(mockActiveSuppliers);
      expect(result.every(s => s.status === 'active')).toBe(true);
    });
  });

  describe('searchSuppliers', () => {
    it('should search suppliers by company name', async () => {
      const searchTerm = 'Test Company';
      const mockSearchResults = [
        {
          id: testSupplierId,
          companyName: 'Test Company Ltd',
          status: 'active',
        },
      ];

      const mockSearchByCompanyName = vi.mocked(supplierRepository.searchByCompanyName);
      mockSearchByCompanyName.mockResolvedValue(mockSearchResults as any);

      const result = await supplierService.searchSuppliers(searchTerm);

      expect(mockSearchByCompanyName).toHaveBeenCalledWith(searchTerm);
      expect(result).toEqual(mockSearchResults);
    });

    it('should return all suppliers for empty search term', async () => {
      const mockAllSuppliers = [
        {
          id: testSupplierId,
          companyName: 'All Suppliers',
          status: 'active',
        },
      ];

      const mockFindAll = vi.mocked(supplierRepository.findAll);
      mockFindAll.mockResolvedValue(mockAllSuppliers as any);

      const result = await supplierService.searchSuppliers('');

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual(mockAllSuppliers);
    });

    it('should return all suppliers for whitespace-only search term', async () => {
      const mockAllSuppliers = [
        {
          id: testSupplierId,
          companyName: 'All Suppliers',
          status: 'active',
        },
      ];

      const mockFindAll = vi.mocked(supplierRepository.findAll);
      mockFindAll.mockResolvedValue(mockAllSuppliers as any);

      const result = await supplierService.searchSuppliers('   ');

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual(mockAllSuppliers);
    });
  });

  describe('createSupplier', () => {
    const createData = {
      companyName: 'New Supplier Inc',
      contactPerson: 'Jane Smith',
      email: 'jane@newsupplier.com',
      phone: '+1987654321',
      address: '123 Supplier St',
      paymentTerms: 'Net 30',
      taxId: 'TAX123456',
      notes: 'New supplier for electronics',
    };

    it('should create supplier successfully', async () => {
      const mockCreatedSupplier = {
        id: testSupplierId,
        ...createData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindByCompanyName = vi.mocked(supplierRepository.findByCompanyName);
      mockFindByCompanyName.mockResolvedValue(null);

      const mockCreate = vi.mocked(supplierRepository.create);
      mockCreate.mockResolvedValue(mockCreatedSupplier as any);

      const result = await supplierService.createSupplier(createData);

      expect(mockFindByCompanyName).toHaveBeenCalledWith(createData.companyName);
      expect(mockCreate).toHaveBeenCalledWith(createData);
      expect(result.companyName).toBe(createData.companyName);
      expect(result.status).toBe('active');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        companyName: '',
        contactPerson: 'John Doe',
        email: 'john@test.com',
      };

      await expect(
        supplierService.createSupplier(invalidData as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate email format', async () => {
      const invalidData = {
        ...createData,
        email: 'invalid-email',
      };

      await expect(
        supplierService.createSupplier(invalidData)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate phone format', async () => {
      const invalidData = {
        ...createData,
        phone: 'invalid-phone',
      };

      await expect(
        supplierService.createSupplier(invalidData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for duplicate company name', async () => {
      const existingSupplier = {
        id: 'existing-id',
        companyName: createData.companyName,
        status: 'active',
      };

      const mockFindByCompanyName = vi.mocked(supplierRepository.findByCompanyName);
      mockFindByCompanyName.mockResolvedValue(existingSupplier as any);

      await expect(
        supplierService.createSupplier(createData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateSupplier', () => {
    const updateData = {
      companyName: 'Updated Supplier Inc',
      contactPerson: 'Updated Contact',
      email: 'updated@supplier.com',
      phone: '+1555123456',
      address: '456 Updated St',
      paymentTerms: 'Net 15',
      notes: 'Updated supplier information',
    };

    it('should update supplier successfully', async () => {
      const existingSupplier = {
        id: testSupplierId,
        companyName: 'Old Supplier Inc',
        contactPerson: 'Old Contact',
        email: 'old@supplier.com',
        status: 'active',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(existingSupplier as any);

      const mockFindByCompanyName = vi.mocked(supplierRepository.findByCompanyName);
      mockFindByCompanyName.mockResolvedValue(null);

      const mockUpdate = vi.mocked(supplierRepository.update);
      mockUpdate.mockResolvedValue({
        ...existingSupplier,
        ...updateData,
        updatedAt: new Date(),
      } as any);

      const result = await supplierService.updateSupplier(testSupplierId, updateData);

      expect(mockFindById).toHaveBeenCalledWith(testSupplierId);
      expect(mockFindByCompanyName).toHaveBeenCalledWith(updateData.companyName);
      expect(mockUpdate).toHaveBeenCalledWith(testSupplierId, updateData);
      expect(result.companyName).toBe(updateData.companyName);
    });

    it('should allow updating without changing company name', async () => {
      const existingSupplier = {
        id: testSupplierId,
        companyName: 'Same Supplier Inc',
        contactPerson: 'Old Contact',
        status: 'active',
      };

      const updateWithoutNameChange = {
        contactPerson: 'New Contact',
        email: 'new@email.com',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(existingSupplier as any);

      const mockUpdate = vi.mocked(supplierRepository.update);
      mockUpdate.mockResolvedValue({
        ...existingSupplier,
        ...updateWithoutNameChange,
      } as any);

      const result = await supplierService.updateSupplier(testSupplierId, updateWithoutNameChange);

      expect(mockUpdate).toHaveBeenCalledWith(testSupplierId, updateWithoutNameChange);
      expect(result.contactPerson).toBe(updateWithoutNameChange.contactPerson);
    });

    it('should throw error for non-existent supplier', async () => {
      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        supplierService.updateSupplier(testSupplierId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error for duplicate company name during update', async () => {
      const existingSupplier = {
        id: testSupplierId,
        companyName: 'Current Name',
        status: 'active',
      };

      const conflictingSupplier = {
        id: 'other-id',
        companyName: updateData.companyName,
        status: 'active',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(existingSupplier as any);

      const mockFindByCompanyName = vi.mocked(supplierRepository.findByCompanyName);
      mockFindByCompanyName.mockResolvedValue(conflictingSupplier as any);

      await expect(
        supplierService.updateSupplier(testSupplierId, updateData)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate input data', async () => {
      const existingSupplier = {
        id: testSupplierId,
        companyName: 'Valid Supplier',
        status: 'active',
      };

      const invalidUpdateData = {
        email: 'invalid-email-format',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(existingSupplier as any);

      await expect(
        supplierService.updateSupplier(testSupplierId, invalidUpdateData as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteSupplier', () => {
    it('should soft delete supplier successfully', async () => {
      const existingSupplier = {
        id: testSupplierId,
        companyName: 'Supplier to Delete',
        status: 'active',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(existingSupplier as any);

      const mockSoftDelete = vi.mocked(supplierRepository.softDelete);
      mockSoftDelete.mockResolvedValue(undefined);

      await expect(
        supplierService.deleteSupplier(testSupplierId)
      ).resolves.not.toThrow();

      expect(mockFindById).toHaveBeenCalledWith(testSupplierId);
      expect(mockSoftDelete).toHaveBeenCalledWith(testSupplierId);
    });

    it('should throw error for non-existent supplier', async () => {
      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        supplierService.deleteSupplier(testSupplierId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('toggleSupplierStatus', () => {
    it('should activate inactive supplier', async () => {
      const inactiveSupplier = {
        id: testSupplierId,
        companyName: 'Inactive Supplier',
        status: 'inactive',
      };

      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockResolvedValue(inactiveSupplier as any);

      const mockUpdateStatus = vi.mocked(supplierRepository.updateStatus);
      mockUpdateStatus.mockResolvedValue({
        ...inactiveSupplier,
        status: 'active',
      } as any);

      const result = await supplierService.toggleSupplierStatus(testSupplierId);

      expect(mockGetSupplierById).toHaveBeenCalledWith(testSupplierId);
      expect(mockUpdateStatus).toHaveBeenCalledWith(testSupplierId, 'active');
      expect(result.status).toBe('active');
    });

    it('should deactivate active supplier', async () => {
      const activeSupplier = {
        id: testSupplierId,
        companyName: 'Active Supplier',
        status: 'active',
      };

      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockResolvedValue(activeSupplier as any);

      const mockUpdateStatus = vi.mocked(supplierRepository.updateStatus);
      mockUpdateStatus.mockResolvedValue({
        ...activeSupplier,
        status: 'inactive',
      } as any);

      const result = await supplierService.toggleSupplierStatus(testSupplierId);

      expect(mockUpdateStatus).toHaveBeenCalledWith(testSupplierId, 'inactive');
      expect(result.status).toBe('inactive');
    });

    it('should throw error for non-existent supplier', async () => {
      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockRejectedValue(new NotFoundError('Supplier'));

      await expect(
        supplierService.toggleSupplierStatus(testSupplierId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('validateSupplierActive', () => {
    it('should pass validation for active supplier', async () => {
      const activeSupplier = {
        id: testSupplierId,
        companyName: 'Active Supplier',
        status: 'active',
      };

      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockResolvedValue(activeSupplier as any);

      await expect(
        supplierService.validateSupplierActive(testSupplierId)
      ).resolves.not.toThrow();
    });

    it('should throw error for inactive supplier', async () => {
      const inactiveSupplier = {
        id: testSupplierId,
        companyName: 'Inactive Supplier',
        status: 'inactive',
      };

      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockResolvedValue(inactiveSupplier as any);

      await expect(
        supplierService.validateSupplierActive(testSupplierId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for non-existent supplier', async () => {
      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockRejectedValue(new NotFoundError('Supplier'));

      await expect(
        supplierService.validateSupplierActive(testSupplierId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Business Logic Integration', () => {
    it('should handle complete supplier lifecycle management', async () => {
      // 1. Create supplier
      const createData = {
        companyName: 'TechCorp Solutions',
        contactPerson: 'Alice Johnson',
        email: 'alice@techcorp.com',
        phone: '+1-555-0123',
        address: '789 Technology Blvd, Silicon Valley, CA',
        paymentTerms: 'Net 30',
        taxId: 'TC123456789',
        notes: 'Primary electronics supplier',
      };

      const mockCreate = vi.mocked(supplierRepository.create);
      mockCreate.mockResolvedValue({
        id: testSupplierId,
        ...createData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const createdSupplier = await supplierService.createSupplier(createData);
      expect(createdSupplier.companyName).toBe(createData.companyName);
      expect(createdSupplier.status).toBe('active');

      // 2. Search and retrieve supplier
      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(createdSupplier as any);

      const retrievedSupplier = await supplierService.getSupplierById(testSupplierId);
      expect(retrievedSupplier.id).toBe(testSupplierId);

      // 3. Update supplier information
      const updateData = {
        contactPerson: 'Alice M. Johnson',
        phone: '+1-555-0124',
        notes: 'Updated: Primary electronics supplier with expanded catalog',
      };

      const mockUpdate = vi.mocked(supplierRepository.update);
      mockUpdate.mockResolvedValue({
        ...createdSupplier,
        ...updateData,
        updatedAt: new Date(),
      } as any);

      const updatedSupplier = await supplierService.updateSupplier(testSupplierId, updateData);
      expect(updatedSupplier.contactPerson).toBe(updateData.contactPerson);
      expect(updatedSupplier.notes).toBe(updateData.notes);

      // 4. Validate supplier is active for transactions
      await supplierService.validateSupplierActive(testSupplierId);

      // 5. Toggle status (deactivate for maintenance)
      const mockUpdateStatus = vi.mocked(supplierRepository.updateStatus);
      mockUpdateStatus.mockResolvedValue({
        ...updatedSupplier,
        status: 'inactive',
      } as any);

      const deactivatedSupplier = await supplierService.toggleSupplierStatus(testSupplierId);
      expect(deactivatedSupplier.status).toBe('inactive');

      // 6. Attempt validation (should fail)
      const mockGetSupplierById = vi.mocked(supplierService.getSupplierById);
      mockGetSupplierById.mockResolvedValue(deactivatedSupplier as any);

      await expect(
        supplierService.validateSupplierActive(testSupplierId)
      ).rejects.toThrow(ValidationError);

      // 7. Reactivate supplier
      mockUpdateStatus.mockResolvedValue({
        ...deactivatedSupplier,
        status: 'active',
      } as any);

      const reactivatedSupplier = await supplierService.toggleSupplierStatus(testSupplierId);
      expect(reactivatedSupplier.status).toBe('active');

      // 8. Soft delete supplier
      const mockSoftDelete = vi.mocked(supplierRepository.softDelete);
      mockSoftDelete.mockResolvedValue(undefined);

      await supplierService.deleteSupplier(testSupplierId);
      expect(mockSoftDelete).toHaveBeenCalledWith(testSupplierId);

      // Verify the complete workflow
      expect(mockCreate).toHaveBeenCalledWith(createData);
      expect(mockUpdate).toHaveBeenCalledWith(testSupplierId, updateData);
      expect(mockUpdateStatus).toHaveBeenCalledTimes(2); // deactivate and reactivate
      expect(mockSoftDelete).toHaveBeenCalledWith(testSupplierId);
    });

    it('should handle supplier search and filtering', async () => {
      const suppliers = [
        {
          id: 'sup1',
          companyName: 'ABC Electronics',
          contactPerson: 'John Smith',
          email: 'john@abc.com',
          status: 'active',
        },
        {
          id: 'sup2',
          companyName: 'XYZ Components',
          contactPerson: 'Jane Doe',
          email: 'jane@xyz.com',
          status: 'active',
        },
        {
          id: 'sup3',
          companyName: 'Global Supplies Inc',
          contactPerson: 'Bob Wilson',
          email: 'bob@global.com',
          status: 'inactive',
        },
      ];

      // Test search functionality
      const mockSearchByCompanyName = vi.mocked(supplierRepository.searchByCompanyName);
      mockSearchByCompanyName.mockImplementation((searchTerm) => {
        const results = suppliers.filter(s =>
          s.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return Promise.resolve(results as any);
      });

      const electronicsResults = await supplierService.searchSuppliers('electronics');
      expect(electronicsResults).toHaveLength(1);
      expect(electronicsResults[0].companyName).toBe('ABC Electronics');

      const globalResults = await supplierService.searchSuppliers('global');
      expect(globalResults).toHaveLength(1);
      expect(globalResults[0].companyName).toBe('Global Supplies Inc');

      // Test active suppliers filter
      const mockFindActive = vi.mocked(supplierRepository.findActive);
      mockFindActive.mockResolvedValue(
        suppliers.filter(s => s.status === 'active') as any
      );

      const activeSuppliers = await supplierService.getActiveSuppliers();
      expect(activeSuppliers).toHaveLength(2);
      expect(activeSuppliers.every(s => s.status === 'active')).toBe(true);

      // Test all suppliers with filters
      const mockFindAll = vi.mocked(supplierRepository.findAll);
      mockFindAll.mockImplementation((filters) => {
        let results = suppliers;
        if (filters?.status) {
          results = results.filter(s => s.status === filters.status);
        }
        return Promise.resolve(results as any);
      });

      const activeFiltered = await supplierService.getAllSuppliers({ status: 'active' });
      expect(activeFiltered).toHaveLength(2);

      const inactiveFiltered = await supplierService.getAllSuppliers({ status: 'inactive' });
      expect(inactiveFiltered).toHaveLength(1);
    });

    it('should enforce data integrity and business rules', async () => {
      // Test company name uniqueness
      const createData1 = {
        companyName: 'Unique Supplier Corp',
        contactPerson: 'CEO',
        email: 'ceo@uniquesupplier.com',
        phone: '+1-555-0001',
      };

      const createData2 = {
        companyName: 'Unique Supplier Corp', // Same name
        contactPerson: 'Manager',
        email: 'manager@uniquesupplier.com',
        phone: '+1-555-0002',
      };

      const mockFindByCompanyName = vi.mocked(supplierRepository.findByCompanyName);
      const mockCreate = vi.mocked(supplierRepository.create);

      // First supplier creation succeeds
      mockFindByCompanyName.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce({
        id: 'sup1',
        ...createData1,
        status: 'active',
      } as any);

      await supplierService.createSupplier(createData1);

      // Second supplier creation fails due to duplicate name
      mockFindByCompanyName.mockResolvedValueOnce({
        id: 'sup1',
        ...createData1,
        status: 'active',
      } as any);

      await expect(
        supplierService.createSupplier(createData2)
      ).rejects.toThrow(ValidationError);

      // Test update with duplicate name prevention
      const updateData = {
        companyName: 'Unique Supplier Corp', // Same name as existing
      };

      const existingSupplier = {
        id: 'sup2',
        companyName: 'Different Name Corp',
        status: 'active',
      };

      const mockFindById = vi.mocked(supplierRepository.findById);
      mockFindById.mockResolvedValue(existingSupplier as any);

      // Should fail because name already exists for different supplier
      mockFindByCompanyName.mockResolvedValue({
        id: 'sup1',
        companyName: 'Unique Supplier Corp',
        status: 'active',
      } as any);

      await expect(
        supplierService.updateSupplier('sup2', updateData)
      ).rejects.toThrow(ValidationError);

      // Test that updating to same name for same supplier is allowed
      mockFindByCompanyName.mockResolvedValue(existingSupplier as any); // Same supplier

      const mockUpdate = vi.mocked(supplierRepository.update);
      mockUpdate.mockResolvedValue({
        ...existingSupplier,
        companyName: 'Different Name Corp', // Same name
      } as any);

      await expect(
        supplierService.updateSupplier('sup2', { companyName: 'Different Name Corp' })
      ).resolves.not.toThrow();
    });
  });
});