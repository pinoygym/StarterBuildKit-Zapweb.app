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
} from '@/types/inventory.types';
import { ValidationError, NotFoundError, InsufficientStockError } from '@/lib/errors';

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
          reason: data.reason || `Transfer to destination warehouse`,
          referenceType: 'TRANSFER',
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
          reason: data.reason || `Transfer from source warehouse`,
          referenceType: 'TRANSFER',
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
    return Object.values(grouped).map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      category: item.category,
      baseUOM: item.baseUOM,
      totalQuantity: item.totalQuantity,
      weightedAverageCost: item.weightedAverageCost,
      totalValue: item.totalValue,
      warehouses: Array.from(item.warehouseMap.values()),
    }));
  }
}

export const inventoryService = new InventoryService();

