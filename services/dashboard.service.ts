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
        ...(filters?.branchId ? { warehouse: { branchId: filters.branchId } } : {}),
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
        inventoryBatches: {
          where: {
            status: 'active',
            ...(filters?.branchId ? { warehouse: { branchId: filters.branchId } } : {}),
          },
        },
      },
    });

    for (const product of products) {
      for (const batch of product.inventoryBatches) {
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
        ...(branchId ? { sale: { branchId } } : {}),
      },
      include: {
        product: true,
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
          name: item.product.name,
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
        inventoryBatches: {
          where: { status: 'active' },
        },
      },
    });

    return warehouses.map((warehouse) => {
      const currentStock = warehouse.inventoryBatches.reduce(
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
        posSales: {
          include: {
            items: true,
          },
        },
        expenses: true,
      },
    });

    const comparisons: BranchComparison[] = [];

    for (const branch of branches) {
      // Calculate revenue
      const revenue = branch.posSales.reduce(
        (sum, sale) => sum.plus(sale.totalAmount),
        new Decimal(0)
      );

      // Calculate expenses
      const expenses = branch.expenses.reduce(
        (sum, exp) => sum.plus(exp.amount),
        new Decimal(0)
      );

      // Calculate COGS
      const cogs = branch.posSales.reduce((sum, sale) => {
        const saleCogs = sale.items.reduce(
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
          warehouse: { branchId: branch.id },
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
}

export const dashboardService = new DashboardService();
