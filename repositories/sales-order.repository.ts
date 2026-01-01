import { prisma } from '@/lib/prisma';
import { SalesOrder } from '@prisma/client';
import {
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  SalesOrderWithItems,
  SalesOrderFilters,
} from '@/types/sales-order.types';

export class SalesOrderRepository {
  async findAll(filters?: SalesOrderFilters): Promise<SalesOrderWithItems[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.salesOrderStatus) {
      where.salesOrderStatus = filters.salesOrderStatus;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
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
      where.OR = [
        {
          customerName: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          orderNumber: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return await prisma.salesOrder.findMany({
      where,
      include: {
        items: true,
        warehouse: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<SalesOrderWithItems | null> {
    return await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        warehouse: true,
        branch: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<SalesOrder | null> {
    return await prisma.salesOrder.findUnique({
      where: { orderNumber },
    });
  }

  async findPendingOrders(branchId?: string): Promise<SalesOrderWithItems[]> {
    const where: any = {
      status: 'pending',
      salesOrderStatus: 'pending',
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return await prisma.salesOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        warehouse: true,
        branch: true,
      },
      orderBy: { deliveryDate: 'asc' },
    });
  }

  async create(data: CreateSalesOrderInput): Promise<SalesOrderWithItems> {
    const { items, ...orderData } = data;

    return await prisma.salesOrder.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        warehouse: true,
        branch: true,
      },
    });
  }

  async update(id: string, data: UpdateSalesOrderInput): Promise<SalesOrderWithItems> {
    const { items, ...orderData } = data;

    // If items are provided, delete existing items and create new ones
    if (items !== undefined) {
      await prisma.salesOrderItem.deleteMany({
        where: { soId: id },
      });

      return await prisma.salesOrder.update({
        where: { id },
        data: {
          ...orderData,
          items: items.length > 0
            ? {
                create: items,
              }
            : undefined,
        },
        include: {
          items: true,
          warehouse: true,
          branch: true,
        },
      });
    }

    // If no items provided, just update order data
    return await prisma.salesOrder.update({
      where: { id },
      data: orderData,
      include: {
        items: true,
        warehouse: true,
        branch: true,
      },
    });
  }

  async delete(id: string): Promise<SalesOrder> {
    return await prisma.salesOrder.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    salesOrderStatus?: string
  ): Promise<SalesOrder> {
    const updateData: any = { status };
    
    if (salesOrderStatus) {
      updateData.salesOrderStatus = salesOrderStatus;
    }

    return await prisma.salesOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async markAsConverted(id: string, convertedToSaleId: string): Promise<SalesOrder> {
    return await prisma.salesOrder.update({
      where: { id },
      data: {
        salesOrderStatus: 'converted',
        convertedToSaleId,
      },
    });
  }

  async countActiveOrders(branchId?: string): Promise<number> {
    const where: any = {
      status: {
        in: ['pending', 'draft'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    return await prisma.salesOrder.count({ where });
  }

  async calculateConversionRate(branchId?: string): Promise<number> {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    const totalOrders = await prisma.salesOrder.count({ where });
    
    const convertedOrders = await prisma.salesOrder.count({
      where: {
        ...where,
        salesOrderStatus: 'converted',
      },
    });

    return totalOrders > 0 ? (convertedOrders / totalOrders) * 100 : 0;
  }
}

export const salesOrderRepository = new SalesOrderRepository();
