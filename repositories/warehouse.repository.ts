import { prisma } from '@/lib/prisma';
import { Warehouse } from '@prisma/client';
import { CreateWarehouseInput, UpdateWarehouseInput } from '@/types/warehouse.types';
import { randomUUID } from 'crypto';
import { withErrorHandling } from '@/lib/errors';

export class WarehouseRepository {
  async findAll(): Promise<Warehouse[]> {
    return withErrorHandling(async () => {
      return await prisma.warehouse.findMany({
        include: {
          Branch: true,
        },
        orderBy: { name: 'asc' },
      });
    }, 'WarehouseRepository.findAll');
  }

  async findById(id: string): Promise<Warehouse | null> {
    return withErrorHandling(async () => {
      return await prisma.warehouse.findUnique({
        where: { id },
        include: {
          Branch: true,
        },
      });
    }, 'WarehouseRepository.findById');
  }

  async findByBranchId(branchId: string): Promise<Warehouse[]> {
    return withErrorHandling(async () => {
      return await prisma.warehouse.findMany({
        where: { branchId },
        include: {
          Branch: true,
        },
        orderBy: { name: 'asc' },
      });
    }, 'WarehouseRepository.findByBranchId');
  }

  async create(data: CreateWarehouseInput): Promise<Warehouse> {
    return withErrorHandling(async () => {
      const now = new Date();
      return await prisma.warehouse.create({
        data: {
          id: randomUUID(),
          name: data.name,
          location: data.location,
          manager: data.manager,
          maxCapacity: data.maxCapacity,
          branchId: data.branchId,
          createdAt: now,
          updatedAt: now,
        },
        include: {
          Branch: true,
        },
      });
    }, 'WarehouseRepository.create');
  }

  async update(id: string, data: UpdateWarehouseInput): Promise<Warehouse> {
    return withErrorHandling(async () => {
      return await prisma.warehouse.update({
        where: { id },
        data,
        include: {
          Branch: true,
        },
      });
    }, 'WarehouseRepository.update');
  }

  async delete(id: string): Promise<Warehouse> {
    return withErrorHandling(async () => {
      return await prisma.warehouse.delete({
        where: { id },
      });
    }, 'WarehouseRepository.delete');
  }

  async getCurrentStock(warehouseId: string): Promise<number> {
    return withErrorHandling(async () => {
      const result = await prisma.inventory.aggregate({
        where: {
          warehouseId,
        },
        _sum: {
          quantity: true,
        },
      });

      return Number(result._sum.quantity) || 0;
    }, 'WarehouseRepository.getCurrentStock');
  }

  async getProductDistribution(warehouseId: string) {
    return withErrorHandling(async () => {
      const inventoryItems = await prisma.inventory.findMany({
        where: {
          warehouseId,
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
      const distribution = inventoryItems.reduce((acc: Record<string, { productId: string; productName: string; quantity: number; baseUOM: string }>, item: any) => {
        const productId = item.Product.id;
        if (!acc[productId]) {
          acc[productId] = {
            productId: item.Product.id,
            productName: item.Product.name,
            quantity: 0,
            baseUOM: item.Product.baseUOM,
          };
        }
        acc[productId].quantity += Number(item.quantity);
        return acc;
      }, {});

      return Object.values(distribution);
    }, 'WarehouseRepository.getProductDistribution');
  }
}

export const warehouseRepository = new WarehouseRepository();
