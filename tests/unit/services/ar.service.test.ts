import { describe, it, expect, vi, beforeEach } from 'vitest';
import { arService } from '@/services/ar.service';
import { arRepository } from '@/repositories/ar.repository';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/repositories/ar.repository', () => ({
  arRepository: {
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
        const otherValue = typeof other === 'object' && other !== null && 'value' in other ? parseFloat(other.value) : parseFloat(other);
        return new MockDecimal(this.value + otherValue);
      }
      minus(other: any) {
        const otherValue = typeof other === 'object' && other !== null && 'value' in other ? parseFloat(other.value) : parseFloat(other);
        return new MockDecimal(this.value - otherValue);
      }
      equals(other: any) {
        const otherValue = typeof other === 'object' && other !== null && 'value' in other ? parseFloat(other.value) : parseFloat(other);
        return this.value === otherValue;
      }
      lessThan(other: any) {
        const otherValue = typeof other === 'object' && other !== null && 'value' in other ? parseFloat(other.value) : parseFloat(other);
        return this.value < otherValue;
      }
      greaterThan(other: any) {
        const otherValue = typeof other === 'object' && other !== null && 'value' in other ? parseFloat(other.value) : parseFloat(other);
        return this.value > otherValue;
      }
      toNumber() {
        return this.value;
      }
    },
  },
}));

