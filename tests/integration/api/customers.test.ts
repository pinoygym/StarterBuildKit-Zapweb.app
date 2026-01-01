import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BASE_URL } from '../config';

describe('Customers API Integration Tests', () => {
    let token: string;
    let headers: any;
    let testCustomerId: string;

    beforeAll(async () => {
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        })
        const loginData = await loginRes.json()
        token = loginData.token
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
    });

    afterAll(async () => {
        if (testCustomerId) {
            try {
                await fetch(`${BASE_URL}/api/customers/${testCustomerId}`, {
                    method: 'DELETE',
                    headers,
                });
            } catch { }
        }
    });

    describe('POST /api/customers', () => {
        it('should create a new customer', async () => {
            const timestamp = Date.now();
            const newCustomer = {
                companyName: `Integration Test Co ${timestamp}`,
                contactPerson: 'John Integrator',
                phone: '09170000000',
                email: `int-customer-${timestamp}@test.com`,
                paymentTerms: 'Net 30',
                customerType: 'regular',
                creditLimit: 10000,
            };

            const response = await fetch(`${BASE_URL}/api/customers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newCustomer),
            });

            const data = await response.json();
            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.companyName).toBe(newCustomer.companyName);
            testCustomerId = data.data.id;
        });

        it('should return 400 for missing required fields', async () => {
            const invalidCustomer = {
                companyName: 'Missing Phone',
            };
            const response = await fetch(`${BASE_URL}/api/customers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(invalidCustomer),
            });
            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/customers', () => {
        it('should return list of customers', async () => {
            const response = await fetch(`${BASE_URL}/api/customers`, {
                headers,
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('should filter customers by search', async () => {
            const response = await fetch(`${BASE_URL}/api/customers?search=John`, {
                headers,
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });

    describe('GET /api/customers/:id', () => {
        it('should return customer by ID', async () => {
            if (!testCustomerId) return;
            const response = await fetch(`${BASE_URL}/api/customers/${testCustomerId}`, {
                headers,
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.id).toBe(testCustomerId);
        });
    });

    describe('PUT /api/customers/:id', () => {
        it('should update customer details', async () => {
            if (!testCustomerId) return;
            const updateData = {
                contactPerson: 'Jane Updated',
                creditLimit: 20000,
            };
            const response = await fetch(`${BASE_URL}/api/customers/${testCustomerId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.contactPerson).toBe(updateData.contactPerson);
            expect(data.data.creditLimit).toBe(updateData.creditLimit);
        });
    });

    describe('DELETE /api/customers/:id', () => {
        it('should delete (or deactivate) customer', async () => {
            if (!testCustomerId) return;
            const response = await fetch(`${BASE_URL}/api/customers/${testCustomerId}`, {
                method: 'DELETE',
                headers,
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify status is inactive
            const getRes = await fetch(`${BASE_URL}/api/customers/${testCustomerId}`, {
                headers,
            });
            const getData = await getRes.json();
            expect(getRes.status).toBe(200);
            expect(getData.data.status).toBe('inactive');
            
            // Clean up for other tests if needed, but inactive is fine
            // testCustomerId = ''; 
        });
    });
});
