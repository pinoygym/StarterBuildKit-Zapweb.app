import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resetTestDatabase, createTestUser, createAuthHeaders, createTestCustomer, createTestBranch } from '@/tests/helpers/test-db-utils';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

import { BASE_URL } from '../config';

describe('AR Payments Report API', () => {
    let authHeaders: Record<string, string>;
    let testBranchId: string;
    let testCustomerId: string;
    let testARId: string;

    beforeAll(async () => {
        await resetTestDatabase();
        const branch = await createTestBranch();
        testBranchId = branch.id;

        const user = await createTestUser({
            // Ensure user is associated with this branch if your logic requires it, 
            // otherwise just creating the user is enough for authHeaders.
            // If User model doesn't have branchId, we don't pass it here.
        });

        // If your auth logic checks for branch access, you might need to create UserBranchAccess here.
        // For now, assuming Super Admin (default role) has access to all or we just need a valid branchId for the records.

        authHeaders = await createAuthHeaders(user.email, user.password);

        // Create test customer
        const customer = await createTestCustomer({
            companyName: 'Test Customer Company',
            contactPerson: 'Test Customer',
            email: 'test@customer.com',
            phone: '1234567890',
            address: '123 Test St',
        });
        testCustomerId = customer.id;

        // Create test AR record
        const ar = await prisma.accountsReceivable.create({
            data: {
                id: randomUUID(),
                branchId: testBranchId,
                customerId: testCustomerId,
                customerName: customer.companyName || customer.contactPerson,
                salesOrderId: 'SO-TEST-001',
                totalAmount: 5000,
                paidAmount: 0,
                balance: 5000,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'pending',
                updatedAt: new Date(),
            },
        });
        testARId = ar.id;

        // Create test payments
        await prisma.aRPayment.createMany({
            data: [
                {
                    id: randomUUID(),
                    arId: testARId,
                    amount: 2000,
                    paymentMethod: 'Cash',
                    referenceNumber: 'REF-001',
                    paymentDate: new Date('2024-01-15'),
                },
                {
                    id: randomUUID(),
                    arId: testARId,
                    amount: 1500,
                    paymentMethod: 'Check',
                    referenceNumber: 'REF-002',
                    paymentDate: new Date('2024-01-20'),
                },
                {
                    id: randomUUID(),
                    arId: testARId,
                    amount: 1000,
                    paymentMethod: 'Bank Transfer',
                    referenceNumber: 'REF-003',
                    paymentDate: new Date('2024-01-25'),
                },
            ],
        });
    });

    afterAll(async () => {
        await resetTestDatabase();
    });

    it('should return all payments without filters', async () => {
        const response = await fetch(`${BASE_URL}/api/ar/payments-report`, {
            method: 'GET',
            headers: authHeaders,
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        expect(data.payments.length).toBeGreaterThanOrEqual(3);
        expect(data.summary).toBeDefined();
        expect(data.summary.totalPayments).toBeGreaterThanOrEqual(3);
        expect(data.summary.totalAmount).toBeGreaterThanOrEqual(4500);
    });

    it('should filter payments by date range', async () => {
        const fromDate = new Date('2024-01-01').toISOString();
        const toDate = new Date('2024-01-18').toISOString();

        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?fromDate=${fromDate}&toDate=${toDate}`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        // Should only include payments from Jan 15
        data.payments.forEach((payment: any) => {
            const paymentDate = new Date(payment.paymentDate);
            expect(paymentDate.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
            expect(paymentDate.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
        });
    });

    it('should filter payments by payment method', async () => {
        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?paymentMethod=Cash`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        data.payments.forEach((payment: any) => {
            expect(payment.paymentMethod).toBe('Cash');
        });
    });

    it('should filter payments by reference number', async () => {
        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?referenceNumber=REF-001`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        expect(data.payments.length).toBeGreaterThanOrEqual(1);
        data.payments.forEach((payment: any) => {
            expect(payment.referenceNumber).toContain('REF-001');
        });
    });

    it('should filter payments by customer name', async () => {
        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?customerName=Test Customer`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        data.payments.forEach((payment: any) => {
            expect(payment.customerName.toLowerCase()).toContain('test customer'.toLowerCase());
        });
    });

    it('should filter payments by branch', async () => {
        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?branchId=${testBranchId}`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        expect(data.payments.length).toBeGreaterThanOrEqual(3);
    });

    it('should return correct summary statistics', async () => {
        const response = await fetch(`${BASE_URL}/api/ar/payments-report`, {
            method: 'GET',
            headers: authHeaders,
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.summary).toBeDefined();
        expect(data.summary.totalPayments).toBeGreaterThanOrEqual(3);
        expect(data.summary.totalAmount).toBeGreaterThanOrEqual(4500);
        expect(data.summary.byPaymentMethod).toBeDefined();
        expect(Array.isArray(data.summary.byPaymentMethod)).toBe(true);
        expect(data.summary.byBranch).toBeDefined();
        expect(Array.isArray(data.summary.byBranch)).toBe(true);
    });

    it('should group payments by payment method correctly', async () => {
        const response = await fetch(`${BASE_URL}/api/ar/payments-report`, {
            method: 'GET',
            headers: authHeaders,
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        const cashMethod = data.summary.byPaymentMethod.find((m: any) => m.method === 'Cash');
        expect(cashMethod).toBeDefined();
        expect(cashMethod.count).toBeGreaterThanOrEqual(1);
        expect(cashMethod.amount).toBeGreaterThanOrEqual(2000);
    });

    it('should return 401 for unauthenticated requests', async () => {
        const response = await fetch(`${BASE_URL}/api/ar/payments-report`, {
            method: 'GET',
        });

        expect(response.status).toBe(401);
    });

    it('should handle empty results gracefully', async () => {
        // Query for a date range with no payments
        const fromDate = new Date('2025-01-01').toISOString();
        const toDate = new Date('2025-01-31').toISOString();

        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?fromDate=${fromDate}&toDate=${toDate}`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        expect(Array.isArray(data.payments)).toBe(true);
        expect(data.summary.totalPayments).toBe(0);
        expect(data.summary.totalAmount).toBe(0);
    });

    it('should combine multiple filters correctly', async () => {
        const fromDate = new Date('2024-01-01').toISOString();
        const toDate = new Date('2024-01-31').toISOString();

        const response = await fetch(
            `${BASE_URL}/api/ar/payments-report?fromDate=${fromDate}&toDate=${toDate}&paymentMethod=Cash&branchId=${testBranchId}`,
            {
                method: 'GET',
                headers: authHeaders,
            }
        );

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.payments).toBeDefined();
        data.payments.forEach((payment: any) => {
            expect(payment.paymentMethod).toBe('Cash');
            const paymentDate = new Date(payment.paymentDate);
            expect(paymentDate.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
            expect(paymentDate.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
        });
    });
});

