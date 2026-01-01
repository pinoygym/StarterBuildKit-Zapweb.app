
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BASE_URL } from '../config';

describe('Customer Search Integration Tests', () => {
    let token: string;
    let headers: any;
    let customer1Id: string;
    let customer2Id: string;

    beforeAll(async () => {
        // Login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });
        const loginData = await loginRes.json();
        token = loginData.token;
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        // Create Test Customer 1 with explicit random customerCode
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const res1 = await fetch(`${BASE_URL}/api/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerCode: `TEST-${timestamp}-${randomSuffix}-1`,
                companyName: `SearchTest One ${timestamp}`,
                contactPerson: 'UniqueName Alpha',
                phone: '09171111111',
                email: `search1-${timestamp}@test.com`,
                status: 'active',
                customerType: 'regular',
                creditLimit: 1000,
                paymentTerms: 'Net 30',
            }),
        });
        const data1 = await res1.json();
        if (!res1.ok || !data1.success) {
            console.error('Failed to create test customer 1:', JSON.stringify(data1, null, 2));
            throw new Error(`Customer 1 creation failed: ${data1.error || 'Unknown error'}`);
        }
        customer1Id = data1.data.id;

        // Create Test Customer 2 with explicit random customerCode
        const res2 = await fetch(`${BASE_URL}/api/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerCode: `TEST-${timestamp}-${randomSuffix}-2`,
                companyName: `SearchTest Two ${timestamp}`,
                contactPerson: 'UniqueName Beta',
                phone: '09172222222',
                email: `search2-${timestamp}@test.com`,
                status: 'active',
                customerType: 'wholesale',
                creditLimit: 2000,
                paymentTerms: 'Net 30',
            }),
        });
        const data2 = await res2.json();
        if (!res2.ok || !data2.success) {
            console.error('Failed to create test customer 2:', JSON.stringify(data2, null, 2));
            throw new Error(`Customer 2 creation failed: ${data2.error || 'Unknown error'}`);
        }
        customer2Id = data2.data.id;
    });


    afterAll(async () => {
        const ids = [customer1Id, customer2Id];
        for (const id of ids) {
            if (id) {
                try {
                    await fetch(`${BASE_URL}/api/customers/${id}`, {
                        method: 'DELETE',
                        headers,
                    });
                } catch { }
            }
        }
    });

    it('should find customer by single keyword "UniqueName"', async () => {
        const res = await fetch(`${BASE_URL}/api/customers?search=UniqueName`, { headers });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.data.length).toBeGreaterThanOrEqual(2);
        const foundIds = data.data.map((c: any) => c.id);
        expect(foundIds).toContain(customer1Id);
        expect(foundIds).toContain(customer2Id);
    });

    it('should find customer by exact phrase "SearchTest One"', async () => {
        const res = await fetch(`${BASE_URL}/api/customers?search=SearchTest One`, { headers });
        const data = await res.json();
        expect(res.status).toBe(200);
        const found = data.data.find((c: any) => c.id === customer1Id);
        expect(found).toBeDefined();
    });

    it('should find customer by partial multi-keyword "Alpha One"', async () => {
        // "One" is in companyName, "Alpha" is in contactPerson
        const res = await fetch(`${BASE_URL}/api/customers?search=Alpha One`, { headers });
        const data = await res.json();
        expect(res.status).toBe(200);

        // This is the CRITICAL test for strict AND behavior of split keywords
        const found = data.data.find((c: any) => c.id === customer1Id);
        expect(found).toBeDefined();
    });

    it('should find customer by mixed case keywords "uniqueNAME beta"', async () => {
        const res = await fetch(`${BASE_URL}/api/customers?search=uniqueNAME beta`, { headers });
        const data = await res.json();
        expect(res.status).toBe(200);

        const found = data.data.find((c: any) => c.id === customer2Id);
        expect(found).toBeDefined();
    });

    it('should NOT find customer if one keyword matches and another does not "Alpha Gamma"', async () => {
        // "Alpha" is in contactPerson, "Gamma" is nowhere
        const res = await fetch(`${BASE_URL}/api/customers?search=Alpha Gamma`, { headers });
        const data = await res.json();
        expect(res.status).toBe(200);

        const found = data.data.find((c: any) => c.id === customer1Id);
        expect(found).toBeUndefined();
    });
});

