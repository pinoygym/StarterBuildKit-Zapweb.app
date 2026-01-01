import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apService } from '@/services/ap.service';
import { apRepository } from '@/repositories/ap.repository';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/repositories/ap.repository', () => ({
  apRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
    getAgingReport: vi.fn(),
    getSummary: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
  Prisma: {
    Decimal: class MockDecimal {
      value: number;
      constructor(value: number | string) {
        this.value = typeof value === 'string' ? parseFloat(value) : value;
      }
      plus(other: any) {
        return new MockDecimal(this.value + (other.value || other));
      }
      minus(other: any) {
        return new MockDecimal(this.value - (other.value || other));
      }
      equals(other: any) {
        return this.value === (other.value || other);
      }
      lessThan(other: any) {
        return this.value < (other.value || other);
      }
      greaterThan(other: any) {
        return this.value > (other.value || other);
      }
      toNumber() {
        return this.value;
      }
    },
  },
}));

describe('APService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAP', () => {
    it('should create AP record with correct initial values', async () => {
      const input = {
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        purchaseOrderId: 'po-1',
        totalAmount: 5000,
        dueDate: new Date(),
      };

      vi.mocked(apRepository.create).mockResolvedValue({
        id: 'ap-1',
        branchId: input.branchId,
        supplierId: input.supplierId,
        purchaseOrderId: input.purchaseOrderId,
        totalAmount: '5000',
        paidAmount: '0',
        balance: '5000',
        dueDate: input.dueDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await apService.createAP(input);

      expect(apRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 5000,
          paidAmount: 0,
          balance: 5000,
          status: 'pending',
        })
      );
      expect(result.status).toBe('pending');
      expect(result.paidAmount).toBe('0');
      expect(result.balance).toBe('5000');
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate Net 15 due date correctly', () => {
      const today = new Date();
      const result = apService.calculateDueDate('Net 15');
      const expected = new Date(today);
      expected.setDate(expected.getDate() + 15);

      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should calculate Net 30 due date correctly', () => {
      const today = new Date();
      const result = apService.calculateDueDate('Net 30');
      const expected = new Date(today);
      expected.setDate(expected.getDate() + 30);

      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should calculate Net 60 due date correctly', () => {
      const today = new Date();
      const result = apService.calculateDueDate('Net 60');
      const expected = new Date(today);
      expected.setDate(expected.getDate() + 60);

      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('should handle COD (Cash On Delivery)', () => {
      const result = apService.calculateDueDate('COD');
      const today = new Date();

      // COD should be due today
      expect(result.toDateString()).toBe(today.toDateString());
    });
  });

  describe('recordPayment', () => {
    it('should record full payment and update status to paid', async () => {
      const apRecord = {
        id: 'ap-1',
        totalAmount: '5000',
        paidAmount: '0',
        balance: '5000',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000),
      };

      const paymentInput = {
        apId: 'ap-1',
        amount: 5000,
        paymentMethod: 'Check',
        paymentDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsPayable: {
            findUnique: vi.fn().mockResolvedValue(apRecord),
            update: vi.fn().mockResolvedValue({
              ...apRecord,
              paidAmount: '5000',
              balance: '0',
              status: 'paid',
            }),
          },
          aPPayment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              apId: 'ap-1',
              amount: '5000',
              paymentMethod: 'Check',
              paymentDate: new Date(),
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await apService.recordPayment(paymentInput);

      expect(result.paidAmount).toBe('5000');
      expect(result.balance).toBe('0');
      expect(result.status).toBe('paid');
    });

    it('should record partial payment and update status to partial', async () => {
      const apRecord = {
        id: 'ap-1',
        totalAmount: '5000',
        paidAmount: '0',
        balance: '5000',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000),
      };

      const paymentInput = {
        apId: 'ap-1',
        amount: 2500,
        paymentMethod: 'Cash',
        paymentDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsPayable: {
            findUnique: vi.fn().mockResolvedValue(apRecord),
            update: vi.fn().mockResolvedValue({
              ...apRecord,
              paidAmount: '2500',
              balance: '2500',
              status: 'partial',
            }),
          },
          aPPayment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              amount: '2500',
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await apService.recordPayment(paymentInput);

      expect(result.paidAmount).toBe('2500');
      expect(result.balance).toBe('2500');
      expect(result.status).toBe('partial');
    });

    it('should reject payment exceeding balance', async () => {
      const apRecord = {
        id: 'ap-1',
        totalAmount: '5000',
        paidAmount: '0',
        balance: '5000',
        status: 'pending',
        dueDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsPayable: {
            findUnique: vi.fn().mockResolvedValue(apRecord),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        apService.recordPayment({
          apId: 'ap-1',
          amount: 6000,
          paymentMethod: 'Cash',
          paymentDate: new Date(),
        })
      ).rejects.toThrow('exceeds outstanding balance');
    });

    it('should reject zero or negative payment', async () => {
      const apRecord = {
        id: 'ap-1',
        totalAmount: '5000',
        paidAmount: '0',
        balance: '5000',
        status: 'pending',
        dueDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsPayable: {
            findUnique: vi.fn().mockResolvedValue(apRecord),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        apService.recordPayment({
          apId: 'ap-1',
          amount: -100,
          paymentMethod: 'Cash',
          paymentDate: new Date(),
        })
      ).rejects.toThrow('greater than 0');
    });

    it('should throw error if AP record not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsPayable: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        apService.recordPayment({
          apId: 'non-existent',
          amount: 100,
          paymentMethod: 'Cash',
          paymentDate: new Date(),
        })
      ).rejects.toThrow('AP record not found');
    });
  });
});
