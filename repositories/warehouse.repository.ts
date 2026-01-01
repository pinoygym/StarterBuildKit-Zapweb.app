import { prisma } from '@/lib/prisma';
import { Warehouse } from '@prisma/client';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@/types/warehouse.types';

export class WarehouseRepository {
  async findAll(): Promise<Warehouse[]> {
    return await prisma.warehouse.findMany({
      include: {
        branch: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Warehouse | null> {
    return await prisma.warehouse.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });
  }

  async findByBranchId(branchId: string): Promise<Warehouse[]> {
    return await prisma.warehouse.findMany({
      where: { branchId },
      include: {
        branch: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateWarehouseInput): Promise<Warehouse> {
    return await prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location,
        manager: data.manager,
        maxCapacity: data.maxCapacity,
        branchId: data.branchId,
      },
      include: {
        branch: true,
      },
    });
  }

  async update(id: string, data: UpdateWarehouseInput): Promise<Warehouse> {
    return await prisma.warehouse.update({
      where: { id },
      data,
      include: {
        branch: true,
      },
    });
  }

  async delete(id: string): Promise<Warehouse> {
    return await prisma.warehouse.delete({
      where: { id },
    });
  }

  async getCurrentStock(warehouseId: string): Promise<number> {
    const result = await prisma.inventoryBatch.aggregate({
      where: {
        warehouseId,
        status: 'active',
      },
      _sum: {
        quantity: true,
      },
    });

    return Number(result._sum.quantity) || 0;
  }

  async getProductDistribution(warehouseId: string) {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        warehouseId,
        status: 'active',
        quantity: { gt: 0 },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
          },
        },
      },
    });

    // Group by product and sum quantities
    const distribution = batches.reduce((acc, batch) => {
      const productId = batch.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          productId: batch.product.id,
          productName: batch.product.name,
          quantity: 0,
          baseUOM: batch.product.baseUOM,
        };
      }
      acc[productId].quantity += Number(batch.quantity);
      return acc;
    }, {} as Record<string, { productId: string; productName: string; quantity: number; baseUOM: string }>);

    return Object.values(distribution);
  }
}

export const warehouseRepository = new WarehouseRepository();
