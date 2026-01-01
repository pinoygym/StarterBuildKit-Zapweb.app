import { prisma } from '@/lib/prisma';
import { Warehouse } from '@prisma/client';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@/types/warehouse.types';
import { randomUUID } from 'crypto';

export class WarehouseRepository {
  async findAll(): Promise<Warehouse[]> {
    return await prisma.warehouse.findMany({
      include: {
        Branch: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Warehouse | null> {
    return await prisma.warehouse.findUnique({
      where: { id },
      include: {
        Branch: true,
      },
    });
  }

  async findByBranchId(branchId: string): Promise<Warehouse[]> {
    return await prisma.warehouse.findMany({
      where: { branchId },
      include: {
        Branch: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateWarehouseInput): Promise<Warehouse> {
    return await prisma.warehouse.create({
      data: {
        id: randomUUID(),
        name: data.name,
        location: data.location,
        manager: data.manager,
        maxCapacity: data.maxCapacity,
        branchId: data.branchId,
      },
      include: {
        Branch: true,
      },
    });
  }

  async update(id: string, data: UpdateWarehouseInput): Promise<Warehouse> {
    return await prisma.warehouse.update({
      where: { id },
      data,
      include: {
        Branch: true,
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
        Product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
          },
        },
      },
    });

    // Group by product and sum quantities
    const distribution = batches.reduce((acc, batch: any) => {
      const productId = batch.Product.id;
      if (!acc[productId]) {
        acc[productId] = {
          productId: batch.Product.id,
          productName: batch.Product.name,
          quantity: 0,
          baseUOM: batch.Product.baseUOM,
        };
      }
      acc[productId].quantity += Number(batch.quantity);
      return acc;
    }, {} as Record<string, { productId: string; productName: string; quantity: number; baseUOM: string }>);

    return Object.values(distribution);
  }
}

export const warehouseRepository = new WarehouseRepository();
