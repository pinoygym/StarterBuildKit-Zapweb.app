import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createAndLoginUser, createTestBranch, createTestWarehouse, createTestCustomer, createTestProduct } from '../../helpers/test-db-utils';
import { BASE_URL } from '../config';

describe('Sales Orders API Integration Tests', () => {
    let testSOId: string;
    let customerId: string;
    let warehouseId: string;
    let branchId: string;
    let productId: string;
    let productUOM: string;
    let token: string;
    let headers: any;

    let cleanup: () => Promise<void>;

    beforeAll(async () => {
        try {
            // 1. Create and login user
            const auth = await createAndLoginUser(BASE_URL);
            token = auth.token;
            headers = auth.headers;
            cleanup = auth.cleanup;

            // 2. Ensure Warehouse exists
            const warehousesRes = await fetch(`${BASE_URL}/api/warehouses`, { headers });
            const warehousesData = await warehousesRes.json();
            if (warehousesData.data && warehousesData.data.length > 0) {
                const warehouse = warehousesData.data[0];
                warehouseId = warehouse.id;
                branchId = warehouse.branchId;
            } else {
                // Create if not exists
                const branch = await createTestBranch();
                const warehouse = await createTestWarehouse(branch.id);
                warehouseId = warehouse.id;
                branchId = branch.id;
            }

            // 3. Ensure Customer exists
            const customersRes = await fetch(`${BASE_URL}/api/customers`, { headers });
            const customersData = await customersRes.json();
            if (customersData.data && customersData.data.length > 0) {
                customerId = customersData.data[0].id;
            } else {
                const customer = await createTestCustomer();
                customerId = customer.id;
            }

            // 4. Ensure Product exists
            const productsRes = await fetch(`${BASE_URL}/api/products`, { headers });
            const productsData = await productsRes.json();
            if (productsData.data && productsData.data.length > 0) {
                const product = productsData.data[0];
                productId = product.id;
                productUOM = product.baseUOM || 'PCS';
            } else {
                const product = await createTestProduct();
                productId = product.id;
                productUOM = product.baseUOM;
            }

            // 5. Add stock to ensure sufficient inventory
            const adjustRes = await fetch(`${BASE_URL}/api/inventory/adjust`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    productId,
                    warehouseId,
                    newQuantity: 100,
                    reason: 'Integration Test Setup'
                })
            });

            if (adjustRes.status !== 200) {
                const adjustData = await adjustRes.json();
                console.error('Inventory Adjustment Failed:', JSON.stringify(adjustData, null, 2));
                throw new Error(`Inventory Adjustment Failed: ${JSON.stringify(adjustData)}`);
            }

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
        if (cleanup) await cleanup();
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
                throw new Error(`Create SO Failed: ${JSON.stringify(data, null, 2)}`);
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

