import { prisma } from '@/lib/prisma';
import { InventoryTransfer, InventoryTransferItem } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
    CreateTransferInput,
    UpdateTransferInput,
    InventoryTransferWithRelations,
    TransferFilters,
    TransferStatus,
} from '@/types/inventory-transfer.types';

export class InventoryTransferRepository {
    async findAll(filters?: TransferFilters): Promise<InventoryTransferWithRelations[]> {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.branchId) {
            where.branchId = filters.branchId;
        }

        if (filters?.sourceWarehouseId) {
            where.sourceWarehouseId = filters.sourceWarehouseId;
        }

        if (filters?.destinationWarehouseId) {
            where.destinationWarehouseId = filters.destinationWarehouseId;
        }

        if (filters?.dateFrom || filters?.dateTo) {
            where.transferDate = {};
            if (filters.dateFrom) {
                where.transferDate.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.transferDate.lte = filters.dateTo;
            }
        }

        if (filters?.searchQuery) {
            where.OR = [
                { transferNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
                { reason: { contains: filters.searchQuery, mode: 'insensitive' } },
            ];
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        return await prisma.inventoryTransfer.findMany({
            where,
            include: {
                sourceWarehouse: {
                    select: { id: true, name: true }
                },
                destinationWarehouse: {
                    select: { id: true, name: true }
                },
                Branch: {
                    select: { id: true, name: true }
                },
                CreatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                                productUOMs: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }) as InventoryTransferWithRelations[];
    }

    async count(filters?: TransferFilters): Promise<number> {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.branchId) where.branchId = filters.branchId;
        if (filters?.sourceWarehouseId) where.sourceWarehouseId = filters.sourceWarehouseId;
        if (filters?.destinationWarehouseId) where.destinationWarehouseId = filters.destinationWarehouseId;

        if (filters?.dateFrom || filters?.dateTo) {
            where.transferDate = {};
            if (filters.dateFrom) where.transferDate.gte = filters.dateFrom;
            if (filters.dateTo) where.transferDate.lte = filters.dateTo;
        }

        if (filters?.searchQuery) {
            where.OR = [
                { transferNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
                { reason: { contains: filters.searchQuery, mode: 'insensitive' } },
            ];
        }

        return await prisma.inventoryTransfer.count({ where });
    }

    async findById(id: string): Promise<InventoryTransferWithRelations | null> {
        return await prisma.inventoryTransfer.findUnique({
            where: { id },
            include: {
                sourceWarehouse: {
                    select: { id: true, name: true }
                },
                destinationWarehouse: {
                    select: { id: true, name: true }
                },
                Branch: {
                    select: { id: true, name: true }
                },
                CreatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                                productUOMs: true,
                            }
                        }
                    }
                }
            },
        }) as InventoryTransferWithRelations | null;
    }

    async findByTransferNumber(transferNumber: string): Promise<InventoryTransfer | null> {
        return await prisma.inventoryTransfer.findUnique({
            where: { transferNumber },
        });
    }

    async create(
        data: CreateTransferInput & { transferNumber: string; createdById: string }
    ): Promise<InventoryTransferWithRelations> {
        const { items, ...transferData } = data;

        return await prisma.inventoryTransfer.create({
            data: {
                id: randomUUID(),
                ...transferData,
                items: {
                    create: items.map(item => ({
                        id: randomUUID(),
                        productId: item.productId,
                        quantity: item.quantity,
                        uom: item.uom,
                    })),
                },
            },
            include: {
                sourceWarehouse: {
                    select: { id: true, name: true }
                },
                destinationWarehouse: {
                    select: { id: true, name: true }
                },
                Branch: {
                    select: { id: true, name: true }
                },
                CreatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                                productUOMs: true,
                            }
                        }
                    }
                }
            },
        }) as InventoryTransferWithRelations;
    }

    async update(
        id: string,
        data: UpdateTransferInput
    ): Promise<InventoryTransferWithRelations> {
        const { items, ...transferData } = data;

        // If items are provided, replace them
        if (items !== undefined) {
            await prisma.inventoryTransferItem.deleteMany({
                where: { transferId: id },
            });

            return await prisma.inventoryTransfer.update({
                where: { id },
                data: {
                    ...transferData,
                    updatedAt: new Date(),
                    items: {
                        create: items.map(item => ({
                            id: randomUUID(),
                            productId: item.productId,
                            quantity: item.quantity,
                            uom: item.uom,
                        })),
                    },
                },
                include: {
                    sourceWarehouse: {
                        select: { id: true, name: true }
                    },
                    destinationWarehouse: {
                        select: { id: true, name: true }
                    },
                    Branch: {
                        select: { id: true, name: true }
                    },
                    CreatedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    items: {
                        include: {
                            Product: {
                                select: {
                                    id: true,
                                    name: true,
                                    baseUOM: true,
                                    productUOMs: true,
                                }
                            }
                        }
                    }
                },
            }) as InventoryTransferWithRelations;
        }

        return await prisma.inventoryTransfer.update({
            where: { id },
            data: { ...transferData, updatedAt: new Date() },
            include: {
                sourceWarehouse: {
                    select: { id: true, name: true }
                },
                destinationWarehouse: {
                    select: { id: true, name: true }
                },
                Branch: {
                    select: { id: true, name: true }
                },
                CreatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                                productUOMs: true,
                            }
                        }
                    }
                }
            },
        }) as InventoryTransferWithRelations;
    }

    async updateStatus(id: string, status: TransferStatus): Promise<InventoryTransfer> {
        return await prisma.inventoryTransfer.update({
            where: { id },
            data: { status, updatedAt: new Date() },
        });
    }

    async delete(id: string): Promise<InventoryTransfer> {
        return await prisma.inventoryTransfer.delete({
            where: { id },
        });
    }
}

export const inventoryTransferRepository = new InventoryTransferRepository();
