import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export { prisma };



export interface TestDataIds {
  users: string[];
  branches: string[];
  warehouses: string[];
  suppliers: string[];
  products: string[];
  purchaseOrders: string[];
  receivingVouchers: string[];
  salesOrders: string[];
  customers: string[];
  expenses: string[];
  ar: string[];
  ap: string[];
  inventoryBatches: string[];
}

/** Clean up all test data created during tests */
export async function cleanupTestData(testIds: TestDataIds | Partial<TestDataIds> = {}): Promise<void> {
  try {
    // Delete in reverse order of dependencies
    if (testIds.ar && testIds.ar.length > 0) {
      await prisma.accountsReceivable.deleteMany({ where: { id: { in: testIds.ar } } });
    }
    if (testIds.ap && testIds.ap.length > 0) {
      await prisma.accountsPayable.deleteMany({ where: { id: { in: testIds.ap } } });
    }
    if (testIds.expenses && testIds.expenses.length > 0) {
      await prisma.expense.deleteMany({ where: { id: { in: testIds.expenses } } });
    }
    if (testIds.salesOrders && testIds.salesOrders.length > 0) {
      await prisma.salesOrderItem.deleteMany({ where: { soId: { in: testIds.salesOrders } } });
      await prisma.salesOrder.deleteMany({ where: { id: { in: testIds.salesOrders } } });
    }
    if (testIds.receivingVouchers && testIds.receivingVouchers.length > 0) {
      await prisma.receivingVoucherItem.deleteMany({ where: { rvId: { in: testIds.receivingVouchers } } });
      await prisma.receivingVoucher.deleteMany({ where: { id: { in: testIds.receivingVouchers } } });
    }
    if (testIds.purchaseOrders && testIds.purchaseOrders.length > 0) {
      await prisma.purchaseOrderItem.deleteMany({ where: { poId: { in: testIds.purchaseOrders } } });
      await prisma.purchaseOrder.deleteMany({ where: { id: { in: testIds.purchaseOrders } } });
    }
    if (testIds.products && testIds.products.length > 0) {
      await prisma.product.deleteMany({ where: { id: { in: testIds.products } } });
    }
    if (testIds.customers && testIds.customers.length > 0) {
      await prisma.customer.deleteMany({ where: { id: { in: testIds.customers } } });
    }
    if (testIds.suppliers && testIds.suppliers.length > 0) {
      await prisma.supplier.deleteMany({ where: { id: { in: testIds.suppliers } } });
    }
    if (testIds.warehouses && testIds.warehouses.length > 0) {
      await prisma.warehouse.deleteMany({ where: { id: { in: testIds.warehouses } } });
    }
    if (testIds.branches && testIds.branches.length > 0) {
      await prisma.branch.deleteMany({ where: { id: { in: testIds.branches } } });
    }
    if (testIds.users && testIds.users.length > 0) {
      // Delete associated sessions first
      await prisma.session.deleteMany({ where: { userId: { in: testIds.users } } });
      await prisma.user.deleteMany({ where: { id: { in: testIds.users } } });
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

export async function createTestUser(overrides: Partial<any> = {}): Promise<any> {
  const userId = randomUUID();
  const password = overrides.password || 'Test@123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = await prisma.role.findFirst({ where: { name: 'Super Admin' } });

  // Remove 'password' from overrides to prevent Prisma validation error
  const { password: _, ...cleanOverrides } = overrides;

  const user = await prisma.user.create({
    data: {
      id: userId,
      email: `test-${userId}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      passwordHash: hashedPassword,
      roleId: role?.id ?? '',
      status: 'ACTIVE',
      emailVerified: true,
      updatedAt: new Date(),
      ...cleanOverrides,
    },
  });
  // Attach the plain password for testing login via API
  (user as any).password = password;
  return user;
}

// Function to register a user via the API
export async function registerUserViaApi(userData: any, baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Registration failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

// Function to log in a user via the API
export async function loginUserViaApi(credentials: any, baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  const setCookie = response.headers.get('set-cookie') || '';
  if (response.status !== 200) {
    throw new Error(`Login failed: ${data.message || JSON.stringify(data)}`);
  }
  return { data, setCookie, token: data.token };
}

export async function createAndLoginUser(baseUrl: string) {
  const testPassword = 'TestUser@123';
  const testUser = await createTestUser({ password: testPassword });

  // Register user via API (if the test needs to test registration)
  // For integration tests that just need a logged-in user, creating directly
  // in DB and then logging in is more robust.
  // We already created the user directly in DB using createTestUser,
  // so we'll just log them in.

  const loginResult = await loginUserViaApi(
    { email: testUser.email, password: testPassword },
    baseUrl
  );

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${loginResult.token}`,
  };

  const cleanup = async () => {
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  };

  return { testUser, token: loginResult.token, headers, cleanup };
}

export async function createAuthHeaders(email?: string, password?: string): Promise<Record<string, string>> {
  const creds = email && password ? { email, password } : { email: 'test@example.com', password: 'password' };
  // We assume the user exists or will be created by the test calling this. 
  // However, loginUserViaApi needs a real user. 
  // If this helper is expected to just "get headers for existing user", it should be effectively a login wrapper.
  try {
    const loginResult = await loginUserViaApi(creds, process.env.BASE_URL || 'http://localhost:3000');
    return {
      'Authorization': `Bearer ${loginResult.token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.warn('createAuthHeaders failed to login:', error);
    throw error;
  }
}


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
      updatedAt: new Date(),
      ...overrides,
    },
  });
  return branch;
}

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
      updatedAt: new Date(),
      ...overrides,
    },
  });
  return warehouse;
}

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
      updatedAt: new Date(),
      ...overrides,
    },
  });
  return supplier;
}

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
      updatedAt: new Date(),
      ...overrides,
    },
  });
  return customer;
}

export async function createTestProduct(overrides: Partial<any> = {}): Promise<any> {
  const productId = randomUUID();
  const product = await prisma.product.create({
    data: {
      id: productId,
      name: `Test Product ${productId.slice(0, 8)}`,
      description: 'Test product description',
      category: 'Test Category',
      basePrice: 15.0,
      baseUOM: 'PCS',
      minStockLevel: 5,
      shelfLifeDays: 365,
      status: 'active',
      updatedAt: new Date(),
      ...overrides,
    },
  });
  return product;
}

/** Initialize test database with basic data */
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
    customers: [],
    expenses: [],
    ar: [],
    ap: [],
    inventoryBatches: [],
  };
  try {
    const user = await createTestUser();
    testIds.users.push(user.id);
    const branch = await createTestBranch();
    testIds.branches.push(branch.id);
    const warehouse = await createTestWarehouse(branch.id);
    testIds.warehouses.push(warehouse.id);
    const supplier = await createTestSupplier();
    testIds.suppliers.push(supplier.id);
    const product = await createTestProduct();
    testIds.products.push(product.id);
    const customer = await createTestCustomer();
    testIds.customers.push(customer.id);
    return testIds;
  } catch (error) {
    console.error('Error initializing test database:', error);
    await cleanupTestData(testIds);
    throw error;
  }
}

export const resetTestDatabase = cleanupTestData;
