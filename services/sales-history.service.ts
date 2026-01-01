import { prisma } from '@/lib/prisma';
import {
  DatePreset,
  SalesHistoryFilters,
  SalesAnalytics,
  SalesHistoryResponse,
} from '@/types/sales-history.types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';

export class SalesHistoryService {
  /**
   * Calculate date range based on preset
   */
  calculateDateRange(preset: DatePreset): { startDate: Date; endDate: Date } {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);

    switch (preset) {
      case DatePreset.TODAY:
        return { startDate: today, endDate: endToday };

      case DatePreset.YESTERDAY:
        const yesterday = subDays(today, 1);
        return { startDate: yesterday, endDate: endOfDay(yesterday) };

      case DatePreset.THIS_WEEK:
        return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };

      case DatePreset.LAST_WEEK:
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        return { startDate: lastWeekStart, endDate: lastWeekEnd };

      case DatePreset.THIS_MONTH:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };

      case DatePreset.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };

      case DatePreset.LAST_30_DAYS:
        return { startDate: subDays(today, 30), endDate: endToday };

      case DatePreset.LAST_60_DAYS:
        return { startDate: subDays(today, 60), endDate: endToday };

      case DatePreset.LAST_90_DAYS:
        return { startDate: subDays(today, 90), endDate: endToday };

      case DatePreset.THIS_YEAR:
        return { startDate: startOfYear(now), endDate: endOfYear(now) };

      case DatePreset.LAST_YEAR:
        const lastYear = subYears(now, 1);
        return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };

      default:
        return { startDate: today, endDate: endToday };
    }
  }

  /**
   * Get sales history with filters and pagination
   */
  async getSalesHistory(filters: SalesHistoryFilters): Promise<SalesHistoryResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Calculate date range
    let startDate = filters.startDate;
    let endDate = filters.endDate;

    if (filters.preset && filters.preset !== DatePreset.CUSTOM) {
      const range = this.calculateDateRange(filters.preset);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Build where clause
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.createdAt = { gte: startDate };
    } else if (endDate) {
      where.createdAt = { lte: endDate };
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    // Note: userId and customerId filters are not supported in current schema
    // These fields would need to be added to POSSale model if needed

    if (filters.receiptNumber) {
      where.receiptNumber = {
        contains: filters.receiptNumber,
        mode: 'insensitive',
      };
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.totalAmount = {};
      if (filters.minAmount !== undefined) {
        where.totalAmount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.totalAmount.lte = filters.maxAmount;
      }
    }

    // Get total count
    const total = await prisma.pOSSale.count({ where });

    // Get sales with related data
    const sales = await prisma.pOSSale.findMany({
      where,
      include: {
        POSSaleItem: {
          include: {
            Product: true,
          },
        },
        Branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      sales: sales as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get analytics for the selected period
   */
  async getAnalytics(filters: SalesHistoryFilters): Promise<SalesAnalytics> {
    // Calculate date range
    let startDate = filters.startDate;
    let endDate = filters.endDate;

    if (filters.preset && filters.preset !== DatePreset.CUSTOM) {
      const range = this.calculateDateRange(filters.preset);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Build where clause
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    // Get all sales for the period
    const sales = await prisma.pOSSale.findMany({
      where,
      include: {
        POSSaleItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    // Calculate summary metrics
    const totalTransactions = sales.length;
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalDiscount = 0; // Discount field not available in current schema
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax || 0), 0);
    const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Payment method breakdown
    const paymentMethodBreakdown = {
      cash: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
      ar_credit: { count: 0, amount: 0 },
    };

    sales.forEach((sale) => {
      const method = sale.paymentMethod as 'cash' | 'credit' | 'ar_credit';
      if (paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method].count++;
        paymentMethodBreakdown[method].amount += Number(sale.totalAmount);
      }
    });

    // Top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    sales.forEach((sale) => {
      sale.POSSaleItem.forEach((item) => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.quantity += Number(item.quantity);
          existing.revenue += Number(item.subtotal); // Using subtotal instead of lineTotal
        } else {
          productMap.set(item.productId, {
            name: item.Product.name,
            quantity: Number(item.quantity),
            revenue: Number(item.subtotal), // Using subtotal instead of lineTotal
          });
        }
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by day (for charts)
    const salesByDay: Array<{ date: string; sales: number; transactions: number }> = [];
    const dayMap = new Map<string, { sales: number; transactions: number }>();

    sales.forEach((sale) => {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const existing = dayMap.get(dateKey);
      if (existing) {
        existing.sales += Number(sale.totalAmount);
        existing.transactions++;
      } else {
        dayMap.set(dateKey, {
          sales: Number(sale.totalAmount),
          transactions: 1,
        });
      }
    });

    dayMap.forEach((data, date) => {
      salesByDay.push({ date, sales: data.sales, transactions: data.transactions });
    });

    salesByDay.sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSales,
      totalTransactions,
      averageTransactionValue,
      totalDiscount,
      totalTax,
      paymentMethodBreakdown,
      topProducts,
      salesByDay,
    };
  }
}

export const salesHistoryService = new SalesHistoryService();
