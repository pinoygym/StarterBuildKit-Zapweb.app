import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ARService } from '@/services/ar.service';
import { arRepository } from '@/repositories/ar.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { Decimal } from '@prisma/client/runtime/library';

// Mock repository
vi.mock('@/repositories/ar.repository');

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    accountsReceivable: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    aRPayment: {
      create: vi.fn(),
    },
  },
}));

describe('ARService', () => {
  let arService: ARService;
  let dbTestBase: DatabaseTestBase;
  let testARId: string;
  let testBranchId: string;
  let testCustomerId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test IDs
    testARId = TestUtils.generate.id();
    testBranchId = TestUtils.generate.id();
    testCustomerId = TestUtils.generate.id();

    // Initialize service
    arService = new ARService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('createAR', () => {
    const createARData = {
      branchId: testBranchId,
      customerId: testCustomerId,
      customerName: 'Test Customer',
      salesOrderId: 'SO-001',
      totalAmount: 2500.00,
      dueDate: new Date('2024-03-15'),
    };

    it('should create AR record with customer ID successfully', async () => {
      const mockAR = {
        id: testARId,
        ...createARData,
        paidAmount: 0,
        balance: 2500.00,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(arRepository.create);
      mockCreate.mockResolvedValue(mockAR);

      const result = await arService.createAR(createARData);

      expect(mockCreate).toHaveBeenCalledWith({
        id: expect.any(String),
        Branch: { connect: { id: createARData.branchId } },
        Customer: { connect: { id: createARData.customerId } },
        customerName: createARData.customerName,
        salesOrderId: createARData.salesOrderId,
        totalAmount: createARData.totalAmount,
        paidAmount: 0,
        balance: 2500.00,
        dueDate: createARData.dueDate,
        status: 'pending',
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockAR);
    });

    it('should create AR record without customer ID (walk-in customer)', async () => {
      const walkInData = {
        ...createARData,
        customerId: undefined,
        customerName: 'Walk-in Customer',
      };

      const mockAR = {
        id: testARId,
        branchId: walkInData.branchId,
        customerId: null,
        customerName: walkInData.customerName,
        salesOrderId: walkInData.salesOrderId,
        totalAmount: walkInData.totalAmount,
        paidAmount: 0,
        balance: 2500.00,
        dueDate: walkInData.dueDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(arRepository.create);
      mockCreate.mockResolvedValue(mockAR);

      const result = await arService.createAR(walkInData);

      expect(mockCreate).toHaveBeenCalledWith({
        id: expect.any(String),
        Branch: { connect: { id: walkInData.branchId } },
        Customer: undefined,
        customerName: walkInData.customerName,
        salesOrderId: walkInData.salesOrderId,
        totalAmount: walkInData.totalAmount,
        paidAmount: 0,
        balance: 2500.00,
        dueDate: walkInData.dueDate,
        status: 'pending',
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockAR);
    });

    it('should calculate balance correctly', async () => {
      const dataWithDifferentAmount = {
        ...createARData,
        totalAmount: 3750.50,
      };

      const mockAR = {
        id: testARId,
        ...dataWithDifferentAmount,
        paidAmount: 0,
        balance: 3750.50,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(arRepository.create);
      mockCreate.mockResolvedValue(mockAR);

      await arService.createAR(dataWithDifferentAmount);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 3750.50,
          paidAmount: 0,
        })
      );
    });
  });

  describe('recordPayment', () => {
    const paymentData = {
      arId: testARId,
      amount: 750.00,
      paymentMethod: 'cash' as const,
      referenceNumber: 'RECEIPT-001',
      paymentDate: new Date(),
    };

    it('should record payment successfully', async () => {
      const mockAR = {
        id: testARId,
        branchId: testBranchId,
        customerId: testCustomerId,
        customerName: 'Test Customer',
        salesOrderId: 'SO-001',
        totalAmount: 2500.00,
        paidAmount: 0,
        balance: 2500.00,
        dueDate: new Date('2024-03-15'),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAR = {
        ...mockAR,
        paidAmount: 750.00,
        balance: 1750.00,
        status: 'partial',
        Branch: { id: testBranchId, name: 'Test Branch' },
        ARPayment: [
          {
            id: TestUtils.generate.id(),
            amount: 750.00,
            paymentMethod: 'cash',
            referenceNumber: 'RECEIPT-001',
            paymentDate: paymentData.paymentDate,
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);
      const mockCreate = vi.mocked(prisma.aRPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsReceivable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue(updatedAR);
        return await callback(prisma);
      });

      const result = await arService.recordPayment(paymentData);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: paymentData.arId },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          AccountsReceivable: { connect: { id: paymentData.arId } },
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          referenceNumber: paymentData.referenceNumber,
          paymentDate: paymentData.paymentDate,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.arId },
        data: {
          paidAmount: 750.00,
          balance: 1750.00,
          status: 'partial',
        },
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
      expect(result).toEqual(updatedAR);
    });

    it('should mark AR as paid when balance reaches zero', async () => {
      const mockAR = {
        id: testARId,
        totalAmount: 1000.00,
        paidAmount: 0,
        balance: 1000.00,
        dueDate: new Date('2024-03-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);
      const mockCreate = vi.mocked(prisma.aRPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsReceivable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAR,
          paidAmount: 1000.00,
          balance: 0,
          status: 'paid',
          Branch: { id: testBranchId, name: 'Test Branch' },
          ARPayment: [],
        });
        return await callback(prisma);
      });

      await arService.recordPayment({
        ...paymentData,
        amount: 1000.00, // Full payment
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.arId },
        data: {
          paidAmount: 1000.00,
          balance: 0,
          status: 'paid',
        },
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
    });

    it('should mark AR as overdue when past due date with remaining balance', async () => {
      const mockAR = {
        id: testARId,
        totalAmount: 2000.00,
        paidAmount: 0,
        balance: 2000.00,
        dueDate: new Date('2024-01-01'), // Past due date
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);
      const mockCreate = vi.mocked(prisma.aRPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsReceivable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAR,
          paidAmount: 500.00,
          balance: 1500.00,
          status: 'overdue',
          Branch: { id: testBranchId, name: 'Test Branch' },
          ARPayment: [],
        });
        return await callback(prisma);
      });

      await arService.recordPayment({
        ...paymentData,
        amount: 500.00,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.arId },
        data: {
          paidAmount: 500.00,
          balance: 1500.00,
          status: 'overdue',
        },
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
    });

    it('should throw error when AR record not found', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(null);
        return await callback(prisma);
      });

      await expect(
        arService.recordPayment(paymentData)
      ).rejects.toThrow('AR record not found');
    });

    it('should throw error when payment amount is zero or negative', async () => {
      const mockAR = {
        id: testARId,
        totalAmount: 2000.00,
        paidAmount: 0,
        balance: 2000.00,
        dueDate: new Date('2024-03-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        return await callback(prisma);
      });

      await expect(
        arService.recordPayment({
          ...paymentData,
          amount: 0,
        })
      ).rejects.toThrow('Payment amount must be greater than 0');

      await expect(
        arService.recordPayment({
          ...paymentData,
          amount: -200,
        })
      ).rejects.toThrow('Payment amount must be greater than 0');
    });

    it('should throw error when payment amount exceeds balance', async () => {
      const mockAR = {
        id: testARId,
        totalAmount: 2000.00,
        paidAmount: 0,
        balance: 1000.00,
        dueDate: new Date('2024-03-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        return await callback(prisma);
      });

      await expect(
        arService.recordPayment({
          ...paymentData,
          amount: 1200.00, // Exceeds balance
        })
      ).rejects.toThrow('Payment amount exceeds outstanding balance');
    });
  });

  describe('getARById', () => {
    it('should return AR record by ID', async () => {
      const mockAR = {
        id: testARId,
        totalAmount: 2500.00,
        paidAmount: 750.00,
        balance: 1750.00,
        status: 'partial',
      };

      const mockFindById = vi.mocked(arRepository.findById);
      mockFindById.mockResolvedValue(mockAR);

      const result = await arService.getARById(testARId);

      expect(mockFindById).toHaveBeenCalledWith(testARId);
      expect(result).toEqual(mockAR);
    });
  });

  describe('getAllAR', () => {
    it('should return all AR records with filters', async () => {
      const mockARs = [
        {
          id: testARId,
          totalAmount: 2500.00,
          balance: 1750.00,
          status: 'partial',
        },
      ];

      const mockFindAll = vi.mocked(arRepository.findAll);
      mockFindAll.mockResolvedValue(mockARs);

      const filters = { branchId: testBranchId, status: 'partial' };
      const result = await arService.getAllAR(filters);

      expect(mockFindAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockARs);
    });
  });

  describe('deleteAR', () => {
    it('should delete AR record', async () => {
      const mockDelete = vi.mocked(arRepository.delete);
      mockDelete.mockResolvedValue(undefined);

      await arService.deleteAR(testARId);

      expect(mockDelete).toHaveBeenCalledWith(testARId);
    });
  });

  describe('getAgingReport', () => {
    it('should generate aging report correctly', async () => {
      const mockRecords = [
        {
          id: '1',
          balance: new Decimal(1500),
          dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          customerName: 'Customer A',
        },
        {
          id: '2',
          balance: new Decimal(3000),
          dueDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
          customerName: 'Customer B',
        },
        {
          id: '3',
          balance: new Decimal(2200),
          dueDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
          customerName: 'Customer A',
        },
      ];

      const mockGetAgingReport = vi.mocked(arRepository.getAgingReport);
      mockGetAgingReport.mockResolvedValue(mockRecords);

      const result = await arService.getAgingReport();

      expect(result.buckets).toHaveLength(4);
      expect(result.buckets[0].bucket).toBe('0-30'); // 1 record, $1500
      expect(result.buckets[1].bucket).toBe('31-60'); // 1 record, $3000
      expect(result.buckets[3].bucket).toBe('90+'); // 1 record, $2200

      expect(result.totalOutstanding.toNumber()).toBe(6700);
      expect(result.byCustomer).toHaveLength(2);

      // Check customer A: 2 records, $3700 total
      const customerA = result.byCustomer.find(c => c.customerName === 'Customer A');
      expect(customerA?.total.toNumber()).toBe(3700);

      // Check customer B: 1 record, $3000 total
      const customerB = result.byCustomer.find(c => c.customerName === 'Customer B');
      expect(customerB?.total.toNumber()).toBe(3000);
    });

    it('should filter aging report by branch', async () => {
      const mockRecords = [
        {
          id: '1',
          balance: new Decimal(1500),
          dueDate: new Date(),
          customerName: 'Customer A',
        },
      ];

      const mockGetAgingReport = vi.mocked(arRepository.getAgingReport);
      mockGetAgingReport.mockResolvedValue(mockRecords);

      await arService.getAgingReport(testBranchId);

      expect(mockGetAgingReport).toHaveBeenCalledWith(testBranchId);
    });
  });

  describe('getSummary', () => {
    it('should return AR summary', async () => {
      const mockSummary = {
        totalOutstanding: 7500.00,
        totalOverdue: 2200.00,
        totalPending: 3000.00,
        totalPaid: 2300.00,
      };

      const mockGetSummary = vi.mocked(arRepository.getSummary);
      mockGetSummary.mockResolvedValue(mockSummary);

      const result = await arService.getSummary(testBranchId);

      expect(mockGetSummary).toHaveBeenCalledWith(testBranchId);
      expect(result).toEqual(mockSummary);
    });
  });

  describe('Customer Management', () => {
    it('should handle walk-in customers correctly', async () => {
      const walkInData = {
        branchId: testBranchId,
        customerId: undefined,
        customerName: 'Walk-in Customer',
        salesOrderId: 'SO-001',
        totalAmount: 150.00,
        dueDate: new Date(),
      };

      const mockAR = {
        id: testARId,
        ...walkInData,
        paidAmount: 0,
        balance: 150.00,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(arRepository.create);
      mockCreate.mockResolvedValue(mockAR);

      const result = await arService.createAR(walkInData);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          Customer: undefined,
          customerName: 'Walk-in Customer',
        })
      );
      expect(result.customerName).toBe('Walk-in Customer');
    });

    it('should handle registered customers correctly', async () => {
      const registeredData = {
        branchId: testBranchId,
        customerId: testCustomerId,
        customerName: 'Registered Customer',
        salesOrderId: 'SO-002',
        totalAmount: 500.00,
        dueDate: new Date(),
      };

      const mockAR = {
        id: testARId,
        ...registeredData,
        paidAmount: 0,
        balance: 500.00,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(arRepository.create);
      mockCreate.mockResolvedValue(mockAR);

      const result = await arService.createAR(registeredData);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          Customer: { connect: { id: testCustomerId } },
          customerName: 'Registered Customer',
        })
      );
      expect(result.customerName).toBe('Registered Customer');
    });
  });

  describe('Financial Calculations', () => {
    it('should handle decimal precision correctly', async () => {
      const paymentData = {
        arId: testARId,
        amount: 123.456789,
        paymentMethod: 'card' as const,
        referenceNumber: 'CARD-001',
        paymentDate: new Date(),
      };

      const mockAR = {
        id: testARId,
        totalAmount: 1000.00,
        paidAmount: 0,
        balance: 1000.00,
        dueDate: new Date('2024-03-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);
      const mockCreate = vi.mocked(prisma.aRPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsReceivable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAR,
          paidAmount: 123.456789,
          balance: 876.543211,
          status: 'partial',
          Branch: { id: testBranchId, name: 'Test Branch' },
          ARPayment: [],
        });
        return await callback(prisma);
      });

      await arService.recordPayment(paymentData);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.arId },
        data: {
          paidAmount: 123.456789,
          balance: 876.543211,
          status: 'partial',
        },
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
    });

    it('should handle large amounts correctly', async () => {
      const largeAmount = 999999.99;

      const mockAR = {
        id: testARId,
        totalAmount: largeAmount,
        paidAmount: 0,
        balance: largeAmount,
        dueDate: new Date('2024-03-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsReceivable.findUnique);
      const mockCreate = vi.mocked(prisma.aRPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsReceivable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAR);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAR,
          paidAmount: largeAmount,
          balance: 0,
          status: 'paid',
          Branch: { id: testBranchId, name: 'Test Branch' },
          ARPayment: [],
        });
        return await callback(prisma);
      });

      await arService.recordPayment({
        arId: testARId,
        amount: largeAmount,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'LARGE-RECEIPT',
        paymentDate: new Date(),
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: testARId },
        data: {
          paidAmount: largeAmount,
          balance: 0,
          status: 'paid',
        },
        include: {
          Branch: true,
          ARPayment: true,
        },
      });
    });
  });
});
