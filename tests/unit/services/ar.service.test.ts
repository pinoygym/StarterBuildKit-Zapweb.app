import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ARService } from '@/services/ar.service';
import { arRepository } from '@/repositories/ar.repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';

vi.mock('@/repositories/ar.repository', () => ({
  arRepository: {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getAgingReport: vi.fn(),
    getSummary: vi.fn(),
    delete: vi.fn(),
  }
}));

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
  }
}));

describe('ARService', () => {
  let arService: ARService;
  let mockARRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    arService = new ARService();
  });

  describe('recordPayment', () => {
    it('should record payment and update AR balance', async () => {
      const arRecord = {
        id: '1',
        customerName: 'John Doe',
        totalAmount: new Decimal(1000),
        paidAmount: new Decimal(0),
        balance: new Decimal(1000),
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
      };

      const paymentData = {
        arId: '1',
        amount: 500,
        paymentMethod: 'Cash' as const,
        paymentDate: new Date(),
      };

      const updatedRecord = {
        ...arRecord,
        paidAmount: new Decimal(500),
        balance: new Decimal(500),
        status: 'partial',
        branch: { id: 'branch-1', name: 'Main Branch' },
        payments: [],
      };

      // Mock the transaction function to execute the callback
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
            update: vi.fn().mockResolvedValue(updatedRecord),
          },
          aRPayment: {
            create: vi.fn().mockResolvedValue({ id: 'payment-1' }),
          },
        };
        return await callback(tx);
      });

      const result = await arService.recordPayment(paymentData);

      expect(result.paidAmount).toEqual(new Decimal(500));
      expect(result.balance).toEqual(new Decimal(500));
      expect(result.status).toBe('partial');
    });

    it('should mark as paid when full amount is paid', async () => {
      const arRecord = {
        id: '1',
        totalAmount: new Decimal(1000),
        paidAmount: new Decimal(0),
        balance: new Decimal(1000),
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000),
      };

      const paymentData = {
        arId: '1',
        amount: 1000,
        paymentMethod: 'Bank Transfer' as const,
        paymentDate: new Date(),
      };

      const updatedRecord = {
        ...arRecord,
        paidAmount: new Decimal(1000),
        balance: new Decimal(0),
        status: 'paid',
        branch: { id: 'branch-1' },
        payments: [],
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
            update: vi.fn().mockResolvedValue(updatedRecord),
          },
          aRPayment: {
            create: vi.fn().mockResolvedValue({ id: 'payment-1' }),
          },
        };
        return await callback(tx);
      });

      const result = await arService.recordPayment(paymentData);

      expect(result.status).toBe('paid');
      expect(result.balance).toEqual(new Decimal(0));
    });

    it('should throw error when payment exceeds balance', async () => {
      const arRecord = {
        id: '1',
        totalAmount: new Decimal(1000),
        paidAmount: new Decimal(0),
        balance: new Decimal(1000),
        dueDate: new Date(),
      };

      const paymentData = {
        arId: '1',
        amount: 1500, // Exceeds balance
        paymentMethod: 'Cash' as const,
        paymentDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
          },
        };
        return await callback(tx);
      });

      await expect(arService.recordPayment(paymentData)).rejects.toThrow('Payment amount exceeds outstanding balance');
    });
  });

  describe('getAgingReport', () => {
    it('should generate aging report with correct buckets', async () => {
      const mockARRecords = [
        {
          id: '1',
          customerName: 'Customer 1',
          totalAmount: new Decimal(5000),
          paidAmount: new Decimal(0),
          balance: new Decimal(5000),
          dueDate: new Date(Date.now() - 15 * 86400000), // 15 days ago
          status: 'overdue',
          branch: { id: 'branch-1', name: 'Main Branch' },
        },
        {
          id: '2',
          customerName: 'Customer 2',
          totalAmount: new Decimal(3000),
          paidAmount: new Decimal(0),
          balance: new Decimal(3000),
          dueDate: new Date(Date.now() - 45 * 86400000), // 45 days ago
          status: 'overdue',
          branch: { id: 'branch-1', name: 'Main Branch' },
        },
      ] as any[];

      vi.mocked(arRepository.getAgingReport).mockResolvedValue(mockARRecords);

      const result = await arService.getAgingReport();

      expect(result.buckets).toHaveLength(4); // Should have 4 buckets: 0-30, 31-60, 61-90, 90+
      expect(result.totalOutstanding).toBeInstanceOf(Decimal);
      expect(arRepository.getAgingReport).toHaveBeenCalled();
    });
  });
});
