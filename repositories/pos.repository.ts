import { prisma } from '@/lib/prisma';
import { POSSale } from '@prisma/client';
import {
  CreatePOSSaleInput,
  POSSaleWithItems,
  POSSaleFilters,
  POSTodaySummary
} from '@/types/pos.types';
import { randomUUID } from 'crypto';
import { withErrorHandling, ValidationError } from '@/lib/errors';

export class POSRepository {
  async findAll(filters?: POSSaleFilters): Promise<POSSaleWithItems[]> {
    return withErrorHandling(async () => {
      const where: any = {};

      if (filters?.branchId) {
        where.branchId = filters.branchId;
      }

      if (filters?.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      if (filters?.search) {
        where.receiptNumber = {
          contains: filters.search,
          mode: 'insensitive'
        };
      }

      const rows = await prisma.pOSSale.findMany({
        where,
        include: {
          POSSaleItem: {
            include: {
              Product: true
            }
          },
          Branch: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map((s: any) => ({
        ...s,
        items: (s.POSSaleItem || []).map((it: any) => ({ ...it, product: it.Product }))
      }));
    }, 'POSRepository.findAll');
  }

  async findById(id: string): Promise<POSSaleWithItems | null> {
    return withErrorHandling(async () => {
      const row = await prisma.pOSSale.findUnique({
        where: { id },
        include: {
          POSSaleItem: {
            include: {
              Product: true
            }
          },
          Branch: true
        }
      });
      if (!row) return null;
      return {
        ...row,
        items: (row as any).POSSaleItem?.map((it: any) => ({ ...it, product: it.Product })) || []
      } as any;
    }, 'POSRepository.findById');
  }

  async findByReceiptNumber(receiptNumber: string): Promise<POSSale | null> {
    return withErrorHandling(async () => {
      return await prisma.pOSSale.findUnique({
        where: { receiptNumber }
      });
    }, 'POSRepository.findByReceiptNumber');
  }

  async create(data: CreatePOSSaleInput, tx?: any): Promise<POSSaleWithItems> {
    return withErrorHandling(async () => {
      const client = tx || prisma;

      // Extract fields that are NOT part of the Prisma POSSale model so they don't get
      // passed through to prisma.pOSSale.create (which would throw on unknown args).
      const {
        items,
        warehouseId, // used for inventory, not stored on POSSale
        receiptNumber,
        customerId,
        customerName,
        partialPayment,
        salesAgentId,
        ...saleData
      } = data;

      // Ensure receiptNumber is present
      if (!receiptNumber) {
        throw new ValidationError('Receipt number is required');
      }

      // Only pass fields that exist on the Prisma POSSale model.
      const row = await client.pOSSale.create({
        data: {
          id: randomUUID(),
          branchId: saleData.branchId,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          totalAmount: saleData.totalAmount,
          paymentMethod: saleData.paymentMethod,
          amountReceived: saleData.amountReceived,
          change: saleData.change,
          convertedFromOrderId: saleData.convertedFromOrderId,
          receiptNumber,
          salesAgentId,
          POSSaleItem: {
            create: items.map((item) => ({
              id: randomUUID(),
              productId: item.productId,
              quantity: item.quantity,
              uom: item.uom,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              costOfGoodsSold: item.costOfGoodsSold || 0
            }))
          }
        },
        include: {
          POSSaleItem: {
            include: {
              Product: true
            }
          },
          Branch: true
        }
      });
      return {
        ...row,
        items: (row as any).POSSaleItem?.map((it: any) => ({ ...it, product: it.Product })) || []
      } as any;
    }, 'POSRepository.create');
  }

  async getTodaySummary(branchId?: string): Promise<POSTodaySummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const sales = await prisma.pOSSale.findMany({
      where,
      select: {
        totalAmount: true
      }
    });

    const transactionCount = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const averageSaleValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return {
      transactionCount,
      totalRevenue,
      averageSaleValue
    };
  }

  async countTodaySales(branchId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return await prisma.pOSSale.count({ where });
  }

  async getTodayRevenue(branchId?: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const result = await prisma.pOSSale.aggregate({
      where,
      _sum: {
        totalAmount: true
      }
    });

    return Number(result._sum.totalAmount) || 0;
  }
}

export const posRepository = new POSRepository();
