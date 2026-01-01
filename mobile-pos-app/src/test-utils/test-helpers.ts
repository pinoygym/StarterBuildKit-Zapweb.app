import { MockSQLiteDatabase, mockDatabaseService } from './__mocks__/database';
import { MockApiClient, mockApiClient } from './__mocks__/apiClient';
import { MockReduxStore, mockStore } from './__mocks__/reduxStore';
import { optimizedAPI } from '../services/optimizedAPI';
import { databaseService } from '../services/database/databaseService';

// Test data factories
export class TestDataFactory {
  static createProduct(overrides: Partial<any> = {}): any {
    return {
      id: 'prod-123',
      name: 'Test Product',
      description: 'Test product description',
      category: 'Test Category',
      imageUrl: null,
      basePrice: 100.00,
      baseUOM: 'pcs',
      minStockLevel: 10,
      shelfLifeDays: 365,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
      lastModified: new Date().toISOString(),
      ...overrides,
    };
  }

  static createCustomer(overrides: Partial<any> = {}): any {
    return {
      id: 'cust-123',
      customerCode: 'CUST001',
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      phone: '+1234567890',
      email: 'john@test.com',
      address: '123 Test St',
      city: 'Test City',
      region: 'Test Region',
      postalCode: '12345',
      paymentTerms: 'Net 30',
      creditLimit: 5000.00,
      taxId: 'TAX123',
      customerType: 'regular',
      notes: 'Test customer',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
      lastModified: new Date().toISOString(),
      ...overrides,
    };
  }

  static createCartItem(overrides: Partial<any> = {}): any {
    return {
      id: 'cart-123',
      productId: 'prod-123',
      productName: 'Test Product',
      quantity: 2,
      uom: 'pcs',
      unitPrice: 100.00,
      subtotal: 200.00,
      imageUrl: null,
      ...overrides,
    };
  }

  static createPOSSale(overrides: Partial<any> = {}): any {
    return {
      id: 'sale-123',
      receiptNumber: 'RCP-20241118-0001',
      branchId: 'branch-123',
      userId: 'user-123',
      subtotal: 200.00,
      tax: 20.00,
      totalAmount: 220.00,
      paymentMethod: 'cash',
      amountReceived: 250.00,
      change: 30.00,
      customerId: 'cust-123',
      customerName: 'Test Customer',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      lastModified: new Date().toISOString(),
      items: [this.createCartItem()],
      ...overrides,
    };
  }

  static createInventoryBatch(overrides: Partial<any> = {}): any {
    return {
      id: 'batch-123',
      batchNumber: 'BATCH001',
      productId: 'prod-123',
      warehouseId: 'wh-123',
      quantity: 100,
      unitCost: 80.00,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      receivedDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
      ...overrides,
    };
  }

  static createUser(overrides: Partial<any> = {}): any {
    return {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      roleId: 'role-123',
      branchId: 'branch-123',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }
}

// Database test helpers
export class DatabaseTestHelper {
  private db: MockSQLiteDatabase;

  constructor() {
    this.db = new MockSQLiteDatabase();
  }

