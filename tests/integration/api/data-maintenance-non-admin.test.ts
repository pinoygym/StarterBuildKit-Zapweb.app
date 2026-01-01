// @vitest-environment node

import { BASE_URL } from '../config';
import { prisma } from '@/lib/prisma';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Data Maintenance API Access (Non-Admin)', () => {
    let token: string;
    let headers: any;
    let testCategoryId: string;
    const timestamp = Date.now();
    const userEmail = `test.user.${timestamp}@example.com`;
    const userPassword = 'Password123!';

    beforeAll(async () => {
        // 1. Register a new non-admin user
        console.log('Registering user:', userEmail);
        const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword,
                firstName: 'Test',
                lastName: 'User',
            }),
        });

        const registerData = await registerRes.json();
        console.log('Register Response:', JSON.stringify(registerData, null, 2));

        if (!registerRes.ok && !registerData.success) {
            console.error('Register failed explicitly');
        }

        // 1.5 Manually activate user
        await prisma.user.update({
            where: { email: userEmail },
            data: {
                status: 'ACTIVE',
                emailVerified: true
            }
        });

        // 2. Login to get token
        console.log('Logging in user:', userEmail);
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword,
            }),
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('Login failed response:', JSON.stringify(loginData, null, 2));
            throw new Error(`Login failed: ${loginData.message}`);
        }

        token = loginData.token;
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    });

    describe('GET /api/data-maintenance/product-categories', () => {
        it('should return 200 and list categories', async () => {
            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, {
                headers,
            });
            const data = await response.json();

            if (response.status === 403) {
                console.error('Access still forbidden');
            }

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
        });
    });

    describe('POST /api/data-maintenance/product-categories', () => {
        it('should create a new product category as non-admin', async () => {
            const newCategory = {
                name: `Non-Admin Category ${timestamp}`,
                code: `NAC-${timestamp}`,
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
            testCategoryId = data.data.id;
        });
    });

    describe('DELETE /api/data-maintenance/product-categories/:id', () => {
        it('should delete product category as non-admin', async () => {
            if (!testCategoryId) return;

            const response = await fetch(`${BASE_URL}/api/data-maintenance/product-categories/${testCategoryId}`, {
                method: 'DELETE',
                headers,
            });

            expect(response.status).toBe(200);
        });
    });
});
