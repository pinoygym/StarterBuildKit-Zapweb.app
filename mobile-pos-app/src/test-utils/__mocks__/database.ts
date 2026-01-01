import { jest } from '@jest/globals';

// Mock SQLite database for testing
export class MockSQLiteDatabase {
  private data: Map<string, any[]> = new Map();
  private execCalls: Array<{ sql: string; params?: any[] }> = [];
  private runCalls: Array<{ sql: string; params?: any[]; result?: any }> = [];
  private getAllCalls: Array<{ sql: string; params?: any[]; result?: any }> = [];
  private getFirstCalls: Array<{ sql: string; params?: any[]; result?: any }> = [];

  constructor() {
    this.setupTableDefaults();
  }

  private setupTableDefaults() {
    // Initialize default tables
    const tables = [
      'users', 'branches', 'products', 'product_uoms', 'customers',
      'inventory_batches', 'pos_sales', 'pos_sale_items', 'sync_log', 
      'settings', 'sync_operations', 'stock_movements'
    ];
    
    tables.forEach(table => {
      this.data.set(table, []);
    });
  }

  async execAsync(sql: string, params: any[] = []): Promise<void> {
    this.execCalls.push({ sql, params });
    
    // Handle CREATE TABLE statements
    if (sql.includes('CREATE TABLE')) {
      const tableMatch = sql.match(/CREATE TABLE.*?(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        if (!this.data.has(tableName)) {
          this.data.set(tableName, []);
        }
      }
    }
    
    // Handle CREATE INDEX statements
    if (sql.includes('CREATE INDEX')) {
      // Just record the call, don't need to store indexes
    }
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    this.runCalls.push({ sql, params });
    
    // Parse INSERT statements
    if (sql.toLowerCase().includes('insert into')) {
      const tableMatch = sql.match(/INSERT INTO (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const table = this.data.get(tableName) || [];
        
        // Create record object from params
        const columnsMatch = sql.match(/\(([^)]+)\)/);
        if (columnsMatch && params.length > 0) {
          const columns = columnsMatch[1].split(',').map(col => col.trim());
          const record: any = {};
          
          columns.forEach((column, index) => {
            record[column] = params[index];
          });
          
          table.push(record);
          this.data.set(tableName, table);
          
          return {
            lastInsertRowId: table.length,
            changes: 1
          };
        }
      }
    }
    
    // Parse UPDATE statements
    if (sql.toLowerCase().includes('update')) {
      const tableMatch = sql.match(/UPDATE (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const table = this.data.get(tableName) || [];
        const id = params[params.length - 1];
        
        // Find and update record
        const recordIndex = table.findIndex(record => record.id === id || record.ID === id);
        if (recordIndex !== -1) {
          // Parse SET clause
          const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
          if (setMatch) {
            const setClause = setMatch[1];
            const assignments = setClause.split(',').map(assign => assign.trim().split(' = ')[0].trim());
            assignments.forEach((key, idx) => {
              table[recordIndex][key] = params[idx];
            });
          }
          
          return {
            lastInsertRowId: 0,
            changes: 1
          };
        }
      }
    }
    
    // Parse DELETE statements
    if (sql.toLowerCase().includes('delete from')) {
      const tableMatch = sql.match(/DELETE FROM (\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const table = this.data.get(tableName) || [];
        const id = params[0];
        
        const originalLength = table.length;
        const filteredTable = table.filter(record => record.id !== id && record.ID !== id);
        this.data.set(tableName, filteredTable);
        
        return {
          lastInsertRowId: 0,
          changes: originalLength - filteredTable.length
        };
      }
    }
    
    return {
      lastInsertRowId: 0,
      changes: 0
    };
  }

  async getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
    this.getAllCalls.push({ sql, params });
    
    // Parse SELECT statements
    const tableMatch = sql.match(/FROM (\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      let table = this.data.get(tableName) || [];
      
      // Handle WHERE clauses (basic support)
      if (sql.includes('WHERE')) {
        if (sql.includes('id = ?') && params.length > 0) {
          table = table.filter(record => record.id === params[0] || record.ID === params[0]);
        } else if (sql.includes('category = ?') && params.length > 0) {
          table = table.filter(record => record.category === params[0]);
        } else if (sql.includes('status = ?') && params.length > 0) {
          table = table.filter(record => record.status === params[0]);
        } else if ((sql.includes('name LIKE ?') || sql.includes('description LIKE ?')) && params.length >= 2) {
          const likeVal = String(params[0]).replace(/%/g, '');
          table = table.filter(record =>
            (record.name && String(record.name).includes(likeVal)) ||
            (record.description && String(record.description).includes(likeVal))
          );
          if (sql.includes('status != ?') && params.length >= 3) {
            const notStatus = params[2];
            table = table.filter(record => record.status !== notStatus);
          }
        } else if (sql.includes('customer_code = ?') && params.length > 0) {
          table = table.filter(record => record.customerCode === params[0] || record.customer_code === params[0]);
        }
      }
      
      // Handle ORDER BY
      if (sql.includes('ORDER BY created_at DESC')) {
        table = [...table].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
          const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
          return dateB - dateA;
        });
      } else if (sql.includes('ORDER BY name')) {
        table = [...table].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      }
      
      return [...table]; // Return a copy
    }
    
    return [];
  }

  async getFirstAsync(sql: string, params: any[] = []): Promise<any | null> {
    this.getFirstCalls.push({ sql, params });
    
    const results = await this.getAllAsync(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async closeAsync(): Promise<void> {
    this.data.clear();
    this.execCalls = [];
    this.runCalls = [];
    this.getAllCalls = [];
    this.getFirstCalls = [];
  }

  async transaction(callback: () => Promise<void>): Promise<void> {
    await callback();
  }

  // Test utility methods
  getTableData(tableName: string): any[] {
    return this.data.get(tableName) || [];
  }

  getExecCalls(): Array<{ sql: string; params?: any[] }> {
    return [...this.execCalls];
  }

  getRunCalls(): Array<{ sql: string; params?: any[] }> {
    return [...this.runCalls];
  }

  getGetAllCalls(): Array<{ sql: string; params?: any[] }> {
    return [...this.getAllCalls];
  }

  getGetFirstCalls(): Array<{ sql: string; params?: any[] }> {
    return [...this.getFirstCalls];
  }

  clearAllData(): void {
    this.data.forEach((_, tableName) => {
      this.data.set(tableName, []);
    });
  }

  addRecord(tableName: string, record: any): void {
    const table = this.data.get(tableName) || [];
    table.push(record);
    this.data.set(tableName, table);
  }
}

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  SQLiteDatabase: jest.fn().mockImplementation(() => new MockSQLiteDatabase()),
  openDatabaseAsync: jest.fn().mockImplementation(() => Promise.resolve(new MockSQLiteDatabase())),
}));

// Mock the database service
const mockJest = jest as any;
export const mockDatabaseService = {
  initialize: mockJest.fn().mockResolvedValue(undefined),
  execute: mockJest.fn().mockResolvedValue(undefined),
  findAll: mockJest.fn().mockResolvedValue([]),
  findById: mockJest.fn().mockResolvedValue(null),
  insert: mockJest.fn().mockResolvedValue('mock-id'),
  update: mockJest.fn().mockResolvedValue(undefined),
  delete: mockJest.fn().mockResolvedValue(undefined),
  clearTable: mockJest.fn().mockResolvedValue(undefined),
  getPendingSyncOperations: mockJest.fn().mockResolvedValue([]),
  markAsSynced: mockJest.fn().mockResolvedValue(undefined),
  close: mockJest.fn().mockResolvedValue(undefined),
  transaction: mockJest.fn().mockImplementation(async (callback: any) => {
    await callback();
  }),
};