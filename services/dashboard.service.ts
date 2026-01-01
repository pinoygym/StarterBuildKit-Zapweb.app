import { prisma } from '@/lib/prisma';
import { 
  DashboardKPIs, 
  TopProduct, 
  WarehouseUtilization,
  BranchComparison,
  DashboardFilters 
} from '@/types/dashboard.types';
import { Decimal } from '@prisma/client/runtime/library';
import { inventoryService } from './inventory.service';

export class DashboardService {
  async getKPIs(filters?: DashboardFilters): Promise<DashboardKPIs> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total active products
    const totalProducts = await prisma.product.count({
      where: { status: 'active' },
    });

    // Total stock units
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        ...(filters?.branchId ? { Warehouse: { branchId: filters.branchId } } : {}),
      },
    });
    const totalStock = batches.reduce((sum, b) => sum + Number(b.quantity), 0);

    // Active sales orders and conversion rate
    const activeSalesOrders = await prisma.salesOrder.count({
      where: {
        status: { in: ['pending', 'draft'] },
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });

    const totalSalesOrders = await prisma.salesOrder.count({
      where: {
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });

    const convertedOrders = await prisma.salesOrder.count({
      where: {
        salesOrderStatus: 'converted',
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });

    const salesOrderConversionRate = totalSalesOrders > 0 
      ? (convertedOrders / totalSalesOrders) * 100 
      : 0;

    // Inventory value (weighted average)
    let inventoryValue = new Decimal(0);
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: {
        InventoryBatch: {
          where: {
            status: 'active',
            ...(filters?.branchId ? { Warehouse: { branchId: filters.branchId } } : {}),
          },
        },
      },
    });

    for (const product of products) {
      for (const batch of product.InventoryBatch) {
        const batchValue = new Decimal(batch.quantity).times(batch.unitCost);
        inventoryValue = inventoryValue.plus(batchValue);
      }
    }

    // Today's POS sales
    const todaySales = await prisma.pOSSale.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });

    const todaySalesCount = todaySales.length;
    const todaySalesRevenue = todaySales.reduce(
      (sum, sale) => sum.plus(sale.totalAmount),
      new Decimal(0)
    );

    // Outstanding AR
    const arRecords = await prisma.accountsReceivable.findMany({
      where: {
        status: { in: ['pending', 'partial'] },
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });
    const outstandingAR = arRecords.reduce(
      (sum, ar) => sum.plus(ar.balance),
      new Decimal(0)
    );

    // Overdue receivables
    const overdueReceivables = await prisma.accountsReceivable.count({
      where: {
        status: 'overdue',
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });

    // Outstanding AP
    const apRecords = await prisma.accountsPayable.findMany({
      where: {
        status: { in: ['pending', 'partial'] },
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });
    const outstandingAP = apRecords.reduce(
      (sum, ap) => sum.plus(ap.balance),
      new Decimal(0)
    );

    // Overdue payables
    const overduePayables = await prisma.accountsPayable.count({
      where: {
        status: 'overdue',
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });

    // Current month expenses
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: firstDayOfMonth },
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
    });
    const currentMonthExpenses = expenses.reduce(
      (sum, exp) => sum.plus(exp.amount),
      new Decimal(0)
    );

    return {
      totalProducts,
      totalStock,
      activeSalesOrders,
      salesOrderConversionRate: Math.round(salesOrderConversionRate * 100) / 100,
      inventoryValue,
      todaySalesCount,
      todaySalesRevenue,
      outstandingAR,
      outstandingAP,
      currentMonthExpenses,
      overdueReceivables,
      overduePayables,
    };
  }

  async getTopSellingProducts(limit: number = 5, branchId?: string): Promise<TopProduct[]> {
    const salesItems = await prisma.pOSSaleItem.findMany({
      where: {
        ...(branchId ? { POSSale: { branchId } } : {}),
      },
      include: {
        Product: true,
      },
    });

    // Group by product
    const productMap = new Map<string, { name: string; quantity: Decimal; revenue: Decimal }>();

    for (const item of salesItems) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantity = existing.quantity.plus(item.quantity);
        existing.revenue = existing.revenue.plus(item.subtotal);
      } else {
        productMap.set(item.productId, {
          name: item.Product.name,
          quantity: new Decimal(item.quantity),
          revenue: new Decimal(item.subtotal),
        });
      }
    }

    // Convert to array and sort by revenue
    const products = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: Number(data.quantity),
        revenue: data.revenue,
      }))
      .sort((a, b) => Number(b.revenue.minus(a.revenue)));

    return products.slice(0, limit);
  }

  async getWarehouseUtilization(branchId?: string): Promise<WarehouseUtilization[]> {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
      },
      include: {
        InventoryBatch: {
          where: { status: 'active' },
        },
      },
    });

    return warehouses.map((warehouse) => {
      const currentStock = warehouse.InventoryBatch.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0
      );

      const utilizationPercentage = warehouse.maxCapacity > 0
        ? (currentStock / warehouse.maxCapacity) * 100
        : 0;

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (utilizationPercentage >= 80) {
        status = 'critical';
      } else if (utilizationPercentage >= 60) {
        status = 'warning';
      }

      return {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        branchId: warehouse.branchId,
        maxCapacity: warehouse.maxCapacity,
        currentStock,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        status,
      };
    });
  }

  async getBranchComparison(): Promise<BranchComparison[]> {
    const branches = await prisma.branch.findMany({
      where: { status: 'active' },
      include: {
        POSSale: {
          include: {
            POSSaleItem: true,
          },
        },
        Expense: true,
      },
    });

    const comparisons: BranchComparison[] = [];

    for (const branch of branches) {
      // Calculate revenue
      const revenue = branch.POSSale.reduce(
        (sum, sale) => sum.plus(sale.totalAmount),
        new Decimal(0)
      );

      // Calculate expenses
      const expenses = branch.Expense.reduce(
        (sum, exp) => sum.plus(exp.amount),
        new Decimal(0)
      );

      // Calculate COGS
      const cogs = branch.POSSale.reduce((sum, sale) => {
        const saleCogs = sale.POSSaleItem.reduce(
          (itemSum, item) => itemSum.plus(item.costOfGoodsSold),
          new Decimal(0)
        );
        return sum.plus(saleCogs);
      }, new Decimal(0));

      // Profit = Revenue - COGS - Expenses
      const profit = revenue.minus(cogs).minus(expenses);

      // Get inventory value for this branch
      const batches = await prisma.inventoryBatch.findMany({
        where: {
          status: 'active',
          Warehouse: { branchId: branch.id },
        },
      });

      const inventoryValue = batches.reduce(
        (sum, batch) => sum.plus(new Decimal(batch.quantity).times(batch.unitCost)),
        new Decimal(0)
      );

      comparisons.push({
        branchId: branch.id,
        branchName: branch.name,
        revenue,
        expenses,
        profit,
        inventoryValue,
      });
    }

    return comparisons.sort((a, b) => Number(b.revenue.minus(a.revenue)));
  }

  async getSalesTrends(days: number = 7, branchId?: string): Promise<{ date: string; sales: number; revenue: number }[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get all sales within the date range
    const sales = await prisma.pOSSale.findMany({
      where: {
        createdAt: { gte: startDate, lte: today },
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trendsMap = new Map<string, { count: number; revenue: Decimal }>();

    // Initialize all dates with zero
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      trendsMap.set(dateStr, { count: 0, revenue: new Decimal(0) });
    }

    // Fill in actual data
    for (const sale of sales) {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      const existing = trendsMap.get(dateStr);
      if (existing) {
        existing.count += 1;
        existing.revenue = existing.revenue.plus(sale.totalAmount);
      }
    }

    // Convert to array
    return Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: data.count,
        revenue: Number(data.revenue),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getLowStockProducts(limit: number = 10, branchId?: string): Promise<{
    productId: string;
    productName: string;
    currentStock: number;
    minStockLevel: number;
    status: 'low' | 'critical';
  }[]> {
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
      },
      include: {
        InventoryBatch: {
          where: {
            status: 'active',
            ...(branchId ? { Warehouse: { branchId } } : {}),
          },
        },
      },
    });

    const lowStockProducts = products
      .map((product) => {
        const currentStock = product.InventoryBatch.reduce(
          (sum, batch) => sum + Number(batch.quantity),
          0
        );

        let status: 'low' | 'critical' = 'low';
        if (currentStock === 0 || currentStock < product.minStockLevel * 0.5) {
          status = 'critical';
        }

        return {
          productId: product.id,
          productName: product.name,
          currentStock,
          minStockLevel: product.minStockLevel,
          status,
        };
      })
      .filter((p) => p.currentStock <= p.minStockLevel)
      .sort((a, b) => {
        // Critical first, then by percentage below minimum
        if (a.status === 'critical' && b.status !== 'critical') return -1;
        if (a.status !== 'critical' && b.status === 'critical') return 1;
        const aPercentage = a.currentStock / a.minStockLevel;
        const bPercentage = b.currentStock / b.minStockLevel;
        return aPercentage - bPercentage;
      });

    return lowStockProducts.slice(0, limit);
  }
}

export const dashboardService = new DashboardService();
