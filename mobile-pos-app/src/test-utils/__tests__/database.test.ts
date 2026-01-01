import { MockSQLiteDatabase, mockDatabaseService } from '../__mocks__/database';
import { DatabaseTestHelper, TestDataFactory } from '../test-helpers';

describe('MockSQLiteDatabase', () => {
  let db: MockSQLiteDatabase;

  beforeEach(() => {
    db = new MockSQLiteDatabase();
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  describe('Basic Operations', () => {
    it('should initialize with empty tables', () => {
      expect(db.getTableData('products')).toEqual([]);
      expect(db.getTableData('customers')).toEqual([]);
      expect(db.getTableData('pos_sales')).toEqual([]);
    });

    it('should execute CREATE TABLE statements', async () => {
      await db.execAsync(`
        CREATE TABLE test_table (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      const calls = db.getExecCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0].sql).toContain('CREATE TABLE test_table');
    });

    it('should insert records correctly', async () => {
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-1', 'Test Product', 'Test Category', 100.00]
      );

      const products = db.getTableData('products');
      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        id: 'prod-1',
        name: 'Test Product',
        category: 'Test Category',
        basePrice: 100.00,
      });
    });

    it('should update records correctly', async () => {
      // First insert a record
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-1', 'Test Product', 'Test Category', 100.00]
      );

      // Then update it
      await db.runAsync(
        'UPDATE products SET name = ?, basePrice = ? WHERE id = ?',
        ['Updated Product', 150.00, 'prod-1']
      );

      const products = db.getTableData('products');
      expect(products[0]).toMatchObject({
        name: 'Updated Product',
        basePrice: 150.00,
      });
    });

    it('should delete records correctly', async () => {
      // First insert a record
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-1', 'Test Product', 'Test Category', 100.00]
      );

      // Then delete it
      await db.runAsync('DELETE FROM products WHERE id = ?', ['prod-1']);

      const products = db.getTableData('products');
      expect(products).toHaveLength(0);
    });

    it('should query records correctly', async () => {
      // Insert test data
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-1', 'Test Product', 'Test Category', 100.00]
      );

      const results = await db.getAllAsync('SELECT * FROM products');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'prod-1',
        name: 'Test Product',
      });
    });

    it('should query single record correctly', async () => {
      // Insert test data
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-1', 'Test Product', 'Test Category', 100.00]
      );

      const result = await db.getFirstAsync('SELECT * FROM products WHERE id = ?', ['prod-1']);
      expect(result).toMatchObject({
        id: 'prod-1',
        name: 'Test Product',
      });
    });

    it('should handle WHERE clauses in queries', async () => {
      // Insert test data
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-1', 'Test Product', 'Test Category', 100.00]
      );
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
        ['prod-2', 'Another Product', 'Other Category', 200.00]
      );

      const results = await db.getAllAsync('SELECT * FROM products WHERE category = ?', ['Test Category']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('prod-1');
    });

    it('should handle ORDER BY clauses', async () => {
      const now = new Date().toISOString();
      
      // Insert test data with different timestamps
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice, createdAt) VALUES (?, ?, ?, ?, ?)',
        ['prod-1', 'Product 1', 'Test Category', 100.00, now]
      );
      
      const later = new Date(Date.now() + 1000).toISOString();
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice, createdAt) VALUES (?, ?, ?, ?, ?)',
        ['prod-2', 'Product 2', 'Test Category', 200.00, later]
      );

      const results = await db.getAllAsync('SELECT * FROM products ORDER BY created_at DESC');
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('prod-2'); // Should be first due to DESC order
    });
  });

  describe('Transaction Support', () => {
    it('should support transaction callbacks', async () => {
      let transactionExecuted = false;

      await db.transaction(async () => {
        transactionExecuted = true;
        await db.runAsync(
          'INSERT INTO products (id, name, category, basePrice) VALUES (?, ?, ?, ?)',
          ['prod-1', 'Test Product', 'Test Category', 100.00]
        );
      });

      expect(transactionExecuted).toBe(true);
      
      const products = db.getTableData('products');
      expect(products).toHaveLength(1);
    });
  });

  describe('Test Utilities', () => {
    it('should track all exec calls', async () => {
      await db.execAsync('CREATE TABLE test (id TEXT)');
      await db.execAsync('CREATE INDEX test_idx ON test(id)');

      const calls = db.getExecCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].sql).toContain('CREATE TABLE test');
      expect(calls[1].sql).toContain('CREATE INDEX test_idx');
    });

    it('should track all run calls', async () => {
      await db.runAsync('INSERT INTO products (id, name) VALUES (?, ?)', ['prod-1', 'Test']);
      await db.runAsync('UPDATE products SET name = ? WHERE id = ?', ['Updated', 'prod-1']);

      const calls = db.getRunCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].sql).toContain('INSERT INTO products');
      expect(calls[1].sql).toContain('UPDATE products');
    });

    it('should track all getAll calls', async () => {
      await db.getAllAsync('SELECT * FROM products');
      await db.getAllAsync('SELECT * FROM customers');

      const calls = db.getGetAllCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].sql).toContain('SELECT * FROM products');
      expect(calls[1].sql).toContain('SELECT * FROM customers');
    });

    it('should track all getFirst calls', async () => {
      await db.getFirstAsync('SELECT * FROM products WHERE id = ?', ['prod-1']);
      await db.getFirstAsync('SELECT * FROM customers WHERE id = ?', ['cust-1']);

      const calls = db.getGetFirstCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].sql).toContain('SELECT * FROM products');
      expect(calls[1].sql).toContain('SELECT * FROM customers');
    });

    it('should clear all data', async () => {
      // Add some test data
      await db.runAsync('INSERT INTO products (id, name) VALUES (?, ?)', ['prod-1', 'Test']);
      await db.runAsync('INSERT INTO customers (id, name) VALUES (?, ?)', ['cust-1', 'Test']);

      expect(db.getTableData('products')).toHaveLength(1);
      expect(db.getTableData('customers')).toHaveLength(1);

      // Clear data
      db.clearAllData();

      expect(db.getTableData('products')).toHaveLength(0);
      expect(db.getTableData('customers')).toHaveLength(0);
    });

    it('should add records directly', () => {
      const testProduct = TestDataFactory.createProduct({ id: 'direct-add' });
      db.addRecord('products', testProduct);

      const products = db.getTableData('products');
      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject(testProduct);
    });
  });
});

describe('DatabaseTestHelper', () => {
  let dbHelper: DatabaseTestHelper;

  beforeEach(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.setup();
  });

  afterEach(async () => {
    await dbHelper.teardown();
  });

  describe('Setup and Teardown', () => {
    it('should setup database tables', async () => {
      const db = dbHelper.getDatabase();
      
      // Should be able to insert into products table
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice, baseUOM, createdAt, updatedAt, syncStatus, lastModified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['test-1', 'Test Product', 'Test Category', 100.00, 'pcs', new Date().toISOString(), new Date().toISOString(), 'synced', new Date().toISOString()]
      );

      const products = db.getTableData('products');
      expect(products).toHaveLength(1);
    });

    it('should teardown database correctly', async () => {
      const db = dbHelper.getDatabase();
      
      // Add some data
      await db.runAsync(
        'INSERT INTO products (id, name, category, basePrice, baseUOM, createdAt, updatedAt, syncStatus, lastModified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['test-1', 'Test Product', 'Test Category', 100.00, 'pcs', new Date().toISOString(), new Date().toISOString(), 'synced', new Date().toISOString()]
      );

      expect(db.getTableData('products')).toHaveLength(1);

      // Teardown should clear data
      await dbHelper.teardown();
      expect(db.getTableData('products')).toHaveLength(0);
    });
  });

  describe('Data Seeding', () => {
    it('should seed default products', async () => {
      await dbHelper.seedProducts();

      const db = dbHelper.getDatabase();
      const products = db.getTableData('products');
      
      expect(products).toHaveLength(2);
      expect(products[0].name).toBe('Product 1');
      expect(products[1].name).toBe('Product 2');
    });

    it('should seed custom products', async () => {
      const customProducts = [
        TestDataFactory.createProduct({ id: 'custom-1', name: 'Custom Product 1' }),
        TestDataFactory.createProduct({ id: 'custom-2', name: 'Custom Product 2' }),
      ];

      await dbHelper.seedProducts(customProducts);

      const db = dbHelper.getDatabase();
      const products = db.getTableData('products');
      
      expect(products).toHaveLength(2);
      expect(products[0].name).toBe('Custom Product 1');
      expect(products[1].name).toBe('Custom Product 2');
    });

    it('should seed default customers', async () => {
      await dbHelper.seedCustomers();

      const db = dbHelper.getDatabase();
      const customers = db.getTableData('customers');
      
      expect(customers).toHaveLength(2);
      expect(customers[0].customerCode).toBe('CUST001');
      expect(customers[1].customerCode).toBe('CUST002');
    });

    it('should seed custom customers', async () => {
      const customCustomers = [
        TestDataFactory.createCustomer({ id: 'custom-1', customerCode: 'CUSTOM001' }),
        TestDataFactory.createCustomer({ id: 'custom-2', customerCode: 'CUSTOM002' }),
      ];

      await dbHelper.seedCustomers(customCustomers);

      const db = dbHelper.getDatabase();
      const customers = db.getTableData('customers');
      
      expect(customers).toHaveLength(2);
      expect(customers[0].customerCode).toBe('CUSTOM001');
      expect(customers[1].customerCode).toBe('CUSTOM002');
    });
  });
});

describe('mockDatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have all required methods mocked', () => {
    expect(mockDatabaseService.initialize).toBeDefined();
    expect(mockDatabaseService.execute).toBeDefined();
    expect(mockDatabaseService.findAll).toBeDefined();
    expect(mockDatabaseService.findById).toBeDefined();
    expect(mockDatabaseService.insert).toBeDefined();
    expect(mockDatabaseService.update).toBeDefined();
    expect(mockDatabaseService.delete).toBeDefined();
    expect(mockDatabaseService.clearTable).toBeDefined();
    expect(mockDatabaseService.getPendingSyncOperations).toBeDefined();
    expect(mockDatabaseService.markAsSynced).toBeDefined();
    expect(mockDatabaseService.close).toBeDefined();
    expect(mockDatabaseService.transaction).toBeDefined();
  });

  it('should return default values for mocked methods', async () => {
    expect(await mockDatabaseService.initialize()).toBeUndefined();
    expect(await mockDatabaseService.execute()).toBeUndefined();
    expect(await mockDatabaseService.findAll()).toEqual([]);
    expect(await mockDatabaseService.findById()).toBeNull();
    expect(await mockDatabaseService.insert()).toBe('mock-id');
    expect(await mockDatabaseService.update()).toBeUndefined();
    expect(await mockDatabaseService.delete()).toBeUndefined();
    expect(await mockDatabaseService.clearTable()).toBeUndefined();
    expect(await mockDatabaseService.getPendingSyncOperations()).toEqual([]);
    expect(await mockDatabaseService.markAsSynced()).toBeUndefined();
    expect(await mockDatabaseService.close()).toBeUndefined();
  });

  it('should handle transaction callbacks', async () => {
    let callbackExecuted = false;
    
    await mockDatabaseService.transaction(async () => {
      callbackExecuted = true;
    });

    expect(callbackExecuted).toBe(true);
  });
});