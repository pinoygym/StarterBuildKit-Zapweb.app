import { prisma, Prisma } from '@/lib/prisma';
import {
  DashboardKPIs,
  TopProduct,
  WarehouseUtilization,
  BranchComparison,
  DashboardFilters,
  ARAPAging,
  AgingBucket,
  SalesOrderSummary,
  DashboardActivity
} from '@/types/dashboard.types';

import { inventoryService } from './inventory.service';

export class DashboardService {
  async getKPIs(filters?: DashboardFilters): Promise<DashboardKPIs> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Execute all independent queries in parallel
    const [
      totalProducts,
      inventoryItems,
      activeSalesOrders,
      totalSalesOrders,
      convertedOrders,
      products,
      todaySales,
      arRecords,
      overdueReceivables,
      apRecords,
      overduePayables,
      expenses,
    ] = await Promise.all([
      // Total active products
      prisma.product.count({
        where: { status: 'active' },
      }),

      // Total stock units
      prisma.inventory.findMany({
        where: {
          ...(filters?.branchId ? { Warehouse: { branchId: filters.branchId } } : {}),
        },
      }),

      // Active sales orders
      prisma.salesOrder.count({
        where: {
          status: { in: ['pending', 'draft'] },
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Total sales orders
      prisma.salesOrder.count({
        where: {
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Converted orders
      prisma.salesOrder.count({
        where: {
          salesOrderStatus: 'converted',
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Products with inventory for value calculation
      prisma.product.findMany({
        where: { status: 'active' },
        include: {
          Inventory: {
            where: {
              ...(filters?.branchId ? { Warehouse: { branchId: filters.branchId } } : {}),
            },
          },
        },
      }),

      // Today's POS sales
      prisma.pOSSale.findMany({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Outstanding AR
      prisma.accountsReceivable.findMany({
        where: {
          status: { in: ['pending', 'partial'] },
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Overdue receivables
      prisma.accountsReceivable.count({
        where: {
          status: 'overdue',
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Outstanding AP
      prisma.accountsPayable.findMany({
        where: {
          status: { in: ['pending', 'partial'] },
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Overdue payables
      prisma.accountsPayable.count({
        where: {
          status: 'overdue',
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),

      // Current month expenses
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: firstDayOfMonth },
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
        },
      }),
    ]);

    // Calculate derived values
    const totalStock = inventoryItems.reduce((sum, item) => sum + Number(item.quantity), 0);

    const salesOrderConversionRate = totalSalesOrders > 0
      ? (convertedOrders / totalSalesOrders) * 100
      : 0;

    // Inventory value (weighted average)
    let inventoryValue = new Prisma.Decimal(0);
    for (const product of products) {
      const productTotalStock = product.Inventory.reduce((sum, item) => sum + Number(item.quantity), 0);
      const productValue = new Prisma.Decimal(productTotalStock).times(product.averageCostPrice || 0);
      inventoryValue = inventoryValue.plus(productValue);
    }

    const todaySalesCount = todaySales.length;
    const todaySalesRevenue = todaySales.reduce(
      (sum, sale) => sum.plus(sale.totalAmount),
      new Prisma.Decimal(0)
    );

    const outstandingAR = arRecords.reduce(
      (sum, ar) => sum.plus(ar.balance),
      new Prisma.Decimal(0)
    );

    const outstandingAP = apRecords.reduce(
      (sum, ap) => sum.plus(ap.balance),
      new Prisma.Decimal(0)
    );

    const currentMonthExpenses = expenses.reduce(
      (sum, exp) => sum.plus(exp.amount),
      new Prisma.Decimal(0)
    );

    // Calculate profit
    // Gross Profit = Today's Sales Revenue - Cost of Goods Sold for those sales
    const todayCogs = todaySales.reduce((sum, sale) => {
      // Note: This assumes POSSale has calculated COGS or we need to sum items
      // For simplicity, we'll try to find associated items if COGS isn't direct
      return sum.plus(new Prisma.Decimal(0)); // Placeholder if COGS is complex
    }, new Prisma.Decimal(0));

    // A better approach for the dashboard KPIs:
    // Profit for the current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await prisma.pOSSale.findMany({
      where: {
        createdAt: { gte: firstDay },
        ...(filters?.branchId ? { branchId: filters.branchId } : {}),
      },
      include: {
        POSSaleItem: true,
      }
    });

    const monthRevenue = monthSales.reduce((sum, s) => sum.plus(s.totalAmount), new Prisma.Decimal(0));
    const monthCogs = monthSales.reduce((sum, s) => {
      const saleCogs = s.POSSaleItem.reduce((iSum, i) => iSum.plus(i.costOfGoodsSold), new Prisma.Decimal(0));
      return sum.plus(saleCogs);
    }, new Prisma.Decimal(0));

    const grossProfit = monthRevenue.minus(monthCogs);
    const netProfit = grossProfit.minus(currentMonthExpenses);

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
      grossProfit,
      netProfit,
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
    const productMap = new Map<string, { name: string; quantity: Prisma.Decimal; revenue: Prisma.Decimal }>();

    for (const item of salesItems) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantity = existing.quantity.plus(item.quantity);
        existing.revenue = existing.revenue.plus(item.subtotal);
      } else {
        productMap.set(item.productId, {
          name: item.Product.name,
          quantity: new Prisma.Decimal(item.quantity),
          revenue: new Prisma.Decimal(item.subtotal),
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
        Inventory: true,
      },
    });

    return warehouses.map((warehouse) => {
      const currentStock = warehouse.Inventory.reduce(
        (sum, item) => sum + Number(item.quantity),
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
        Warehouse: {
          include: {
            Inventory: {
              include: {
                Product: true
              }
            }
          }
        }
      },
    });

    const comparisons: BranchComparison[] = [];

    for (const branch of branches) {
      // Calculate revenue
      const revenue = branch.POSSale.reduce(
        (sum, sale) => sum.plus(sale.totalAmount),
        new Prisma.Decimal(0)
      );

      // Calculate expenses
      const expenses = branch.Expense.reduce(
        (sum, exp) => sum.plus(exp.amount),
        new Prisma.Decimal(0)
      );

      // Calculate COGS
      const cogs = branch.POSSale.reduce((sum, sale) => {
        const saleCogs = sale.POSSaleItem.reduce(
          (itemSum, item) => itemSum.plus(item.costOfGoodsSold),
          new Prisma.Decimal(0)
        );
        return sum.plus(saleCogs);
      }, new Prisma.Decimal(0));

      // Profit = Revenue - COGS - Expenses
      const profit = revenue.minus(cogs).minus(expenses);

      // Get inventory value for this branch
      let inventoryValue = new Prisma.Decimal(0);
      for (const warehouse of branch.Warehouse) {
        for (const item of warehouse.Inventory) {
          const itemValue = new Prisma.Decimal(item.quantity).times(item.Product.averageCostPrice || 0);
          inventoryValue = inventoryValue.plus(itemValue);
        }
      }

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
    const trendsMap = new Map<string, { count: number; revenue: Prisma.Decimal }>();

    // Initialize all dates with zero
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      trendsMap.set(dateStr, { count: 0, revenue: new Prisma.Decimal(0) });
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
        Inventory: {
          where: {
            ...(branchId ? { Warehouse: { branchId } } : {}),
          },
        },
      },
    });

    const lowStockProducts = products
      .map((product) => {
        const currentStock = product.Inventory.reduce(
          (sum, item) => sum + Number(item.quantity),
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

  async getEntityCounts(branchId?: string): Promise<Record<string, number>> {
    const [
      products,
      warehouses,
      branches,
      customers,
      suppliers,
      purchaseOrders,
      receivingVouchers,
      salesOrders,
      users,
      roles
    ] = await Promise.all([
      prisma.product.count({ where: { status: 'active' } }),
      prisma.warehouse.count({
        where: {
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.branch.count({ where: { status: 'active' } }),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.supplier.count({ where: { status: 'active' } }),
      prisma.purchaseOrder.count({
        where: {
          status: { not: 'cancelled' },
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.receivingVoucher.count({
        where: {
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.salesOrder.count({
        where: {
          status: { not: 'cancelled' },
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.role.count(),
    ]);

    return {
      products,
      warehouses,
      branches,
      customers,
      suppliers,
      purchaseOrders,
      receivingVouchers,
      salesOrders,
      users,
      roles,
    };
  }

  async getARPayableAging(branchId?: string): Promise<ARAPAging> {
    const today = new Date();

    // helper to get buckets
    const calculateBuckets = (items: any[]): AgingBucket[] => {
      const buckets: Record<string, { amount: Prisma.Decimal; count: number }> = {
        '0-30': { amount: new Prisma.Decimal(0), count: 0 },
        '31-60': { amount: new Prisma.Decimal(0), count: 0 },
        '61-90': { amount: new Prisma.Decimal(0), count: 0 },
        '90+': { amount: new Prisma.Decimal(0), count: 0 },
      };

      items.forEach(item => {
        const dueDate = new Date(item.dueDate);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 30) {
          buckets['0-30'].amount = buckets['0-30'].amount.plus(item.balance);
          buckets['0-30'].count++;
        } else if (diffDays <= 60) {
          buckets['31-60'].amount = buckets['31-60'].amount.plus(item.balance);
          buckets['31-60'].count++;
        } else if (diffDays <= 90) {
          buckets['61-90'].amount = buckets['61-90'].amount.plus(item.balance);
          buckets['61-90'].count++;
        } else {
          buckets['90+'].amount = buckets['90+'].amount.plus(item.balance);
          buckets['90+'].count++;
        }
      });

      return Object.entries(buckets).map(([bucket, data]) => ({
        bucket: bucket as any,
        amount: data.amount,
        count: data.count,
      }));
    };

    const [receivables, payables] = await Promise.all([
      prisma.accountsReceivable.findMany({
        where: {
          status: { in: ['pending', 'partial', 'overdue'] },
          ...(branchId ? { branchId } : {}),
        },
      }),
      prisma.accountsPayable.findMany({
        where: {
          status: { in: ['pending', 'partial', 'overdue'] },
          ...(branchId ? { branchId } : {}),
        },
      }),
    ]);

    return {
      receivables: calculateBuckets(receivables),
      payables: calculateBuckets(payables),
    };
  }

  async getSalesOrderSummary(branchId?: string): Promise<SalesOrderSummary[]> {
    const orders = await prisma.salesOrder.groupBy({
      by: ['status'],
      where: {
        ...(branchId ? { branchId } : {}),
      },
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return orders.map(o => ({
      status: o.status,
      count: o._count._all,
      totalAmount: new Prisma.Decimal(o._sum.totalAmount || 0),
    }));
  }

  async getRecentActivities(limit: number = 10, branchId?: string): Promise<DashboardActivity[]> {
    const [sales, purchases, adjustments, expenses] = await Promise.all([
      prisma.pOSSale.findMany({
        where: { ...(branchId ? { branchId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.purchaseOrder.findMany({
        where: { ...(branchId ? { branchId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.inventoryAdjustment.findMany({
        where: { ...(branchId ? { branchId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.expense.findMany({
        where: { ...(branchId ? { branchId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const activities: DashboardActivity[] = [
      ...sales.map((s: any) => ({
        id: s.id,
        type: 'sale' as const,
        description: `POS Sale #${s.id.slice(-6)}`,
        amount: s.totalAmount,
        status: s.status,
        timestamp: s.createdAt,
        referenceId: s.id,
      })),
      ...purchases.map((p: any) => ({
        id: p.id,
        type: 'purchase' as const,
        description: `Purchase Order #${p.orderNumber}`,
        amount: p.totalAmount,
        status: p.status,
        timestamp: p.createdAt,
        referenceId: p.id,
      })),
      ...adjustments.map((a: any) => ({
        id: a.id,
        type: 'adjustment' as const,
        description: `Inventory Adj: ${a.reason}`,
        timestamp: a.createdAt,
        referenceId: a.id,
      })),
      ...expenses.map((e: any) => ({
        id: e.id,
        type: 'expense' as const,
        description: `Expense: ${e.description}`,
        amount: e.amount,
        timestamp: e.createdAt,
        referenceId: e.id,
      })),
    ];

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const dashboardService = new DashboardService();
