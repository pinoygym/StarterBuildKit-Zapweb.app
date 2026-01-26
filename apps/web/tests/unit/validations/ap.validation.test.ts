import { describe, it, expect } from 'vitest';
import {
    accountsPayableSchema,
    updateAPSchema,
    apPaymentSchema,
} from '@/lib/validations/ap.validation';

describe('AP (Accounts Payable) Validation', () => {
    describe('accountsPayableSchema', () => {
        it('should accept valid AP record', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: 10000.00,
                balance: 10000.00,
                dueDate: new Date('2025-01-01'),
            };

            const result = accountsPayableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional fields and validate balance', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: 10000.00,
                taxAmount: 1200.00,
                discountAmount: 500.00,
                paidAmount: 2000.00,
                balance: 8000.00, // totalAmount - paidAmount
                dueDate: new Date('2025-01-01'),
                notes: 'Payment terms: Net 30',
                purchaseOrderId: 'clabcdefg12345680',
            };

            const result = accountsPayableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject when balance does not equal totalAmount - paidAmount', () => {
            const invalidData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: 10000.00,
                paidAmount: 2000.00,
                balance: 5000.00, // Should be 8000.00
                dueDate: new Date('2025-01-01'),
            };

            const result = accountsPayableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                supplierId: 'clabcdefg12345678',
                // missing branchId, totalAmount, balance, dueDate
            };

            const result = accountsPayableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative totalAmount', () => {
            const invalidData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: -5000.00,
                balance: -5000.00,
                dueDate: new Date('2025-01-01'),
            };

            const result = accountsPayableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative balance', () => {
            const invalidData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: 10000.00,
                balance: -1000.00,
                dueDate: new Date('2025-01-01'),
            };

            const result = accountsPayableSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept valid status values', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: 10000.00,
                balance: 10000.00,
                dueDate: new Date('2025-01-01'),
                status: 'pending' as const,
            };

            const result = accountsPayableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should handle large amounts', () => {
            const validData = {
                branchId: 'clabcdefg12345678',
                supplierId: 'clabcdefg12345679',
                totalAmount: 999999.99,
                balance: 999999.99,
                dueDate: new Date('2025-01-01'),
            };

            const result = accountsPayableSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('updateAPSchema', () => {
        it('should accept partial updates', () => {
            const validData = {
                notes: 'Updated payment terms',
            };

            const result = updateAPSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept totalAmount update', () => {
            const validData = {
                totalAmount: 15000.00,
            };

            const result = updateAPSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept status update', () => {
            const validData = {
                status: 'paid' as const,
            };

            const result = updateAPSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject negative totalAmount', () => {
            const invalidData = {
                totalAmount: -1000.00,
            };

            const result = updateAPSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('apPaymentSchema', () => {
        it('should accept valid payment data', () => {
            const validData = {
                amount: 5000.00,
                paymentDate: new Date('2024-12-25'),
                paymentMethod: 'bank_transfer' as const,
            };

            const result = apPaymentSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional fields', () => {
            const validData = {
                amount: 5000.00,
                paymentDate: new Date('2024-12-25'),
                paymentMethod: 'check' as const,
                referenceNumber: 'CHK-12345',
                notes: 'Partial payment',
            };

            const result = apPaymentSchema.safeParse(validData);
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
                    amount: 1000.00,
                    paymentDate: new Date('2024-12-25'),
                    paymentMethod: method,
                };
                const result = apPaymentSchema.safeParse(validData);
                expect(result.success).toBe(true);
            });
        });

        it('should reject negative payment amount', () => {
            const invalidData = {
                amount: -1000.00,
                paymentDate: new Date('2024-12-25'),
                paymentMethod: 'cash',
            };

            const result = apPaymentSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero payment amount', () => {
            const invalidData = {
                amount: 0,
                paymentDate: new Date('2024-12-25'),
                paymentMethod: 'cash',
            };

            const result = apPaymentSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should require payment method', () => {
            const invalidData = {
                amount: 5000.00,
                paymentDate: new Date('2024-12-25'),
                // missing paymentMethod
            };

            const result = apPaymentSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
