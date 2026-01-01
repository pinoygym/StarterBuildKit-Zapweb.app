import { prisma } from '@/lib/prisma';
import { Inventory, StockMovement, Prisma } from '@prisma/client';
import {
  CreateStockMovementInput,
  StockMovementFilters,
  StockMovementWithRelations,
} from '@/types/inventory.types';

export class InventoryRepository {
  // ==================== Inventory Operations ====================

  async findInventory(productId: string, warehouseId: string): Promise<Inventory | null> {
    return await prisma.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });
  }

  async updateInventory(productId: string, warehouseId: string, quantity: number): Promise<Inventory> {
    return await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      update: {
        quantity,
      },
      create: {
        productId,
        warehouseId,
        quantity,
      },
    });
  }

  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    return await prisma.inventory.findMany({
      where: { productId },
      include: {
        Warehouse: true,
      },
    });
  }

  async getInventoryByWarehouse(warehouseId: string): Promise<Inventory[]> {
    return await prisma.inventory.findMany({
      where: { warehouseId },
      include: {
        Product: true,
      },
    });
  }

  // ==================== Stock Movement Operations ====================

  async findAllMovements(filters?: StockMovementFilters): Promise<StockMovementWithRelations[]> {
    const where: Prisma.StockMovementWhereInput = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.referenceId) {
      where.referenceId = filters.referenceId;
    }

    if (filters?.referenceType) {
      where.referenceType = filters.referenceType;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    const rows = await prisma.stockMovement.findMany({
      where,
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
          },
        },
        Warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((m: any) => ({
      ...m,
      product: m.Product,
      warehouse: m.Warehouse,
    }));
  }

  async findMovementById(id: string): Promise<StockMovementWithRelations | null> {
    const row = await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
          },
        },
        Warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!row) return null;

    return {
      ...row,
      product: (row as any).Product,
      warehouse: (row as any).Warehouse,
    };
  }

  async createMovement(data: CreateStockMovementInput): Promise<StockMovement> {
    return await prisma.stockMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
      },
    });
  }

  // ==================== Aggregate Queries ====================

  async getTotalStockByProduct(productId: string): Promise<number> {
    const result = await prisma.inventory.aggregate({
      where: {
        productId,
      },
      _sum: {
        quantity: true,
      },
    });

    return Number(result._sum.quantity || 0);
  }
}

export const inventoryRepository = new InventoryRepository();
