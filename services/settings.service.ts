import { prisma } from '@/lib/prisma';
import { DatabaseClearResult, DatabaseStats, TableStat } from '@/types/settings.types';

export class SettingsService {
  /**
   * Clear all data from the database (except users and roles for security)
   */
  async clearDatabase(): Promise<DatabaseClearResult> {
    const tables = [
      // Transaction tables (clear first due to dependencies)
      'StockMovement',
      'POSSaleItem',
      'POSSale',
      'SalesOrderItem',
      'SalesOrder',
      'ReceivingVoucherItem',
      'ReceivingVoucher',
      'PurchaseOrderItem',
      'PurchaseOrder',
      'ARPayment',
      'AccountsReceivable',
      'APPayment',
      'AccountsPayable',
      'Expense',
      'InventoryBatch',

      // Master data tables
      'ProductUOM',
      'Product',
      'Customer',
      'Supplier',
      'Warehouse',

      // Session table (optional - for clean session state)
      'Session',
    ];

    let totalDeleted = 0;
    const clearedTables: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Delete from all tables in order
      for (const table of tables) {
        try {
          // Use raw query for dynamic table names
          const result = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
          totalDeleted += result;
          clearedTables.push(table);
          console.log(`Cleared ${result} records from ${table}`);
        } catch (error: any) {
          console.error(`Error clearing ${table}:`, error.message);
          // Continue with other tables even if one fails
        }
      }
    });

    return {
      success: true,
      message: `Successfully cleared ${totalDeleted} records from ${clearedTables.length} tables`,
      tablesCleared: clearedTables,
      recordsDeleted: totalDeleted,
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const tables = [
      'User',
      'Role',
      'Permission',
      'RolePermission',
      'Branch',
      'Warehouse',
      'Product',
      'ProductUOM',
      'Customer',
      'Supplier',
      'PurchaseOrder',
      'PurchaseOrderItem',
      'ReceivingVoucher',
      'ReceivingVoucherItem',
      'SalesOrder',
      'SalesOrderItem',
      'POSSale',
      'POSSaleItem',
      'InventoryBatch',
      'StockMovement',
      'AccountsReceivable',
      'ARPayment',
      'AccountsPayable',
      'APPayment',
      'Expense',
      'Session',
    ];

    const tableStats: TableStat[] = [];
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        const recordCount = Number(count[0].count);
        tableStats.push({
          tableName: table,
          recordCount,
        });
        totalRecords += recordCount;
      } catch (error: any) {
        console.error(`Error counting ${table}:`, error.message);
        tableStats.push({
          tableName: table,
          recordCount: 0,
        });
      }
    }

    return {
      totalTables: tables.length,
      totalRecords,
      tableStats: tableStats.sort((a, b) => b.recordCount - a.recordCount),
    };
  }
}

export const settingsService = new SettingsService();
