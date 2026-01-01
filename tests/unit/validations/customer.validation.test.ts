
import { describe, it, expect } from 'vitest';
import { customerSchema } from '@/lib/validations/customer.validation';

describe('Customer Validation Schema', () => {
    it('should validate complete valid input', () => {
        const valid = {
            contactPerson: 'Jane Doe',
            phone: '0917-123-4567',
            paymentTerms: 'Net 30',
            customerType: 'regular',
            status: 'active',
            taxId: 'TAX-123'
        };
        const result = customerSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('should accept new payment terms Net 3 and Net 7', () => {
        const base = {
            contactPerson: 'Jane Doe',
            phone: '0917-123-4567',
        };

        expect(customerSchema.safeParse({ ...base, paymentTerms: 'Net 3' }).success).toBe(true);
        expect(customerSchema.safeParse({ ...base, paymentTerms: 'Net 7' }).success).toBe(true);
    });

    it('should validate optional fields', () => {
        const valid = {
            contactPerson: 'Jane Doe',
            phone: '0917-123-4567',
            // email is optional
            // taxId is optional
        };
        const result = customerSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
        const invalid = {
            contactPerson: 'Jane Doe',
            phone: '0917-123-4567',
            email: 'invalid-email'
        };
        const result = customerSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it('should validate credit limit non-negative', () => {
        const invalid = {
            contactPerson: 'Jane Doe',
            phone: '0917-123-4567',
            creditLimit: -500
        };
        const result = customerSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });
});
