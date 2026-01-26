import { describe, it, expect, beforeAll } from 'vitest'
import { BASE_URL } from '../config'

describe('Cooperative Module Full CRUD Standardized', () => {
    let token: string
    let headers: any
    let membershipTypeId: string
    let memberId: string
    let walletId: string

    beforeAll(async () => {
        // 1. Login
        let password = 'Qweasd1234';
        let loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: password,
            }),
        })

        if (loginRes.status === 401) {
            console.log('Login failed with Qweasd1234, trying alternative...');
            password = 'Qweasd1234';
            loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'cybergada@gmail.com',
                    password: password,
                }),
            })
        }

        const setCookie = loginRes.headers.get('set-cookie');
        const loginText = await loginRes.text();
        let loginData;
        try {
            loginData = JSON.parse(loginText);
        } catch (e) {
            console.error('Login Response Invalid:', loginRes.status, loginText.substring(0, 500));
            try {
                const fs = require('fs');
                fs.writeFileSync('login_debug.txt', loginText);
            } catch (fsError) { }
            throw new Error('Login failed to return JSON');
        }

        if (!loginRes.ok || !loginData.success) {
            console.error('Login details failed:', JSON.stringify(loginData, null, 2))
            throw new Error('Login failed')
        }

        token = loginData.token
        headers = {
            'Content-Type': 'application/json',
            'Cookie': setCookie || `auth-token=${token}`,
        }
    })

    // Helper for safe fetch with logging
    const safeFetch = async (url: string, options: any) => {
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            if (!res.ok) {
                console.error(`Fetch Failed [${options.method || 'GET'} ${url}]:`, res.status, text.substring(0, 500));
            } else {
                console.log(`Fetch Success [${options.method || 'GET'} ${url}]:`, res.status);
            }
            let data = null;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // Not JSON
            }
            return { status: res.status, data, text };
        } catch (error) {
            console.error(`Fetch Exception [${options.method || 'GET'} ${url}]:`, error);
            throw error;
        }
    }

    describe('Cooperative CRUD Flow', () => {
        it('1. should create a membership type', async () => {
            const payload = {
                name: `Type ${Date.now()}`,
                code: `CT-${Date.now()}`,
                description: 'Description',
                monthlyFee: 100,
                registrationFee: 500,
                minimumShareCapital: 1000,
                requirements: 'Requirements',
                benefits: 'Benefits',
                status: 'active'
            }
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/membership-types`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            })
            expect(status).toBe(201)
            membershipTypeId = data.id || data.data?.id;
            expect(membershipTypeId).toBeDefined()
        })

        it('2. should read membership type', async () => {
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/membership-types/${membershipTypeId}`, {
                headers
            })
            expect(status).toBe(200)
            const id = data.id || data.data?.id;
            expect(id).toBe(membershipTypeId)
        })

        it('3. should update membership type', async () => {
            const payload = { description: 'Updated' }
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/membership-types/${membershipTypeId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload)
            })
            expect(status).toBe(200)
            expect(data.description || data.data?.description).toBe('Updated')
        })

        it('4. should register member', async () => {
            const payload = {
                firstName: 'CRUD',
                lastName: `User-${Date.now()}`,
                email: `crud.${Date.now()}@example.com`,
                phone: '09170000000',
                address: 'Address',
                gender: 'female',
                civilStatus: 'married',
                dateOfBirth: '1985-05-15',
                membershipTypeId: membershipTypeId,
                status: 'active'
            }
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/members`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            })
            expect(status).toBe(201)
            memberId = data.id || data.data?.id;
            expect(memberId).toBeDefined()
        })

        it('5. should read member details', async () => {
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/members/${memberId}`, {
                headers
            })
            expect(status).toBe(200)
            const id = data.id || data.data?.id;
            expect(id).toBe(memberId)
        })

        it('6. should update member', async () => {
            const payload = { address: 'New Address' }
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/members/${memberId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload)
            })
            expect(status).toBe(200)
            expect(data.address || data.data?.address).toBe('New Address')
        })

        it('7. should get/create wallet', async () => {
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/wallets?memberId=${memberId}`, {
                headers
            })
            expect(status).toBe(200)
            walletId = data.id || data.data?.id;
            expect(walletId).toBeDefined()
        })

        it('8. should process transaction', async () => {
            const payload = {
                walletId: walletId,
                type: 'cash_in',
                amount: 500,
                description: 'Initial Load'
            }
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/wallets/transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            })
            expect(status).toBe(201)
        })

        it('9. should verify balance', async () => {
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/wallets?memberId=${memberId}`, {
                headers
            })
            expect(status).toBe(200)
            expect(data.walletBalance || data.data?.walletBalance).toBe(500)
        })

        it('10. should archive member', async () => {
            const { status } = await safeFetch(`${BASE_URL}/api/cooperative/members/${memberId}`, {
                method: 'DELETE',
                headers
            })
            expect(status).toBe(200)
        })

        it('11. should delete membership type', async () => {
            const { status, data } = await safeFetch(`${BASE_URL}/api/cooperative/membership-types/${membershipTypeId}`, {
                method: 'DELETE',
                headers
            })
            // Expected 400 because members are using this type
            expect(status === 200 || status === 400).toBe(true)
            if (status === 400) {
                expect(data.error).toContain('existing members')
            }
        })
    })
})
