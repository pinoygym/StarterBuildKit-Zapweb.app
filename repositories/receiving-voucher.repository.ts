import { prisma } from '@/lib/prisma';
import {
  ReceivingVoucher,
  ReceivingVoucherWithDetails,
  ReceivingVoucherFilters,
} from '@/types/receiving-voucher.types';
import { Prisma } from '@prisma/client';

export class ReceivingVoucherRepository {
  async create(data: Prisma.ReceivingVoucherCreateInput): Promise<ReceivingVoucher> {
    return await prisma.receivingVoucher.create({
      data,
    });
  }

  async findById(id: string): Promise<ReceivingVoucherWithDetails | null> {
    return await prisma.receivingVoucher.findUnique({
      where: { id },
      include: {
        PurchaseOrder: {
          include: {
            Supplier: true,
          },
        },
        Warehouse: true,
        Branch: true,
        ReceivingVoucherItem: {
          include: {
            Product: true,
          },
        },
      },
    });
  }

  async findByRVNumber(rvNumber: string): Promise<ReceivingVoucherWithDetails | null> {
    return await prisma.receivingVoucher.findUnique({
      where: { rvNumber },
      include: {
        PurchaseOrder: {
          include: {
            Supplier: true,
          },
        },
        Warehouse: true,
        Branch: true,
        ReceivingVoucherItem: {
          include: {
            Product: true,
          },
        },
      },
    });
  }

  async findMany(filters: ReceivingVoucherFilters): Promise<ReceivingVoucherWithDetails[]> {
    const where: Prisma.ReceivingVoucherWhereInput = {};

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.rvNumber) {
      where.rvNumber = {
        contains: filters.rvNumber,
        mode: 'insensitive',
      };
    }

    if (filters.poNumber) {
      where.PurchaseOrder = {
        poNumber: {
          contains: filters.poNumber,
          mode: 'insensitive',
        },
      };
    }

    if (filters.startDate || filters.endDate) {
      where.receivedDate = {};
      if (filters.startDate) {
        where.receivedDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.receivedDate.lte = filters.endDate;
      }
    }

    return await prisma.receivingVoucher.findMany({
      where,
      include: {
        PurchaseOrder: {
          include: {
            Supplier: true,
          },
        },
        Warehouse: true,
        Branch: true,
        ReceivingVoucherItem: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByPurchaseOrderId(poId: string): Promise<ReceivingVoucherWithDetails[]> {
    return await prisma.receivingVoucher.findMany({
      where: { purchaseOrderId: poId },
      include: {
        PurchaseOrder: {
          include: {
            Supplier: true,
          },
        },
        Warehouse: true,
        Branch: true,
        ReceivingVoucherItem: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async count(filters: ReceivingVoucherFilters): Promise<number> {
    const where: Prisma.ReceivingVoucherWhereInput = {};

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.receivingVoucher.count({ where });
  }
}

export const receivingVoucherRepository = new ReceivingVoucherRepository();
