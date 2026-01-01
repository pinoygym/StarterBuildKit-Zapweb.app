import * as SQLite from 'expo-sqlite';
import { Product, Customer, POSSale, POSSaleItem, User, Branch, InventoryBatch } from '../types';

let database: any = null;

export const initDatabase = async (): Promise<any> => {
  if (database) return database;

  database = await SQLite.openDatabaseAsync('mobilePos.db');
  
  // Create tables
  await database.execAsync(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      phone TEXT,
      roleId TEXT NOT NULL,
      branchId TEXT,
      status TEXT DEFAULT 'ACTIVE',
      emailVerified BOOLEAN DEFAULT FALSE,
      lastLoginAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Branches table
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      manager TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
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
    );

    -- Product UOMs table
    CREATE TABLE IF NOT EXISTS product_uoms (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      name TEXT NOT NULL,
      conversionFactor REAL NOT NULL,
      sellingPrice REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      customerCode TEXT UNIQUE NOT NULL,
      companyName TEXT,
      contactPerson TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT,
      city TEXT,
      region TEXT,
      postalCode TEXT,
      paymentTerms TEXT DEFAULT 'Net 30',
      creditLimit REAL,
      taxId TEXT,
      customerType TEXT DEFAULT 'regular',
      notes TEXT,
      status TEXT DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT DEFAULT 'synced',
      lastModified TEXT NOT NULL
    );

    -- Inventory Batches table
    CREATE TABLE IF NOT EXISTS inventory_batches (
      id TEXT PRIMARY KEY,
      batchNumber TEXT UNIQUE NOT NULL,
      productId TEXT NOT NULL,
      warehouseId TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitCost REAL NOT NULL,
      expiryDate TEXT NOT NULL,
      receivedDate TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
    );

    -- POS Sales table
    CREATE TABLE IF NOT EXISTS pos_sales (
      id TEXT PRIMARY KEY,
      receiptNumber TEXT UNIQUE NOT NULL,
      branchId TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      amountReceived REAL,
      change REAL,
      customerId TEXT,
      customerName TEXT,
      status TEXT DEFAULT 'completed',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT DEFAULT 'pending',
      lastModified TEXT NOT NULL,
      FOREIGN KEY (branchId) REFERENCES branches (id)
    );

    -- POS Sale Items table
    CREATE TABLE IF NOT EXISTS pos_sale_items (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity REAL NOT NULL,
      uom TEXT NOT NULL,
      unitPrice REAL NOT NULL,
      subtotal REAL NOT NULL,
      costOfGoodsSold REAL NOT NULL,
      FOREIGN KEY (saleId) REFERENCES pos_sales (id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products (id)
    );

    -- Sync log table
    CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      tableName TEXT NOT NULL,
      recordId TEXT NOT NULL,
      operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
      timestamp TEXT NOT NULL,
      synced BOOLEAN DEFAULT FALSE,
      retryCount INTEGER DEFAULT 0
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
    CREATE INDEX IF NOT EXISTS idx_pos_sales_branch ON pos_sales (branchId);
    CREATE INDEX IF NOT EXISTS idx_pos_sales_date ON pos_sales (createdAt);
    CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log (synced);
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_batches (productId);
  `);

  return database;
};

// Database operations
export class DatabaseService {
  private db: any = null;

  async init() {
    this.db = await initDatabase();
  }

  // Generic CRUD operations
  async insert(table: string, data: Record<string, any>) {
    if (!this.db) throw new Error('Database not initialized');
    
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    await this.db.runAsync(query, values);
  }

  async update(table: string, id: string, data: Record<string, any>) {
    if (!this.db) throw new Error('Database not initialized');
    
    const columns = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const query = `UPDATE ${table} SET ${columns} WHERE id = ?`;
    await this.db.runAsync(query, values);
  }

  async delete(table: string, id: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const query = `DELETE FROM ${table} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  async findById(table: string, id: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    const result = await this.db.getFirstAsync(query, [id]);
    return result;
  }

  async findAll(table: string, whereClause = '', params: any[] = []) {
    if (!this.db) throw new Error('Database not initialized');
    
    const query = `SELECT * FROM ${table}${whereClause}`;
    const result = await this.db.getAllAsync(query, params);
    return result;
  }

  // Sync operations
  async markForSync(table: string, recordId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE') {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.insert('sync_log', {
      id: `${recordId}-${Date.now()}`,
      tableName: table,
      recordId,
      operation,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0
    });
  }

  async getPendingSync() {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.findAll('sync_log', ' WHERE synced = ?', [false]);
  }

  async markSyncCompleted(syncLogId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.update('sync_log', syncLogId, { synced: true });
  }

  // Utility methods
  async executeRaw(query: string, params: any[] = []) {
    if (!this.db) throw new Error('Database not initialized');
    
    return await this.db.execAsync(query, params);
  }

  async transaction(callback: () => Promise<void>) {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync('BEGIN TRANSACTION');
    try {
      await callback();
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();