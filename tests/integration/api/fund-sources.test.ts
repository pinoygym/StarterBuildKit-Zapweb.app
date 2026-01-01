// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
    createTestBranch,
    createAndLoginUser,
} from '@/tests/helpers/test-db-utils';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';

describe('Fund Sources API Integration Tests', () => {
    let testUser: any;
    let testBranch: any;
    let token: string;
    let headers: any;
    let userCleanup: () => Promise<void>;
    let testFundSource: any;
    let testFundSource2: any;

    beforeAll(async () => {
        // Setup test user and login
        const { testUser: user, token: userToken, headers: userHeaders, cleanup } = await createAndLoginUser(BASE_URL);
        testUser = user;
        token = userToken;
        headers = userHeaders;
        userCleanup = cleanup;

        // Create test branch
        testBranch = await createTestBranch();
    });

    afterEach(async () => {
        // Clean up fund sources and related data
        if (testFundSource) {
            await prisma.fundTransaction.deleteMany({ where: { fundSourceId: testFundSource.id } });
            await prisma.fundSource.delete({ where: { id: testFundSource.id } }).catch(() => { });
            testFundSource = null;
        }
        if (testFundSource2) {
            await prisma.fundTransaction.deleteMany({ where: { fundSourceId: testFundSource2.id } });
            await prisma.fundSource.delete({ where: { id: testFundSource2.id } }).catch(() => { });
            testFundSource2 = null;
        }
    });

    afterAll(async () => {
        // Cleanup all fund sources for test branch
        const fundSources = await prisma.fundSource.findMany({ where: { branchId: testBranch.id } });
        for (const fs of fundSources) {
            await prisma.fundTransaction.deleteMany({ where: { fundSourceId: fs.id } });
            await prisma.fundSource.delete({ where: { id: fs.id } }).catch(() => { });
        }

        // Cleanup transfers
        await prisma.fundTransfer.deleteMany({});

        await prisma.branch.delete({ where: { id: testBranch.id } });
        await userCleanup();
        await prisma.$disconnect();
    });

    describe('POST /api/fund-sources - Create Fund Source', () => {
        it('should create a cash register fund source successfully', async () => {
            const fundSourceData = {
                name: 'Main Cash Register',
                code: 'CASH-001',
                type: 'CASH_REGISTER',
                branchId: testBranch.id,
                openingBalance: 10000,
                description: 'Main store cash register',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fundSourceData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.name).toBe('Main Cash Register');
            expect(data.code).toBe('CASH-001');
            expect(data.type).toBe('CASH_REGISTER');
            expect(data.currentBalance).toBe(10000);
            expect(data.openingBalance).toBe(10000);
            expect(data.status).toBe('active');

            testFundSource = data;

            // Verify opening balance transaction was created
            const transactions = await prisma.fundTransaction.findMany({
                where: { fundSourceId: data.id },
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].type).toBe('OPENING_BALANCE');
            expect(transactions[0].amount).toBe(10000);
        });

        it('should create a bank account fund source with bank details', async () => {
            const fundSourceData = {
                name: 'BDO Corporate Account',
                code: 'BDO-001',
                type: 'BANK_ACCOUNT',
                bankName: 'BDO',
                accountNumber: '****1234',
                accountHolder: 'Test Company',
                openingBalance: 100000,
                currency: 'PHP',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fundSourceData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.type).toBe('BANK_ACCOUNT');
            expect(data.bankName).toBe('BDO');
            expect(data.accountNumber).toBe('****1234');
            expect(data.accountHolder).toBe('Test Company');
            expect(data.currentBalance).toBe(100000);

            testFundSource = data;
        });

        it('should create company-wide fund source without branch', async () => {
            const fundSourceData = {
                name: 'Petty Cash',
                code: 'PETTY-001',
                type: 'PETTY_CASH',
                openingBalance: 5000,
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fundSourceData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.branchId).toBeNull();
            expect(data.currentBalance).toBe(5000);

            testFundSource = data;
        });

        it('should set default fund source', async () => {
            const fundSourceData = {
                name: 'Default Cash',
                code: 'DEF-001',
                type: 'CASH_REGISTER',
                openingBalance: 1000,
                isDefault: true,
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fundSourceData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.isDefault).toBe(true);

            testFundSource = data;
        });

        it('should reject duplicate code', async () => {
            // Create first fund source
            const fundSourceData = {
                name: 'First Fund',
                code: 'DUP-001',
                type: 'CASH_REGISTER',
                openingBalance: 1000,
            };

            const response1 = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fundSourceData),
            });

            testFundSource = await response1.json();

            // Try to create duplicate
            const response2 = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify(fundSourceData),
            });

            expect(response2.status).toBe(400);
            const data = await response2.json();
            expect(data.error).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    // Missing name, code, type
                    openingBalance: 1000,
                }),
            });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/fund-sources - List Fund Sources', () => {
        beforeEach(async () => {
            // Create multiple fund sources
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Cash Register 1',
                    code: 'CASH-TEST-1',
                    type: 'CASH_REGISTER',
                    branchId: testBranch.id,
                    openingBalance: 5000,
                    currentBalance: 5000,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            testFundSource2 = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Bank Account 1',
                    code: 'BANK-TEST-1',
                    type: 'BANK_ACCOUNT',
                    openingBalance: 50000,
                    currentBalance: 50000,
                    currency: 'PHP',
                    status: 'active',
                },
            });
        });

        it('should fetch all fund sources', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThanOrEqual(2);
        });

        it('should filter by type', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources?type=CASH_REGISTER`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.every((fs: any) => fs.type === 'CASH_REGISTER')).toBe(true);
        });

        it('should filter by branch', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources?branchId=${testBranch.id}`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.some((fs: any) => fs.branchId === testBranch.id)).toBe(true);
        });

        it('should filter by status', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources?status=active`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.every((fs: any) => fs.status === 'active')).toBe(true);
        });

        it('should search by name', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources?search=Cash`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.some((fs: any) => fs.name.includes('Cash'))).toBe(true);
        });
    });

    describe('GET /api/fund-sources/[id] - Get Fund Source', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Fund Source',
                    code: 'TEST-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });
        });

        it('should fetch fund source by ID', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.id).toBe(testFundSource.id);
            expect(data.name).toBe('Test Fund Source');
            expect(data.currentBalance).toBe(10000);
        });

        it('should return 404 for non-existent fund source', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${randomUUID()}`, { headers });

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/fund-sources/[id] - Update Fund Source', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Original Name',
                    code: 'ORIG-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });
        });

        it('should update fund source details', async () => {
            const updateData = {
                name: 'Updated Name',
                description: 'Updated description',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.name).toBe('Updated Name');
            expect(data.description).toBe('Updated description');
        });

        it('should update status to inactive', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'inactive' }),
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.status).toBe('inactive');
        });
    });

    describe('POST /api/fund-sources/[id]/transactions - Record Transactions', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Transaction Test Fund',
                    code: 'TRANS-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });
        });

        it('should record a deposit', async () => {
            const transactionData = {
                type: 'DEPOSIT',
                amount: 5000,
                description: 'Manual deposit',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transactionData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.currentBalance).toBe(15000);

            // Verify transaction was created
            const transactions = await prisma.fundTransaction.findMany({
                where: { fundSourceId: testFundSource.id, type: 'DEPOSIT' },
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(5000);
            expect(transactions[0].runningBalance).toBe(15000);
        });

        it('should record a withdrawal', async () => {
            const transactionData = {
                type: 'WITHDRAWAL',
                amount: 3000,
                description: 'Manual withdrawal',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transactionData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.currentBalance).toBe(7000);

            // Verify transaction
            const transactions = await prisma.fundTransaction.findMany({
                where: { fundSourceId: testFundSource.id, type: 'WITHDRAWAL' },
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(3000);
            expect(transactions[0].runningBalance).toBe(7000);
        });

        it('should reject withdrawal exceeding balance', async () => {
            const transactionData = {
                type: 'WITHDRAWAL',
                amount: 15000, // More than current balance
                description: 'Excessive withdrawal',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transactionData),
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Insufficient balance');
        });

        it('should validate transaction type', async () => {
            const transactionData = {
                type: 'INVALID_TYPE',
                amount: 1000,
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transactionData),
            });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/fund-sources/[id]/transactions - Get Transaction History', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'History Test Fund',
                    code: 'HIST-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            // Create some transactions
            await prisma.fundTransaction.createMany({
                data: [
                    {
                        id: randomUUID(),
                        fundSourceId: testFundSource.id,
                        type: 'DEPOSIT',
                        amount: 5000,
                        runningBalance: 15000,
                        description: 'Deposit 1',
                        transactionDate: new Date(),
                        createdById: testUser.id,
                    },
                    {
                        id: randomUUID(),
                        fundSourceId: testFundSource.id,
                        type: 'WITHDRAWAL',
                        amount: 2000,
                        runningBalance: 13000,
                        description: 'Withdrawal 1',
                        transactionDate: new Date(),
                        createdById: testUser.id,
                    },
                ],
            });
        });

        it('should fetch transaction history', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.transactions.length).toBeGreaterThanOrEqual(2);
        });

        it('should filter transactions by type', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions?type=DEPOSIT`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.transactions.every((t: any) => t.type === 'DEPOSIT')).toBe(true);
        });

        it('should support pagination', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/transactions?page=1&pageSize=1`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.transactions.length).toBe(1);
            expect(data.pagination.page).toBe(1);
            expect(data.pagination.pageSize).toBe(1);
        });
    });

    describe('POST /api/fund-sources/[id]/adjust - Adjust Balance', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Adjust Test Fund',
                    code: 'ADJ-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });
        });

        it('should adjust balance for reconciliation', async () => {
            const adjustData = {
                newBalance: 12000,
                reason: 'Bank reconciliation - found missing deposit',
            };

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/adjust`, {
                method: 'POST',
                headers,
                body: JSON.stringify(adjustData),
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.currentBalance).toBe(12000);

            // Verify adjustment transaction
            const transactions = await prisma.fundTransaction.findMany({
                where: { fundSourceId: testFundSource.id, type: 'ADJUSTMENT' },
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(2000);
            expect(transactions[0].description).toContain('Bank reconciliation');
        });

        it('should require reason for adjustment', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}/adjust`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ newBalance: 12000 }),
            });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/fund-transfers - Create Fund Transfer', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Source Fund',
                    code: 'SRC-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 20000,
                    currentBalance: 20000,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            testFundSource2 = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Destination Fund',
                    code: 'DEST-001',
                    type: 'BANK_ACCOUNT',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });
        });

        it('should transfer funds between sources', async () => {
            const transferData = {
                fromFundSourceId: testFundSource.id,
                toFundSourceId: testFundSource2.id,
                amount: 5000,
                description: 'Transfer to bank',
            };

            const response = await fetch(`${BASE_URL}/api/fund-transfers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transferData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.amount).toBe(5000);
            expect(data.status).toBe('completed');

            // Verify balances updated
            const source = await prisma.fundSource.findUnique({ where: { id: testFundSource.id } });
            const dest = await prisma.fundSource.findUnique({ where: { id: testFundSource2.id } });

            expect(source?.currentBalance).toBe(15000);
            expect(dest?.currentBalance).toBe(15000);

            // Verify transactions created
            const sourceTransactions = await prisma.fundTransaction.findMany({
                where: { fundSourceId: testFundSource.id, type: 'TRANSFER_OUT' },
            });
            const destTransactions = await prisma.fundTransaction.findMany({
                where: { fundSourceId: testFundSource2.id, type: 'TRANSFER_IN' },
            });

            expect(sourceTransactions).toHaveLength(1);
            expect(destTransactions).toHaveLength(1);
        });

        it('should handle transfer with fee', async () => {
            const transferData = {
                fromFundSourceId: testFundSource.id,
                toFundSourceId: testFundSource2.id,
                amount: 5000,
                transferFee: 50,
                description: 'Transfer with fee',
            };

            const response = await fetch(`${BASE_URL}/api/fund-transfers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transferData),
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.transferFee).toBe(50);
            expect(data.netAmount).toBe(4950);

            // Verify balances
            const source = await prisma.fundSource.findUnique({ where: { id: testFundSource.id } });
            const dest = await prisma.fundSource.findUnique({ where: { id: testFundSource2.id } });

            expect(source?.currentBalance).toBe(14950); // 20000 - 5000 - 50
            expect(dest?.currentBalance).toBe(14950); // 10000 + 4950
        });

        it('should reject transfer exceeding balance', async () => {
            const transferData = {
                fromFundSourceId: testFundSource.id,
                toFundSourceId: testFundSource2.id,
                amount: 25000, // More than source balance
            };

            const response = await fetch(`${BASE_URL}/api/fund-transfers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transferData),
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Insufficient balance');
        });

        it('should reject transfer to same fund source', async () => {
            const transferData = {
                fromFundSourceId: testFundSource.id,
                toFundSourceId: testFundSource.id,
                amount: 1000,
            };

            const response = await fetch(`${BASE_URL}/api/fund-transfers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transferData),
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('same fund source');
        });
    });

    describe('GET /api/fund-transfers - List Fund Transfers', () => {
        beforeEach(async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Transfer List Source',
                    code: 'TLS-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 50000,
                    currentBalance: 50000,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            testFundSource2 = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Transfer List Dest',
                    code: 'TLD-001',
                    type: 'BANK_ACCOUNT',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            // Create a transfer
            await prisma.fundTransfer.create({
                data: {
                    id: randomUUID(),
                    transferNumber: 'TRF-TEST-001',
                    fromFundSourceId: testFundSource.id,
                    toFundSourceId: testFundSource2.id,
                    amount: 5000,
                    transferFee: 0,
                    netAmount: 5000,
                    status: 'completed',
                    transferDate: new Date(),
                    createdById: testUser.id,
                },
            });
        });

        it('should fetch all transfers', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-transfers`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThanOrEqual(1);
        });

        it('should filter by source fund', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-transfers?fromFundSourceId=${testFundSource.id}`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.every((t: any) => t.fromFundSourceId === testFundSource.id)).toBe(true);
        });

        it('should filter by destination fund', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-transfers?toFundSourceId=${testFundSource2.id}`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.every((t: any) => t.toFundSourceId === testFundSource2.id)).toBe(true);
        });
    });

    describe('GET /api/fund-sources/summary - Dashboard Summary', () => {
        beforeEach(async () => {
            // Create multiple fund sources for summary
            await prisma.fundSource.createMany({
                data: [
                    {
                        id: randomUUID(),
                        name: 'Summary Cash 1',
                        code: 'SUM-CASH-1',
                        type: 'CASH_REGISTER',
                        branchId: testBranch.id,
                        openingBalance: 10000,
                        currentBalance: 10000,
                        currency: 'PHP',
                        status: 'active',
                    },
                    {
                        id: randomUUID(),
                        name: 'Summary Bank 1',
                        code: 'SUM-BANK-1',
                        type: 'BANK_ACCOUNT',
                        openingBalance: 50000,
                        currentBalance: 50000,
                        currency: 'PHP',
                        status: 'active',
                    },
                ],
            });
        });

        afterEach(async () => {
            await prisma.fundSource.deleteMany({
                where: { code: { startsWith: 'SUM-' } },
            });
        });

        it('should fetch dashboard summary', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/summary`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.summary).toBeDefined();
            expect(data.summary.totalBalance).toBeGreaterThanOrEqual(60000);
            expect(data.summary.totalFundSources).toBeGreaterThanOrEqual(2);
            expect(Array.isArray(data.summary.byType)).toBe(true);
        });

        it('should filter summary by branch', async () => {
            const response = await fetch(`${BASE_URL}/api/fund-sources/summary?branchId=${testBranch.id}`, { headers });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.summary).toBeDefined();
        });
    });

    describe('DELETE /api/fund-sources/[id] - Delete Fund Source', () => {
        it('should soft delete fund source with transactions', async () => {
            // Create fund source with transaction
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Delete Test Fund',
                    code: 'DEL-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 10000,
                    currentBalance: 10000,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            await prisma.fundTransaction.create({
                data: {
                    id: randomUUID(),
                    fundSourceId: testFundSource.id,
                    type: 'DEPOSIT',
                    amount: 5000,
                    runningBalance: 15000,
                    description: 'Test deposit',
                    transactionDate: new Date(),
                    createdById: testUser.id,
                },
            });

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}`, {
                method: 'DELETE',
                headers,
            });

            expect(response.status).toBe(200);

            // Verify it was soft deleted (status changed to closed)
            const fundSource = await prisma.fundSource.findUnique({
                where: { id: testFundSource.id },
            });
            expect(fundSource?.status).toBe('closed');
        });

        it('should hard delete fund source without transactions', async () => {
            testFundSource = await prisma.fundSource.create({
                data: {
                    id: randomUUID(),
                    name: 'Hard Delete Test',
                    code: 'HDEL-001',
                    type: 'CASH_REGISTER',
                    openingBalance: 0,
                    currentBalance: 0,
                    currency: 'PHP',
                    status: 'active',
                },
            });

            const response = await fetch(`${BASE_URL}/api/fund-sources/${testFundSource.id}`, {
                method: 'DELETE',
                headers,
            });

            expect(response.status).toBe(200);

            // Verify it was hard deleted
            const fundSource = await prisma.fundSource.findUnique({
                where: { id: testFundSource.id },
            });
            expect(fundSource).toBeNull();
            testFundSource = null;
        });
    });
});
