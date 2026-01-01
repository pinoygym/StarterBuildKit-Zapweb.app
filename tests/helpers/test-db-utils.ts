import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Create a separate Prisma client for testing
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export interface TestDataIds {
  users: string[];
  branches: string[];
  warehouses: string[];
  suppliers: string[];
  products: string[];
  purchaseOrders: string[];
  receivingVouchers: string[];
  salesOrders: string[];
  inventoryBatches: string[];
  customers: string[];
  expenses: string[];
  ar: string[];
  ap: string[];
}

/**
 * Clean up all test data created during tests
 */
export async function cleanupTestData(testIds: TestDataIds): Promise<void> {
  try {
    // Delete in reverse order of dependencies
    if (testIds.ar.length > 0) {
      await prisma.accountsReceivable.deleteMany({
        where: { id: { in: testIds.ar } }
      });
    }

    if (testIds.ap.length > 0) {
      await prisma.accountsPayable.deleteMany({
        where: { id: { in: testIds.ap } }
      });
    }

    if (testIds.expenses.length > 0) {
      await prisma.expense.deleteMany({
        where: { id: { in: testIds.expenses } }
      });
    }

    if (testIds.salesOrders.length > 0) {
      await prisma.salesOrderItem.deleteMany({
        where: { soId: { in: testIds.salesOrders } }
      });
      await prisma.salesOrder.deleteMany({
        where: { id: { in: testIds.salesOrders } }
      });
    }

    if (testIds.inventoryBatches.length > 0) {
      await prisma.inventoryBatch.deleteMany({
        where: { id: { in: testIds.inventoryBatches } }
      });
    }

    if (testIds.receivingVouchers.length > 0) {
      await prisma.receivingVoucherItem.deleteMany({
        where: { rvId: { in: testIds.receivingVouchers } }
      });
      await prisma.receivingVoucher.deleteMany({
        where: { id: { in: testIds.receivingVouchers } }
      });
    }

    if (testIds.purchaseOrders.length > 0) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { poId: { in: testIds.purchaseOrders } }
      });
      await prisma.purchaseOrder.deleteMany({
        where: { id: { in: testIds.purchaseOrders } }
      });
    }

    if (testIds.products.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: testIds.products } }
      });
    }

    if (testIds.customers.length > 0) {
      await prisma.customer.deleteMany({
        where: { id: { in: testIds.customers } }
      });
    }

    if (testIds.suppliers.length > 0) {
      await prisma.supplier.deleteMany({
        where: { id: { in: testIds.suppliers } }
      });
    }

    if (testIds.warehouses.length > 0) {
      await prisma.warehouse.deleteMany({
        where: { id: { in: testIds.warehouses } }
      });
    }

    if (testIds.branches.length > 0) {
      await prisma.branch.deleteMany({
        where: { id: { in: testIds.branches } }
      });
    }

    if (testIds.users.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testIds.users } }
      });
    }

  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

/**
 * Create test user with admin role
 */
