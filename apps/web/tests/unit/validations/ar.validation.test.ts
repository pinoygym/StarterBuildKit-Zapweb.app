import { describe, it, expect } from 'vitest';
import {
    accountsReceivableSchema,
    updateARSchema,
    arPaymentSchema,
} from '@/lib/validations/ar.validation';

describe('AR (Accounts Receivable) Validation', () => {
    describe('accountsReceivableSchema', () => {
        it('should accept valid AR record', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                customerName: 'John Doe',
                totalAmount: 15000.00,
                balance: 15000.00,
                dueDate: new Date('2025-01-15'),
            };

            const result = accountsReceivableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional fields and validate balance', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                customerName: 'Jane Smith',
                totalAmount: 15000.00,
                paidAmount: 5000.00,
                balance: 10000.00, // totalAmount - paidAmount
                dueDate: new Date('2025-01-15'),
                notes: 'Customer payment terms: 30 days',
                salesOrderId: 'clabcdefg12345680',
            };

            const result = accountsReceivableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject when balance does not equal totalAmount - paidAmount', () => {
            const invalidData = {
                branchId: 'clabcdefg12345678',
                customerName: 'Test Customer',
                totalAmount: 15000.00,
                paidAmount: 5000.00,
                balance: 8000.00, // Should be 10000.00
                dueDate: new Date('2025-01-15'),
            };

            const result = accountsReceivableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                customerName: 'Test Customer',
                // missing branchId, totalAmount, balance, dueDate
            };

            const result = accountsReceivableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative totalAmount', () => {
            const invalidData = {
                branchId: 'clabcdefg12345678',
                customerName: 'Test Customer',
                totalAmount: -8000.00,
                balance: -8000.00,
                dueDate: new Date('2025-01-15'),
            };

            const result = accountsReceivableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative balance', () => {
            const invalidData = {
                branchId: 'clabcdefg12345678',
                customerName: 'Test Customer',
                totalAmount: 15000.00,
                balance: -2000.00,
                dueDate: new Date('2025-01-15'),
            };

            const result = accountsReceivableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept valid status values', () => {
            const statuses: Array<'pending' | 'partial' | 'paid' | 'overdue'> = [
                'pending',
                'partial',
                'paid',
                'overdue',
            ];

            statuses.forEach((status) => {
                const validData = {
                    branchId: 'clabcdefg12345678',
                    customerName: 'Test Customer',
                    totalAmount: 15000.00,
                    balance: 15000.00,
                    dueDate: new Date('2025-01-15'),
                    status,
                };
                const result = accountsReceivableSchema.safeParse(validData);
                expect(result.success).toBe(true);
            });
        });

        it('should handle large amounts', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                customerName: 'Corporate Client',
                totalAmount: 999999.99,
                balance: 999999.99,
                dueDate: new Date('2025-01-15'),
            };

            const result = accountsReceivableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('updateARSchema', () => {
        it('should accept partial updates', () => {
            const validData = {
                notes: 'Updated customer payment terms',
            };

            const result = updateARSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept totalAmount update', () => {
            const validData = {
                totalAmount: 20000.00,
            };

            const result = updateARSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept status update', () => {
            const validData = {
                status: 'paid' as const,
            };

            const result = updateARSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject negative totalAmount', () => {
            const invalidData = {
                totalAmount: -5000.00,
            };

            const result = updateARSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('arPaymentSchema', () => {
        it('should accept valid payment data', () => {
            const validData = {
                amount: 7500.00,
                paymentDate: new Date('2024-12-26'),
                paymentMethod: 'bank_transfer' as const,
            };

            const result = arPaymentSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional fields', () => {
            const validData = {
                amount: 7500.00,
                paymentDate: new Date('2024-12-26'),
                paymentMethod: 'check' as const,
                referenceNumber: 'CHK-67890',
                notes: 'Payment received from customer',
            };

            const result = arPaymentSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept all payment methods', () => {
            const methods: Array<'cash' | 'card' | 'check' | 'bank_transfer' | 'online_transfer'> = [
                'cash',
                'card',
                'check',
                'bank_transfer',
                'online_transfer',
            ];

            methods.forEach((method) => {
                const validData = {
                    amount: 2000.00,
                    paymentDate: new Date('2024-12-26'),
                    paymentMethod: method,
                };
                const result = arPaymentSchema.safeParse(validData);
                expect(result.success).toBe(true);
            });
        });

        it('should reject negative payment amount', () => {
            const invalidData = {
                amount: -3000.00,
                paymentDate: new Date('2024-12-26'),
                paymentMethod: 'cash',
            };

            const result = arPaymentSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero payment amount', () => {
            const invalidData = {
                amount: 0,
                paymentDate: new Date('2024-12-26'),
                paymentMethod: 'cash',
            };

            const result = arPaymentSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should require payment method', () => {
            const invalidData = {
                amount: 7500.00,
                paymentDate: new Date('2024-12-26'),
                // missing paymentMethod
            };

            const result = arPaymentSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
