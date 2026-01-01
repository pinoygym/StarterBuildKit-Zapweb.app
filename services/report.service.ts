import { prisma } from '@/lib/prisma';
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
import { Decimal } from '@prisma/client/runtime/library';

export class ReportService {
  async getStockLevelReport(filters?: ReportFilters): Promise<StockLevelReport[]> {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        warehouse: {
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
          ...(filters?.warehouseId ? { id: filters.warehouseId } : {}),
        },
        product: {
          ...(filters?.category ? { category: filters.category } : {}),
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    const productStockMap = new Map<string, Map<string, number>>();

    for (const batch of batches) {
      const key = `${batch.productId}-${batch.warehouseId}`;
      const warehouseMap = productStockMap.get(batch.productId) || new Map();
      const current = warehouseMap.get(batch.warehouseId) || 0;
      warehouseMap.set(batch.warehouseId, current + Number(batch.quantity));
      productStockMap.set(batch.productId, warehouseMap);
    }

    const report: StockLevelReport[] = [];

    for (const batch of batches) {
      const key = `${batch.productId}-${batch.warehouseId}`;
      if (report.find(r => r.productId === batch.productId && r.warehouseId === batch.warehouseId)) {
        continue;
      }

      const warehouseMap = productStockMap.get(batch.productId)!;
      const currentStock = warehouseMap.get(batch.warehouseId) || 0;

      let status: 'adequate' | 'low' | 'critical' = 'adequate';
      if (currentStock === 0) {
        status = 'critical';
      } else if (currentStock < batch.product.minStockLevel) {
        status = 'low';
      }

      report.push({
        productId: batch.productId,
        productName: batch.product.name,
        category: batch.product.category,
        warehouseId: batch.warehouseId,
        warehouseName: batch.warehouse.name,
        currentStock,
        baseUOM: batch.product.baseUOM,
        minStockLevel: batch.product.minStockLevel,
        status,
      });
    }

    return report;
  }

  async getInventoryValueReport(filters?: ReportFilters): Promise<InventoryValueReport[]> {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        warehouse: {
          ...(filters?.branchId ? { branchId: filters.branchId } : {}),
          ...(filters?.warehouseId ? { id: filters.warehouseId } : {}),
        },
        product: {
          ...(filters?.category ? { category: filters.category } : {}),
        },
      },
      include: {
        product: true,
      },
    });

    const productMap = new Map<string, { name: string; quantity: Decimal; totalCost: Decimal }>();

    for (const batch of batches) {
      const existing = productMap.get(batch.productId);
      const batchCost = new Decimal(batch.quantity).times(batch.unitCost);

      if (existing) {
        existing.quantity = existing.quantity.plus(batch.quantity);
        existing.totalCost = existing.totalCost.plus(batchCost);
      } else {
        productMap.set(batch.productId, {
          name: batch.product.name,
          quantity: new Decimal(batch.quantity),
          totalCost: batchCost,
        });
      }
    }

    return Array.from(productMap.entries()).map(([productId, data]) => ({
      productId,
      productName: data.name,
      totalQuantity: Number(data.quantity),
      averageCost: data.quantity.greaterThan(0) ? data.totalCost.dividedBy(data.quantity) : new Decimal(0),
      totalValue: data.totalCost,
    }));
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
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { count: number; revenue: Decimal; cogs: Decimal }>();

    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey);
      
      const saleCOGS = sale.items.reduce(
        (sum, item) => sum.plus(item.costOfGoodsSold),
        new Decimal(0)
      );

      if (existing) {
        existing.count++;
        existing.revenue = existing.revenue.plus(sale.totalAmount);
        existing.cogs = existing.cogs.plus(saleCOGS);
      } else {
        dailyMap.set(dateKey, {
          count: 1,
          revenue: new Decimal(sale.totalAmount),
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

    if (filters?.branchId) {
      where.sale = { branchId: filters.branchId };
    }

    if (filters?.fromDate || filters?.toDate) {
      where.sale = { ...where.sale, createdAt: {} };
      if (filters.fromDate) where.sale.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.sale.createdAt.lte = filters.toDate;
    }

    const items = await prisma.pOSSaleItem.findMany({
      where,
      include: {
        product: true,
      },
    });

    const productMap = new Map<string, { name: string; category: string; quantity: Decimal; revenue: Decimal; cogs: Decimal }>();

    for (const item of items) {
      const existing = productMap.get(item.productId);

      if (existing) {
        existing.quantity = existing.quantity.plus(item.quantity);
        existing.revenue = existing.revenue.plus(item.subtotal);
        existing.cogs = existing.cogs.plus(item.costOfGoodsSold);
      } else {
        productMap.set(item.productId, {
          name: item.product.name,
          category: item.product.category,
          quantity: new Decimal(item.quantity),
          revenue: new Decimal(item.subtotal),
          cogs: new Decimal(item.costOfGoodsSold),
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
      include: { items: true },
    });

    const revenue = sales.reduce((sum, sale) => sum.plus(sale.totalAmount), new Decimal(0));
    const cogs = sales.reduce((sum, sale) => {
      const saleCOGS = sale.items.reduce((itemSum, item) => itemSum.plus(item.costOfGoodsSold), new Decimal(0));
      return sum.plus(saleCOGS);
    }, new Decimal(0));

    const expenseWhere: any = {};
    if (filters?.branchId) expenseWhere.branchId = filters.branchId;
    if (filters?.fromDate || filters?.toDate) {
      expenseWhere.expenseDate = {};
      if (filters.fromDate) expenseWhere.expenseDate.gte = filters.fromDate;
      if (filters.toDate) expenseWhere.expenseDate.lte = filters.toDate;
    }

    const expenses = await prisma.expense.findMany({ where: expenseWhere });
    const totalExpenses = expenses.reduce((sum, exp) => sum.plus(exp.amount), new Decimal(0));

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
    const posSales = sales.reduce((sum, sale) => sum.plus(sale.totalAmount), new Decimal(0));

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
    const arPaymentsTotal = arPayments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

    const expenseWhere: any = {};
    if (filters?.branchId) expenseWhere.branchId = filters.branchId;
    if (filters?.fromDate || filters?.toDate) {
      expenseWhere.expenseDate = {};
      if (filters.fromDate) expenseWhere.expenseDate.gte = filters.fromDate;
      if (filters.toDate) expenseWhere.expenseDate.lte = filters.toDate;
    }

    const expenses = await prisma.expense.findMany({ where: expenseWhere });
    const totalExpenses = expenses.reduce((sum, exp) => sum.plus(exp.amount), new Decimal(0));

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
    const apPaymentsTotal = apPayments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

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
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        ...(branchId ? { warehouse: { branchId } } : {}),
      },
    });

    const inventoryValue = batches.reduce(
      (sum, batch) => sum.plus(new Decimal(batch.quantity).times(batch.unitCost)),
      new Decimal(0)
    );

    const arRecords = await prisma.accountsReceivable.findMany({
      where: {
        status: { in: ['pending', 'partial'] },
        ...(branchId ? { branchId } : {}),
      },
    });
    const accountsReceivable = arRecords.reduce((sum, ar) => sum.plus(ar.balance), new Decimal(0));

    const apRecords = await prisma.accountsPayable.findMany({
      where: {
        status: { in: ['pending', 'partial'] },
        ...(branchId ? { branchId } : {}),
      },
    });
    const accountsPayable = apRecords.reduce((sum, ap) => sum.plus(ap.balance), new Decimal(0));

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
