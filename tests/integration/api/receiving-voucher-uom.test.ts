import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestWarehouse, createTestSupplier } from '@/tests/helpers/test-db-utils';

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Receiving Voucher UOM Conversion Integration Tests', () => {
  let testUser: any;
  let testBranch: any;
  let testWarehouse: any;
  let testSupplier: any;
  let testProduct: any;
  let testPurchaseOrder: any;

  beforeAll(async () => {
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
      },
    });

    // Create purchase order item
    await prisma.purchaseOrderItem.create({
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
  });

  afterEach(async () => {
    // Clean up receiving vouchers created during tests
    await prisma.receivingVoucher.deleteMany({
      where: {
        purchaseOrderId: testPurchaseOrder.id,
      },
    });

    // Reset inventory batches
    await prisma.inventoryBatch.deleteMany({
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
  });

  afterAll(async () => {
    // Clean up all test data
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.rvNumber).toMatch(/^RV-\d{8}-\d{4}$/);

      // Verify inventory batch was created with converted quantity
      const inventoryBatches = await prisma.inventoryBatch.findMany({
        where: { productId: testProduct.id },
      });

      expect(inventoryBatches).toHaveLength(1);
      expect(inventoryBatches[0].quantity).toBe(10); // 1 case = 10 bottles
      expect(inventoryBatches[0].unitCost).toBe(45); // ₱450 ÷ 10 bottles = ₱45 per bottle
    });

    it('should handle partial case receipt (0.5 case = 5 bottles)', async () => {
      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Test Receiver',
        deliveryNotes: 'Partial case receipt',
        items: [
          {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify inventory batch has correct converted quantity
      const inventoryBatches = await prisma.inventoryBatch.findMany({
        where: { productId: testProduct.id },
      });

      expect(inventoryBatches[0].quantity).toBe(5); // 0.5 case = 5 bottles
      expect(inventoryBatches[0].unitCost).toBe(45); // Cost per bottle remains the same
    });

    it('should work with pack UOM conversion', async () => {
      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Test Receiver',
        deliveryNotes: 'Pack UOM test',
        items: [
          {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify inventory batch: 2 packs × 6 bottles per pack = 12 bottles
      const inventoryBatches = await prisma.inventoryBatch.findMany({
        where: { productId: testProduct.id },
      });

      expect(inventoryBatches[0].quantity).toBe(12); // 2 packs = 12 bottles
      expect(inventoryBatches[0].unitCost).toBe(45); // ₱270 ÷ 6 bottles = ₱45 per bottle
    });

    it('should fail with invalid UOM configuration', async () => {
      // Remove UOM configurations to simulate missing setup
      await prisma.productUOM.deleteMany({
        where: { productId: testProduct.id },
      });

      const rvData = {
        purchaseOrderId: testPurchaseOrder.id,
        receiverName: 'Test Receiver',
        items: [
          {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('UOM conversion');

      // Restore UOM configurations for other tests
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rvData)
      });

      const responseData = await response.json();
      expect(response.status).toBe(200);

      // Critical assertion: inventory should show 10 bottles, not 1
      const inventoryBatches = await prisma.inventoryBatch.findMany({
        where: { productId: testProduct.id },
      });

      expect(inventoryBatches[0].quantity).toBe(10);
      expect(inventoryBatches[0].quantity).not.toBe(1); // Explicitly test against the bug
    });
  });
});