  async setup(): Promise<void> {
    // Initialize database tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        imageUrl TEXT,
        basePrice REAL NOT NULL,
        baseUOM TEXT NOT NULL,
        minStockLevel INTEGER DEFAULT 0,
        shelfLifeDays INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        lastModified TEXT NOT NULL
      )
    `);
  }

  async teardown(): Promise<void> {
    this.db.clearAllData();
  }

  async seedProducts(products: any[] = []): Promise<void> {
    if (products.length === 0) {
      products = [
        TestDataFactory.createProduct({ id: 'prod-1', name: 'Product 1' }),
        TestDataFactory.createProduct({ id: 'prod-2', name: 'Product 2' }),
      ];
    }

    for (const product of products) {
      await this.db.runAsync(
        `INSERT INTO products (id, name, description, category, imageUrl, basePrice, baseUOM, minStockLevel, shelfLifeDays, status, createdAt, updatedAt, syncStatus, lastModified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.description,
          product.category,
          product.imageUrl,
          product.basePrice,
          product.baseUOM,
          product.minStockLevel,
          product.shelfLifeDays,
          product.status,
          product.createdAt,
          product.updatedAt,
          product.syncStatus,
          product.lastModified,
        ]
      );
    }

    const dbMock = databaseService as any;
    if (dbMock.findAll && dbMock.findById) {
      dbMock.findAll.mockImplementation(async (_table: string, whereClause?: string, params: any[] = []) => {
        let result = [...products];
        if (whereClause) {
          // Category filter
          const catIdx = whereClause.indexOf('category = ?');
          if (catIdx !== -1) {
            const catParamIndex = params.findIndex((_v, i) => i >= 0);
            const category = params[catParamIndex];
            result = result.filter(p => p.category === category);
          }
          // Status filter
          if (whereClause.includes('status = ?')) {
            const status = params.find(v => typeof v === 'string' && (v === 'active' || v === 'inactive'));
            if (status) result = result.filter(p => p.status === status);
          }
          // Name/description LIKE
          if (whereClause.includes('name LIKE ?') || whereClause.includes('description LIKE ?')) {
            const like = String(params[0] || '').replace(/%/g, '').toLowerCase();
            result = result.filter(p =>
              String(p.name || '').toLowerCase().includes(like) ||
              String(p.description || '').toLowerCase().includes(like)
            );
          }
        }
        return result;
      });
      dbMock.findById.mockImplementation(async (_table: string, id: string) => {
        return products.find((p: any) => p.id === id) || null;
      });
    }
  }

  async seedCustomers(customers: any[] = []): Promise<void> {
    if (customers.length === 0) {
      customers = [
        TestDataFactory.createCustomer({ id: 'cust-1', customerCode: 'CUST001' }),
        TestDataFactory.createCustomer({ id: 'cust-2', customerCode: 'CUST002' }),
      ];
    }

    for (const customer of customers) {
      await this.db.runAsync(
        `INSERT INTO customers (id, customerCode, companyName, contactPerson, phone, email, address, city, region, postalCode, paymentTerms, creditLimit, taxId, customerType, notes, status, createdAt, updatedAt, syncStatus, lastModified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.customerCode,
          customer.companyName,
          customer.contactPerson,
          customer.phone,
          customer.email,
          customer.address,
          customer.city,
          customer.region,
          customer.postalCode,
          customer.paymentTerms,
          customer.creditLimit,
          customer.taxId,
          customer.customerType,
          customer.notes,
          customer.status,
          customer.createdAt,
          customer.updatedAt,
          customer.syncStatus,
          customer.lastModified,
        ]
      );
    }
  }

  getDatabase(): MockSQLiteDatabase {
    return this.db;
  }

  getCallHistory(method: string): any[] {
    const fn = (databaseService as any)[method];
    return fn?.mock?.calls || [];
  }
}

// API test helpers
export class ApiTestHelper {
  private apiClient: MockApiClient;
  private cacheInvalidations: string[] = [];

  constructor() {
    this.apiClient = new MockApiClient();
  }

  setupSuccessResponse(endpoint: string, data: any): void {
    (optimizedAPI.get as any).mockResolvedValueOnce({ data, status: 200 });
    this.apiClient.setResponse('GET', endpoint, { data, success: true });
    const dbMock = databaseService as any;
    if (Array.isArray(data) && dbMock.findAll) {
      dbMock.findAll.mockResolvedValue(data);
    }

    // Endpoint-aware DB mapping for specialized queries
    if (endpoint.startsWith('/products/low-stock')) {
      if (dbMock.execute) {
        dbMock.execute.mockResolvedValue(data);
      }
    }
  }

  setupErrorResponse(endpoint: string, error: any): void {
    (optimizedAPI.get as any).mockRejectedValueOnce(error);
    this.apiClient.setError('GET', endpoint, error);
  }

  setupNetworkError(): void {
    const err = new Error('Network error');
    (optimizedAPI.get as any).mockRejectedValueOnce(err);
  }

  setupPostSuccess(endpoint: string, responseData: any): void {
    (optimizedAPI.post as any).mockResolvedValueOnce({ data: responseData, status: 200 });
    this.apiClient.setResponse('POST', endpoint, { data: responseData, success: true });
    const dbMock = databaseService as any;
    if (dbMock.insert) {
      dbMock.insert.mockResolvedValue('mock-id');
    }
  }

  setupPostError(endpoint: string, error: any): void {
    (optimizedAPI.post as any).mockRejectedValueOnce(error);
    this.apiClient.setError('POST', endpoint, error);
  }

  setupPutSuccess(endpoint: string, responseData: any): void {
    (optimizedAPI.put as any).mockResolvedValueOnce({ data: responseData, status: 200 });
    this.apiClient.setResponse('PUT', endpoint, { data: responseData, success: true });
    const dbMock = databaseService as any;
    if (dbMock.update) {
      dbMock.update.mockResolvedValue(undefined);
    }
  }

  setOnlineStatus(online: boolean): void {
    this.apiClient.setOnlineStatus(online);
    const err = new Error('Network error');
    if (!online) {
      (optimizedAPI.get as any) = jest.fn().mockRejectedValue(err);
      (optimizedAPI.post as any) = jest.fn().mockRejectedValue(err);
      (optimizedAPI.put as any) = jest.fn().mockRejectedValue(err);
      (optimizedAPI.delete as any) = jest.fn().mockRejectedValue(err);
    } else {
      (optimizedAPI.get as any) = jest.fn();
      (optimizedAPI.post as any) = jest.fn();
      (optimizedAPI.put as any) = jest.fn();
      (optimizedAPI.delete as any) = jest.fn();
    }
  }

  setDelay(delay: number): void {
    this.apiClient.setDelay(delay);
  }

  getCallHistory(): Array<{ method: string; endpoint: string; data?: any; config?: any }> {
    const calls: Array<{ method: string; endpoint: string; data?: any; config?: any }> = [];
    const collect = (fn: any, method: string) => {
      const arr = fn?.mock?.calls || [];
      arr.forEach((args: any[]) => {
        calls.push({ method, endpoint: args[0], data: args[1], config: args[2] });
      });
    };
    collect((optimizedAPI.get as any), 'GET');
    collect((optimizedAPI.post as any), 'POST');
    collect((optimizedAPI.put as any), 'PUT');
    collect((optimizedAPI.delete as any), 'DELETE');
    // Deduplicate by method+endpoint
    const seen = new Set<string>();
    const deduped: Array<{ method: string; endpoint: string; data?: any; config?: any }> = [];
    const pushUnique = (entry: { method: string; endpoint: string; data?: any; config?: any }) => {
      const key = `${entry.method}:${entry.endpoint}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(entry);
      }
    };
    calls.forEach(pushUnique);
    if (deduped.length === 0) {
      return this.apiClient.getCallHistory();
    }
    return deduped;
  }

  clearCallHistory(): void {
    if ((optimizedAPI.get as any).mock) (optimizedAPI.get as any).mockClear();
    if ((optimizedAPI.post as any).mock) (optimizedAPI.post as any).mockClear();
    if ((optimizedAPI.put as any).mock) (optimizedAPI.put as any).mockClear();
    if ((optimizedAPI.delete as any).mock) (optimizedAPI.delete as any).mockClear();
    if ((optimizedAPI.invalidateCache as any).mock) (optimizedAPI.invalidateCache as any).mockClear();
    this.apiClient.clearCallHistory();
  }

  getApiClient(): MockApiClient {
    return this.apiClient;
  }

  getCacheInvalidationCalls(): string[] {
    const calls = (optimizedAPI.invalidateCache as any).mock?.calls || [];
    return calls.map((args: any[]) => args[0]);
  }
}

