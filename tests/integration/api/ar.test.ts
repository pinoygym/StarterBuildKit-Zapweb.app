import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestCustomer } from '@/tests/helpers/test-db-utils';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Accounts Receivable API Integration Tests', () => {
  let testUser: any;
  let testBranch: any;
  let testCustomer: any;
  let token: string;
  let headers: any;
  let testAR: any;

  beforeAll(async () => {
    // Seed database
    const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const seed = await seedRes.json();

    if (!seed.success) {
      throw new Error('Seed failed');
    }

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

    if (!loginData.success) {
      throw new Error('Login failed');
    }

    token = loginData.token;
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Create test data
    testUser = await createTestUser();
    testBranch = await createTestBranch();
    testCustomer = await createTestCustomer();
  });

  afterEach(async () => {
    // Clean up AR records after each test
    if (testAR) {
      await prisma.aRPayment.deleteMany({ where: { arId: testAR.id } });
      await prisma.accountsReceivable.delete({ where: { id: testAR.id } });
      testAR = null;
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.accountsReceivable.deleteMany({ where: { branchId: testBranch.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });
    await prisma.branch.delete({ where: { id: testBranch.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/ar - Create AR', () => {
    it('should create AR record successfully', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const arData = {
        branchId: testBranch.id,
        customerId: testCustomer.id,
        customerName: testCustomer.contactPerson,
        totalAmount: 1000,
        dueDate: dueDate.toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(arData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalAmount).toBe('1000');
      expect(data.data.paidAmount).toBe('0');
      expect(data.data.balance).toBe('1000');
      expect(data.data.status).toBe('pending');

      testAR = data.data;
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/ar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          branchId: testBranch.id,
          // Missing customerName and totalAmount
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/ar/payment - Record Payment', () => {
    beforeEach(async () => {
      // Create AR record for payment tests
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      testAR = await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerId: testCustomer.id,
          customerName: testCustomer.contactPerson,
          totalAmount: 1000,
          paidAmount: 0,
          balance: 1000,
          dueDate,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    });

    it('should record full payment and update status to paid', async () => {
      const paymentData = {
        arId: testAR.id,
        amount: 1000,
        paymentMethod: 'Cash',
        referenceNumber: 'REF-001',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.paidAmount).toBe('1000');
      expect(data.data.balance).toBe('0');
      expect(data.data.status).toBe('paid');

      // Verify payment record was created
      const payments = await prisma.aRPayment.findMany({
        where: { arId: testAR.id },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe('1000');
      expect(payments[0].paymentMethod).toBe('Cash');
    });

    it('should record partial payment and update status to partial', async () => {
      const paymentData = {
        arId: testAR.id,
        amount: 500,
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.paidAmount).toBe('500');
      expect(data.data.balance).toBe('500');
      expect(data.data.status).toBe('partial');
    });

    it('should handle multiple partial payments', async () => {
      // First payment
      await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          arId: testAR.id,
          amount: 300,
          paymentMethod: 'Cash',
          paymentDate: new Date().toISOString(),
        }),
      });

      // Second payment
      await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          arId: testAR.id,
          amount: 400,
          paymentMethod: 'Card',
          paymentDate: new Date().toISOString(),
        }),
      });

      // Third payment (final)
      const response = await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          arId: testAR.id,
          amount: 300,
          paymentMethod: 'Online Transfer',
          paymentDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.paidAmount).toBe('1000');
      expect(data.data.balance).toBe('0');
      expect(data.data.status).toBe('paid');

      // Verify all payment records
      const payments = await prisma.aRPayment.findMany({
        where: { arId: testAR.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(payments).toHaveLength(3);
      expect(payments[0].amount).toBe('300');
      expect(payments[1].amount).toBe('400');
      expect(payments[2].amount).toBe('300');
    });

    it('should reject payment exceeding balance', async () => {
      const paymentData = {
        arId: testAR.id,
        amount: 1500, // More than balance
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('exceeds outstanding balance');
    });

    it('should reject zero or negative payment', async () => {
      const paymentData = {
        arId: testAR.id,
        amount: 0,
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('greater than 0');
    });

    it('should validate required payment fields', async () => {
      const response = await fetch(`${BASE_URL}/api/ar/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          arId: testAR.id,
          // Missing amount, paymentMethod, paymentDate
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/ar/aging-report - Aging Analysis', () => {
    beforeEach(async () => {
      // Create AR records with different due dates
      const today = new Date();

      // Current (0-30 days)
      const current = new Date(today);
      current.setDate(current.getDate() + 15);
      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Customer A',
          totalAmount: 1000,
          paidAmount: 0,
          balance: 1000,
          dueDate: current,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // 31-60 days overdue
      const overdue30 = new Date(today);
      overdue30.setDate(overdue30.getDate() - 45);
      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Customer B',
          totalAmount: 2000,
          paidAmount: 0,
          balance: 2000,
          dueDate: overdue30,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // 61-90 days overdue
      const overdue60 = new Date(today);
      overdue60.setDate(overdue60.getDate() - 75);
      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Customer C',
          totalAmount: 3000,
          paidAmount: 0,
          balance: 3000,
          dueDate: overdue60,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // 90+ days overdue
      const overdue90 = new Date(today);
      overdue90.setDate(overdue90.getDate() - 100);
      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Customer D',
          totalAmount: 4000,
          paidAmount: 0,
          balance: 4000,
          dueDate: overdue90,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    });

    afterEach(async () => {
      await prisma.accountsReceivable.deleteMany({
        where: { branchId: testBranch.id },
      });
    });

    it('should calculate aging buckets correctly', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ar/aging-report?branchId=${testBranch.id}`,
        { headers }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const buckets = data.data.buckets;
      expect(buckets).toHaveLength(4);

      // Verify bucket counts and amounts
      const bucket030 = buckets.find((b: any) => b.bucket === '0-30');
      const bucket3160 = buckets.find((b: any) => b.bucket === '31-60');
      const bucket6190 = buckets.find((b: any) => b.bucket === '61-90');
      const bucket90plus = buckets.find((b: any) => b.bucket === '90+');

      expect(bucket030.count).toBe(1);
      expect(parseFloat(bucket030.totalAmount)).toBe(1000);

      expect(bucket3160.count).toBe(1);
      expect(parseFloat(bucket3160.totalAmount)).toBe(2000);

      expect(bucket6190.count).toBe(1);
      expect(parseFloat(bucket6190.totalAmount)).toBe(3000);

      expect(bucket90plus.count).toBe(1);
      expect(parseFloat(bucket90plus.totalAmount)).toBe(4000);
    });

    it('should group by customer correctly', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ar/aging-report?branchId=${testBranch.id}`,
        { headers }
      );

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.byCustomer).toHaveLength(4);

      const customerA = data.data.byCustomer.find(
        (c: any) => c.customerName === 'Customer A'
      );
      expect(parseFloat(customerA.total)).toBe(1000);
    });

    it('should calculate total outstanding correctly', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ar/aging-report?branchId=${testBranch.id}`,
        { headers }
      );

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(parseFloat(data.data.totalOutstanding)).toBe(10000); // 1000 + 2000 + 3000 + 4000
    });
  });

  describe('GET /api/ar - List AR Records', () => {
    beforeEach(async () => {
      // Create multiple AR records
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Test Customer 1',
          totalAmount: 1000,
          paidAmount: 0,
          balance: 1000,
          dueDate,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Test Customer 2',
          totalAmount: 2000,
          paidAmount: 1000,
          balance: 1000,
          dueDate,
          status: 'partial',
          updatedAt: new Date(),
        },
      });

      await prisma.accountsReceivable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          customerName: 'Test Customer 3',
          totalAmount: 3000,
          paidAmount: 3000,
          balance: 0,
          dueDate,
          status: 'paid',
          updatedAt: new Date(),
        },
      });
    });

    afterEach(async () => {
      await prisma.accountsReceivable.deleteMany({
        where: { branchId: testBranch.id },
      });
    });

    it('should fetch all AR records', async () => {
      const response = await fetch(`${BASE_URL}/api/ar`, { headers });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', async () => {
      const response = await fetch(`${BASE_URL}/api/ar?status=pending`, {
        headers,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((ar: any) => ar.status === 'pending')).toBe(true);
    });

    it('should filter by branch', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ar?branchId=${testBranch.id}`,
        { headers }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((ar: any) => ar.branchId === testBranch.id)).toBe(
        true
      );
    });
  });
});
