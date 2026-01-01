import { describe, it, expect, vi, beforeEach } from 'vitest';
import { arService } from '@/services/ar.service';
import { prisma } from '@/lib/prisma';
import { ARPaymentReportFilters } from '@/types/ar.types';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        aRPayment: {
            findMany: vi.fn(),
        },
    },
    Prisma: {
        QueryMode: {
            insensitive: 'insensitive',
        },
    },
}));

describe('ARService - Payments Report', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPaymentsReport', () => {
        it('should return all payments when no filters are provided', async () => {
            const mockPayments = [
                {
                    id: 'payment-1',
                    arId: 'ar-1',
                    amount: 1000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-001',
                    paymentDate: new Date('2024-01-15'),
                    AccountsReceivable: {
                        customerName: 'Customer A',
                        salesOrderId: 'SO-001',
                        Branch: {
                            name: 'Main Branch',
                            code: 'MB',
                        },
                    },
                },
                {
                    id: 'payment-2',
                    arId: 'ar-2',
                    amount: 2000,
                    paymentMethod: 'Check',
                    referenceNumber: 'REF-002',
                    paymentDate: new Date('2024-01-16'),
                    AccountsReceivable: {
                        customerName: 'Customer B',
                        salesOrderId: 'SO-002',
                        Branch: {
                            name: 'Branch 2',
                            code: 'B2',
                        },
                    },
                },
            ];

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue(mockPayments as any);

            const result = await arService.getPaymentsReport();

            expect(result.payments).toHaveLength(2);
            expect(result.summary.totalPayments).toBe(2);
            expect(result.summary.totalAmount).toBe(3000);
            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    AccountsReceivable: {
                        include: {
                            Branch: true,
                        },
                    },
                },
                orderBy: {
                    paymentDate: 'desc',
                },
            });
        });

        it('should filter by date range', async () => {
            const filters: ARPaymentReportFilters = {
                fromDate: new Date('2024-01-01'),
                toDate: new Date('2024-01-31'),
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        paymentDate: {
                            gte: filters.fromDate,
                            lte: filters.toDate,
                        },
                    },
                })
            );
        });

        it('should filter by payment method', async () => {
            const filters: ARPaymentReportFilters = {
                paymentMethod: 'Cash',
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        paymentMethod: 'Cash',
                    },
                })
            );
        });

        it('should filter by reference number', async () => {
            const filters: ARPaymentReportFilters = {
                referenceNumber: 'REF-001',
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        referenceNumber: {
                            contains: 'REF-001',
                            mode: 'insensitive',
                        },
                    },
                })
            );
        });

        it('should filter by branch', async () => {
            const filters: ARPaymentReportFilters = {
                branchId: 'branch-1',
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AccountsReceivable: {
                            branchId: 'branch-1',
                        },
                    },
                })
            );
        });

        it('should filter by customer', async () => {
            const filters: ARPaymentReportFilters = {
                customerId: 'customer-1',
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AccountsReceivable: {
                            customerId: 'customer-1',
                        },
                    },
                })
            );
        });

        it('should filter by customer name', async () => {
            const filters: ARPaymentReportFilters = {
                customerName: 'John',
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AccountsReceivable: {
                            customerName: {
                                contains: 'John',
                                mode: 'insensitive',
                            },
                        },
                    },
                })
            );
        });

        it('should combine multiple filters', async () => {
            const filters: ARPaymentReportFilters = {
                fromDate: new Date('2024-01-01'),
                toDate: new Date('2024-01-31'),
                branchId: 'branch-1',
                paymentMethod: 'Cash',
            };

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            await arService.getPaymentsReport(filters);

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        paymentDate: {
                            gte: filters.fromDate,
                            lte: filters.toDate,
                        },
                        paymentMethod: 'Cash',
                        AccountsReceivable: {
                            branchId: 'branch-1',
                        },
                    },
                })
            );
        });

        it('should calculate summary statistics correctly', async () => {
            const mockPayments = [
                {
                    id: 'payment-1',
                    arId: 'ar-1',
                    amount: 1000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-001',
                    paymentDate: new Date('2024-01-15'),
                    AccountsReceivable: {
                        customerName: 'Customer A',
                        salesOrderId: 'SO-001',
                        Branch: {
                            name: 'Main Branch',
                            code: 'MB',
                        },
                    },
                },
                {
                    id: 'payment-2',
                    arId: 'ar-2',
                    amount: 2000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-002',
                    paymentDate: new Date('2024-01-16'),
                    AccountsReceivable: {
                        customerName: 'Customer B',
                        salesOrderId: 'SO-002',
                        Branch: {
                            name: 'Main Branch',
                            code: 'MB',
                        },
                    },
                },
                {
                    id: 'payment-3',
                    arId: 'ar-3',
                    amount: 1500,
                    paymentMethod: 'Check',
                    referenceNumber: 'REF-003',
                    paymentDate: new Date('2024-01-17'),
                    AccountsReceivable: {
                        customerName: 'Customer C',
                        salesOrderId: 'SO-003',
                        Branch: {
                            name: 'Branch 2',
                            code: 'B2',
                        },
                    },
                },
            ];

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue(mockPayments as any);

            const result = await arService.getPaymentsReport();

            // Check total statistics
            expect(result.summary.totalAmount).toBe(4500);
            expect(result.summary.totalPayments).toBe(3);

            // Check grouping by payment method
            expect(result.summary.byPaymentMethod).toHaveLength(2);
            const cashMethod = result.summary.byPaymentMethod.find((m) => m.method === 'Cash');
            expect(cashMethod?.count).toBe(2);
            expect(cashMethod?.amount).toBe(3000);

            const checkMethod = result.summary.byPaymentMethod.find((m) => m.method === 'Check');
            expect(checkMethod?.count).toBe(1);
            expect(checkMethod?.amount).toBe(1500);

            // Check grouping by branch
            expect(result.summary.byBranch).toHaveLength(2);
            const mainBranch = result.summary.byBranch.find((b) => b.branchName === 'Main Branch');
            expect(mainBranch?.count).toBe(2);
            expect(mainBranch?.amount).toBe(3000);

            const branch2 = result.summary.byBranch.find((b) => b.branchName === 'Branch 2');
            expect(branch2?.count).toBe(1);
            expect(branch2?.amount).toBe(1500);
        });

        it('should return empty report when no payments found', async () => {
            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue([]);

            const result = await arService.getPaymentsReport();

            expect(result.payments).toHaveLength(0);
            expect(result.summary.totalPayments).toBe(0);
            expect(result.summary.totalAmount).toBe(0);
            expect(result.summary.byPaymentMethod).toHaveLength(0);
            expect(result.summary.byBranch).toHaveLength(0);
        });

        it('should transform payment data correctly', async () => {
            const mockPayments = [
                {
                    id: 'payment-1',
                    arId: 'ar-1',
                    amount: 1000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-001',
                    paymentDate: new Date('2024-01-15'),
                    AccountsReceivable: {
                        customerName: 'Customer A',
                        salesOrderId: 'SO-001',
                        Branch: {
                            name: 'Main Branch',
                            code: 'MB',
                        },
                    },
                },
            ];

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue(mockPayments as any);

            const result = await arService.getPaymentsReport();

            expect(result.payments[0]).toEqual({
                id: 'payment-1',
                arId: 'ar-1',
                amount: 1000,
                paymentMethod: 'Cash',
                referenceNumber: 'REF-001',
                paymentDate: mockPayments[0].paymentDate,
                customerName: 'Customer A',
                salesOrderId: 'SO-001',
                branchName: 'Main Branch',
                branchCode: 'MB',
            });
        });

        it('should order payments by date descending', async () => {
            const mockPayments = [
                {
                    id: 'payment-2',
                    arId: 'ar-2',
                    amount: 2000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-002',
                    paymentDate: new Date('2024-01-16'),
                    AccountsReceivable: {
                        customerName: 'Customer B',
                        salesOrderId: 'SO-002',
                        Branch: { name: 'Main Branch', code: 'MB' },
                    },
                },
                {
                    id: 'payment-1',
                    arId: 'ar-1',
                    amount: 1000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-001',
                    paymentDate: new Date('2024-01-15'),
                    AccountsReceivable: {
                        customerName: 'Customer A',
                        salesOrderId: 'SO-001',
                        Branch: { name: 'Main Branch', code: 'MB' },
                    },
                },
            ];

            vi.mocked(prisma.aRPayment.findMany).mockResolvedValue(mockPayments as any);

            await arService.getPaymentsReport();

            expect(prisma.aRPayment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: {
                        paymentDate: 'desc',
                    },
                })
            );
        });
    });
});
