import { Inventory, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productService } from '@/services/product.service';
import { randomUUID } from 'crypto';
import {
  AddStockInput,
  DeductStockInput,
  TransferStockInput,
  StockMovementFilters,
  StockMovementWithRelations,
  StockLevel,
  ProductInventorySummary,
  InventoryWithRelations,
  InventoryFilters,
  TransferStockBatchInput,
  AdjustStockBatchInput,
  AdjustmentSlip,
  AdjustmentFilters,
} from '@/types/inventory.types';
import { ValidationError, NotFoundError, InsufficientStockError, AppError } from '@/lib/errors';

export class InventoryService {
  /**
   * Get all inventory records with filters
   */
  async getAll(filters?: InventoryFilters): Promise<InventoryWithRelations[]> {
    const inventory = await prisma.inventory.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
      },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            category: true,
            averageCostPrice: true,
            productUOMs: true,
          },
        },
        Warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: [
        { Product: { name: 'asc' } },
        { Warehouse: { name: 'asc' } },
      ],
    });

    return inventory as InventoryWithRelations[];
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
      // FALLBACK: If UOM is 'pcs' or 'pc', treat as 1:1 with base units
      // This handles cases where users use 'pcs' interchangeably with base units
      if (['pcs', 'pc'].includes(uom.trim().toLowerCase())) {
        console.warn(`UOM '${uom}' not found for product ${product.name}, defaulting to 1:1 conversion.`);
        return quantity;
      }

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
  async getCurrentStockLevel(productId: string, warehouseId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const inventory = await inventoryRepository.findInventory(productId, warehouseId, tx);
    return inventory ? Number(inventory.quantity) : 0;
  }

  /**
   * Add stock to inventory
   */
  async addStock(data: AddStockInput, tx?: Prisma.TransactionClient): Promise<Inventory> {
    // Validate product exists
    const product = await productService.getProductById(data.productId);

    // Validate unit cost
    if (data.unitCost <= 0) {
      throw new ValidationError('Unit cost must be greater than zero', {
        unitCost: 'Invalid cost',
      });
    }

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

    // Convert unit cost to base UOM cost
    // If receiving 1 case @ ₱100 and case = 10 bottles, base cost = ₱100 / 10 = ₱10/bottle
    let baseUnitCost = data.unitCost;
    if (data.uom.trim().toLowerCase() !== product.baseUOM.trim().toLowerCase()) {
      const alternateUOM = product.alternateUOMs.find(
        (u: any) => u.name.trim().toLowerCase() === data.uom.trim().toLowerCase()
      );
      if (alternateUOM) {
        baseUnitCost = data.unitCost / Number(alternateUOM.conversionFactor);
      }
    }

    const execute = async (transaction: Prisma.TransactionClient) => {
      // Get current inventory for this warehouse
      const currentInventory = await transaction.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      const currentQuantity = currentInventory ? Number(currentInventory.quantity) : 0;
      const newQuantity = currentQuantity + baseQuantity;

      // Calculate weighted average cost (global across all warehouses)
      // Get total stock across all warehouses
      const totalStock = await inventoryRepository.getTotalStockByProduct(data.productId, transaction);
      const currentAverageCost = Number(product.averageCostPrice);

      let newAverageCost: number;
      if (totalStock === 0) {
        // First stock entry - use the new cost
        newAverageCost = baseUnitCost;
      } else {
        // Weighted average: (currentTotalValue + newValue) / (currentQty + newQty)
        const currentTotalValue = currentAverageCost * totalStock;
        const newValue = baseUnitCost * baseQuantity;
        newAverageCost = (currentTotalValue + newValue) / (totalStock + baseQuantity);
      }

      // Update product's average cost
      await transaction.product.update({
        where: { id: data.productId },
        data: {
          averageCostPrice: newAverageCost,
        },
      });

      // Update inventory
      const inventory = await transaction.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        update: {
          quantity: newQuantity,
        },
        create: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: newQuantity,
        },
      });

      // Record stock movement
      await transaction.stockMovement.create({
        data: {
          id: randomUUID(),
          productId: data.productId,
          warehouseId: data.warehouseId,
          type: 'IN',
          quantity: baseQuantity,
          reason: data.reason || 'Stock addition',
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          uom: data.uom,
          conversionFactor: baseUnitCost !== data.unitCost ? data.unitCost / baseUnitCost : 1,
        },
      });

      return inventory;
    };

    if (tx) {
      return execute(tx);
    }

    return await prisma.$transaction(execute);
  }

  /**
   * Deduct stock from inventory
   */
  async deductStock(data: DeductStockInput, tx?: Prisma.TransactionClient): Promise<void> {
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

    // Check if sufficient stock is available
    const currentStock = await this.getCurrentStockLevel(data.productId, data.warehouseId, tx);

    if (currentStock < baseQuantity) {
      throw new InsufficientStockError(
        product.name,
        currentStock,
        baseQuantity
      );
    }

    const execute = async (transaction: Prisma.TransactionClient) => {
      const newQuantity = currentStock - baseQuantity;

      // Update inventory
      await transaction.inventory.update({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        data: {
          quantity: newQuantity,
        },
      });

      // Record stock movement
      await transaction.stockMovement.create({
        data: {
          id: randomUUID(),
          productId: data.productId,
          warehouseId: data.warehouseId,
          type: 'OUT',
          quantity: baseQuantity,
          reason: data.reason || 'Stock deduction',
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          uom: data.uom,
          conversionFactor: baseQuantity / data.quantity,
        },
      });
    };

    if (tx) {
      return execute(tx);
    }

    await prisma.$transaction(execute);
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

    // Check if sufficient stock is available in source warehouse
    const sourceStock = await this.getCurrentStockLevel(data.productId, data.sourceWarehouseId);

    if (sourceStock < baseQuantity) {
      throw new InsufficientStockError(
        product.name,
        sourceStock,
        baseQuantity
      );
    }

    // Perform transfer in a single transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Deduct from source warehouse
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.sourceWarehouseId,
          },
        },
        data: {
          quantity: { decrement: baseQuantity },
        },
      });

      // Record stock movement OUT from source warehouse
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          productId: data.productId,
          warehouseId: data.sourceWarehouseId,
          type: 'OUT',
          quantity: baseQuantity,
          reason: data.reason || `Transfer to ${data.destinationWarehouseId}`,
          referenceId: data.referenceId,
          referenceType: 'TRANSFER',
          uom: data.uom,
          conversionFactor: baseQuantity / data.quantity,
        },
      });

      // Step 2: Add to destination warehouse
      await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.destinationWarehouseId,
          },
        },
        update: {
          quantity: { increment: baseQuantity },
        },
        create: {
          productId: data.productId,
          warehouseId: data.destinationWarehouseId,
          quantity: baseQuantity,
        },
      });

      // Record stock movement IN to destination warehouse
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          productId: data.productId,
          warehouseId: data.destinationWarehouseId,
          type: 'IN',
          quantity: baseQuantity,
          reason: data.reason || `Transfer from ${data.sourceWarehouseId}`,
          referenceId: data.referenceId,
          referenceType: 'TRANSFER',
          uom: data.uom,
          conversionFactor: baseQuantity / data.quantity,
        },
      });
    });
  }

  /**
   * Adjust stock quantity directly
   */
  async adjustStock(data: {
    productId: string;
    warehouseId: string;
    newQuantity: number;
    reason: string;
  }): Promise<void> {
    // Validate new quantity
    if (data.newQuantity < 0) {
      throw new ValidationError('Quantity cannot be negative', {
        newQuantity: 'Invalid quantity',
      });
    }

    const currentStock = await this.getCurrentStockLevel(data.productId, data.warehouseId);
    const quantityDifference = data.newQuantity - currentStock;

    if (quantityDifference === 0) return;

    // Update inventory and record movement in transaction
    await prisma.$transaction(async (tx) => {
      // Update inventory
      await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        update: {
          quantity: data.newQuantity,
        },
        create: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.newQuantity,
        },
      });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          id: randomUUID(),
          productId: data.productId,
          warehouseId: data.warehouseId,
          type: 'ADJUSTMENT',
          quantity: Math.abs(quantityDifference),
          reason: data.reason,
        },
      });
    });
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
    // Get all inventory records
    const inventory = await prisma.inventory.findMany({
      where: {
        ...(warehouseId && { warehouseId }),
      },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            averageCostPrice: true,
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
      ],
    });

    return inventory.map((item) => ({
      productId: item.productId,
      productName: item.Product.name,
      warehouseId: item.warehouseId,
      warehouseName: item.Warehouse.name,
      totalQuantity: Number(item.quantity),
      baseUOM: item.Product.baseUOM,
      weightedAverageCost: Number(item.Product.averageCostPrice),
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
    const inventory = await inventoryRepository.findInventory(productId, warehouseId);

    if (!inventory) {
      return null;
    }

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
      totalQuantity: Number(inventory.quantity),
      baseUOM: product.baseUOM,
      weightedAverageCost: Number(product.averageCostPrice),
    };
  }

  /**
   * Get total stock for a product across all warehouses or specific warehouse
   */
  async getTotalStock(productId: string, warehouseId?: string): Promise<number> {
    if (warehouseId) {
      return await this.getCurrentStockLevel(productId, warehouseId);
    }
    return await inventoryRepository.getTotalStockByProduct(productId);
  }

  /**
   * Get average cost for a product in a specific UOM
   */
  async getAverageCostByUOM(productId: string, warehouseId: string, uom: string): Promise<number> {
    // Get product to check base UOM and average cost
    const product = await productService.getProductById(productId);
    const averageCost = Number(product.averageCostPrice);

    // If UOM is the same as base UOM, return average cost directly
    if (uom.trim().toLowerCase() === product.baseUOM.trim().toLowerCase()) {
      return averageCost;
    }

    // Find the alternate UOM conversion
    const alternateUOM = product.alternateUOMs.find(
      (u: any) => u.name.trim().toLowerCase() === uom.trim().toLowerCase()
    );

    if (!alternateUOM) {
      throw new ValidationError(`UOM '${uom}' not found for product ${product.name}`, {
        uom: 'Invalid UOM for this product',
      });
    }

    // Convert cost: base cost ÷ conversion factor = alternate UOM cost
    // If base is 1 bottle = ₱25, and carton = 24 bottles, then 1 carton = ₱25 × 24 = ₱600
    return averageCost * Number(alternateUOM.conversionFactor);
  }

  /**
   * Get product summaries - aggregated inventory grouped by product
   */
  async getProductSummaries(filters?: { productId?: string; warehouseId?: string }): Promise<ProductInventorySummary[]> {
    // Get all inventory records with filters
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
      },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            baseUOM: true,
            category: true,
            averageCostPrice: true,
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
      ],
    });

    // Group by product
    const grouped = inventoryItems.reduce((acc, item) => {
      const productId = item.productId;

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: item.Product.name,
          category: item.Product.category,
          baseUOM: item.Product.baseUOM,
          totalQuantity: 0,
          weightedAverageCost: Number(item.Product.averageCostPrice),
          totalValue: 0,
          warehouseMap: new Map<string, { warehouseId: string; warehouseName: string; quantity: number }>(),
        };
      }

      const quantity = Number(item.quantity);
      const cost = Number(item.Product.averageCostPrice);

      acc[productId].totalQuantity += quantity;
      acc[productId].totalValue += quantity * cost;

      // Aggregate by warehouse
      const warehouseId = item.warehouseId;
      const warehouseName = item.Warehouse.name;

      acc[productId].warehouseMap.set(warehouseId, {
        warehouseId,
        warehouseName,
        quantity,
      });

      return acc;
    }, {} as Record<string, any>);

    // Format results
    return (Object.values(grouped) as any[]).map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      category: item.category,
      baseUOM: item.baseUOM,
      totalQuantity: item.totalQuantity,
      weightedAverageCost: item.weightedAverageCost,
      totalValue: item.totalValue,
      batchCount: item.batchCount || 0,
      warehouses: Array.from(item.warehouseMap.values()),
    }));
  }

  /**
   * Batch transfer stock between warehouses
   */
  async transferStocks(data: TransferStockBatchInput): Promise<void> {
    // Validate warehouses are different
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new ValidationError('Source and destination warehouses must be different', {
        warehouse: 'Cannot transfer to the same warehouse',
      });
    }

    if (!data.items || data.items.length === 0) {
      throw new ValidationError('No items to transfer', {
        items: 'At least one item is required',
      });
    }

    // Perform transfer in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        // Validate product exists
        const product = await productService.getProductById(item.productId);

        // Convert quantity to base UOM
        const baseQuantity = await this.convertToBaseUOM(
          item.productId,
          item.quantity,
          item.uom
        );

        // Validate quantity
        if (baseQuantity <= 0) {
          throw new ValidationError(`Quantity for ${product.name} must be greater than zero`, {
            quantity: 'Invalid quantity',
          });
        }

        // Check stock availability
        const sourceStock = await this.getCurrentStockLevel(item.productId, data.sourceWarehouseId, tx);
        if (sourceStock < baseQuantity) {
          throw new InsufficientStockError(
            product.name,
            sourceStock,
            baseQuantity
          );
        }

        // Deduct from source
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: data.sourceWarehouseId,
            },
          },
          data: {
            quantity: { decrement: baseQuantity },
          },
        });

        // Record OUT movement
        await tx.stockMovement.create({
          data: {
            id: randomUUID(),
            productId: item.productId,
            warehouseId: data.sourceWarehouseId,
            type: 'OUT',
            quantity: baseQuantity,
            reason: data.reason || 'Batch transfer to destination',
            referenceType: 'TRANSFER',
            referenceId: data.referenceNumber,
            createdAt: data.transferDate ? new Date(data.transferDate) : undefined,
          },
        });

        // Add to destination
        await tx.inventory.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: data.destinationWarehouseId,
            },
          },
          update: {
            quantity: { increment: baseQuantity },
          },
          create: {
            productId: item.productId,
            warehouseId: data.destinationWarehouseId,
            quantity: baseQuantity,
          },
        });

        // Record IN movement
        await tx.stockMovement.create({
          data: {
            id: randomUUID(),
            productId: item.productId,
            warehouseId: data.destinationWarehouseId,
            type: 'IN',
            quantity: baseQuantity,
            reason: data.reason || 'Batch transfer from source',
            referenceType: 'TRANSFER',
            referenceId: data.referenceNumber,
            createdAt: data.transferDate ? new Date(data.transferDate) : undefined,
          },
        });
      }
    });
  }

  /**
   * Batch adjust stock for multiple items in a warehouse
   */
  async adjustStockBatch(data: AdjustStockBatchInput, tx?: Prisma.TransactionClient): Promise<void> {
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('No items to adjust', {
        items: 'At least one item is required',
      });
    }

    try {
      // OPTIMIZATION 1: Batch fetch all products at once (outside transaction)
      const productIds = data.items.map(item => item.productId);

      // Use provided tx or prisma for read operations if possible, but for consistency 
      // with how we'll use the data, regular prisma client is fine for reading 
      // unless we suspect uncommitted changes in tx affect this (unlikely for product config)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { productUOMs: true }
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      // OPTIMIZATION 2: Pre-validate and pre-calculate all conversions (outside transaction)
      const processedItems: Array<{
        productId: string;
        quantity: number;
        uom: string;
        adjustmentType: 'RELATIVE' | 'ABSOLUTE';
        product: any;
        baseQuantity: number;
        conversionFactor: number;
      }> = [];

      for (const [index, item] of data.items.entries()) {
        // Validate item integrity
        if (!item.productId || !item.uom) {
          throw new ValidationError(`Invalid item data at index ${index}: Missing productId or uom`);
        }

        // Validate product exists
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundError(`Product not found: ${item.productId}`);
        }

        // Convert quantity to base UOM
        let baseQuantity = 0;
        try {
          // Inline conversion to avoid extra DB calls
          if (item.uom.trim().toLowerCase() === product.baseUOM.trim().toLowerCase()) {
            baseQuantity = item.quantity;
            processedItems.push({
              ...item,
              product,
              baseQuantity,
              conversionFactor: 1
            });
          } else {
            const alternateUOM = product.productUOMs.find(
              (u: any) => u.name.trim().toLowerCase() === item.uom.trim().toLowerCase()
            );

            if (!alternateUOM) {
              // FALLBACK: If UOM is 'pcs' or 'pc', treat as 1:1 with base units
              if (['pcs', 'pc'].includes(item.uom.trim().toLowerCase())) {
                console.warn(`UOM '${item.uom}' not found for product ${product.name} in batch adjustment, defaulting to 1:1 conversion.`);

                const factor = 1;
                baseQuantity = item.quantity * factor;
                processedItems.push({
                  ...item,
                  product,
                  baseQuantity,
                  conversionFactor: factor
                });
                continue;
              }

              throw new ValidationError(`UOM '${item.uom}' not found for product ${product.name}`, {
                uom: 'Invalid UOM for this product',
              });
            }

            const factor = Number(alternateUOM.conversionFactor);
            baseQuantity = item.quantity * factor;
            processedItems.push({
              ...item,
              product,
              baseQuantity,
              conversionFactor: factor
            });
          }
        } catch (e: any) {
          throw new ValidationError(`UOM conversion failed for ${product.name}: ${e.message}`, {
            uom: item.uom,
            error: e.message
          });
        }

        // Validate quantity for ABSOLUTE adjustments
        if (baseQuantity < 0 && item.adjustmentType === 'ABSOLUTE') {
          throw new ValidationError(`Quantity for ${product.name} cannot be negative for absolute adjustment`, {
            quantity: 'Invalid quantity',
          });
        }
      }

      // OPTIMIZATION 3: Increased timeout for large batches
      const timeout = data.items.length > 50 ? 60000 : 30000;

      // Helper function to execute the main logic
      const execute = async (transaction: Prisma.TransactionClient) => {
        // Batch fetch current inventory levels
        const inventoryRecords = await transaction.inventory.findMany({
          where: {
            warehouseId: data.warehouseId,
            productId: { in: productIds }
          }
        });

        const inventoryMap = new Map(
          inventoryRecords.map(inv => [inv.productId, Number(inv.quantity)])
        );

        // Prepare batch operations
        const inventoryUpdates = [];
        const stockMovements = [];

        for (const item of processedItems) {
          const currentStock = inventoryMap.get(item.productId) || 0;

          // Calculate new quantity based on adjustment type
          let newQuantity: number;
          let quantityDifference: number;

          if (item.adjustmentType === 'ABSOLUTE') {
            newQuantity = item.baseQuantity;
            quantityDifference = newQuantity - currentStock;
          } else {
            // RELATIVE
            quantityDifference = item.baseQuantity;
            newQuantity = currentStock + quantityDifference;
          }

          // Validate final quantity is not negative
          if (newQuantity < 0) {
            throw new ValidationError(
              `Adjustment would result in negative stock for ${item.product.name}. Current: ${currentStock}, Change: ${quantityDifference}`,
              { quantity: 'Invalid adjustment' }
            );
          }

          // Skip if no change
          if (quantityDifference === 0) continue;

          // Collect inventory update
          inventoryUpdates.push({
            productId: item.productId,
            warehouseId: data.warehouseId,
            newQuantity
          });

          // Collect stock movement
          const movementType = quantityDifference > 0 ? 'IN' : 'OUT';
          stockMovements.push({
            id: randomUUID(),
            productId: item.productId,
            warehouseId: data.warehouseId,
            type: movementType,
            quantity: Math.abs(quantityDifference),
            reason: data.reason || 'Batch adjustment',
            referenceId: data.referenceNumber,
            referenceType: 'ADJUSTMENT' as const,
            createdAt: data.adjustmentDate ? new Date(data.adjustmentDate) : new Date(),
            uom: item.uom,
            conversionFactor: item.conversionFactor
          });
        }

        // OPTIMIZATION 5: Execute updates in batches to avoid long locks
        const CHUNK_SIZE = 25;

        // Process inventory updates in chunks
        for (let i = 0; i < inventoryUpdates.length; i += CHUNK_SIZE) {
          const chunk = inventoryUpdates.slice(i, i + CHUNK_SIZE);

          await Promise.all(chunk.map(update =>
            transaction.inventory.upsert({
              where: {
                productId_warehouseId: {
                  productId: update.productId,
                  warehouseId: update.warehouseId,
                },
              },
              update: {
                quantity: update.newQuantity,
              },
              create: {
                productId: update.productId,
                warehouseId: update.warehouseId,
                quantity: update.newQuantity,
              },
            })
          ));
        }

        // Process stock movements in chunks
        for (let i = 0; i < stockMovements.length; i += CHUNK_SIZE) {
          const chunk = stockMovements.slice(i, i + CHUNK_SIZE);

          await transaction.stockMovement.createMany({
            data: chunk
          });
        }
      };

      // OPTIMIZATION 4: Single transaction with all pre-calculated data
      // Use provided transaction or create a new one
      if (tx) {
        await execute(tx);
      } else {
        await prisma.$transaction(execute, {
          maxWait: 10000,
          timeout: timeout,
        });
      }
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Error in adjustStockBatch:', error);

      // If it's already a known AppError, rethrow it
      if (error instanceof AppError || error instanceof Prisma.PrismaClientKnownRequestError) {
        throw error;
      }

      // Otherwise wrap it in a generic safe error
      throw new ValidationError(`Failed to process stock adjustment: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get all adjustment slips with filtering and search
   */
  async getAdjustmentSlips(filters?: AdjustmentFilters): Promise<AdjustmentSlip[]> {
    // Build where clause for stock movements
    const where: Prisma.StockMovementWhereInput = {
      type: 'ADJUSTMENT',
      referenceType: 'ADJUSTMENT',
      ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
          createdAt: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        }
        : {}),
    };

    // Query all adjustment movements
    const movements = await prisma.stockMovement.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by referenceId to reconstruct adjustment slips
    const groupedByReference = movements.reduce((acc, movement) => {
      const refId = movement.referenceId || movement.id;

      if (!acc[refId]) {
        acc[refId] = [];
      }
      acc[refId].push(movement);
      return acc;
    }, {} as Record<string, typeof movements>);

    // Reconstruct adjustment slips
    const adjustmentSlips: AdjustmentSlip[] = Object.entries(groupedByReference).map(
      ([referenceId, items]) => {
        const firstItem = items[0];

        return {
          referenceId,
          referenceNumber: firstItem.referenceId || undefined,
          warehouseId: firstItem.warehouseId,
          warehouseName: firstItem.Warehouse.name,
          reason: firstItem.reason || 'No reason provided',
          adjustmentDate: firstItem.createdAt,
          items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.Product.name,
            quantity: Number(item.quantity),
            baseUOM: item.Product.baseUOM,
            warehouseId: item.warehouseId,
            warehouseName: item.Warehouse.name,
            createdAt: item.createdAt,
          })),
          totalItems: items.length,
          createdAt: firstItem.createdAt,
        };
      }
    );

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return adjustmentSlips.filter(
        (slip) =>
          slip.referenceNumber?.toLowerCase().includes(query) ||
          slip.reason.toLowerCase().includes(query) ||
          slip.items.some((item) => item.productName.toLowerCase().includes(query))
      );
    }

    return adjustmentSlips;
  }

  /**
   * Get a single adjustment slip by reference ID
   */
  async getAdjustmentSlipById(referenceId: string): Promise<AdjustmentSlip | null> {
    const movements = await prisma.stockMovement.findMany({
      where: {
        type: 'ADJUSTMENT',
        referenceType: 'ADJUSTMENT',
        referenceId,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (movements.length === 0) {
      return null;
    }

    const firstItem = movements[0];

    return {
      referenceId,
      referenceNumber: firstItem.referenceId || undefined,
      warehouseId: firstItem.warehouseId,
      warehouseName: firstItem.Warehouse.name,
      reason: firstItem.reason || 'No reason provided',
      adjustmentDate: firstItem.createdAt,
      items: movements.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.Product.name,
        quantity: Number(item.quantity),
        baseUOM: item.Product.baseUOM,
        warehouseId: item.warehouseId,
        warehouseName: item.Warehouse.name,
        createdAt: item.createdAt,
      })),
      totalItems: movements.length,
      createdAt: firstItem.createdAt,
    };
  }

  /**
   * Get product history (stock card) with movements and summary
   */
  async getProductHistory(productId: string, filters?: {
    warehouseId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    product: {
      id: string;
      name: string;
      baseUOM: string;
      category: string;
      productUOMs: Array<{ id: string; name: string; conversionFactor: number }>;
    };
    summary: {
      received: number;
      salesReturns: number;
      adjustmentsIn: number;
      transfersIn: number;
      sold: number;
      vendorReturns: number;
      adjustmentsOut: number;
      transfersOut: number;
      currentStock: number;
      netMovement: number;
    };
    movements: Array<{
      id: string;
      type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
      details: string;
      quantityChange: number;
      runningBalance: number;
      status: string;
      warehouseName: string;
      date: Date;
      documentNumber: string | null;
      referenceType: string | null;
      referenceId: string | null;
    }>;
  }> {
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        baseUOM: true,
        category: true,
        productUOMs: {
          select: {
            id: true,
            name: true,
            conversionFactor: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product not found: ${productId}`);
    }

    // Build where clause for movements
    const where: Prisma.StockMovementWhereInput = {
      productId,
    };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
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

    // Fetch all movements ordered by date (oldest first for running balance calculation)
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        Warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get current stock level
    let currentStock = 0;
    if (filters?.warehouseId) {
      currentStock = await this.getCurrentStockLevel(productId, filters.warehouseId);
    } else {
      currentStock = await inventoryRepository.getTotalStockByProduct(productId);
    }

    // Calculate summary statistics
    const summary = {
      received: 0,
      salesReturns: 0,
      adjustmentsIn: 0,
      transfersIn: 0,
      sold: 0,
      vendorReturns: 0,
      adjustmentsOut: 0,
      transfersOut: 0,
      currentStock,
      netMovement: 0,
    };

    // Process movements and calculate running balance
    let runningBalance = 0;
    const processedMovements = movements.map((movement) => {
      const qty = Number(movement.quantity);
      let quantityChange = 0;
      let details = movement.reason || '';

      // Determine quantity change sign and categorize
      switch (movement.type) {
        case 'IN':
          quantityChange = qty;
          if (movement.referenceType === 'RV' || movement.referenceType === 'PO') {
            summary.received += qty;
            details = details || 'Received from supplier';
          } else if (movement.referenceType === 'TRANSFER') {
            summary.transfersIn += qty;
            details = details || 'Transfer in';
          } else if (movement.referenceType === 'ADJUSTMENT') {
            summary.adjustmentsIn += qty;
            details = details || 'Inventory adjustment in';
          } else {
            summary.received += qty;
            details = details || 'Stock addition';
          }
          break;
        case 'OUT':
          quantityChange = -qty;
          if (movement.referenceType === 'POS' || movement.referenceType === 'SO') {
            summary.sold += qty;
            details = details || 'Sale';
          } else if (movement.referenceType === 'TRANSFER') {
            summary.transfersOut += qty;
            details = details || 'Transfer out';
          } else if (movement.referenceType === 'ADJUSTMENT') {
            summary.adjustmentsOut += qty;
            details = details || 'Inventory adjustment out';
          } else {
            summary.sold += qty;
            details = details || 'Stock deduction';
          }
          break;
        case 'ADJUSTMENT':
          // Legacy support or fallback for data without explicit IN/OUT type
          const reasonLower = movement.reason?.toLowerCase() || '';
          if (reasonLower.includes('increase') ||
            reasonLower.includes('add') ||
            reasonLower.includes('beginning')) {
            quantityChange = qty;
            summary.adjustmentsIn += qty;
          } else {
            quantityChange = -qty;
            summary.adjustmentsOut += qty;
          }
          details = details || 'Inventory adjustment';
          break;
        case 'TRANSFER':
          // Transfer type movements should ideally be handled by IN/OUT
          // but just in case:
          quantityChange = qty;
          summary.transfersIn += qty;
          details = details || 'Transfer';
          break;
        default:
          quantityChange = qty;
      }

      runningBalance += quantityChange;

      return {
        id: movement.id,
        type: movement.type as 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER',
        details,
        quantityChange,
        runningBalance,
        status: 'Regular', // Status from referenceType or default
        warehouseName: movement.Warehouse.name,
        date: movement.createdAt,
        documentNumber: movement.referenceId || null,
        referenceType: movement.referenceType || null,
        referenceId: movement.referenceId || null,
        uom: movement.uom,
        conversionFactor: movement.conversionFactor ? Number(movement.conversionFactor) : null,
      };
    });

    // Calculate net movement
    summary.netMovement =
      (summary.received + summary.salesReturns + summary.adjustmentsIn + summary.transfersIn) -
      (summary.sold + summary.vendorReturns + summary.adjustmentsOut + summary.transfersOut);

    // Reverse to show newest first (like the reference image)
    processedMovements.reverse();

    return {
      product,
      summary,
      movements: processedMovements,
    };
  }
  /**
   * Audit all inventory to find discrepancies between current stock and stock movements
   */
  async auditInventory(): Promise<{
    totalChecked: number;
    discrepanciesFound: number;
    discrepancies: Array<{
      productId: string;
      productName: string;
      warehouseId: string;
      warehouseName: string;
      systemQuantity: number;
      calculatedQuantity: number;
      variance: number;
    }>;
    allItems: Array<{
      productId: string;
      productName: string;
      warehouseId: string;
      warehouseName: string;
      baseUOM: string;
      systemQuantity: number;
      calculatedQuantity: number;
      variance: number;
      status: 'PASS' | 'FAIL';
      movementCount: number;
      movements: Array<{
        id: string;
        type: string;
        quantity: number;
        reason: string | null;
        referenceType: string | null;
        referenceId: string | null;
        createdAt: Date;
        quantityChange: number;
        runningBalance: number;
      }>;
    }>;
  }> {
    // Fetch all inventory records
    const inventoryRecords = await prisma.inventory.findMany({
      include: {
        Product: { select: { id: true, name: true, baseUOM: true } },
        Warehouse: { select: { id: true, name: true } }
      },
      orderBy: [{ productId: 'asc' }, { warehouseId: 'asc' }]
    });

    // Fetch all stock movements
    const stockMovements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const movementMap = new Map<string, any[]>();

    for (const sm of stockMovements) {
      const key = `${sm.productId}-${sm.warehouseId}`;
      if (!movementMap.has(key)) {
        movementMap.set(key, []);
      }
      movementMap.get(key)?.push(sm);
    }

    const discrepancies = [];
    const allItems = [];

    for (const inv of inventoryRecords) {
      const key = `${inv.productId}-${inv.warehouseId}`;
      const movements = movementMap.get(key) || [];

      let calculatedQuantity = 0;
      const processedMovements = [];

      for (const movement of movements) {
        const qty = Number(movement.quantity);
        let quantityChange = 0;

        switch (movement.type) {
          case 'IN':
            quantityChange = qty;
            break;
          case 'OUT':
            quantityChange = -qty;
            break;
          case 'ADJUSTMENT':
            // Logic matching getProductHistory
            const reasonLower = movement.reason?.toLowerCase() || '';
            if (reasonLower.includes('increase') ||
              reasonLower.includes('add') ||
              reasonLower.includes('beginning')) {
              quantityChange = qty;
            } else {
              quantityChange = -qty;
            }
            break;
          case 'TRANSFER':
            quantityChange = qty;
            break;
          default:
            quantityChange = qty;
        }
        calculatedQuantity += quantityChange;

        processedMovements.push({
          id: movement.id,
          type: movement.type,
          quantity: qty,
          reason: movement.reason,
          referenceType: movement.referenceType,
          referenceId: movement.referenceId,
          createdAt: movement.createdAt,
          quantityChange,
          runningBalance: calculatedQuantity
        });
      }

      const systemQuantity = Number(inv.quantity);
      const variance = calculatedQuantity - systemQuantity;
      const hasDiscrepancy = Math.abs(variance) > 0.0001;

      const itemDetail = {
        productId: inv.productId,
        productName: inv.Product.name,
        warehouseId: inv.warehouseId,
        warehouseName: inv.Warehouse.name,
        baseUOM: inv.Product.baseUOM,
        systemQuantity,
        calculatedQuantity,
        variance,
        status: hasDiscrepancy ? 'FAIL' as const : 'PASS' as const,
        movementCount: movements.length,
        movements: processedMovements
      };

      allItems.push(itemDetail);

      if (hasDiscrepancy) {
        discrepancies.push({
          productId: inv.productId,
          productName: inv.Product.name,
          warehouseId: inv.warehouseId,
          warehouseName: inv.Warehouse.name,
          systemQuantity,
          calculatedQuantity,
          variance
        });
      }
    }

    return {
      totalChecked: inventoryRecords.length,
      discrepanciesFound: discrepancies.length,
      discrepancies,
      allItems
    };
  }
}

export const inventoryService = new InventoryService();