export async function createTestUser(overrides: Partial<any> = {}): Promise<any> {
  const userId = randomUUID();
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: `test-${userId}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: '$2a$10$hashedpassword', // bcrypt hash for 'password'
      roleId: 'admin-role-id', // This should be a valid role ID
      status: 'ACTIVE',
      emailVerified: true,
      ...overrides,
    },
  });
  return user;
}

/**
 * Create test branch
 */
export async function createTestBranch(overrides: Partial<any> = {}): Promise<any> {
  const branchId = randomUUID();
  const branch = await prisma.branch.create({
    data: {
      id: branchId,
      name: `Test Branch ${branchId.slice(0, 8)}`,
      code: `TB${branchId.slice(0, 6).toUpperCase()}`,
      location: '123 Test Street',
      manager: 'Test Manager',
      phone: '123-456-7890',
      status: 'active',
      ...overrides,
    },
  });
  return branch;
}

/**
 * Create test warehouse
 */
export async function createTestWarehouse(branchId: string, overrides: Partial<any> = {}): Promise<any> {
  const warehouseId = randomUUID();
  const warehouse = await prisma.warehouse.create({
    data: {
      id: warehouseId,
      name: `Test Warehouse ${warehouseId.slice(0, 8)}`,
      location: '456 Warehouse Ave',
      manager: 'Test Warehouse Manager',
      maxCapacity: 1000,
      branchId,
      ...overrides,
    },
  });
  return warehouse;
}

/**
 * Create test supplier
 */
export async function createTestSupplier(overrides: Partial<any> = {}): Promise<any> {
  const supplierId = randomUUID();
  const supplier = await prisma.supplier.create({
    data: {
      id: supplierId,
      companyName: `Test Supplier ${supplierId.slice(0, 8)}`,
      contactPerson: 'John Doe',
      email: `supplier-${supplierId.slice(0, 8)}@example.com`,
      phone: '555-123-4567',
      paymentTerms: 'Net 30',
      status: 'active',
      ...overrides,
    },
  });
  return supplier;
}

/**
 * Create test product
 */
export async function createTestProduct(overrides: Partial<any> = {}): Promise<any> {
  const productId = randomUUID();
  const product = await prisma.product.create({
    data: {
      id: productId,
      name: `Test Product ${productId.slice(0, 8)}`,
      description: 'Test product description',
      category: 'Test Category',
      basePrice: 15.00,
      baseUOM: 'PCS',
      minStockLevel: 5,
      shelfLifeDays: 365,
      status: 'active',
      ...overrides,
    },
  });
  return product;
}

/**
 * Create test customer
 */
export async function createTestCustomer(overrides: Partial<any> = {}): Promise<any> {
  const customerId = randomUUID();
  const customer = await prisma.customer.create({
    data: {
      id: customerId,
      customerCode: `TC${customerId.slice(0, 6).toUpperCase()}`,
      contactPerson: 'Jane Smith',
      email: `customer-${customerId.slice(0, 8)}@example.com`,
      phone: '555-987-6543',
      address: '321 Customer St',
      paymentTerms: 'Net 30',
      customerType: 'regular',
      status: 'active',
      ...overrides,
    },
  });
  return customer;
}

/**
 * Initialize test database with basic data
 */
export async function initializeTestDatabase(): Promise<TestDataIds> {
  const testIds: TestDataIds = {
    users: [],
    branches: [],
    warehouses: [],
    suppliers: [],
    products: [],
    purchaseOrders: [],
    receivingVouchers: [],
    salesOrders: [],
    inventoryBatches: [],
    customers: [],
    expenses: [],
    ar: [],
    ap: [],
  };

  try {
    // Create test user
    const user = await createTestUser();
    testIds.users.push(user.id);

    // Create test branch
    const branch = await createTestBranch();
    testIds.branches.push(branch.id);

    // Create test warehouse
    const warehouse = await createTestWarehouse(branch.id);
    testIds.warehouses.push(warehouse.id);

    // Create test supplier
    const supplier = await createTestSupplier();
    testIds.suppliers.push(supplier.id);

    // Create test customer
    const customer = await createTestCustomer();
    testIds.customers.push(customer.id);

    // Create test product
    const product = await createTestProduct();
    testIds.products.push(product.id);

    return testIds;
  } catch (error) {
    console.error('Error initializing test database:', error);
    await cleanupTestData(testIds);
    throw error;
  }
}

/**
 * Reset database to clean state (use with caution!)
 */
export async function resetTestDatabase(): Promise<void> {
  try {
    // Clear all data in reverse dependency order
    await prisma.accountsReceivable.deleteMany();
    await prisma.accountsPayable.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.salesOrderItem.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.receivingVoucherItem.deleteMany();
    await prisma.receivingVoucher.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.inventoryBatch.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
}

export { prisma };