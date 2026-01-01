
// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  createTestBranch,
  createTestSupplier,
  createAndLoginUser,
  cleanupTestData,
  TestDataIds,
} from '@/tests/helpers/test-db-utils';

import { BASE_URL } from '../config';

describe('Accounts Payable API Integration Tests', () => {
  let testUser: any;
  let testBranch: any;
  let testSupplier: any;
  let token: string;
  let headers: any;
  let testAP: any;
  let userCleanup: () => Promise<void>; // For cleaning up the test user

  beforeAll(async () => {
    // 1. Setup a unique test user and login
    const { testUser: user, token: userToken, headers: userHeaders, cleanup } = await createAndLoginUser(BASE_URL);
    testUser = user;
    token = userToken;
    headers = userHeaders;
    userCleanup = cleanup; // Store the cleanup function

    // 2. Create other test data
    testBranch = await createTestBranch();
    testSupplier = await createTestSupplier();
  });

  afterEach(async () => {
    // Clean up AP records after each test
    if (testAP) {
      await prisma.aPPayment.deleteMany({ where: { apId: testAP.id } });
      await prisma.accountsPayable.delete({ where: { id: testAP.id } });
      testAP = null;
    }
  });

  afterAll(async () => {
    // Cleanup other test data and the test user
    // The individual test cleanups (afterEach) might handle most AP records.
    // Ensure any remaining AP records for testBranch are cleaned up.
    await prisma.accountsPayable.deleteMany({ where: { branchId: testBranch.id } });
    await prisma.supplier.delete({ where: { id: testSupplier.id } });
    await prisma.branch.delete({ where: { id: testBranch.id } });

    // Clean up the test user and their sessions
    await userCleanup();
    await prisma.$disconnect();
  });

  describe('POST /api/ap - Create AP', () => {
    it('should create AP record successfully', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const apData = {
        branchId: testBranch.id,
        supplierId: testSupplier.id,
        totalAmount: 5000,
        dueDate: dueDate.toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ap`, {
        method: 'POST',
        headers,
        body: JSON.stringify(apData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalAmount).toBe(5000);
      expect(data.data.paidAmount).toBe(0);
      expect(data.data.balance).toBe(5000);
      expect(data.data.status).toBe('pending');

      testAP = data.data;
    });

    it('should create AP record with all discount and charge fields', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const apData = {
        branchId: testBranch.id,
        supplierId: testSupplier.id,
        totalAmount: 5000,
        taxAmount: 600,
        discountAmount: 200,
        otherCharges: 100,
        withholdingTax: 50,
        salesDiscount: -150,
        rebates: 75,
        taxExemption: 25,
        dueDate: dueDate.toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ap`, {
        method: 'POST',
        headers,
        body: JSON.stringify(apData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalAmount).toBe(5000);
      expect(data.data.taxAmount).toBe(600);
      expect(data.data.discountAmount).toBe(200);
      expect(data.data.otherCharges).toBe(100);
      expect(data.data.withholdingTax).toBe(50);
      expect(data.data.salesDiscount).toBe(-150);
      expect(data.data.rebates).toBe(75);
      expect(data.data.taxExemption).toBe(25);
      expect(data.data.paidAmount).toBe(0);
      expect(data.data.balance).toBe(5000);
      expect(data.data.status).toBe('pending');

      testAP = data.data;
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/ap`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          branchId: testBranch.id,
          // Missing supplierId and totalAmount
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/ap/payment - Record Payment', () => {
    beforeEach(async () => {
      // Create AP record for payment tests
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      testAP = await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 5000,
          paidAmount: 0,
          balance: 5000,
          dueDate,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    });

    it('should record full payment and update status to paid', async () => {
      const paymentData = {
        apId: testAP.id,
        amount: 5000,
        paymentMethod: 'Cash',
        referenceNumber: 'CHK-001',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.balance).toBe(0);
      expect(data.data.status).toBe('paid');

      // Verify payment record was created
      const payments = await prisma.aPPayment.findMany({
        where: { apId: testAP.id },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(5000);
      expect(payments[0].paymentMethod).toBe('Cash');
    });

    it('should record partial payment and update status to partial', async () => {
      const paymentData = {
        apId: testAP.id,
        amount: 2500,
        paymentMethod: 'Check',
        referenceNumber: 'CHK-002',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.paidAmount).toBe(2500);
      expect(data.data.balance).toBe(2500);
      expect(data.data.status).toBe('partial');
    });

    it('should handle multiple partial payments', async () => {
      // First payment
      await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apId: testAP.id,
          amount: 2000,
          paymentMethod: 'Cash',
          paymentDate: new Date().toISOString(),
        }),
      });

      // Second payment
      await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apId: testAP.id,
          amount: 2000,
          paymentMethod: 'Check',
          paymentDate: new Date().toISOString(),
        }),
      });

      // Third payment (final)
      const response = await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apId: testAP.id,
          amount: 1000,
          paymentMethod: 'Bank Transfer',
          paymentDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.paidAmount).toBe(5000);
      expect(data.data.balance).toBe(0);
      expect(data.data.status).toBe('paid');

      // Verify all payment records
      const payments = await prisma.aPPayment.findMany({
        where: { apId: testAP.id },
        orderBy: { createdAt: 'asc' },
      });
      expect(payments).toHaveLength(3);
      expect(payments[0].amount).toBe(2000);
      expect(payments[1].amount).toBe(2000);
      expect(payments[2].amount).toBe(1000);
    });

    it('should reject payment exceeding balance', async () => {
      const paymentData = {
        apId: testAP.id,
        amount: 6000, // More than balance
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ap/payment`, {
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
        apId: testAP.id,
        amount: -100,
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('greater than 0');
    });

    it('should validate required payment fields', async () => {
      const response = await fetch(`${BASE_URL}/api/ap/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apId: testAP.id,
          // Missing amount, paymentMethod, paymentDate
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle different payment methods', async () => {
      const paymentMethods = ['Cash', 'Check', 'Bank Transfer', 'Credit Card'];

      for (const method of paymentMethods) {
        // Create new AP for each test
        const ap = await prisma.accountsPayable.create({
          data: {
            id: randomUUID(),
            branchId: testBranch.id,
            supplierId: testSupplier.id,
            totalAmount: 1000,
            paidAmount: 0,
            balance: 1000,
            dueDate: new Date(),
            status: 'pending',
            updatedAt: new Date(),
          },
        });

        const response = await fetch(`${BASE_URL}/api/ap/payment`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            apId: ap.id,
            amount: 1000,
            paymentMethod: method,
            paymentDate: new Date().toISOString(),
          }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('paid');

        // Cleanup
        await prisma.aPPayment.deleteMany({ where: { apId: ap.id } });
        await prisma.accountsPayable.delete({ where: { id: ap.id } });
      }
    });
  });

  describe('GET /api/ap/aging-report - Aging Analysis', () => {
    beforeEach(async () => {
      // Create AP records with different due dates
      const today = new Date();

      // Current (0-30 days)
      const current = new Date(today);
      current.setDate(current.getDate() + 15);
      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 10000,
          paidAmount: 0,
          balance: 10000,
          dueDate: current,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // 31-60 days overdue
      const overdue30 = new Date(today);
      overdue30.setDate(overdue30.getDate() - 45);
      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 20000,
          paidAmount: 0,
          balance: 20000,
          dueDate: overdue30,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // 61-90 days overdue
      const overdue60 = new Date(today);
      overdue60.setDate(overdue60.getDate() - 75);
      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 30000,
          paidAmount: 0,
          balance: 30000,
          dueDate: overdue60,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // 90+ days overdue
      const overdue90 = new Date(today);
      overdue90.setDate(overdue90.getDate() - 100);
      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 40000,
          paidAmount: 0,
          balance: 40000,
          dueDate: overdue90,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
    });

    afterEach(async () => {
      await prisma.accountsPayable.deleteMany({
        where: { branchId: testBranch.id },
      });
    });

    it('should calculate aging buckets correctly', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ap/aging-report?branchId=${testBranch.id}`,
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
      expect(parseFloat(bucket030.totalAmount)).toBe(10000);

      expect(bucket3160.count).toBe(1);
      expect(parseFloat(bucket3160.totalAmount)).toBe(20000);

      expect(bucket6190.count).toBe(1);
      expect(parseFloat(bucket6190.totalAmount)).toBe(30000);

      expect(bucket90plus.count).toBe(1);
      expect(parseFloat(bucket90plus.totalAmount)).toBe(40000);
    });

    it('should calculate total outstanding correctly', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ap/aging-report?branchId=${testBranch.id}`,
        { headers }
      );

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(parseFloat(data.data.totalOutstanding)).toBe(100000); // 10k + 20k + 30k + 40k
    });
  });

  describe('GET /api/ap - List AP Records', () => {
    beforeEach(async () => {
      // Create multiple AP records
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 10000,
          paidAmount: 0,
          balance: 10000,
          dueDate,
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 20000,
          paidAmount: 10000,
          balance: 10000,
          dueDate,
          status: 'partial',
          updatedAt: new Date(),
        },
      });

      await prisma.accountsPayable.create({
        data: {
          id: randomUUID(),
          branchId: testBranch.id,
          supplierId: testSupplier.id,
          totalAmount: 30000,
          paidAmount: 30000,
          balance: 0,
          dueDate,
          status: 'paid',
          updatedAt: new Date(),
        },
      });
    });

    afterEach(async () => {
      await prisma.accountsPayable.deleteMany({
        where: { branchId: testBranch.id },
      });
    });

    it('should fetch all AP records', async () => {
      const response = await fetch(`${BASE_URL}/api/ap`, { headers });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', async () => {
      const response = await fetch(`${BASE_URL}/api/ap?status=pending`, {
        headers,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((ap: any) => ap.status === 'pending')).toBe(true);
    });

    it('should filter by branch', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ap?branchId=${testBranch.id}`,
        { headers }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((ap: any) => ap.branchId === testBranch.id)).toBe(
        true
      );
    });

    it('should filter by supplier', async () => {
      const response = await fetch(
        `${BASE_URL}/api/ap?supplierId=${testSupplier.id}`,
        { headers }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(
        data.data.every((ap: any) => ap.supplierId === testSupplier.id)
      ).toBe(true);
    });
  });
});

