import { prisma } from '@/lib/prisma';
import { DatabaseClearResult, DatabaseStats, TableStat } from '@/types/settings.types';

export class SettingsService {
  /**
   * Clear all data from the database (except users and roles for security)
   */
  /**
   * Clear all data from the database (except users and roles for security, and products are preserved as per request)
   */
  async clearDatabase(): Promise<DatabaseClearResult> {
    let totalDeleted = 0;
    const clearedTables: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Level 5: Transaction Details / Items
      const detailsTables = [
        'POSSaleItem', 'PurchaseOrderItem', 'SalesOrderItem', 'ReceivingVoucherItem',
        'APPayment', 'ARPayment'
      ];
      for (const table of detailsTables) {
        const result = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
        totalDeleted += result;
        if (result > 0) clearedTables.push(table);
      }

      // Level 4: Transactional Records
      const recordsTables = [
        'POSReceipt', 'PromotionUsage', 'CustomerPurchaseHistory', 'StockMovement',
        'Expense', 'DailySalesSummary', 'EmployeePerformance', 'Inventory' // Strictly delete inventory
      ];
      for (const table of recordsTables) {
        const result = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
        totalDeleted += result;
        if (result > 0) clearedTables.push(table);
      }

      // Level 3: Transaction Headers
      const headersTables = [
        'POSSale', 'ReceivingVoucher', 'PurchaseOrder', 'SalesOrder',
        'AccountsPayable', 'AccountsReceivable'
      ];
      for (const table of headersTables) {
        const result = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
        totalDeleted += result;
        if (result > 0) clearedTables.push(table);
      }

      // Level 2.5: User-Branch Access
      const uba = await tx.userBranchAccess.deleteMany({});
      totalDeleted += uba.count;
      if (uba.count > 0) clearedTables.push('UserBranchAccess');

      // Level 2: Master Data Entities
      const masterTables = [
        'Warehouse', 'Customer', 'Supplier', 'SalesAgent',
        'ProductUOM', 'Product'
      ];
      for (const table of masterTables) {
        const result = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
        totalDeleted += result;
        if (result > 0) clearedTables.push(table);
      }

      // Level 1: Core Units (Branch)
      // Disconnect users from branches first
      await tx.user.updateMany({
        data: { branchId: null },
      });

      const branches = await tx.branch.deleteMany({});
      totalDeleted += branches.count;
      if (branches.count > 0) clearedTables.push('Branch');

    }, {
      maxWait: 10000,
      timeout: 60000,
    });

    return {
      success: true,
      message: `Successfully cleared ${totalDeleted} records from ${clearedTables.length} tables`,
      tablesCleared: clearedTables,
      recordsDeleted: totalDeleted,
    };
  }

  /**
   * Delete all transactions but keep master data
   */
  async deleteTransactions(): Promise<DatabaseClearResult> {
    const tables = [
      // Inventory & Stock
      'StockMovement',
      'Inventory',

      // Sales
      'POSSaleItem',
      'POSReceipt',
      'POSSale',
      'SalesOrderItem',
      'SalesOrder',

      // Purchasing
      'ReceivingVoucherItem',
      'ReceivingVoucher',
      'PurchaseOrderItem',
      'PurchaseOrder',

      // Financials
      'ARPayment',
      'AccountsReceivable',
      'APPayment',
      'AccountsPayable',
      'Expense',

      // Analytics & History
      'CustomerPurchaseHistory',
      'DailySalesSummary',
      'EmployeePerformance',
      'PromotionUsage',
      'AuditLog',
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
    }, {
      maxWait: 10000,
      timeout: 60000,
    });

    return {
      success: true,
      message: `Successfully deleted transactions. ${totalDeleted} records removed from ${clearedTables.length} tables.`,
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
  /**
   * Clean up test customers (name = "Test Customer") and their related data
   */
  async cleanupTestCustomers(): Promise<DatabaseClearResult> {
    const targetName = 'Test Customer';
    let totalDeleted = 0;
    const clearedTables: string[] = [];

    // Find customers to delete
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { companyName: targetName },
          { contactPerson: targetName }
        ]
      },
      select: { id: true }
    });

    if (customers.length === 0) {
      return {
        success: true,
        message: 'No test customers found.',
        tablesCleared: [],
        recordsDeleted: 0,
      };
    }

    const customerIds = customers.map(c => c.id);
    console.log(`Found ${customerIds.length} test customers to delete.`);

    await prisma.$transaction(async (tx) => {
      // 1. Delete related Sales Orders
      const deletedSOs = await tx.salesOrder.deleteMany({
        where: { customerId: { in: customerIds } }
      });
      if (deletedSOs.count > 0) {
        clearedTables.push('SalesOrder');
        totalDeleted += deletedSOs.count;
      }

      // 2. Delete related Accounts Receivable
      const deletedARs = await tx.accountsReceivable.deleteMany({
        where: { customerId: { in: customerIds } }
      });
      if (deletedARs.count > 0) {
        clearedTables.push('AccountsReceivable');
        totalDeleted += deletedARs.count;
      }

      // 3. Update POS Receipts (set customerId to null)
      await tx.pOSReceipt.updateMany({
        where: { customerId: { in: customerIds } },
        data: { customerId: null }
      });

      // 4. Update PromotionUsage
      await tx.promotionUsage.updateMany({
        where: { customerId: { in: customerIds } },
        data: { customerId: null }
      });

      // 5. Finally delete the customers
      // CustomerPurchaseHistory will be deleted automatically (Cascade)
      const deletedCustomers = await tx.customer.deleteMany({
        where: { id: { in: customerIds } }
      });

      clearedTables.push('Customer');
      totalDeleted += deletedCustomers.count;

    }, {
      maxWait: 10000,
      timeout: 60000,
    });

    return {
      success: true,
      message: `Successfully cleaned up ${customerIds.length} test customers and related data.`,
      tablesCleared: clearedTables,
      recordsDeleted: totalDeleted,
    };
  }
}

export const settingsService = new SettingsService();
