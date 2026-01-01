import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { BASE_URL } from '../config';
import bcrypt from 'bcryptjs';

describe('Stock Level API', () => {
    let authToken: string;
    let warehouseId: string;
    let productId: string;
    let branchId: string;

    beforeAll(async () => {
        // Setup Branch
        const branch = await prisma.branch.create({
            data: {
                id: randomUUID(),
                name: 'Test Stock Level Branch',
                code: `SL-${randomUUID().substring(0, 8)}`,
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '123-456-7890',
                updatedAt: new Date(),
            },
        });
        branchId = branch.id;

        // Setup Warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                id: randomUUID(),
                name: 'Stock Level Warehouse',
                location: 'Loc',
                manager: 'Mgr',
                maxCapacity: 1000,
                branchId: branchId,
                updatedAt: new Date(),
            },
        });
        warehouseId = warehouse.id;

        // Setup Product
        const product = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: `Stock Level Product ${randomUUID()}`,
                basePrice: 100,
                baseUOM: 'PC',
                category: 'Test',
                minStockLevel: 5,
                shelfLifeDays: 365,
                updatedAt: new Date(),
            },
        });
        productId = product.id;

        // Add stock
        await prisma.inventory.upsert({
            where: { productId_warehouseId: { productId, warehouseId } },
            update: { quantity: 42 },
            create: {
                id: randomUUID(),
                productId: productId,
                warehouseId: warehouseId,
                quantity: 42,
            }
        });

        // Ensure user exists for login
        const email = 'cybergada@gmail.com';
        const password = 'Qweasd145698@';
        const hashedPassword = await bcrypt.hash(password, 4);

        // Find or create admin role
        let adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
        if (!adminRole) {
            adminRole = await prisma.role.create({
                data: {
                    id: randomUUID(),
                    name: 'Admin',
                    description: 'Administrator',
                    updatedAt: new Date(),
                }
            });
        }

        await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                status: 'ACTIVE',
                emailVerified: true,
                roleId: adminRole.id,
                updatedAt: new Date(),
            },
            create: {
                id: randomUUID(),
                email,
                passwordHash: hashedPassword,
                firstName: 'Test',
                lastName: 'Admin',
                status: 'ACTIVE',
                emailVerified: true,
                roleId: adminRole.id,
                updatedAt: new Date(),
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

        if (!loginResponse.ok) {
            const errorBody = await loginResponse.text();
            throw new Error(`Login failed with status ${loginResponse.status}: ${errorBody}`);
        }
        const loginData = await loginResponse.json();
        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
            const tokenMatch = cookies.match(/auth-token=([^;]+)/);
            if (tokenMatch) authToken = tokenMatch[1];
        }
    });

    afterAll(async () => {
        if (productId) {
            await prisma.inventory.deleteMany({ where: { productId } }).catch(() => { });
            await prisma.product.delete({ where: { id: productId } }).catch(() => { });
        }
        if (warehouseId) {
            await prisma.warehouse.delete({ where: { id: warehouseId } }).catch(() => { });
        }
        if (branchId) {
            await prisma.branch.delete({ where: { id: branchId } }).catch(() => { });
        }
    });

    it('should return the correct stock level', async () => {
        const url = `${BASE_URL}/api/inventory/stock-level?productId=${productId}&warehouseId=${warehouseId}`;
        const response = await fetch(url, {
            headers: { Cookie: `auth-token=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.quantity).toBe(42);
        expect(data.data.productId).toBe(productId);
        expect(data.data.warehouseId).toBe(warehouseId);
    });

    it('should return 0 for non-existent inventory', async () => {
        const otherProductId = randomUUID();
        const url = `${BASE_URL}/api/inventory/stock-level?productId=${otherProductId}&warehouseId=${warehouseId}`;
        const response = await fetch(url, {
            headers: { Cookie: `auth-token=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.quantity).toBe(0);
    });

    it('should return 400 if parameters are missing', async () => {
        const url = `${BASE_URL}/api/inventory/stock-level?productId=${productId}`;
        const response = await fetch(url, {
            headers: { Cookie: `auth-token=${authToken}` },
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('required');
    });
});
