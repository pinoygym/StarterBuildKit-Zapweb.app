import { prisma } from '@/lib/prisma';
import { PurchaseOrder, PurchaseOrderItem } from '@prisma/client';
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderWithDetails,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
} from '@/types/purchase-order.types';

export class PurchaseOrderRepository {
  async findAll(filters?: PurchaseOrderFilters): Promise<PurchaseOrderWithDetails[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
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

    return await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                baseUOM: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<PurchaseOrderWithDetails | null> {
    return await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                baseUOM: true,
              },
            },
          },
        },
      },
    });
  }

  async findByPONumber(poNumber: string): Promise<PurchaseOrder | null> {
    return await prisma.purchaseOrder.findUnique({
      where: { poNumber },
    });
  }

  async create(
    data: CreatePurchaseOrderInput & { poNumber: string; totalAmount: number }
  ): Promise<PurchaseOrderWithDetails> {
    const { items, ...poData } = data;

    return await prisma.purchaseOrder.create({
      data: {
        ...poData,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                baseUOM: true,
              },
            },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdatePurchaseOrderInput & { totalAmount?: number }
  ): Promise<PurchaseOrderWithDetails> {
    const { items, ...poData } = data;

    // If items are provided, delete existing items and create new ones
    if (items !== undefined) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { poId: id },
      });

      return await prisma.purchaseOrder.update({
        where: { id },
        data: {
          ...poData,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          supplier: true,
          warehouse: true,
          branch: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  baseUOM: true,
                },
              },
            },
          },
        },
      });
    }

    // If no items provided, just update PO data
    return await prisma.purchaseOrder.update({
      where: { id },
      data: poData,
      include: {
        supplier: true,
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                baseUOM: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  async updateStatusAndDeliveryDate(
    id: string,
    status: PurchaseOrderStatus,
    actualDeliveryDate: Date
  ): Promise<PurchaseOrder> {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        actualDeliveryDate,
      },
    });
  }

  async delete(id: string): Promise<PurchaseOrder> {
    return await prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
