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
      const posSaleItems = await tx.pOSSaleItem.deleteMany({});
      totalDeleted += posSaleItems.count;
      if (posSaleItems.count > 0) clearedTables.push('POSSaleItem');

      const purchaseOrderItems = await tx.purchaseOrderItem.deleteMany({});
      totalDeleted += purchaseOrderItems.count;
      if (purchaseOrderItems.count > 0) clearedTables.push('PurchaseOrderItem');

      const salesOrderItems = await tx.salesOrderItem.deleteMany({});
      totalDeleted += salesOrderItems.count;
      if (salesOrderItems.count > 0) clearedTables.push('SalesOrderItem');

      const receivingVoucherItems = await tx.receivingVoucherItem.deleteMany({});
      totalDeleted += receivingVoucherItems.count;
      if (receivingVoucherItems.count > 0) clearedTables.push('ReceivingVoucherItem');

      const apPayments = await tx.aPPayment.deleteMany({});
      totalDeleted += apPayments.count;
      if (apPayments.count > 0) clearedTables.push('APPayment');

      const arPayments = await tx.aRPayment.deleteMany({});
      totalDeleted += arPayments.count;
      if (arPayments.count > 0) clearedTables.push('ARPayment');

      // Level 4: Transactional Records
      const posReceipts = await tx.pOSReceipt.deleteMany({});
      totalDeleted += posReceipts.count;
      if (posReceipts.count > 0) clearedTables.push('POSReceipt');

      const promotionUsage = await tx.promotionUsage.deleteMany({});
      totalDeleted += promotionUsage.count;
      if (promotionUsage.count > 0) clearedTables.push('PromotionUsage');

      const customerPurchaseHistory = await tx.customerPurchaseHistory.deleteMany({});
      totalDeleted += customerPurchaseHistory.count;
      if (customerPurchaseHistory.count > 0) clearedTables.push('CustomerPurchaseHistory');

      const stockMovements = await tx.stockMovement.deleteMany({});
      totalDeleted += stockMovements.count;
      if (stockMovements.count > 0) clearedTables.push('StockMovement');

      const expenses = await tx.expense.deleteMany({});
      totalDeleted += expenses.count;
      if (expenses.count > 0) clearedTables.push('Expense');

      const dailySalesSummary = await tx.dailySalesSummary.deleteMany({});
      totalDeleted += dailySalesSummary.count;
      if (dailySalesSummary.count > 0) clearedTables.push('DailySalesSummary');

      const employeePerformance = await tx.employeePerformance.deleteMany({});
      totalDeleted += employeePerformance.count;
      if (employeePerformance.count > 0) clearedTables.push('EmployeePerformance');

      const inventory = await tx.inventory.deleteMany({});
      totalDeleted += inventory.count;
      if (inventory.count > 0) clearedTables.push('Inventory');

      // Level 3: Transaction Headers
      const posSales = await tx.pOSSale.deleteMany({});
      totalDeleted += posSales.count;
      if (posSales.count > 0) clearedTables.push('POSSale');

      const receivingVouchers = await tx.receivingVoucher.deleteMany({});
      totalDeleted += receivingVouchers.count;
      if (receivingVouchers.count > 0) clearedTables.push('ReceivingVoucher');

      const purchaseOrders = await tx.purchaseOrder.deleteMany({});
      totalDeleted += purchaseOrders.count;
      if (purchaseOrders.count > 0) clearedTables.push('PurchaseOrder');

      const salesOrders = await tx.salesOrder.deleteMany({});
      totalDeleted += salesOrders.count;
      if (salesOrders.count > 0) clearedTables.push('SalesOrder');

      const accountsPayable = await tx.accountsPayable.deleteMany({});
      totalDeleted += accountsPayable.count;
      if (accountsPayable.count > 0) clearedTables.push('AccountsPayable');

      const accountsReceivable = await tx.accountsReceivable.deleteMany({});
      totalDeleted += accountsReceivable.count;
      if (accountsReceivable.count > 0) clearedTables.push('AccountsReceivable');

      // Level 2.5: User-Branch Access
      const uba = await tx.userBranchAccess.deleteMany({});
      totalDeleted += uba.count;
      if (uba.count > 0) clearedTables.push('UserBranchAccess');

      // Level 2: Master Data Entities
      const warehouses = await tx.warehouse.deleteMany({});
      totalDeleted += warehouses.count;
      if (warehouses.count > 0) clearedTables.push('Warehouse');

      const customers = await tx.customer.deleteMany({});
      totalDeleted += customers.count;
      if (customers.count > 0) clearedTables.push('Customer');

      const suppliers = await tx.supplier.deleteMany({});
      totalDeleted += suppliers.count;
      if (suppliers.count > 0) clearedTables.push('Supplier');

      const salesAgents = await tx.salesAgent.deleteMany({});
      totalDeleted += salesAgents.count;
      if (salesAgents.count > 0) clearedTables.push('SalesAgent');

      const productUOMs = await tx.productUOM.deleteMany({});
      totalDeleted += productUOMs.count;
      if (productUOMs.count > 0) clearedTables.push('ProductUOM');

      const products = await tx.product.deleteMany({});
      totalDeleted += products.count;
      if (products.count > 0) clearedTables.push('Product');

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
      // Delete from all tables in order using type-safe Prisma methods
      try {
        const stockMovements = await tx.stockMovement.deleteMany({});
        totalDeleted += stockMovements.count;
        if (stockMovements.count > 0) clearedTables.push('StockMovement');

        const inventory = await tx.inventory.deleteMany({});
        totalDeleted += inventory.count;
        if (inventory.count > 0) clearedTables.push('Inventory');

        const posSaleItems = await tx.pOSSaleItem.deleteMany({});
        totalDeleted += posSaleItems.count;
        if (posSaleItems.count > 0) clearedTables.push('POSSaleItem');

        const posReceipts = await tx.pOSReceipt.deleteMany({});
        totalDeleted += posReceipts.count;
        if (posReceipts.count > 0) clearedTables.push('POSReceipt');

        const posSales = await tx.pOSSale.deleteMany({});
        totalDeleted += posSales.count;
        if (posSales.count > 0) clearedTables.push('POSSale');

        const salesOrderItems = await tx.salesOrderItem.deleteMany({});
        totalDeleted += salesOrderItems.count;
        if (salesOrderItems.count > 0) clearedTables.push('SalesOrderItem');

        const salesOrders = await tx.salesOrder.deleteMany({});
        totalDeleted += salesOrders.count;
        if (salesOrders.count > 0) clearedTables.push('SalesOrder');

        const receivingVoucherItems = await tx.receivingVoucherItem.deleteMany({});
        totalDeleted += receivingVoucherItems.count;
        if (receivingVoucherItems.count > 0) clearedTables.push('ReceivingVoucherItem');

        const receivingVouchers = await tx.receivingVoucher.deleteMany({});
        totalDeleted += receivingVouchers.count;
        if (receivingVouchers.count > 0) clearedTables.push('ReceivingVoucher');

        const purchaseOrderItems = await tx.purchaseOrderItem.deleteMany({});
        totalDeleted += purchaseOrderItems.count;
        if (purchaseOrderItems.count > 0) clearedTables.push('PurchaseOrderItem');

        const purchaseOrders = await tx.purchaseOrder.deleteMany({});
        totalDeleted += purchaseOrders.count;
        if (purchaseOrders.count > 0) clearedTables.push('PurchaseOrder');

        const arPayments = await tx.aRPayment.deleteMany({});
        totalDeleted += arPayments.count;
        if (arPayments.count > 0) clearedTables.push('ARPayment');

        const accountsReceivable = await tx.accountsReceivable.deleteMany({});
        totalDeleted += accountsReceivable.count;
        if (accountsReceivable.count > 0) clearedTables.push('AccountsReceivable');

        const apPayments = await tx.aPPayment.deleteMany({});
        totalDeleted += apPayments.count;
        if (apPayments.count > 0) clearedTables.push('APPayment');

        const accountsPayable = await tx.accountsPayable.deleteMany({});
        totalDeleted += accountsPayable.count;
        if (accountsPayable.count > 0) clearedTables.push('AccountsPayable');

        const expenses = await tx.expense.deleteMany({});
        totalDeleted += expenses.count;
        if (expenses.count > 0) clearedTables.push('Expense');

        const customerPurchaseHistory = await tx.customerPurchaseHistory.deleteMany({});
        totalDeleted += customerPurchaseHistory.count;
        if (customerPurchaseHistory.count > 0) clearedTables.push('CustomerPurchaseHistory');

        const dailySalesSummary = await tx.dailySalesSummary.deleteMany({});
        totalDeleted += dailySalesSummary.count;
        if (dailySalesSummary.count > 0) clearedTables.push('DailySalesSummary');

        const employeePerformance = await tx.employeePerformance.deleteMany({});
        totalDeleted += employeePerformance.count;
        if (employeePerformance.count > 0) clearedTables.push('EmployeePerformance');

        const promotionUsage = await tx.promotionUsage.deleteMany({});
        totalDeleted += promotionUsage.count;
        if (promotionUsage.count > 0) clearedTables.push('PromotionUsage');

        const auditLogs = await tx.auditLog.deleteMany({});
        totalDeleted += auditLogs.count;
        if (auditLogs.count > 0) clearedTables.push('AuditLog');
      } catch (error: any) {
        console.error('Error clearing transactions:', error.message);
        throw error;
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

    // Use Prisma's type-safe count methods instead of raw queries
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.rolePermission.count(),
      prisma.branch.count(),
      prisma.warehouse.count(),
      prisma.product.count(),
      prisma.productUOM.count(),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.purchaseOrder.count(),
      prisma.purchaseOrderItem.count(),
      prisma.receivingVoucher.count(),
      prisma.receivingVoucherItem.count(),
      prisma.salesOrder.count(),
      prisma.salesOrderItem.count(),
      prisma.pOSSale.count(),
      prisma.pOSSaleItem.count(),
      prisma.stockMovement.count(),
      prisma.accountsReceivable.count(),
      prisma.aRPayment.count(),
      prisma.accountsPayable.count(),
      prisma.aPPayment.count(),
      prisma.expense.count(),
      prisma.session.count(),
    ]);

    tables.forEach((table, index) => {
      const recordCount = counts[index];
      tableStats.push({
        tableName: table,
        recordCount,
      });
      totalRecords += recordCount;
    });

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
