import { prisma } from '@/lib/prisma';
import { inventoryService } from '@/services/inventory.service';
import {
    CreateAdjustmentInput,
    UpdateAdjustmentInput,
    InventoryAdjustmentWithRelations,
    AdjustmentFilters
} from '@/types/inventory-adjustment.types';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { Prisma } from '@prisma/client';
import { auditService } from './audit.service';

export class InventoryAdjustmentService {

    private async generateAdjustmentNumber(tx: Prisma.TransactionClient): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const prefix = `ADJ-${dateStr}`;

        // Count existing adjustments for today to determine sequence
        const count = await tx.inventoryAdjustment.count({
            where: {
                adjustmentNumber: {
                    startsWith: prefix
                }
            }
        });

        const sequence = (count + 1).toString().padStart(4, '0');
        return `${prefix}-${sequence}`;
    }

    /**
     * Create a new draft adjustment
     */
    async create(data: CreateAdjustmentInput, userId: string): Promise<InventoryAdjustmentWithRelations> {
        return await prisma.$transaction(async (tx) => {
            const adjustmentNumber = await this.generateAdjustmentNumber(tx);

            const adjustment = await tx.inventoryAdjustment.create({
                data: {
                    id: crypto.randomUUID(),
                    adjustmentNumber,
                    warehouseId: data.warehouseId,
                    branchId: data.branchId,
                    reason: data.reason,
                    referenceNumber: data.referenceNumber,
                    adjustmentDate: data.adjustmentDate || new Date(),
                    status: 'DRAFT',
                    createdById: userId,
                    items: {
                        create: data.items.map(item => ({
                            id: crypto.randomUUID(),
                            productId: item.productId,
                            quantity: item.quantity,
                            uom: item.uom,
                            type: item.type || 'RELATIVE',
                            systemQuantity: item.systemQuantity,
                            actualQuantity: item.actualQuantity,
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            Product: {
                                select: {
                                    id: true,
                                    name: true,
                                    baseUOM: true,
                                }
                            }
                        }
                    },
                    Warehouse: {
                        select: { id: true, name: true }
                    },
                    Branch: {
                        select: { id: true, name: true }
                    },
                    CreatedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    PostedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    // @ts-ignore
                    UpdatedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            });

            // Log creation
            await auditService.log({
                userId,
                action: 'CREATE',
                resource: 'INVENTORY_ADJUSTMENT',
                resourceId: adjustment.id,
                details: { adjustmentNumber }
            });

            return adjustment as unknown as InventoryAdjustmentWithRelations;
        });
    }

    /**
     * Update an existing draft adjustment
     */
    async update(id: string, data: UpdateAdjustmentInput, userId?: string): Promise<InventoryAdjustmentWithRelations> {
        const adjustment = await prisma.inventoryAdjustment.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!adjustment) {
            throw new NotFoundError('Inventory adjustment not found');
        }

        if (adjustment.status !== 'DRAFT' && data.status !== 'CANCELLED') {
            throw new ValidationError('Only draft adjustments can be updated');
        }

        // Prepare update data
        const updateData: Prisma.InventoryAdjustmentUncheckedUpdateInput = {
            ...(data.reason && { reason: data.reason }),
            ...(data.referenceNumber !== undefined && { referenceNumber: data.referenceNumber }),
            ...(data.adjustmentDate && { adjustmentDate: data.adjustmentDate || undefined }),
            ...(data.status === 'CANCELLED' && { status: 'CANCELLED' }),
            // @ts-ignore
            updatedById: userId,
        };

        if (data.items) {
            // Replace items logic
            updateData.items = {
                deleteMany: {}, // Delete all existing for this adjustment
                create: data.items.map(item => ({
                    id: crypto.randomUUID(),
                    productId: item.productId,
                    quantity: item.quantity,
                    uom: item.uom,
                    type: item.type || 'RELATIVE',
                    systemQuantity: item.systemQuantity,
                    actualQuantity: item.actualQuantity,
                }))
            };
        }

        const updated = await prisma.inventoryAdjustment.update({
            where: { id },
            data: updateData,
            include: {
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                            }
                        }
                    }
                },
                Warehouse: {
                    select: { id: true, name: true }
                },
                Branch: {
                    select: { id: true, name: true }
                },
                CreatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                PostedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                // @ts-ignore
                UpdatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        // Log update
        await auditService.log({
            userId,
            action: data.status === 'CANCELLED' ? 'CANCEL' : 'UPDATE',
            resource: 'INVENTORY_ADJUSTMENT',
            resourceId: id,
            details: { adjustmentNumber: updated.adjustmentNumber }
        });

        return updated as unknown as InventoryAdjustmentWithRelations;
    }

    /**
     * Post an adjustment (Apply to Inventory)
     */
    async post(id: string, userId: string): Promise<InventoryAdjustmentWithRelations> {
        return await prisma.$transaction(async (tx) => {
            const adjustment = await tx.inventoryAdjustment.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!adjustment) {
                throw new NotFoundError('Inventory adjustment not found');
            }

            if (adjustment.status !== 'DRAFT') {
                throw new ValidationError('Only draft adjustments can be posted');
            }

            // Batch fetch current inventory levels
            const productIds = adjustment.items.map(i => i.productId);
            const inventoryRecords = await tx.inventory.findMany({
                where: {
                    warehouseId: adjustment.warehouseId,
                    productId: { in: productIds }
                }
            });
            const inventoryMap = new Map(inventoryRecords.map(inv => [inv.productId, Number(inv.quantity)]));

            // Record system quantities and actual quantities for all items
            for (const item of adjustment.items) {
                const currentStock = inventoryMap.get(item.productId) || 0;

                let actualQuantity: number;
                if (item.type === 'ABSOLUTE') {
                    // For absolute, item.quantity IS the target actual quantity
                    actualQuantity = item.quantity;
                } else {
                    // For relative, item.quantity is the change
                    actualQuantity = currentStock + item.quantity;
                }

                await tx.inventoryAdjustmentItem.update({
                    where: { id: item.id },
                    data: {
                        systemQuantity: currentStock,
                        actualQuantity: actualQuantity
                    }
                });
            }

            // Refresh adjustment data to get updated items
            const refreshedAdjustment = await tx.inventoryAdjustment.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!refreshedAdjustment) throw new NotFoundError('Adjustment not found after update');

            const stockItems = refreshedAdjustment.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                uom: item.uom,
                adjustmentType: item.type as 'RELATIVE' | 'ABSOLUTE'
            }));

            await inventoryService.adjustStockBatch({
                warehouseId: refreshedAdjustment.warehouseId,
                reason: refreshedAdjustment.reason,
                adjustmentDate: refreshedAdjustment.adjustmentDate,
                referenceNumber: refreshedAdjustment.adjustmentNumber, // Link StockMovement to this Adjustment Number
                items: stockItems
            });

            // Mark as posted
            const updated = await tx.inventoryAdjustment.update({
                where: { id },
                data: {
                    status: 'POSTED',
                    postedById: userId,
                    updatedAt: new Date()
                },
                include: {
                    items: {
                        include: {
                            Product: {
                                select: {
                                    id: true,
                                    name: true,
                                    baseUOM: true,
                                }
                            }
                        }
                    },
                    Warehouse: {
                        select: { id: true, name: true }
                    },
                    Branch: {
                        select: { id: true, name: true }
                    },
                    CreatedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    PostedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    // @ts-ignore
                    UpdatedBy: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            });

            // Log post
            await auditService.log({
                userId,
                action: 'POST',
                resource: 'INVENTORY_ADJUSTMENT',
                resourceId: id,
                details: { adjustmentNumber: updated.adjustmentNumber }
            });

            return updated as unknown as InventoryAdjustmentWithRelations;
        });
    }

    /**
     * Get filtered adjustments with pagination
     */
    async findAll(filters?: AdjustmentFilters & { page?: number; limit?: number }) {
        const { page = 1, limit = 10 } = filters || {};
        const skip = (page - 1) * limit;

        const where: Prisma.InventoryAdjustmentWhereInput = {
            ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
            ...(filters?.branchId && { branchId: filters.branchId }),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.dateFrom || filters?.dateTo ? {
                adjustmentDate: {
                    ...(filters?.dateFrom && { gte: filters.dateFrom }),
                    ...(filters?.dateTo && { lte: filters.dateTo }),
                }
            } : {}),
            ...(filters?.searchQuery && {
                OR: [
                    { adjustmentNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
                    { reason: { contains: filters.searchQuery, mode: 'insensitive' } },
                    { referenceNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
                ]
            })
        };

        const total = await prisma.inventoryAdjustment.count({ where });

        const data = await prisma.inventoryAdjustment.findMany({
            where,
            include: {
                Warehouse: { select: { id: true, name: true } },
                Branch: { select: { id: true, name: true } },
                CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                PostedBy: { select: { id: true, firstName: true, lastName: true } },
                // @ts-ignore
                UpdatedBy: { select: { id: true, firstName: true, lastName: true } },
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            ...(limit > 0 ? {
                take: limit,
                skip: skip
            } : {})
        });

        return {
            data: data as unknown as InventoryAdjustmentWithRelations[],
            meta: {
                total,
                page,
                limit,
                totalPages: limit > 0 ? Math.ceil(total / limit) : 1
            }
        };
    }

    async findById(id: string): Promise<InventoryAdjustmentWithRelations> {
        const adjustment = await prisma.inventoryAdjustment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                baseUOM: true,
                            }
                        }
                    }
                },
                Warehouse: {
                    select: { id: true, name: true }
                },
                Branch: {
                    select: { id: true, name: true }
                },
                CreatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                PostedBy: {
                    select: { id: true, firstName: true, lastName: true }
                },
                // @ts-ignore
                UpdatedBy: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        if (!adjustment) throw new NotFoundError('Adjustment not found');
        return adjustment as unknown as InventoryAdjustmentWithRelations;
    }

    /**
     * Copy an adjustment to a new draft
     */
    async copy(id: string, userId: string): Promise<InventoryAdjustmentWithRelations> {
        const original = await this.findById(id);

        // Create new items based on original
        const newItems = original.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            uom: item.uom,
            type: item.type as 'RELATIVE' | 'ABSOLUTE',
            systemQuantity: undefined,
            actualQuantity: undefined
        }));

        const input: CreateAdjustmentInput = {
            warehouseId: original.warehouseId,
            branchId: original.branchId,
            reason: `Copy of ${original.adjustmentNumber}: ${original.reason}`,
            items: newItems,
            referenceNumber: original.referenceNumber || undefined
        };

        const copy = await this.create(input, userId);

        // Log specific COPY action
        await auditService.log({
            userId,
            action: 'COPY',
            resource: 'INVENTORY_ADJUSTMENT',
            resourceId: copy.id,
            details: { sourceId: id, sourceNumber: original.adjustmentNumber }
        });

        return copy;
    }

    /**
     * Create a reversal adjustment
     */
    async reverse(id: string, userId: string): Promise<InventoryAdjustmentWithRelations> {
        const original = await this.findById(id);

        if (original.status !== 'POSTED') {
            throw new ValidationError('Only posted adjustments can be reversed');
        }

        const reversalItems = original.items.map(item => {
            let reverseQuantity = 0;
            let type: 'RELATIVE' | 'ABSOLUTE' = 'RELATIVE';

            if (item.type === 'RELATIVE') {
                reverseQuantity = -item.quantity;
            } else {
                // Reversal of ABSOLUTE uses recorded system and actual quantities
                const system = item.systemQuantity || 0;
                const actual = item.actualQuantity || item.quantity;
                const delta = actual - system;

                // Reversal is negative of delta
                reverseQuantity = -delta;
            }

            return {
                productId: item.productId,
                quantity: reverseQuantity,
                uom: item.uom,
                type: type
            };
        });

        const input: CreateAdjustmentInput = {
            warehouseId: original.warehouseId,
            branchId: original.branchId,
            reason: `Reversal of ${original.adjustmentNumber}`,
            items: reversalItems,
            referenceNumber: original.adjustmentNumber
        };

        const reversal = await this.create(input, userId);

        // Log specific REVERSE action
        await auditService.log({
            userId,
            action: 'REVERSE',
            resource: 'INVENTORY_ADJUSTMENT',
            resourceId: reversal.id,
            details: { reversedId: id, reversedNumber: original.adjustmentNumber }
        });

        // Automatically post the reversal
        return await this.post(reversal.id, userId);
    }
}

export const inventoryAdjustmentService = new InventoryAdjustmentService();