describe('ARService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAR', () => {
    it('should create AR record with correct initial values', async () => {
      const input = {
        branchId: 'branch-1',
        customerId: 'customer-1',
        customerName: 'Test Customer',
        salesOrderId: 'so-1',
        totalAmount: 1000,
        dueDate: new Date(),
      };

      vi.mocked(arRepository.create).mockResolvedValue({
        id: 'ar-1',
        branchId: input.branchId,
        customerId: input.customerId,
        customerName: input.customerName,
        salesOrderId: input.salesOrderId,
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        dueDate: input.dueDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await arService.createAR(input);

      expect(arRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 1000,
          paidAmount: 0,
          balance: 1000,
          status: 'pending',
        }),
        undefined
      );
      expect(result.status).toBe('pending');
      expect(result.paidAmount).toBe('0');
      expect(result.balance).toBe('1000');
    });
  });

  describe('recordPayment', () => {
    it('should record full payment and update status to paid', async () => {
      const arRecord = {
        id: 'ar-1',
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
      };

      const paymentInput = {
        arId: 'ar-1',
        amount: 1000,
        paymentMethod: 'Cash',
        paymentDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
            update: vi.fn().mockResolvedValue({
              ...arRecord,
              paidAmount: '1000',
              balance: '0',
              status: 'paid',
            }),
          },
          aRPayment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              arId: 'ar-1',
              amount: '1000',
              paymentMethod: 'Cash',
              paymentDate: new Date(),
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await arService.recordPayment(paymentInput);

      expect(result.paidAmount).toBe('1000');
      expect(result.balance).toBe('0');
      expect(result.status).toBe('paid');
    });

    it('should record partial payment and update status to partial', async () => {
      const arRecord = {
        id: 'ar-1',
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000),
      };

      const paymentInput = {
        arId: 'ar-1',
        amount: 500,
        paymentMethod: 'Cash',
        paymentDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
            update: vi.fn().mockResolvedValue({
              ...arRecord,
              paidAmount: '500',
              balance: '500',
              status: 'partial',
            }),
          },
          aRPayment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              amount: '500',
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await arService.recordPayment(paymentInput);

      expect(result.paidAmount).toBe('500');
      expect(result.balance).toBe('500');
      expect(result.status).toBe('partial');
    });

    it('should reject payment exceeding balance', async () => {
      const arRecord = {
        id: 'ar-1',
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        status: 'pending',
        dueDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        arService.recordPayment({
          arId: 'ar-1',
          amount: 1500,
          paymentMethod: 'Cash',
          paymentDate: new Date(),
        })
      ).rejects.toThrow('exceeds outstanding balance');
    });

    it('should reject zero or negative payment', async () => {
      const arRecord = {
        id: 'ar-1',
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        status: 'pending',
        dueDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        arService.recordPayment({
          arId: 'ar-1',
          amount: 0,
          paymentMethod: 'Cash',
          paymentDate: new Date(),
        })
      ).rejects.toThrow('greater than 0');
    });

    it('should throw error if AR record not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        arService.recordPayment({
          arId: 'non-existent',
          amount: 100,
          paymentMethod: 'Cash',
          paymentDate: new Date(),
        })
      ).rejects.toThrow('AR record not found');
    });
  });

  describe('getAgingReport', () => {
    it('should calculate aging buckets correctly', async () => {
      const today = new Date();

      const mockRecords = [
        // 0-30 days (due in 15 days)
        {
          id: '1',
          customerName: 'Customer A',
          balance: '1000',
          dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        },
        // 31-60 days overdue (45 days overdue)
        {
          id: '2',
          customerName: 'Customer B',
          balance: '2000',
          dueDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
        },
        // 61-90 days overdue (75 days overdue)
        {
          id: '3',
          customerName: 'Customer C',
          balance: '3000',
          dueDate: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000),
        },
        // 90+ days overdue (100 days overdue)
        {
          id: '4',
          customerName: 'Customer D',
          balance: '4000',
          dueDate: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000),
        },
      ];

      vi.mocked(arRepository.getAgingReport).mockResolvedValue(mockRecords as any);

      const result = await arService.getAgingReport();

      // Check bucket counts
      expect(result.buckets[0].count).toBe(1); // 0-30
      expect(result.buckets[1].count).toBe(1); // 31-60
      expect(result.buckets[2].count).toBe(1); // 61-90
      expect(result.buckets[3].count).toBe(1); // 90+

      // Check bucket amounts
      expect(result.buckets[0].totalAmount.toNumber()).toBe(1000);
      expect(result.buckets[1].totalAmount.toNumber()).toBe(2000);
      expect(result.buckets[2].totalAmount.toNumber()).toBe(3000);
      expect(result.buckets[3].totalAmount.toNumber()).toBe(4000);

      // Check total outstanding
      expect(result.totalOutstanding.toNumber()).toBe(10000);

      // Check customer grouping
      expect(result.byCustomer).toHaveLength(4);
      const customerA = result.byCustomer.find(
        (c) => c.customerName === 'Customer A'
      );
      expect(customerA?.total.toNumber()).toBe(1000);
    });

    it('should handle multiple invoices for same customer', async () => {
      const today = new Date();

      const mockRecords = [
        {
          id: '1',
          customerName: 'Customer A',
          balance: '500',
          dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          customerName: 'Customer A',
          balance: '700',
          dueDate: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000),
        },
      ];

      vi.mocked(arRepository.getAgingReport).mockResolvedValue(mockRecords as any);

      const result = await arService.getAgingReport();

      const customerA = result.byCustomer.find(
        (c) => c.customerName === 'Customer A'
      );
      expect(customerA?.total.toNumber()).toBe(1200);
      expect(customerA?.aging[0].count).toBe(1); // One in 0-30
      expect(customerA?.aging[1].count).toBe(1); // One in 31-60
    });

    it('should handle empty records', async () => {
      vi.mocked(arRepository.getAgingReport).mockResolvedValue([]);

      const result = await arService.getAgingReport();

      expect(result.buckets.every((b) => b.count === 0)).toBe(true);
      expect(result.totalOutstanding.toNumber()).toBe(0);
      expect(result.byCustomer).toHaveLength(0);
    });
  });

  describe('recordBatchPayment', () => {
    it('should record batch payment across multiple AR records', async () => {
      const batchPaymentInput = {
        customerId: 'customer-1',
        totalAmount: 1500,
        paymentMethod: 'Check',
        referenceNumber: 'CHK-001',
        paymentDate: new Date(),
        allocations: [
          { arId: 'ar-1', amount: 1000 },
          { arId: 'ar-2', amount: 500 },
        ],
      };

      const arRecord1 = {
        id: 'ar-1',
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        status: 'pending',
        dueDate: new Date(),
      };

      const arRecord2 = {
        id: 'ar-2',
        totalAmount: '800',
        paidAmount: '0',
        balance: '800',
        status: 'pending',
        dueDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(arRecord1)
              .mockResolvedValueOnce(arRecord2),
            update: vi.fn()
              .mockResolvedValueOnce({
                ...arRecord1,
                paidAmount: '1000',
                balance: '0',
                status: 'paid',
              })
              .mockResolvedValueOnce({
                ...arRecord2,
                paidAmount: '500',
                balance: '300',
                status: 'partial',
              }),
          },
          aRPayment: {
            create: vi.fn()
              .mockResolvedValueOnce({
                id: 'payment-1',
                arId: 'ar-1',
                amount: '1000',
                paymentMethod: 'Check',
                referenceNumber: 'CHK-001',
              })
              .mockResolvedValueOnce({
                id: 'payment-2',
                arId: 'ar-2',
                amount: '500',
                paymentMethod: 'Check',
                referenceNumber: 'CHK-001',
              }),
          },
        };
        return await callback(mockTx);
      });

      const result = await arService.recordBatchPayment(batchPaymentInput);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('paid');
      expect(result[1].status).toBe('partial');
    });

    it('should reject batch payment with mismatched total', async () => {
      const batchPaymentInput = {
        customerId: 'customer-1',
        totalAmount: 1500,
        paymentMethod: 'Check',
        paymentDate: new Date(),
        allocations: [
          { arId: 'ar-1', amount: 1000 },
          { arId: 'ar-2', amount: 400 }, // Only 1400 total, not 1500
        ],
      };

      await expect(
        arService.recordBatchPayment(batchPaymentInput)
      ).rejects.toThrow('Total allocated amount must equal total payment amount');
    });

    it('should reject batch payment with empty allocations', async () => {
      const batchPaymentInput = {
        customerId: 'customer-1',
        totalAmount: 1000,
        paymentMethod: 'Check',
        paymentDate: new Date(),
        allocations: [],
      };

      await expect(
        arService.recordBatchPayment(batchPaymentInput)
      ).rejects.toThrow('At least one allocation is required');
    });

    it('should handle batch payment with withholding tax and discounts', async () => {
      const batchPaymentInput = {
        customerId: 'customer-1',
        totalAmount: 1000,
        paymentMethod: 'Check',
        paymentDate: new Date(),
        withholdingTax: 50,
        salesDiscount: 30,
        rebates: 20,
        allocations: [
          { arId: 'ar-1', amount: 1000 },
        ],
      };

      const arRecord = {
        id: 'ar-1',
        totalAmount: '1000',
        paidAmount: '0',
        balance: '1000',
        status: 'pending',
        dueDate: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn().mockResolvedValue(arRecord),
            update: vi.fn().mockResolvedValue({
              ...arRecord,
              paidAmount: '1000',
              balance: '0',
              status: 'paid',
            }),
          },
          aRPayment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment-1',
              arId: 'ar-1',
              amount: '1000',
              paymentMethod: 'Check',
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await arService.recordBatchPayment(batchPaymentInput);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('paid');
    });

    it('should rollback transaction if any allocation fails', async () => {
      const batchPaymentInput = {
        customerId: 'customer-1',
        totalAmount: 1500,
        paymentMethod: 'Check',
        paymentDate: new Date(),
        allocations: [
          { arId: 'ar-1', amount: 1000 },
          { arId: 'ar-invalid', amount: 500 },
        ],
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const mockTx = {
          accountsReceivable: {
            findUnique: vi.fn()
              .mockResolvedValueOnce({
                id: 'ar-1',
                balance: '1000',
              })
              .mockResolvedValueOnce(null), // Second AR not found
          },
        };
        return await callback(mockTx);
      });

      await expect(
        arService.recordBatchPayment(batchPaymentInput)
      ).rejects.toThrow();
    });
  });
});