// Redux test helpers
export class ReduxTestHelper {
  private store: MockReduxStore;

  constructor() {
    this.store = new MockReduxStore();
  }

  getState(): any {
    return this.store.getState();
  }

  dispatch(action: any): any {
    return this.store.dispatch(action);
  }

  getActions(): any[] {
    return this.store.getActions();
  }

  clearActions(): void {
    this.store.clearActions();
  }

  setState(newState: any): void {
    this.store.setState(newState);
  }

  getStore(): MockReduxStore {
    return this.store;
  }
}

// Global test setup
export const setupTestEnvironment = () => {
  const dbHelper = new DatabaseTestHelper();
  const apiHelper = new ApiTestHelper();
  const reduxHelper = new ReduxTestHelper();

  return {
    dbHelper,
    apiHelper,
    reduxHelper,
    database: dbHelper.getDatabase(),
    apiClient: apiHelper.getApiClient(),
    store: reduxHelper.getStore(),
  };
};

// Common test utilities
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const expectAsyncThrow = async (fn: () => Promise<any>, errorMessage?: string): Promise<void> => {
  try {
    await fn();
    fail('Expected function to throw an error');
  } catch (error) {
    if (errorMessage) {
      expect((error as Error).message).toContain(errorMessage);
    }
  }
};

export const createMockAsyncThunk = (typePrefix: string, implementation: any) => {
  return jest.fn().mockImplementation(async (arg: any) => {
    try {
      const result = await implementation(arg);
      return {
        type: `${typePrefix}/fulfilled`,
        payload: result,
      };
    } catch (error) {
      throw {
        type: `${typePrefix}/rejected`,
        error,
      };
    }
  });
};