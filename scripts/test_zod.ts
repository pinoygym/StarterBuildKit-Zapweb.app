
import { customerSchema } from '../lib/validations/customer.validation';
import { z } from 'zod';

console.log('Testing Zod Schema with empty email...');

const data = {
    contactPerson: 'John Doe',
    phone: '09170000000',
    email: '',
    paymentTerms: 'Net 30',
    customerType: 'regular',
};

const result = customerSchema.safeParse(data);

if (result.success) {
    console.log('Validation passed');
    console.log(result.data);
} else {
    console.log('Validation failed');
    console.log(JSON.stringify(result.error.flatten(), null, 2));
}

// Test literal logic directly
const emailSchema = z.union([z.string().email('Invalid email format'), z.literal('')]).optional();
const res2 = emailSchema.safeParse('');
console.log('Direct schema test for "":', res2.success);
