import { InventoryBatch } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productService } from '@/services/product.service';
import { randomUUID } from 'crypto';
import {
  AddStockInput,
  DeductStockInput,
  TransferStockInput,
  InventoryBatchFilters,
  StockMovementFilters,
  InventoryBatchWithRelations,
  StockMovementWithRelations,
  StockLevel,
} from '@/types/inventory.types';
import { ValidationError, NotFoundError, InsufficientStockError } from '@/lib/errors';

export class InventoryService {
  /**
   * Generate a unique batch number in format: BATCH-YYYYMMDD-XXXX
   */
  async generateBatchNumber(tx?: any): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Use transaction context if provided, otherwise use global prisma
    const client = tx || prisma;

    // Find the last batch number for today
    const lastBatch = await client.inventoryBatch.findFirst({
      where: {
        batchNumber: {
          startsWith: `BATCH-${dateStr}`,
        },
      },
      orderBy: {
        batchNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastBatch) {
      const lastSequence = parseInt(lastBatch.batchNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `BATCH-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate weighted average cost for a product in a warehouse
   * Formula: (sum of quantity × unitCost) / (sum of quantity)
   */
  async calculateWeightedAverageCost(
    productId: string,
    warehouseId: string
  ): Promise<number> {
    const batches = await inventoryRepository.findActiveBatches(productId, warehouseId);

    if (batches.length === 0) {
      return 0;
    }

    const totalCost = batches.reduce(
      (sum, batch) => sum + Number(batch.quantity) * Number(batch.unitCost),
      0
    );

    const totalQuantity = batches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  /**
   * Convert quantity from any UOM to base UOM
   */
  async convertToBaseUOM(
    productId: string,
    quantity: number,
    uom: string
  ): Promise<number> {
    const product = await productService.getProductById(productId);

    // If already base UOM, return as-is
    if (uom.trim().toLowerCase() === product.baseUOM.trim().toLowerCase()) {
      return quantity;
    }

    // Find the alternate UOM
    const alternateUOM = product.alternateUOMs.find(
      (u: any) => u.name.trim().toLowerCase() === uom.trim().toLowerCase()
    );

    if (!alternateUOM) {
      throw new ValidationError(`UOM '${uom}' not found for product ${product.name}`, {
        uom: 'Invalid UOM for this product',
      });
    }

    // Convert: quantity × conversionFactor = base units
    return quantity * Number(alternateUOM.conversionFactor);
  }

  /**
   * Get current stock level for a product in a warehouse (in base UOM)
   */
  async getCurrentStockLevel(productId: string, warehouseId: string): Promise<number> {
    const batches = await inventoryRepository.findActiveBatches(productId, warehouseId);

    return batches.reduce((sum, batch) => sum + Number(batch.quantity), 0);
  }

  /**
   * Add stock to inventory
   */
  async addStock(data: AddStockInput): Promise<InventoryBatch> {
    // Validate product exists
    const product = await productService.getProductById(data.productId);

    // Convert quantity to base UOM
    const baseQuantity = await this.convertToBaseUOM(
      data.productId,
      data.quantity,
      data.uom
    );

    // Validate quantity
    if (baseQuantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero', {
        quantity: 'Invalid quantity',
      });
    }

    // Validate unit cost
    if (data.unitCost <= 0) {
      throw new ValidationError('Unit cost must be greater than zero', {
        unitCost: 'Invalid unit cost',
      });
    }

    // Calculate expiry date
    const receivedDate = new Date();
    const expiryDate = new Date(receivedDate);
    expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

    // Create batch and movement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate batch number inside transaction for consistency
      const batchNumber = await this.generateBatchNumber(tx);

      // Create inventory batch
      const batch = await tx.inventoryBatch.create({
        data: {
          id: randomUUID(),
          batchNumber,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: baseQuantity,
          unitCost: data.unitCost,
          receivedDate,
          expiryDate,
          status: 'active',
        },
      });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          batchId: batch.id,
          type: 'IN',
          quantity: baseQuantity,
          reason: data.reason || 'Stock addition',
          referenceId: data.referenceId,
          referenceType: data.referenceType,
        },
      });

      return batch;
    });

    return result;
  }

  /**
   * Deduct stock from inventory using FIFO (First Expiry, First Out)
   */
  async deductStock(data: DeductStockInput): Promise<void> {
    // Validate product exists
    const product = await productService.getProductById(data.productId);

    // Convert quantity to base UOM
    const baseQuantity = await this.convertToBaseUOM(
      data.productId,
      data.quantity,
      data.uom
    );

    // Validate quantity
    if (baseQuantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero', {
        quantity: 'Invalid quantity',
      });
    }

    // Get active batches ordered by expiry date (FIFO)
    const batches = await inventoryRepository.findActiveBatches(
      data.productId,
      data.warehouseId
    );

    // Check if sufficient stock is available
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    if (totalAvailable < baseQuantity) {
      throw new InsufficientStockError(
        product.name,
        totalAvailable,
        baseQuantity
      );
    }

    // Deduct from batches in transaction
    await prisma.$transaction(async (tx) => {
      let remainingToDeduct = baseQuantity;

      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;

        const batchQuantity = Number(batch.quantity);
        const deductFromBatch = Math.min(batchQuantity, remainingToDeduct);

        // Update batch quantity
        const newQuantity = batchQuantity - deductFromBatch;
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            quantity: newQuantity,
            status: newQuantity === 0 ? 'depleted' : 'active',
          },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            id: randomUUID(),
            batchId: batch.id,
            type: 'OUT',
            quantity: deductFromBatch,
            reason: data.reason || 'Stock deduction',
            referenceId: data.referenceId,
            referenceType: data.referenceType,
          },
        });

        remainingToDeduct -= deductFromBatch;
      }
    });
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(data: TransferStockInput): Promise<void> {
    // Validate warehouses are different
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new ValidationError('Source and destination warehouses must be different', {
        warehouse: 'Cannot transfer to the same warehouse',
      });
    }

    // Validate product exists
    const product = await productService.getProductById(data.productId);

    // Convert quantity to base UOM
    const baseQuantity = await this.convertToBaseUOM(
      data.productId,
      data.quantity,
      data.uom
    );

    // Validate quantity
    if (baseQuantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero', {
        quantity: 'Invalid quantity',
      });
    }

    // Get active batches from source warehouse ordered by expiry date (FIFO)
    const sourceBatches = await inventoryRepository.findActiveBatches(
      data.productId,
      data.sourceWarehouseId
    );

    // Check if sufficient stock is available in source warehouse
    const totalAvailable = sourceBatches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    if (totalAvailable < baseQuantity) {
      throw new InsufficientStockError(
        product.name,
        totalAvailable,
        baseQuantity
      );
    }

    // Get weighted average cost from source warehouse for the new batch
    const avgCost = await this.calculateWeightedAverageCost(
      data.productId,
      data.sourceWarehouseId
    );

    // Perform transfer in a single transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Deduct from source warehouse batches (FIFO)
      let remainingToDeduct = baseQuantity;

      for (const batch of sourceBatches) {
        if (remainingToDeduct <= 0) break;

        const batchQuantity = Number(batch.quantity);
        const deductFromBatch = Math.min(batchQuantity, remainingToDeduct);

        // Update batch quantity
        const newQuantity = batchQuantity - deductFromBatch;
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            quantity: newQuantity,
            status: newQuantity === 0 ? 'depleted' : 'active',
          },
        });

        // Record stock movement OUT from source warehouse
        await tx.stockMovement.create({
          data: {
            id: randomUUID(),
            batchId: batch.id,
            type: 'OUT',
            quantity: deductFromBatch,
            reason: data.reason || `Transfer to destination warehouse`,
            referenceType: 'TRANSFER',
          },
        });

        remainingToDeduct -= deductFromBatch;
      }

      // Step 2: Add to destination warehouse as new batch
      // Generate batch number (pass transaction context)
      const batchNumber = await this.generateBatchNumber(tx);

      // Calculate expiry date based on product shelf life
      const receivedDate = new Date();
      const expiryDate = new Date(receivedDate);
      expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

      // Create new batch in destination warehouse
      const newBatch = await tx.inventoryBatch.create({
        data: {
          id: randomUUID(),
          batchNumber,
          productId: data.productId,
          warehouseId: data.destinationWarehouseId,
          quantity: baseQuantity,
          unitCost: avgCost,
          receivedDate,
          expiryDate,
          status: 'active',
        },
      });

      // Record stock movement IN to destination warehouse
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          batchId: newBatch.id,
          type: 'IN',
          quantity: baseQuantity,
          reason: data.reason || `Transfer from source warehouse`,
          referenceType: 'TRANSFER',
        },
      });
    });
  }

  /**
   * Adjust stock quantity for a specific batch
   */
  async adjustStock(data: {
    batchId: string;
    newQuantity: number;
    reason: string;
  }): Promise<void> {
    // Validate batch exists
    const batch = await inventoryRepository.findBatchById(data.batchId);
    if (!batch) {
      throw new NotFoundError('Inventory batch');
    }

    // Validate new quantity
    if (data.newQuantity < 0) {
      throw new ValidationError('Quantity cannot be negative', {
        newQuantity: 'Invalid quantity',
      });
    }

    const currentQuantity = Number(batch.quantity);
    const quantityDifference = data.newQuantity - currentQuantity;

    // Update batch and record movement in transaction
    await prisma.$transaction(async (tx) => {
      // Update batch quantity and status
      await tx.inventoryBatch.update({
        where: { id: data.batchId },
        data: {
          quantity: data.newQuantity,
          status: data.newQuantity === 0 ? 'depleted' : batch.status,
        },
      });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          batchId: data.batchId,
          type: 'ADJUSTMENT',
          quantity: Math.abs(quantityDifference),
          reason: data.reason,
        },
      });
    });
  }

  /**
   * Get all inventory batches with filters
   */
  async getAllBatches(filters?: InventoryBatchFilters): Promise<InventoryBatchWithRelations[]> {
    return await inventoryRepository.findAllBatches(filters);
  }

  /**
   * Get batch by ID
   */
  async getBatchById(id: string): Promise<InventoryBatchWithRelations> {
    const batch = await inventoryRepository.findBatchById(id);
    if (!batch) {
      throw new NotFoundError('Inventory batch');
    }
    return batch;
  }

  /**
   * Get all stock movements with filters
   */
  async getAllMovements(filters?: StockMovementFilters): Promise<StockMovementWithRelations[]> {
    return await inventoryRepository.findAllMovements(filters);
  }

  /**
   * Get stock levels for all products in a warehouse or all warehouses
   */
  async getStockLevels(warehouseId?: string): Promise<StockLevel[]> {
    // Get all active batches grouped by product and warehouse
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        ...(warehouseId && { warehouseId }),
      },
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
      orderBy: [
        { productId: 'asc' },
        { warehouseId: 'asc' },
        { expiryDate: 'asc' },
      ],
    });

    // Group batches by product and warehouse
    const grouped = batches.reduce((acc, batch) => {
      const key = `${batch.productId}-${batch.warehouseId}`;
      if (!acc[key]) {
        acc[key] = {
          productId: batch.productId,
          productName: (batch as any).Product.name,
          warehouseId: batch.warehouseId,
          warehouseName: (batch as any).Warehouse.name,
          baseUOM: (batch as any).Product.baseUOM,
          batches: [],
          totalQuantity: 0,
          totalCost: 0,
        };
      }

      const quantity = Number(batch.quantity);
      const unitCost = Number(batch.unitCost);

      acc[key].batches.push({
        batchNumber: batch.batchNumber,
        quantity,
        unitCost,
        expiryDate: batch.expiryDate,
        status: batch.status,
      });

      acc[key].totalQuantity += quantity;
      acc[key].totalCost += quantity * unitCost;

      return acc;
    }, {} as Record<string, any>);

    // Calculate weighted average cost and format results
    return Object.values(grouped).map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
      totalQuantity: item.totalQuantity,
      baseUOM: item.baseUOM,
      weightedAverageCost: item.totalQuantity > 0 ? item.totalCost / item.totalQuantity : 0,
      batches: item.batches,
    }));
  }

  /**
   * Get stock level with details for a product in a warehouse
   */
  async getStockLevel(
    productId: string,
    warehouseId: string
  ): Promise<StockLevel | null> {
    const product = await productService.getProductById(productId);
    const batches = await inventoryRepository.findActiveBatches(productId, warehouseId);

    if (batches.length === 0) {
      return null;
    }

    const totalQuantity = batches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    const weightedAverageCost = await this.calculateWeightedAverageCost(
      productId,
      warehouseId
    );

    // Get warehouse info
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { name: true },
    });

    return {
      productId: product.id,
      productName: product.name,
      warehouseId,
      warehouseName: warehouse?.name || '',
      totalQuantity,
      baseUOM: product.baseUOM,
      weightedAverageCost,
      batches: batches.map((batch) => ({
        batchNumber: batch.batchNumber,
        quantity: Number(batch.quantity),
        unitCost: Number(batch.unitCost),
        expiryDate: batch.expiryDate,
        status: batch.status,
      })),
    };
  }

  /**
   * Calculate average cost for a product in a specific UOM
   * Converts base UOM average cost using product's UOM conversion factors
   */
  async getAverageCostByUOM(
    productId: string,
    warehouseId: string,
    uom: string
  ): Promise<number> {
    const product = await productService.getProductById(productId);

    // If already base UOM, return the weighted average cost directly
    if (uom.trim().toLowerCase() === product.baseUOM.trim().toLowerCase()) {
      return await this.calculateWeightedAverageCost(productId, warehouseId);
    }

    // Find the alternate UOM
    const alternateUOM = product.alternateUOMs.find(
      (u: any) => u.name.trim().toLowerCase() === uom.trim().toLowerCase()
    );

    if (!alternateUOM) {
      throw new ValidationError(`UOM '${uom}' not found for product ${product.name}`, {
        uom: 'Invalid UOM for this product',
      });
    }

    // Get base UOM average cost
    const baseAverageCost = await this.calculateWeightedAverageCost(productId, warehouseId);

    // Convert: base cost × conversion factor = cost in selected UOM
    // Example: if base is "bottles" and alternate is "cases" with factor 12,
    // then cost per case = cost per bottle × 12
    return baseAverageCost * Number(alternateUOM.conversionFactor);
  }

  /**
   * Get total stock for a product across all warehouses or specific warehouse
   */
  async getTotalStock(productId: string, warehouseId?: string): Promise<number> {
    return await inventoryRepository.getTotalStockByProduct(productId, warehouseId);
  }

  /**
   * Mark expired batches
   */
  async markExpiredBatches(): Promise<number> {
    const expiredBatches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        expiryDate: {
          lt: new Date(),
        },
      },
    });

    for (const batch of expiredBatches) {
      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: { status: 'expired' },
      });
    }

    return expiredBatches.length;
  }

  /**
   * Get expiring batches within specified days
   */
  async getExpiringBatches(daysUntilExpiry: number = 30): Promise<InventoryBatchWithRelations[]> {
    return await inventoryRepository.getExpiringBatches(daysUntilExpiry);
  }

  /**
   * Get expired batches
   */
  async getExpiredBatches(): Promise<InventoryBatchWithRelations[]> {
    return await inventoryRepository.getExpiredBatches();
  }
}

export const inventoryService = new InventoryService();
