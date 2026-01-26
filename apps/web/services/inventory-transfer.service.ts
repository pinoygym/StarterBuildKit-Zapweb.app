import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { inventoryService } from '@/services/inventory.service';
import { inventoryTransferRepository } from '@/repositories/inventory-transfer.repository';
import {
    CreateTransferInput,
    UpdateTransferInput,
    InventoryTransferWithRelations,
    TransferFilters,
} from '@/types/inventory-transfer.types';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { Prisma } from '@prisma/client';
import { auditService } from './audit.service';

export class InventoryTransferService {

    private async generateTransferNumber(tx: Prisma.TransactionClient): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const prefix = `TRF-${dateStr}`;

        // Find the last transfer number for today
        const lastTransfer = await tx.inventoryTransfer.findFirst({
            where: {
                transferNumber: {
                    startsWith: prefix
                }
            },
            orderBy: {
                transferNumber: 'desc'
            }
        });

        let nextSequence = 1;
        if (lastTransfer) {
            const parts = lastTransfer.transferNumber.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) {
                nextSequence = lastSeq + 1;
            }
        }

        const sequence = nextSequence.toString().padStart(4, '0');
        return `${prefix}-${sequence}`;
    }

    private validateNoDuplicateProducts(items: { productId: string }[]): void {
        const productIds = items.map(item => item.productId);
        const uniqueProductIds = new Set(productIds);

        if (productIds.length !== uniqueProductIds.size) {
            const duplicates = productIds.filter((id, index) =>
                productIds.indexOf(id) !== index
            );
            const uniqueDuplicates = [...new Set(duplicates)];

            throw new ValidationError(
                `Duplicate products found in transfer: ${uniqueDuplicates.join(', ')}`
            );
        }
    }

    private async validateUOMs(items: { productId: string, uom: string }[], tx?: Prisma.TransactionClient): Promise<void> {
        const client = tx || prisma;
        const productIds = [...new Set(items.map(i => i.productId))];
        const products = await client.product.findMany({
            where: { id: { in: productIds } },
            include: { productUOMs: true }
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new ValidationError(`Product with ID "${item.productId}" not found`);
            }

            const uomName = item.uom.toLowerCase();
            const isValid =
                product.baseUOM.toLowerCase() === uomName ||
                product.productUOMs.some(u => u.name.toLowerCase() === uomName);

            if (!isValid) {
                throw new ValidationError(
                    `UOM "${item.uom}" is not valid for product "${product.name}"`
                );
            }
        }
    }

    async create(data: CreateTransferInput, userId: string): Promise<InventoryTransferWithRelations> {
        this.validateNoDuplicateProducts(data.items);
        await this.validateUOMs(data.items);

        if (data.sourceWarehouseId === data.destinationWarehouseId) {
            throw new ValidationError('Source and destination warehouses must be different');
        }

        return await prisma.$transaction(async (tx) => {
            const transferNumber = await this.generateTransferNumber(tx);

            const transfer = await tx.inventoryTransfer.create({
                data: {
                    id: randomUUID(),
                    transferNumber,
                    sourceWarehouseId: data.sourceWarehouseId,
                    destinationWarehouseId: data.destinationWarehouseId,
                    branchId: data.branchId,
                    reason: data.reason,
                    transferDate: data.transferDate || new Date(),
                    status: 'DRAFT',
                    createdById: userId,
                    items: {
                        create: data.items.map(item => ({
                            id: randomUUID(),
                            productId: item.productId,
                            quantity: item.quantity,
                            uom: item.uom,
                        }))
                    }
                },
                include: {
                    sourceWarehouse: { select: { id: true, name: true } },
                    destinationWarehouse: { select: { id: true, name: true } },
                    Branch: { select: { id: true, name: true } },
                    CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                    items: {
                        include: {
                            Product: {
                                select: { id: true, name: true, baseUOM: true, productUOMs: true }
                            }
                        }
                    }
                }
            });

            await auditService.log({
                userId,
                action: 'CREATE',
                resource: 'INVENTORY_TRANSFER',
                resourceId: transfer.id,
                details: { transferNumber }
            }, tx);

            return transfer as unknown as InventoryTransferWithRelations;
        });
    }

    async update(id: string, data: UpdateTransferInput, userId: string): Promise<InventoryTransferWithRelations> {
        const transfer = await prisma.inventoryTransfer.findUnique({
            where: { id },
        });

        if (!transfer) throw new NotFoundError('Inventory transfer not found');
        if (transfer.status !== 'DRAFT' && data.status !== 'CANCELLED') {
            throw new ValidationError('Only draft transfers can be updated');
        }

        if (data.items) {
            this.validateNoDuplicateProducts(data.items);
            await this.validateUOMs(data.items);
        }

        if (data.sourceWarehouseId && data.destinationWarehouseId) {
            if (data.sourceWarehouseId === data.destinationWarehouseId) {
                throw new ValidationError('Source and destination warehouses must be different');
            }
        } else if (data.sourceWarehouseId && data.sourceWarehouseId === transfer.destinationWarehouseId) {
            throw new ValidationError('Source and destination warehouses must be different');
        } else if (data.destinationWarehouseId && data.destinationWarehouseId === transfer.sourceWarehouseId) {
            throw new ValidationError('Source and destination warehouses must be different');
        }

        const { items, ...transferData } = data;

        const updated = await prisma.$transaction(async (tx) => {
            const updateData: any = {
                ...transferData,
                updatedAt: new Date(),
            };

            if (items) {
                await tx.inventoryTransferItem.deleteMany({ where: { transferId: id } });
                updateData.items = {
                    create: items.map(item => ({
                        id: randomUUID(),
                        productId: item.productId,
                        quantity: item.quantity,
                        uom: item.uom,
                    }))
                };
            }

            const result = await tx.inventoryTransfer.update({
                where: { id },
                data: updateData,
                include: {
                    sourceWarehouse: { select: { id: true, name: true } },
                    destinationWarehouse: { select: { id: true, name: true } },
                    Branch: { select: { id: true, name: true } },
                    CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                    items: {
                        include: {
                            Product: {
                                select: { id: true, name: true, baseUOM: true, productUOMs: true }
                            }
                        }
                    }
                }
            });

            await auditService.log({
                userId,
                action: data.status === 'CANCELLED' ? 'CANCEL' : 'UPDATE',
                resource: 'INVENTORY_TRANSFER',
                resourceId: id,
                details: { transferNumber: result.transferNumber }
            }, tx);

            return result;
        });

        return updated as unknown as InventoryTransferWithRelations;
    }

    async post(id: string, userId: string): Promise<InventoryTransferWithRelations> {
        return await prisma.$transaction(async (tx) => {
            const transfer = await tx.inventoryTransfer.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!transfer) throw new NotFoundError('Inventory transfer not found');
            if (transfer.status !== 'DRAFT') throw new ValidationError('Only draft transfers can be posted');
            if (transfer.items.length === 0) throw new ValidationError('Transfer has no items');

            // Apply stock transfer via inventoryService
            await inventoryService.transferStocks({
                sourceWarehouseId: transfer.sourceWarehouseId,
                destinationWarehouseId: transfer.destinationWarehouseId,
                items: transfer.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    uom: item.uom
                })),
                reason: transfer.reason || `Inventory Transfer ${transfer.transferNumber}`,
                transferDate: transfer.transferDate,
                referenceNumber: transfer.transferNumber
            }, tx);

            const updated = await tx.inventoryTransfer.update({
                where: { id },
                data: {
                    status: 'POSTED',
                    updatedAt: new Date()
                },
                include: {
                    sourceWarehouse: { select: { id: true, name: true } },
                    destinationWarehouse: { select: { id: true, name: true } },
                    Branch: { select: { id: true, name: true } },
                    CreatedBy: { select: { id: true, firstName: true, lastName: true } },
                    items: {
                        include: {
                            Product: {
                                select: { id: true, name: true, baseUOM: true, productUOMs: true }
                            }
                        }
                    }
                }
            });

            await auditService.log({
                userId,
                action: 'POST',
                resource: 'INVENTORY_TRANSFER',
                resourceId: id,
                details: { transferNumber: updated.transferNumber }
            }, tx);

            return updated as unknown as InventoryTransferWithRelations;
        });
    }

    async findAll(filters?: TransferFilters) {
        const data = await inventoryTransferRepository.findAll(filters);
        const total = await inventoryTransferRepository.count(filters);

        const page = filters?.page || 1;
        const limit = filters?.limit || 10;

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findById(id: string): Promise<InventoryTransferWithRelations> {
        const transfer = await inventoryTransferRepository.findById(id);
        if (!transfer) throw new NotFoundError('Inventory transfer not found');
        return transfer;
    }

    async delete(id: string, userId: string): Promise<void> {
        const transfer = await this.findById(id);
        if (transfer.status !== 'DRAFT') {
            throw new ValidationError('Only draft transfers can be deleted');
        }

        await prisma.inventoryTransfer.delete({ where: { id } });

        await auditService.log({
            userId,
            action: 'DELETE',
            resource: 'INVENTORY_TRANSFER',
            resourceId: id,
            details: { transferNumber: transfer.transferNumber }
        });
    }
}

export const inventoryTransferService = new InventoryTransferService();
