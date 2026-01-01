import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { BASE_URL } from '../config';

describe('Inventory Transfer API Routes', () => {
    let authToken: string;
    let userId: string;
    let sourceWarehouseId: string;
    let destinationWarehouseId: string;
    let productId: string;
    let branchId: string;
    let transferId: string;

    beforeAll(async () => {
        try {
            console.log('Starting setup...');
            // Setup Branch
            const branch = await prisma.branch.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Transfer Branch',
                    code: `TB-${randomUUID().substring(0, 8)}`,
                    location: 'Test Location',
                    manager: 'Test Manager',
                    phone: '123-456-7890',
                    updatedAt: new Date(),
                },
            });
            console.log('Branch created');
            branchId = branch.id;

            // Setup Warehouses
            const sourceWarehouse = await prisma.warehouse.create({
                data: {
                    id: randomUUID(),
                    name: 'Source Warehouse',
                    location: 'Source Loc',
                    manager: 'Mgr 1',
                    maxCapacity: 1000,
                    branchId: branchId,
                    updatedAt: new Date(),
                },
            });
            sourceWarehouseId = sourceWarehouse.id;

            const destWarehouse = await prisma.warehouse.create({
                data: {
                    id: randomUUID(),
                    name: 'Dest Warehouse',
                    location: 'Dest Loc',
                    manager: 'Mgr 2',
                    maxCapacity: 1000,
                    branchId: branchId,
                    updatedAt: new Date(),
                },
            });
            destinationWarehouseId = destWarehouse.id;

            // Setup Product with stock in source
            const product = await prisma.product.create({
                data: {
                    id: randomUUID(),
                    name: `Test Transfer Product ${randomUUID()}`,
                    basePrice: 100,
                    baseUOM: 'PC',
                    category: 'Test',
                    minStockLevel: 5,
                    shelfLifeDays: 365,
                    updatedAt: new Date(),
                },
            });
            productId = product.id;

            // Add stock to source
            await prisma.inventory.create({
                data: {
                    id: randomUUID(),
                    productId: productId,
                    warehouseId: sourceWarehouseId,
                    quantity: 100,
                }
            });

            // Login
            const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'cybergada@gmail.com',
                    password: 'Qweasd145698@',
                }),
            });

            if (!loginResponse.ok) throw new Error('Login failed');
            const loginData = await loginResponse.json();
            userId = loginData.user.id;
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const tokenMatch = cookies.match(/auth-token=([^;]+)/);
                if (tokenMatch) authToken = tokenMatch[1];
            }
        } catch (e) {
            console.error('Setup failed', e);
            throw e;
        }
    });

    afterAll(async () => {
        if (transferId) await prisma.inventoryTransfer.delete({ where: { id: transferId } }).catch(() => { });
        if (productId) {
            await prisma.stockMovement.deleteMany({ where: { productId } }).catch(() => { });
            await prisma.inventory.deleteMany({ where: { productId } }).catch(() => { });
            await prisma.product.delete({ where: { id: productId } }).catch(() => { });
        }
        if (sourceWarehouseId && destinationWarehouseId) {
            await prisma.warehouse.deleteMany({ where: { id: { in: [sourceWarehouseId, destinationWarehouseId] } } }).catch(() => { });
        }
        if (branchId) {
            await prisma.branch.delete({ where: { id: branchId } }).catch(() => { });
        }
    });

    it('should create a draft transfer', async () => {
        const payload = {
            sourceWarehouseId,
            destinationWarehouseId,
            branchId,
            reason: 'Test Transfer',
            transferDate: new Date(),
            items: [
                {
                    productId,
                    quantity: 10,
                    uom: 'PC'
                }
            ]
        };

        const response = await fetch(`${BASE_URL}/api/inventory/transfers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `auth-token=${authToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (response.status !== 201) {
            const error = await response.json();
            console.error('Create failed:', JSON.stringify(error, null, 2));
        }
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('DRAFT');
        transferId = data.data.id;
    });

    it('should list transfers', async () => {
        const response = await fetch(`${BASE_URL}/api/inventory/transfers`, {
            headers: { Cookie: `auth-token=${authToken}` },
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        const found = data.data.find((t: any) => t.id === transferId);
        expect(found).toBeDefined();
    });

    it('should update the transfer', async () => {
        const payload = {
            reason: 'Updated Reason',
            items: [
                {
                    productId,
                    quantity: 20,
                    uom: 'PC'
                }
            ]
        };

        const response = await fetch(`${BASE_URL}/api/inventory/transfers/${transferId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `auth-token=${authToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (response.status !== 200) {
            const error = await response.json();
            console.error('Update failed:', JSON.stringify(error, null, 2));
        }

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.reason).toBe('Updated Reason');
        expect(data.data.items[0].quantity).toBe(20);
    });

    it('should post the transfer', async () => {
        const response = await fetch(`${BASE_URL}/api/inventory/transfers/${transferId}/post`, {
            method: 'POST',
            headers: { Cookie: `auth-token=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('POSTED');

        // Verify stock movement
        const sourceInv = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId, warehouseId: sourceWarehouseId } }
        });
        const destInv = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId, warehouseId: destinationWarehouseId } }
        });

        expect(Number(sourceInv?.quantity)).toBe(80); // 100 - 20
        expect(Number(destInv?.quantity)).toBe(20);   // 0 + 20
    });
});
