import * as SQLite from 'expo-sqlite';
import { Product, Customer, InventoryBatch, POSSale, POSSaleItem, SyncStatus } from '../../types';

export interface DatabaseService {
  initialize(): Promise<void>;
  execute(sql: string, params?: any[]): Promise<any>;
  findAll(table: string, whereClause?: string, params?: any[]): Promise<any[]>;
  findById(table: string, id: string): Promise<any | null>;
  insert(table: string, data: any): Promise<string>;
  update(table: string, id: string, data: any): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  clearTable(table: string): Promise<void>;
  getPendingSyncOperations(): Promise<any[]>;
  markAsSynced(table: string, id: string): Promise<void>;
  close(): Promise<void>;
}

class SQLiteDatabaseService implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('mobile_pos.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        role_id TEXT NOT NULL,
        branch_id TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        email_verified BOOLEAN NOT NULL DEFAULT 0,
        last_login_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending'
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        image_url TEXT,
        base_price REAL NOT NULL,
        base_uom TEXT NOT NULL,
        min_stock_level INTEGER NOT NULL DEFAULT 0,
        shelf_life_days INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'synced'
      )`,

      // Product UOMs table
      `CREATE TABLE IF NOT EXISTS product_uoms (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        name TEXT NOT NULL,
        conversion_factor REAL NOT NULL,
        selling_price REAL NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        customer_code TEXT NOT NULL UNIQUE,
        company_name TEXT,
        contact_person TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT,
        city TEXT,
        region TEXT,
        postal_code TEXT,
        payment_terms TEXT NOT NULL,
        credit_limit REAL,
        tax_id TEXT,
        customer_type TEXT NOT NULL DEFAULT 'regular',
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'synced'
      )`,

      // Inventory batches table
      `CREATE TABLE IF NOT EXISTS inventory_batches (
        id TEXT PRIMARY KEY,
        batch_number TEXT NOT NULL,
        product_id TEXT NOT NULL,
        warehouse_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost REAL NOT NULL,
        expiry_date DATETIME,
        received_date DATETIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'synced',
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // POS Sales table
      `CREATE TABLE IF NOT EXISTS pos_sales (
        id TEXT PRIMARY KEY,
        receipt_number TEXT NOT NULL UNIQUE,
        branch_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        amount_received REAL,
        change_amount REAL,
        customer_id TEXT,
        customer_name TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // POS Sale Items table
      `CREATE TABLE IF NOT EXISTS pos_sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        uom TEXT NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        cost_of_goods_sold REAL NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES pos_sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // Stock movements table
      `CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        warehouse_id TEXT NOT NULL,
        movement_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reference_id TEXT,
        reference_type TEXT,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY (batch_id) REFERENCES inventory_batches (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // Sync operations table
      `CREATE TABLE IF NOT EXISTS sync_operations (
        id TEXT PRIMARY KEY,
        operation_type TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation_data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)`,
      `CREATE INDEX IF NOT EXISTS idx_products_status ON products (status)`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches (product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_batches_warehouse ON inventory_batches (warehouse_id)`,
      `CREATE INDEX IF NOT EXISTS idx_inventory_batches_status ON inventory_batches (status)`,
      `CREATE INDEX IF NOT EXISTS idx_pos_sales_user ON pos_sales (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pos_sales_customer ON pos_sales (customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at ON pos_sales (created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements (batch_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations (status)`,
    ];

    for (const query of queries) {
      await this.db.execAsync(query);
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      return await this.db.runAsync(sql, params);
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  }

  async findAll(table: string, whereClause?: string, params: any[] = []): Promise<any[]> {
    let sql = `SELECT * FROM ${table}`;
    if (whereClause) {
      sql += ` ${whereClause}`;
    }
    
    const result = await this.execute(sql, params);
    return result as any[];
  }

  async findById(table: string, id: string): Promise<any | null> {
    const result = await this.findAll(table, 'WHERE id = ?', [id]);
    return result.length > 0 ? result[0] : null;
  }

  async insert(table: string, data: any): Promise<string> {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(',');
    const values = keys.map(key => data[key]);
    
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);
    
    return data.id || result.lastInsertRowId.toString();
  }

  async update(table: string, id: string, data: any): Promise<void> {
    const keys = Object.keys(data).filter(key => key !== 'id');
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = [...keys.map(key => data[key]), id];
    
    const sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.execute(sql, values);
  }

  async delete(table: string, id: string): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    await this.execute(sql, [id]);
  }

  async clearTable(table: string): Promise<void> {
    const sql = `DELETE FROM ${table}`;
    await this.execute(sql);
  }

  async getPendingSyncOperations(): Promise<any[]> {
    return await this.findAll('sync_operations', 'WHERE status = ? ORDER BY created_at ASC', ['pending']);
  }

  async markAsSynced(table: string, id: string): Promise<void> {
    await this.update(table, id, { sync_status: 'synced' });
  }

  async addSyncOperation(operation: {
    operationType: string;
    tableName: string;
    recordId: string;
    operationData: any;
  }): Promise<void> {
    await this.insert('sync_operations', {
      id: `${operation.tableName}-${operation.recordId}-${Date.now()}`,
      operation_type: operation.operationType,
      table_name: operation.tableName,
      record_id: operation.recordId,
      operation_data: JSON.stringify(operation.operationData),
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Product-specific methods
  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.findAll('products', 'WHERE category = ? AND status = ?', [category, 'active']);
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    return await this.findAll(
      'products',
      'WHERE (name LIKE ? OR description LIKE ?) AND status = ?',
      [`%${searchTerm}%`, `%${searchTerm}%`, 'active']
    );
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await this.findAll(
      'products',
      `WHERE status = ? AND id IN (
        SELECT product_id FROM inventory_batches 
        WHERE status = 'active' 
        GROUP BY product_id 
        HAVING SUM(quantity) <= min_stock_level
      )`,
      ['active']
    );
  }

  // Inventory-specific methods
  async getInventoryByProduct(productId: string): Promise<InventoryBatch[]> {
    return await this.findAll(
      'inventory_batches',
      'WHERE product_id = ? AND status = ? ORDER BY expiry_date ASC',
      [productId, 'active']
    );
  }

  async getExpiringInventory(days: number = 30): Promise<InventoryBatch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await this.findAll(
      'inventory_batches',
      'WHERE status = ? AND expiry_date <= ? ORDER BY expiry_date ASC',
      ['active', futureDate.toISOString()]
    );
  }

  // Sales-specific methods
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<POSSale[]> {
    return await this.findAll(
      'pos_sales',
      'WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate.toISOString(), endDate.toISOString()]
    );
  }

  async getSalesByCustomer(customerId: string): Promise<POSSale[]> {
    return await this.findAll(
      'pos_sales',
      'WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
  }

  async getSalesSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as average_transaction_value
      FROM pos_sales 
      WHERE created_at BETWEEN ? AND ? AND status = 'completed'
    `;
    
    const result = await this.execute(sql, [startDate.toISOString(), endDate.toISOString()]);
    const row = (result as any).rows?.[0] || {};
    
    return {
      totalSales: row.total_sales || 0,
      totalTransactions: row.total_transactions || 0,
      averageTransactionValue: row.average_transaction_value || 0,
    };
  }

  // Customer-specific methods
  async getCustomerByCode(customerCode: string): Promise<Customer | null> {
    const result = await this.findAll('customers', 'WHERE customer_code = ?', [customerCode]);
    return result.length > 0 ? result[0] : null;
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    return await this.findAll(
      'customers',
      'WHERE (company_name LIKE ? OR contact_person LIKE ? OR phone LIKE ?) AND status = ?',
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, 'active']
    );
  }

  // Stock movement methods
  async recordStockMovement(movement: {
    batchId: string;
    productId: string;
    warehouseId: string;
    movementType: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    referenceId?: string;
    referenceType?: string;
    notes?: string;
  }): Promise<void> {
    await this.insert('stock_movements', {
      id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      batch_id: movement.batchId,
      product_id: movement.productId,
      warehouse_id: movement.warehouseId,
      movement_type: movement.movementType,
      quantity: movement.quantity,
      reference_id: movement.referenceId,
      reference_type: movement.referenceType,
      notes: movement.notes,
      created_at: new Date().toISOString(),
    });
  }

  // Backup and restore methods
  async exportData(): Promise<string> {
    const tables = ['users', 'products', 'customers', 'inventory_batches', 'pos_sales', 'pos_sale_items'];
    const exportData: any = {};
    
    for (const table of tables) {
      exportData[table] = await this.findAll(table);
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    for (const [table, records] of Object.entries(data)) {
      if (Array.isArray(records)) {
        await this.clearTable(table);
        for (const record of records) {
          await this.insert(table, record);
        }
      }
    }
  }

  async getTodaySales(branchId: string): Promise<POSSale[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.findAll(
      'pos_sales',
      'WHERE branch_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at DESC',
      [branchId, today.toISOString(), tomorrow.toISOString()]
    );
  }

  async getPendingOrders(branchId: string): Promise<POSSale[]> {
    return await this.findAll(
      'pos_sales',
      'WHERE branch_id = ? AND status = ? ORDER BY created_at DESC',
      [branchId, 'pending']
    );
  }
}

export const databaseService = new SQLiteDatabaseService();