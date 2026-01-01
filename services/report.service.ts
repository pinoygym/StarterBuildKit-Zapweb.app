import { prisma, Prisma } from '@/lib/prisma';
import {
  StockLevelReport,
  InventoryValueReport,
  SalesReport,
  BestSellingProduct,
  ProfitLossStatement,
  CashFlowStatement,
  BalanceSheet,
  ReportFilters,
} from '@/types/report.types';

export class ReportService {
  async getStockLevelReport(filters?: ReportFilters): Promise<StockLevelReport[]> {
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        Warehouse: {
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
          ...(filters?.warehouseId ? { id: filters.warehouseId } : {}),
        },
        Product: {
          status: 'active',
          ...(filters?.category ? { category: filters.category } : {}),
        },
      },
      include: {
        Product: true,
        Warehouse: true,
      },
    });

    const report: StockLevelReport[] = [];

    for (const item of inventoryItems) {
      const currentStock = Number(item.quantity);

      let status: 'adequate' | 'low' | 'critical' = 'adequate';
      if (currentStock === 0) {
        status = 'critical';
      } else if (currentStock < item.Product.minStockLevel) {
        status = 'low';
      }

      report.push({
        productId: item.productId,
        productName: item.Product.name,
        category: item.Product.category,
        warehouseId: item.warehouseId,
        warehouseName: item.Warehouse.name,
        currentStock,
        baseUOM: item.Product.baseUOM,
        minStockLevel: item.Product.minStockLevel,
        status,
      });
    }

    return report;
  }

  async getInventoryValueReport(filters?: ReportFilters): Promise<InventoryValueReport[]> {
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        Warehouse: {
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
          ...(filters?.warehouseId ? { id: filters.warehouseId } : {}),
        },
        Product: {
          status: 'active',
          ...(filters?.category ? { category: filters.category } : {}),
        },
      },
      include: {
        Product: true,
      },
    });

    const report: InventoryValueReport[] = inventoryItems.map(item => {
      const quantity = new Prisma.Decimal(item.quantity);
      const cost = new Prisma.Decimal(item.Product.averageCostPrice || 0);
      const totalValue = quantity.times(cost);

      return {
        productId: item.productId,
        productName: item.Product.name,
        totalQuantity: Number(quantity),
        averageCost: cost,
        totalValue: totalValue,
      };
    });

    return report;
  }

  async getSalesReport(filters?: ReportFilters): Promise<SalesReport[]> {
    const where: any = {};

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const sales = await prisma.pOSSale.findMany({
      where,
      include: {
        POSSaleItem: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { count: number; revenue: Prisma.Decimal; cogs: Prisma.Decimal }>();

    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey);

      const saleCOGS = sale.POSSaleItem.reduce(
        (sum, item) => sum.plus(item.costOfGoodsSold),
        new Prisma.Decimal(0)
      );

      if (existing) {
        existing.count++;
        existing.revenue = existing.revenue.plus(sale.totalAmount);
        existing.cogs = existing.cogs.plus(saleCOGS);
      } else {
        dailyMap.set(dateKey, {
          count: 1,
          revenue: new Prisma.Decimal(sale.totalAmount),
          cogs: saleCOGS,
        });
      }
    }

    return Array.from(dailyMap.entries()).map(([date, data]) => {
      const grossProfit = data.revenue.minus(data.cogs);
      return {
        date: new Date(date),
        transactionCount: data.count,
        totalRevenue: data.revenue,
        totalCOGS: data.cogs,
        grossProfit,
        grossMargin: data.revenue.greaterThan(0)
          ? Number(grossProfit.dividedBy(data.revenue).times(100))
          : 0,
      };
    });
  }

  async getBestSellingProducts(filters?: ReportFilters, limit: number = 10): Promise<BestSellingProduct[]> {
    const where: any = {};

    if (filters?.branchId || filters?.fromDate || filters?.toDate) {
      where.POSSale = { is: {} };

      if (filters.branchId) {
        where.POSSale.is.branchId = filters.branchId;
      }

      if (filters.fromDate || filters.toDate) {
        where.POSSale.is.createdAt = {};
        if (filters.fromDate) where.POSSale.is.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.POSSale.is.createdAt.lte = filters.toDate;
      }
    }

    const items = await prisma.pOSSaleItem.findMany({
      where,
      include: {
        Product: true,
      },
    });

    const productMap = new Map<string, { name: string; category: string; quantity: Prisma.Decimal; revenue: Prisma.Decimal; cogs: Prisma.Decimal }>();

    for (const item of items) {
      if (!item.Product) continue;

      const existing = productMap.get(item.productId);

      if (existing) {
        existing.quantity = existing.quantity.plus(item.quantity);
        existing.revenue = existing.revenue.plus(item.subtotal);
        existing.cogs = existing.cogs.plus(item.costOfGoodsSold);
      } else {
        productMap.set(item.productId, {
          name: item.Product.name,
          category: item.Product.category,
          quantity: new Prisma.Decimal(item.quantity),
          revenue: new Prisma.Decimal(item.subtotal),
          cogs: new Prisma.Decimal(item.costOfGoodsSold),
        });
      }
    }

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        category: data.category,
        quantitySold: Number(data.quantity),
        revenue: data.revenue,
        profit: data.revenue.minus(data.cogs),
      }))
      .sort((a, b) => Number(b.revenue.minus(a.revenue)))
      .slice(0, limit);
  }

  async getProfitLossStatement(filters?: ReportFilters): Promise<ProfitLossStatement> {
    const where: any = {};

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const sales = await prisma.pOSSale.findMany({
      where,
      include: { POSSaleItem: true },
    });

    const revenue = sales.reduce((sum, sale) => sum.plus(sale.totalAmount), new Prisma.Decimal(0));
    const cogs = sales.reduce((sum, sale) => {
      const saleCOGS = sale.POSSaleItem.reduce((itemSum, item) => itemSum.plus(item.costOfGoodsSold), new Prisma.Decimal(0));
      return sum.plus(saleCOGS);
    }, new Prisma.Decimal(0));

    const expenseWhere: any = {};
    if (filters?.branchId) expenseWhere.branchId = filters.branchId;
    if (filters?.fromDate || filters?.toDate) {
      expenseWhere.expenseDate = {};
      if (filters.fromDate) expenseWhere.expenseDate.gte = filters.fromDate;
      if (filters.toDate) expenseWhere.expenseDate.lte = filters.toDate;
    }

    const expenses = await prisma.expense.findMany({ where: expenseWhere });
    const totalExpenses = expenses.reduce((sum, exp) => sum.plus(exp.amount), new Prisma.Decimal(0));

    const grossProfit = revenue.minus(cogs);
    const netProfit = grossProfit.minus(totalExpenses);

    return {
      revenue,
      cogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      grossMargin: revenue.greaterThan(0) ? Number(grossProfit.dividedBy(revenue).times(100)) : 0,
      netMargin: revenue.greaterThan(0) ? Number(netProfit.dividedBy(revenue).times(100)) : 0,
    };
  }

  async getCashFlowStatement(filters?: ReportFilters): Promise<CashFlowStatement> {
    const where: any = {};
    if (filters?.branchId) where.branchId = filters.branchId;
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const sales = await prisma.pOSSale.findMany({ where });
    const posSales = sales.reduce((sum, sale) => sum.plus(sale.totalAmount), new Prisma.Decimal(0));

    const arPayments = await prisma.aRPayment.findMany({
      where: {
        ...(filters?.fromDate || filters?.toDate ? {
          paymentDate: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        } : {}),
      },
    });
    const arPaymentsTotal = arPayments.reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));

    const expenseWhere: any = {};
    if (filters?.branchId) expenseWhere.branchId = filters.branchId;
    if (filters?.fromDate || filters?.toDate) {
      expenseWhere.expenseDate = {};
      if (filters.fromDate) expenseWhere.expenseDate.gte = filters.fromDate;
      if (filters.toDate) expenseWhere.expenseDate.lte = filters.toDate;
    }

    const expenses = await prisma.expense.findMany({ where: expenseWhere });
    const totalExpenses = expenses.reduce((sum, exp) => sum.plus(exp.amount), new Prisma.Decimal(0));

    const apPayments = await prisma.aPPayment.findMany({
      where: {
        ...(filters?.fromDate || filters?.toDate ? {
          paymentDate: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        } : {}),
      },
    });
    const apPaymentsTotal = apPayments.reduce((sum, p) => sum.plus(p.amount), new Prisma.Decimal(0));

    const totalInflows = posSales.plus(arPaymentsTotal);
    const totalOutflows = totalExpenses.plus(apPaymentsTotal);

    return {
      cashInflows: {
        posSales,
        arPayments: arPaymentsTotal,
        total: totalInflows,
      },
      cashOutflows: {
        expenses: totalExpenses,
        apPayments: apPaymentsTotal,
        total: totalOutflows,
      },
      netCashFlow: totalInflows.minus(totalOutflows),
    };
  }

  async getBalanceSheet(branchId?: string): Promise<BalanceSheet> {
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        ...(branchId ? { Warehouse: { branchId } } : {}),
      },
      include: {
        Product: true,
      },
    });

    const inventoryValue = inventoryItems.reduce(
      (sum, item) => sum.plus(new Prisma.Decimal(item.quantity).times(item.Product.averageCostPrice || 0)),
      new Prisma.Decimal(0)
    );

    const arRecords = await prisma.accountsReceivable.findMany({
      where: {
        status: { in: ['pending', 'partial'] },
        ...(branchId ? { branchId } : {}),
      },
    });
    const accountsReceivable = arRecords.reduce((sum, ar) => sum.plus(ar.balance), new Prisma.Decimal(0));

    const apRecords = await prisma.accountsPayable.findMany({
      where: {
        status: { in: ['pending', 'partial'] },
        ...(branchId ? { branchId } : {}),
      },
    });
    const accountsPayable = apRecords.reduce((sum, ap) => sum.plus(ap.balance), new Prisma.Decimal(0));

    const totalAssets = inventoryValue.plus(accountsReceivable);
    const totalLiabilities = accountsPayable;
    const equity = totalAssets.minus(totalLiabilities);

    return {
      assets: {
        inventoryValue,
        accountsReceivable,
        total: totalAssets,
      },
      liabilities: {
        accountsPayable,
        total: totalLiabilities,
      },
      equity,
    };
  }
}

export const reportService = new ReportService();
