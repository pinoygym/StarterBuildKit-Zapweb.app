
import { describe, it, expect } from 'vitest';
import { supplierSchema } from '@/lib/validations/supplier.validation';

describe('Supplier Validation Schema', () => {
    it('should validate complete valid input', () => {
        const valid = {
            companyName: 'Test Inc',
            contactPerson: 'John Doe',
            phone: '123-456-7890',
            email: 'test@example.com',
            taxId: '123-456',
            paymentTerms: 'Net 30',
            status: 'active'
        };
        const result = supplierSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('should accept new payment terms Net 3 and Net 7', () => {
        const base = {
            companyName: 'Test Inc',
            contactPerson: 'John Doe',
            phone: '123-456-7890',
        };

        expect(supplierSchema.safeParse({ ...base, paymentTerms: 'Net 3' }).success).toBe(true);
        expect(supplierSchema.safeParse({ ...base, paymentTerms: 'Net 7' }).success).toBe(true);
    });

    it('should validate optional taxId', () => {
        const valid = {
            companyName: 'Test Inc',
            contactPerson: 'John Doe',
            phone: '123-456-7890',
            paymentTerms: 'COD'
        };
        expect(supplierSchema.safeParse(valid).success).toBe(true);
    });

    it('should fail on invalid payment terms', () => {
        const invalid = {
            companyName: 'Test Inc',
            contactPerson: 'John Doe',
            phone: '123-456-7890',
            paymentTerms: 'Net 999'
        };
        const result = supplierSchema.safeParse(invalid);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid payment terms');
        }
    });

    it('should fail on missing required fields', () => {
        const invalid = {
            contactPerson: 'John Doe'
        };
        const result = supplierSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});
