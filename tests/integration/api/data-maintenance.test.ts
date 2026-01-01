// @vitest-environment node

import { prisma } from '@/lib/prisma';
import { BASE_URL } from '../config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Data Maintenance API Support (Product Categories)', () => {
    let token: string;
    let headers: any;
    let testCategoryId: string;

    beforeAll(async () => {
        // 1. Seed data
        const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        const seed = await seedRes.json()

        if (!seed.success) {
            console.error('Seed failed:', JSON.stringify(seed, null, 2))
            throw new Error('Seed failed')
        }

        // 2. Login to get token
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        })
        const loginData = await loginRes.json()

        if (!loginData.success) {
            console.error('Login failed:', JSON.stringify(loginData, null, 2))
            throw new Error('Login failed')
        }

        token = loginData.token
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }

        // Connect Prisma
        await prisma.$connect();
    });

    afterAll(async () => {
        if (testCategoryId) {
            try {
                await prisma.productCategory.delete({ where: { id: testCategoryId } });
            } catch { }
        }
        await prisma.$disconnect();
    });

    describe('POST /api/data-maintenance/product-categories', () => {
        it('should create a new product category', async () => {
            const timestamp = Date.now();
            const newCategory = {
                name: `Integration Test Category ${timestamp}`,
                code: `ITC-${timestamp}`,
                description: 'Test category description',
                status: 'active',
            };

            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newCategory),
            });

            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.name).toBe(newCategory.name);
            expect(data.data.code).toBe(newCategory.code);

            testCategoryId = data.data.id;
        });

        it('should return 400 for existing name', async () => {
            if (!testCategoryId) throw new Error('Previous test failed, cannot run this one');

            const category = await prisma.productCategory.findUnique({ where: { id: testCategoryId } });
            if (!category) throw new Error('Test category not found');

            const duplicateCategory = {
                name: category.name, // Same name
                code: `ITC-NEW-${Date.now()}`,
            };

            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify(duplicateCategory),
            });

            const data = await response.json();
            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
        });

        it('should return 400 for existing code', async () => {
            if (!testCategoryId) throw new Error('Previous test failed, cannot run this one');

            const category = await prisma.productCategory.findUnique({ where: { id: testCategoryId } });
            if (!category) throw new Error('Test category not found');

            const duplicateCategory = {
                name: `New Name ${Date.now()}`,
                code: category.code, // Same code
            };

            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify(duplicateCategory),
            });

            const data = await response.json();
            expect(data.success).toBe(false);
        });
    });

    describe('GET /api/data-maintenance/product-categories', () => {
        it('should return list of product categories', async () => {
            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, {
                headers,
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);

            // Verify our created category is in the list
            const found = data.data.find((c: any) => c.id === testCategoryId);
            expect(found).toBeDefined();
        });
    });

    describe('PUT /api/data-maintenance/product-categories/:id', () => {
        it('should update product category details', async () => {
            if (!testCategoryId) return;
            const updateData = {
                name: `Updated Category Name ${Date.now()}`,
                description: 'Updated description',
            };
            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories/${testCategoryId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.name).toBe(updateData.name);
            expect(data.data.description).toBe(updateData.description);
        });
    });

    describe('DELETE /api/data-maintenance/product-categories/:id', () => {
        it('should delete product category', async () => {
            if (!testCategoryId) return;

            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories/${testCategoryId}`, {
                method: 'DELETE',
                headers,
            });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify it's gone
            const getRes = await fetch(`${BASE_URL}/api/data-maintenance/product-categories/${testCategoryId}`, {
                headers,
            });
            expect(getRes.status).toBe(404);

            testCategoryId = '';
        });
    });

    // Test Expense Categories (Checking generic service fix)
    describe('Expense Categories (Generic Service Check)', () => {
        let expenseCatId: string;

        it('should create expense category', async () => {
            const newCat = {
                name: `Test Expense Cat ${Date.now()}`,
                code: `EC-${Date.now()}`,
                status: 'active'
            };
            const response = await fetch(`${BASE_URL}/api/data-maintenance/expense-categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newCat)
            });
            const data = await response.json();

            if (!data.success) console.error('Create Expense Cat Failed:', data);

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.updatedAt).toBeDefined(); // Verify updatedAt is present
            expenseCatId = data.data.id;
        });

        it('should delete expense category', async () => {
            if (!expenseCatId) return;
            const res = await fetch(`${BASE_URL}/api/data-maintenance/expense-categories/${expenseCatId}`, { method: 'DELETE', headers });
            expect(res.status).toBe(200);
        });
    });

    // Test Unit Of Measure (Checking generic service fix)
    describe('Units of Measure (Generic Service Check)', () => {
        let uomId: string;

        it('should create unit of measure', async () => {
            const newUom = {
                name: `Test UOM ${Date.now()}`,
                code: `U-${Date.now()}`,
                status: 'active'
            };
            const response = await fetch(`${BASE_URL}/api/data-maintenance/units-of-measure`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newUom)
            });
            const data = await response.json();

            if (!data.success) console.error('Create UOM Failed:', data);

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.updatedAt).toBeDefined();
            uomId = data.data.id;
        });

        it('should delete unit of measure', async () => {
            if (!uomId) return;
            const res = await fetch(`${BASE_URL}/api/data-maintenance/units-of-measure/${uomId}`, { method: 'DELETE', headers });
            expect(res.status).toBe(200);
        });
    });
});

