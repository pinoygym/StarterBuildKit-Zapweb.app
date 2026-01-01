// @vitest-environment node

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestWarehouse, createTestSupplier } from '@/tests/helpers/test-db-utils';
import { BASE_URL } from '../config';

describe('Receiving Voucher UOM Conversion Integration Tests', () => {
  let testUser: any;
  let testBranch: any;
  let testWarehouse: any;
  let testSupplier: any;
  let testProduct: any;
  let testPurchaseOrder: any;
  let testPoItemId: string;
  let token: string;
  let headers: any;

  beforeAll(async () => {
    // 1. Seed data (roles, admin user)
    console.log('Test BASE_URL:', BASE_URL);
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

    // Create test data
    testUser = await createTestUser();
    testBranch = await createTestBranch();
    testWarehouse = await createTestWarehouse(testBranch.id);
    testSupplier = await createTestSupplier();

    // Create test product with UOM configurations
    testProduct = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: 'Test Absolute Bottle',
        description: 'Test product for UOM conversion',
        category: 'Beverages',
        basePrice: 50,
        averageCostPrice: 45,
        baseUOM: 'Bottle',
        minStockLevel: 10,
        shelfLifeDays: 365,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Create UOM configurations
    await prisma.productUOM.createMany({
      data: [
        {
          id: randomUUID(),
          productId: testProduct.id,
          name: 'Case',
          conversionFactor: 10, // 1 case = 10 bottles
          sellingPrice: 450,
        },
        {
          id: randomUUID(),
          productId: testProduct.id,
          name: 'Pack',
          conversionFactor: 6, // 1 pack = 6 bottles
          sellingPrice: 270,
        },
      ],
    });

    // Create test purchase order
    testPurchaseOrder = await prisma.purchaseOrder.create({
      data: {
        id: randomUUID(),
        poNumber: `PO-UOM-${Date.now()}`,
        supplierId: testSupplier.id,
        warehouseId: testWarehouse.id,
        branchId: testBranch.id,
        totalAmount: 450, // 1 case at ₱450
        status: 'ordered',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        updatedAt: new Date(),
      },
    });

    // Create purchase order item
    const poItem = await prisma.purchaseOrderItem.create({
      data: {
        id: randomUUID(),
        poId: testPurchaseOrder.id,
        productId: testProduct.id,
        quantity: 1, // 1 case ordered
        uom: 'Case',
        unitPrice: 450,
        subtotal: 450,
        receivedQuantity: 0,
      },
    });
    testPoItemId = poItem.id;
  });

  afterEach(async () => {
    // Clean up receiving vouchers created during tests
    await prisma.receivingVoucher.deleteMany({
      where: {
        purchaseOrderId: testPurchaseOrder.id,
      },
    });

    // Reset inventory
    await prisma.inventory.deleteMany({
      where: {
        productId: testProduct.id,
      },
    });

    // Reset stock movements
    await prisma.stockMovement.deleteMany({
      where: {
        referenceType: 'RV',
      },
    });

    // Reset PO item received quantity
    await prisma.purchaseOrderItem.updateMany({
      where: {
        poId: testPurchaseOrder.id,
      },
      data: {
        receivedQuantity: 0,
      },
    });

    // Reset PO status
    await prisma.purchaseOrder.update({
      where: { id: testPurchaseOrder.id },
      data: {
        status: 'ordered',
        receivingStatus: 'pending',
        actualDeliveryDate: null,
      },
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.receivingVoucherItem.deleteMany({
      where: { ReceivingVoucher: { purchaseOrderId: testPurchaseOrder.id } }
    });
    await prisma.receivingVoucher.deleteMany({
      where: { purchaseOrderId: testPurchaseOrder.id }
    });
    await prisma.accountsPayable.deleteMany({
      where: { purchaseOrderId: testPurchaseOrder.id }
    });
    await prisma.purchaseOrderItem.deleteMany({
      where: { poId: testPurchaseOrder.id },
    });
    await prisma.purchaseOrder.delete({ where: { id: testPurchaseOrder.id } });
    await prisma.productUOM.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    await prisma.supplier.delete({ where: { id: testSupplier.id } });
    await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
    await prisma.branch.delete({ where: { id: testBranch.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    await prisma.$disconnect();
  });

  describe('POST /api/receiving-vouchers - UOM Conversion', () => {
    it('should successfully create receiving voucher with case to bottle conversion', async () => {
      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Test Receiver',
        deliveryNotes: 'Test delivery with UOM conversion',
        items: [
          {
            poItemId: testPoItemId,
            productId: testProduct.id,
            uom: 'Case',
            orderedQuantity: 1,
            receivedQuantity: 1, // Receive 1 case
            unitPrice: 450,
            varianceReason: '',
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      if (response.status !== 200) {
        console.log('RV Creation Error:', JSON.stringify(responseData, null, 2));
      }
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.rvNumber).toMatch(/^RV-\d{8}-\d{4}$/);

      // Verify inventory was updated with converted quantity
      const inventory = await prisma.inventory.findFirst({
        where: { productId: testProduct.id, warehouseId: testWarehouse.id },
      });

      expect(inventory).toBeDefined();
      expect(inventory?.quantity).toBe(10); // 1 case = 10 bottles

      // Verify product average cost
      const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(product?.averageCostPrice).toBe(45); // ₱450 ÷ 10 bottles = ₱45 per bottle
    });

    it('should handle partial case receipt (0.5 case = 5 bottles)', async () => {
      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Test Receiver',
        deliveryNotes: 'Partial case receipt',
        items: [
          {
            poItemId: testPoItemId,
            productId: testProduct.id,
            uom: 'Case',
            orderedQuantity: 1,
            receivedQuantity: 0.5, // Receive half a case
            unitPrice: 450,
            varianceReason: 'Partial delivery',
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify inventory has correct converted quantity
      const inventory = await prisma.inventory.findFirst({
        where: { productId: testProduct.id, warehouseId: testWarehouse.id },
      });

      expect(inventory?.quantity).toBe(5); // 0.5 case = 5 bottles

      const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(product?.averageCostPrice).toBe(45); // Cost per bottle remains the same
    });

    it('should work with pack UOM conversion', async () => {
      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Test Receiver',
        deliveryNotes: 'Pack UOM test',
        items: [
          {
            poItemId: testPoItemId,
            productId: testProduct.id,
            uom: 'Pack',
            orderedQuantity: 1,
            receivedQuantity: 2, // Receive 2 packs
            unitPrice: 270,
            varianceReason: '',
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify inventory: 2 packs × 6 bottles per pack = 12 bottles
      const inventory = await prisma.inventory.findFirst({
        where: { productId: testProduct.id, warehouseId: testWarehouse.id },
      });

      expect(inventory?.quantity).toBe(12); // 2 packs = 12 bottles

      const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(product?.averageCostPrice).toBe(45); // ₱270 ÷ 6 bottles = ₱45 per bottle
    });

    it('should fail with invalid UOM configuration', async () => {
      // Remove UOM configurations to simulate missing setup
      await prisma.productUOM.deleteMany({
        where: { productId: testProduct.id },
      });

      try {
        const rvData = {
          purchaseOrderId: testPurchaseOrder.id,
          receiverName: 'Test Receiver',
          items: [
            {
              poItemId: testPoItemId,
              productId: testProduct.id,
              uom: 'Case',
              orderedQuantity: 1,
              receivedQuantity: 1,
              unitPrice: 450,
            },
          ],
        };

        const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(rvData)
        });

        const responseData = await response.json();
        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        // Check either error or details for the message
        const errorMessage = responseData.details || responseData.error;
        expect(errorMessage).toContain('UOM');
        expect(errorMessage).toContain('not found');
      } finally {
        // Restore UOM configurations for other tests
        const existingUOMs = await prisma.productUOM.count({ where: { productId: testProduct.id } });
        if (existingUOMs === 0) {
          await prisma.productUOM.createMany({
            data: [
              {
                id: randomUUID(),
                productId: testProduct.id,
                name: 'Case',
                conversionFactor: 10,
                sellingPrice: 450,
              },
              {
                id: randomUUID(),
                productId: testProduct.id,
                name: 'Pack',
                conversionFactor: 6,
                sellingPrice: 270,
              },
            ],
          });
        }
      }
    });
  });

  describe('Regression Tests', () => {
    it('should prevent the original UOM conversion bug', async () => {
      // This test ensures that receiving 1 case results in 10 bottles in inventory
      // (not 1 bottle as the original bug would cause)

      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Regression Test',
        items: [
          {
            poItemId: testPoItemId,
            productId: testProduct.id,
            uom: 'Case',
            orderedQuantity: 1,
            receivedQuantity: 1,
            unitPrice: 450,
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);

      // Critical assertion: inventory should show 10 bottles, not 1
      const inventory = await prisma.inventory.findFirst({
        where: { productId: testProduct.id, warehouseId: testWarehouse.id },
      });

      expect(inventory?.quantity).toBe(10);
      expect(inventory?.quantity).not.toBe(1); // Explicitly test against the bug
    });
  });
});
