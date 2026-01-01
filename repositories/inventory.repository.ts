import { prisma } from '@/lib/prisma';
import { InventoryBatch, StockMovement, Prisma } from '@prisma/client';
import {
  CreateInventoryBatchInput,
  UpdateInventoryBatchInput,
  CreateStockMovementInput,
  InventoryBatchFilters,
  StockMovementFilters,
  InventoryBatchWithRelations,
  StockMovementWithRelations,
} from '@/types/inventory.types';

export class InventoryRepository {
  // ==================== Inventory Batch Operations ====================

  async findAllBatches(filters?: InventoryBatchFilters): Promise<InventoryBatchWithRelations[]> {
    const where: Prisma.InventoryBatchWhereInput = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.expiryDateFrom || filters?.expiryDateTo) {
      where.expiryDate = {};
      if (filters.expiryDateFrom) {
        where.expiryDate.gte = filters.expiryDateFrom;
      }
      if (filters.expiryDateTo) {
        where.expiryDate.lte = filters.expiryDateTo;
      }
    }

    return await prisma.inventoryBatch.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            category: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findBatchById(id: string): Promise<InventoryBatchWithRelations | null> {
    return await prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            category: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }

  async findBatchByNumber(batchNumber: string): Promise<InventoryBatch | null> {
    return await prisma.inventoryBatch.findUnique({
      where: { batchNumber },
    });
  }

  async findActiveBatches(
    productId: string,
    warehouseId: string
  ): Promise<InventoryBatch[]> {
    return await prisma.inventoryBatch.findMany({
      where: {
        productId,
        warehouseId,
        status: 'active',
        quantity: { gt: 0 },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async createBatch(data: CreateInventoryBatchInput): Promise<InventoryBatch> {
    return await prisma.inventoryBatch.create({
      data: {
        batchNumber: '', // Will be set by service
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        unitCost: data.unitCost,
        expiryDate: data.expiryDate,
        receivedDate: data.receivedDate,
        status: data.status || 'active',
      },
    });
  }

  async updateBatch(id: string, data: UpdateInventoryBatchInput): Promise<InventoryBatch> {
    return await prisma.inventoryBatch.update({
      where: { id },
      data,
    });
  }

  async updateBatchQuantity(id: string, quantity: number): Promise<InventoryBatch> {
    return await prisma.inventoryBatch.update({
      where: { id },
      data: { quantity },
    });
  }

  async updateBatchStatus(id: string, status: string): Promise<InventoryBatch> {
    return await prisma.inventoryBatch.update({
      where: { id },
      data: { status },
    });
  }

  async deleteBatch(id: string): Promise<InventoryBatch> {
    return await prisma.inventoryBatch.delete({
      where: { id },
    });
  }

  // ==================== Stock Movement Operations ====================

  async findAllMovements(filters?: StockMovementFilters): Promise<StockMovementWithRelations[]> {
    const where: Prisma.StockMovementWhereInput = {};

    if (filters?.batchId) {
      where.batchId = filters.batchId;
    }

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

    // Handle productId and warehouseId filters through batch relation
    if (filters?.productId || filters?.warehouseId) {
      where.batch = {};
      if (filters.productId) {
        where.batch.productId = filters.productId;
      }
      if (filters.warehouseId) {
        where.batch.warehouseId = filters.warehouseId;
      }
    }

    return await prisma.stockMovement.findMany({
      where,
      include: {
        batch: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                baseUOM: true,
              },
            },
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMovementById(id: string): Promise<StockMovementWithRelations | null> {
    return await prisma.stockMovement.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                baseUOM: true,
              },
            },
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findMovementsByBatch(batchId: string): Promise<StockMovement[]> {
    return await prisma.stockMovement.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMovement(data: CreateStockMovementInput): Promise<StockMovement> {
    return await prisma.stockMovement.create({
      data: {
        batchId: data.batchId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
      },
    });
  }

  // ==================== Aggregate Queries ====================

  async getTotalStockByProduct(
    productId: string,
    warehouseId?: string
  ): Promise<number> {
    const where: Prisma.InventoryBatchWhereInput = {
      productId,
      status: 'active',
      quantity: { gt: 0 },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const result = await prisma.inventoryBatch.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    return Number(result._sum.quantity || 0);
  }

  async getTotalStockByWarehouse(warehouseId: string): Promise<number> {
    const result = await prisma.inventoryBatch.aggregate({
      where: {
        warehouseId,
        status: 'active',
        quantity: { gt: 0 },
      },
      _sum: {
        quantity: true,
      },
    });

    return Number(result._sum.quantity || 0);
  }

  async getExpiringBatches(daysUntilExpiry: number): Promise<InventoryBatchWithRelations[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysUntilExpiry);

    return await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            category: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getExpiredBatches(): Promise<InventoryBatchWithRelations[]> {
    const today = new Date();

    return await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: {
          lt: today,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            category: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
