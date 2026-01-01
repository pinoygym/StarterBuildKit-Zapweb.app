import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APService } from '@/services/ap.service';
import { apRepository } from '@/repositories/ap.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { Decimal } from '@prisma/client/runtime/library';

// Mock repository
vi.mock('@/repositories/ap.repository');

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    accountsPayable: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    aPPayment: {
      create: vi.fn(),
    },
  },
}));

describe('APService', () => {
  let apService: APService;
  let dbTestBase: DatabaseTestBase;
  let testAPId: string;
  let testBranchId: string;
  let testSupplierId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test IDs
    testAPId = TestUtils.generate.id();
    testBranchId = TestUtils.generate.id();
    testSupplierId = TestUtils.generate.id();

    // Initialize service
    apService = new APService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('createAP', () => {
    const createAPData = {
      branchId: testBranchId,
      supplierId: testSupplierId,
      purchaseOrderId: 'PO-001',
      totalAmount: 1500.00,
      dueDate: new Date('2024-02-15'),
    };

    it('should create AP record successfully', async () => {
      const mockAP = {
        id: testAPId,
        ...createAPData,
        paidAmount: 0,
        balance: 1500.00,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(apRepository.create);
      mockCreate.mockResolvedValue(mockAP);

      const result = await apService.createAP(createAPData);

      expect(mockCreate).toHaveBeenCalledWith({
        id: expect.any(String),
        Branch: { connect: { id: createAPData.branchId } },
        Supplier: { connect: { id: createAPData.supplierId } },
        purchaseOrderId: createAPData.purchaseOrderId,
        totalAmount: createAPData.totalAmount,
        paidAmount: 0,
        balance: 1500.00,
        dueDate: createAPData.dueDate,
        status: 'pending',
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockAP);
    });

    it('should calculate balance correctly', async () => {
      const dataWithDifferentAmount = {
        ...createAPData,
        totalAmount: 2500.50,
      };

      const mockAP = {
        id: testAPId,
        ...dataWithDifferentAmount,
        paidAmount: 0,
        balance: 2500.50,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreate = vi.mocked(apRepository.create);
      mockCreate.mockResolvedValue(mockAP);

      await apService.createAP(dataWithDifferentAmount);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 2500.50,
          paidAmount: 0,
        })
      );
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate Net 15 due date', () => {
      const today = new Date();
      const expectedDueDate = new Date(today);
      expectedDueDate.setDate(today.getDate() + 15);

      const result = apService.calculateDueDate('Net 15');

      expect(result.toDateString()).toBe(expectedDueDate.toDateString());
    });

    it('should calculate Net 30 due date', () => {
      const today = new Date();
      const expectedDueDate = new Date(today);
      expectedDueDate.setDate(today.getDate() + 30);

      const result = apService.calculateDueDate('Net 30');

      expect(result.toDateString()).toBe(expectedDueDate.toDateString());
    });

    it('should calculate Net 60 due date', () => {
      const today = new Date();
      const expectedDueDate = new Date(today);
      expectedDueDate.setDate(today.getDate() + 60);

      const result = apService.calculateDueDate('Net 60');

      expect(result.toDateString()).toBe(expectedDueDate.toDateString());
    });

    it('should handle COD payment terms', () => {
      const today = new Date();
      const result = apService.calculateDueDate('COD');

      // COD should be due today
      expect(result.toDateString()).toBe(today.toDateString());
    });

    it('should handle unknown payment terms', () => {
      const today = new Date();
      const result = apService.calculateDueDate('Unknown Terms');

      // Unknown terms should default to today
      expect(result.toDateString()).toBe(today.toDateString());
    });
  });

  describe('recordPayment', () => {
    const paymentData = {
      apId: testAPId,
      amount: 500.00,
      paymentMethod: 'bank_transfer' as const,
      referenceNumber: 'REF-001',
      paymentDate: new Date(),
    };

    it('should record payment successfully', async () => {
      const mockAP = {
        id: testAPId,
        totalAmount: 1500.00,
        paidAmount: 0,
        balance: 1500.00,
        dueDate: new Date('2024-02-15'),
        status: 'pending',
      };

      const updatedAP = {
        ...mockAP,
        paidAmount: 500.00,
        balance: 1000.00,
        status: 'partial',
        Branch: { id: testBranchId, name: 'Test Branch' },
        Supplier: { id: testSupplierId, companyName: 'Test Supplier' },
        APPayment: [
          {
            id: TestUtils.generate.id(),
            amount: 500.00,
            paymentMethod: 'bank_transfer',
            referenceNumber: 'REF-001',
            paymentDate: paymentData.paymentDate,
          },
        ],
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);
      const mockCreate = vi.mocked(prisma.aPPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsPayable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue(updatedAP);
        return await callback(prisma);
      });

      const result = await apService.recordPayment(paymentData);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: paymentData.apId },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          AccountsPayable: { connect: { id: paymentData.apId } },
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          referenceNumber: paymentData.referenceNumber,
          paymentDate: paymentData.paymentDate,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.apId },
        data: {
          paidAmount: 500.00,
          balance: 1000.00,
          status: 'partial',
        },
        include: {
          Branch: true,
          Supplier: true,
          APPayment: true,
        },
      });
      expect(result).toEqual(updatedAP);
    });

    it('should mark AP as paid when balance reaches zero', async () => {
      const mockAP = {
        id: testAPId,
        totalAmount: 500.00,
        paidAmount: 0,
        balance: 500.00,
        dueDate: new Date('2024-02-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);
      const mockCreate = vi.mocked(prisma.aPPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsPayable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAP,
          paidAmount: 500.00,
          balance: 0,
          status: 'paid',
          Branch: { id: testBranchId, name: 'Test Branch' },
          Supplier: { id: testSupplierId, companyName: 'Test Supplier' },
          APPayment: [],
        });
        return await callback(prisma);
      });

      await apService.recordPayment({
        ...paymentData,
        amount: 500.00, // Full payment
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.apId },
        data: {
          paidAmount: 500.00,
          balance: 0,
          status: 'paid',
        },
        include: {
          Branch: true,
          Supplier: true,
          APPayment: true,
        },
      });
    });

    it('should mark AP as overdue when past due date with remaining balance', async () => {
      const mockAP = {
        id: testAPId,
        totalAmount: 1000.00,
        paidAmount: 0,
        balance: 1000.00,
        dueDate: new Date('2024-01-01'), // Past due date
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);
      const mockCreate = vi.mocked(prisma.aPPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsPayable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAP,
          paidAmount: 300.00,
          balance: 700.00,
          status: 'overdue',
          Branch: { id: testBranchId, name: 'Test Branch' },
          Supplier: { id: testSupplierId, companyName: 'Test Supplier' },
          APPayment: [],
        });
        return await callback(prisma);
      });

      await apService.recordPayment({
        ...paymentData,
        amount: 300.00,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.apId },
        data: {
          paidAmount: 300.00,
          balance: 700.00,
          status: 'overdue',
        },
        include: {
          Branch: true,
          Supplier: true,
          APPayment: true,
        },
      });
    });

    it('should throw error when AP record not found', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(null);
        return await callback(prisma);
      });

      await expect(
        apService.recordPayment(paymentData)
      ).rejects.toThrow('AP record not found');
    });

    it('should throw error when payment amount is zero or negative', async () => {
      const mockAP = {
        id: testAPId,
        totalAmount: 1000.00,
        paidAmount: 0,
        balance: 1000.00,
        dueDate: new Date('2024-02-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        return await callback(prisma);
      });

      await expect(
        apService.recordPayment({
          ...paymentData,
          amount: 0,
        })
      ).rejects.toThrow('Payment amount must be greater than 0');

      await expect(
        apService.recordPayment({
          ...paymentData,
          amount: -100,
        })
      ).rejects.toThrow('Payment amount must be greater than 0');
    });

    it('should throw error when payment amount exceeds balance', async () => {
      const mockAP = {
        id: testAPId,
        totalAmount: 1000.00,
        paidAmount: 0,
        balance: 500.00,
        dueDate: new Date('2024-02-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        return await callback(prisma);
      });

      await expect(
        apService.recordPayment({
          ...paymentData,
          amount: 600.00, // Exceeds balance
        })
      ).rejects.toThrow('Payment amount exceeds outstanding balance');
    });
  });

  describe('getAPById', () => {
    it('should return AP record by ID', async () => {
      const mockAP = {
        id: testAPId,
        totalAmount: 1500.00,
        paidAmount: 500.00,
        balance: 1000.00,
        status: 'partial',
      };

      const mockFindById = vi.mocked(apRepository.findById);
      mockFindById.mockResolvedValue(mockAP);

      const result = await apService.getAPById(testAPId);

      expect(mockFindById).toHaveBeenCalledWith(testAPId);
      expect(result).toEqual(mockAP);
    });
  });

  describe('getAllAP', () => {
    it('should return all AP records with filters', async () => {
      const mockAPs = [
        {
          id: testAPId,
          totalAmount: 1500.00,
          balance: 1000.00,
          status: 'partial',
        },
      ];

      const mockFindAll = vi.mocked(apRepository.findAll);
      mockFindAll.mockResolvedValue(mockAPs);

      const filters = { branchId: testBranchId, status: 'partial' };
      const result = await apService.getAllAP(filters);

      expect(mockFindAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockAPs);
    });
  });

  describe('deleteAP', () => {
    it('should delete AP record', async () => {
      const mockDelete = vi.mocked(apRepository.delete);
      mockDelete.mockResolvedValue(undefined);

      await apService.deleteAP(testAPId);

      expect(mockDelete).toHaveBeenCalledWith(testAPId);
    });
  });

  describe('getAgingReport', () => {
    it('should generate aging report correctly', async () => {
      const mockRecords = [
        {
          id: '1',
          balance: new Decimal(1000),
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          supplier: { companyName: 'Supplier A' },
        },
        {
          id: '2',
          balance: new Decimal(2000),
          dueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          supplier: { companyName: 'Supplier B' },
        },
        {
          id: '3',
          balance: new Decimal(1500),
          dueDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
          supplier: { companyName: 'Supplier A' },
        },
      ];

      const mockGetAgingReport = vi.mocked(apRepository.getAgingReport);
      mockGetAgingReport.mockResolvedValue(mockRecords);

      const result = await apService.getAgingReport();

      expect(result.buckets).toHaveLength(4);
      expect(result.buckets[0].bucket).toBe('0-30'); // 1 record, $1000
      expect(result.buckets[1].bucket).toBe('31-60'); // 1 record, $2000
      expect(result.buckets[3].bucket).toBe('90+'); // 1 record, $1500

      expect(result.totalOutstanding.toNumber()).toBe(4500);
      expect(result.bySupplier).toHaveLength(2);

      // Check supplier A: 2 records, $2500 total
      const supplierA = result.bySupplier.find(s => s.supplierName === 'Supplier A');
      expect(supplierA?.total.toNumber()).toBe(2500);

      // Check supplier B: 1 record, $2000 total
      const supplierB = result.bySupplier.find(s => s.supplierName === 'Supplier B');
      expect(supplierB?.total.toNumber()).toBe(2000);
    });

    it('should filter aging report by branch', async () => {
      const mockRecords = [
        {
          id: '1',
          balance: new Decimal(1000),
          dueDate: new Date(),
          supplier: { companyName: 'Supplier A' },
        },
      ];

      const mockGetAgingReport = vi.mocked(apRepository.getAgingReport);
      mockGetAgingReport.mockResolvedValue(mockRecords);

      await apService.getAgingReport(testBranchId);

      expect(mockGetAgingReport).toHaveBeenCalledWith(testBranchId);
    });
  });

  describe('getSummary', () => {
    it('should return AP summary', async () => {
      const mockSummary = {
        totalOutstanding: 5000.00,
        totalOverdue: 1500.00,
        totalPending: 2000.00,
        totalPaid: 1500.00,
      };

      const mockGetSummary = vi.mocked(apRepository.getSummary);
      mockGetSummary.mockResolvedValue(mockSummary);

      const result = await apService.getSummary(testBranchId);

      expect(mockGetSummary).toHaveBeenCalledWith(testBranchId);
      expect(result).toEqual(mockSummary);
    });
  });

  describe('Financial Calculations', () => {
    it('should handle decimal precision correctly', async () => {
      const paymentData = {
        apId: testAPId,
        amount: 123.456789,
        paymentMethod: 'bank_transfer' as const,
        referenceNumber: 'REF-001',
        paymentDate: new Date(),
      };

      const mockAP = {
        id: testAPId,
        totalAmount: 1000.00,
        paidAmount: 0,
        balance: 1000.00,
        dueDate: new Date('2024-02-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);
      const mockCreate = vi.mocked(prisma.aPPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsPayable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAP,
          paidAmount: 123.456789,
          balance: 876.543211,
          status: 'partial',
          Branch: { id: testBranchId, name: 'Test Branch' },
          Supplier: { id: testSupplierId, companyName: 'Test Supplier' },
          APPayment: [],
        });
        return await callback(prisma);
      });

      await apService.recordPayment(paymentData);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: paymentData.apId },
        data: {
          paidAmount: 123.456789,
          balance: 876.543211,
          status: 'partial',
        },
        include: {
          Branch: true,
          Supplier: true,
          APPayment: true,
        },
      });
    });

    it('should handle large amounts correctly', async () => {
      const largeAmount = 999999.99;

      const mockAP = {
        id: testAPId,
        totalAmount: largeAmount,
        paidAmount: 0,
        balance: largeAmount,
        dueDate: new Date('2024-02-15'),
        status: 'pending',
      };

      const { prisma } = await import('@/lib/prisma');
      const mockTransaction = vi.mocked(prisma.$transaction);
      const mockFindUnique = vi.mocked(prisma.accountsPayable.findUnique);
      const mockCreate = vi.mocked(prisma.aPPayment.create);
      const mockUpdate = vi.mocked(prisma.accountsPayable.update);

      mockTransaction.mockImplementation(async (callback) => {
        mockFindUnique.mockResolvedValue(mockAP);
        mockCreate.mockResolvedValue({} as any);
        mockUpdate.mockResolvedValue({
          ...mockAP,
          paidAmount: largeAmount,
          balance: 0,
          status: 'paid',
          Branch: { id: testBranchId, name: 'Test Branch' },
          Supplier: { id: testSupplierId, companyName: 'Test Supplier' },
          APPayment: [],
        });
        return await callback(prisma);
      });

      await apService.recordPayment({
        apId: testAPId,
        amount: largeAmount,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'LARGE-PAYMENT',
        paymentDate: new Date(),
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: testAPId },
        data: {
          paidAmount: largeAmount,
          balance: 0,
          status: 'paid',
        },
        include: {
          Branch: true,
          Supplier: true,
          APPayment: true,
        },
      });
    });
  });
});