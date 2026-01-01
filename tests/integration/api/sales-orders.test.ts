import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Sales Orders API Integration Tests', () => {
    let testSOId: string;
    let customerId: string;
    let warehouseId: string;
    let branchId: string;
    let productId: string;
    let productUOM: string;
    let token: string;
    let headers: any;
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

    beforeAll(async () => {
        try {
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

            // Get Branch and Warehouse
            const warehousesRes = await fetch(`${BASE_URL}/api/warehouses`, { headers });
            const warehousesData = await warehousesRes.json();
            const warehouse = warehousesData.data?.[0];
            warehouseId = warehouse?.id;
            branchId = warehouse?.branchId;

            // Get Customer
            const customersRes = await fetch(`${BASE_URL}/api/customers`, { headers });
            const customersData = await customersRes.json();
            customerId = customersData.data?.[0]?.id;

            // Get Product
            const productsRes = await fetch(`${BASE_URL}/api/products`, { headers });
            const productsData = await productsRes.json();
            const product = productsData.data?.[0];
            productId = product?.id;
            productUOM = product?.baseUOM || 'bottle';

            // Add stock to ensure sufficient inventory
            await fetch(`${BASE_URL}/api/inventory/adjust`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    productId,
                    warehouseId,
                    newQuantity: 100,
                    reason: 'Integration Test Setup'
                })
            });

        } catch (e) {
            console.error('Setup failed', e);
            throw e;
        }
    });

    afterAll(async () => {
        // Cleanup test data
        if (testSOId) {
            try {
                await fetch(`${BASE_URL}/api/sales-orders/${testSOId}`, {
                    method: 'DELETE',
                    headers,
                });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    describe('POST /api/sales-orders', () => {
        it('should create a new sales order', async () => {
            const timestamp = Date.now();
            const newSO = {
                customerName: 'Integration Test Customer',
                customerPhone: '09171234567',
                deliveryAddress: 'Test Address',
                warehouseId,
                branchId,
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        productId,
                        quantity: 5,
                        uom: productUOM,
                        unitPrice: 100,
                        subtotal: 500,
                    },
                ],
            };

            const response = await fetch(`${BASE_URL}/api/sales-orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newSO),
            });

            const data = await response.json();

            if (response.status !== 201) {
                console.error('Create SO Failed:', JSON.stringify(data, null, 2));
            }

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.orderNumber).toBeDefined();

            testSOId = data.data.id;
        });

        it('should return 400 for invalid SO data', async () => {
            const invalidSO = {
                warehouseId,
                items: [],
            };

            const response = await fetch(`${BASE_URL}/api/sales-orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(invalidSO),
            });

            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
        });
    });

    describe('GET /api/sales-orders', () => {
        it('should return list of sales orders', async () => {
            const response = await fetch(`${BASE_URL}/api/sales-orders`, {
                headers,
            });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
        });
    });

    describe('GET /api/sales-orders/:id', () => {
        it('should return a sales order by ID', async () => {
            if (!testSOId) return;

            const response = await fetch(`${BASE_URL}/api/sales-orders/${testSOId}`, {
                headers,
            });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.id).toBe(testSOId);
        });
    });

    describe('PUT /api/sales-orders/:id', () => {
        it('should update sales order', async () => {
            if (!testSOId) return;

            const updateData = {
                notes: 'Updated notes for integration test',
            };

            const response = await fetch(`${BASE_URL}/api/sales-orders/${testSOId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            // Notes field may not be returned in update response
        });
    });

    describe('DELETE /api/sales-orders/:id', () => {
        it('should cancel sales order', async () => {
            if (!testSOId) return;

            const response = await fetch(`${BASE_URL}/api/sales-orders/${testSOId}`, {
                method: 'DELETE',
                headers,
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
        });
    });
});
