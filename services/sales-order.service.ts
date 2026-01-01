import { SalesOrder } from '@prisma/client';
import { salesOrderRepository } from '@/repositories/sales-order.repository';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';
import {
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  SalesOrderWithItems,
  SalesOrderFilters,
} from '@/types/sales-order.types';
import { ValidationError, NotFoundError, InsufficientStockError } from '@/lib/errors';
import {
  salesOrderSchema,
  updateSalesOrderSchema,
} from '@/lib/validations/sales-order.validation';

export class SalesOrderService {
  /**
   * Generate unique order number in format SO-YYYYMMDD-XXXX
   */
  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `SO-${year}${month}${day}`;

    // Find the last order number for today
    const lastOrder = await salesOrderRepository.findAll({
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
    });

    // Extract sequence numbers from today's orders
    const sequenceNumbers = lastOrder
      .map((order) => {
        const match = order.orderNumber.match(/SO-\d{8}-(\d{4})/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) + 1 : 1;
    const sequenceStr = String(nextSequence).padStart(4, '0');

    return `${datePrefix}-${sequenceStr}`;
  }

  /**
   * Validate stock availability for all items in the order
   */
  async validateStockAvailability(
    warehouseId: string,
    items: Array<{ productId: string; quantity: number; uom: string }>
  ): Promise<void> {
    for (const item of items) {
      // Convert quantity to base UOM
      const baseQuantity = await inventoryService.convertToBaseUOM(
        item.productId,
        item.quantity,
        item.uom
      );

      // Get current stock level
      const currentStock = await inventoryService.getCurrentStockLevel(
        item.productId,
        warehouseId
      );

      if (currentStock < baseQuantity) {
        const product = await productService.getProductById(item.productId);
        throw new InsufficientStockError(
          product.name,
          baseQuantity,
          currentStock
        );
      }
    }
  }

  /**
   * Get all sales orders with optional filters
   */
  async getAllSalesOrders(filters?: SalesOrderFilters): Promise<SalesOrderWithItems[]> {
    return await salesOrderRepository.findAll(filters);
  }

  /**
   * Get sales order by ID
   */
  async getSalesOrderById(id: string): Promise<SalesOrderWithItems> {
    const salesOrder = await salesOrderRepository.findById(id);
    if (!salesOrder) {
      throw new NotFoundError('Sales Order');
    }
    return salesOrder;
  }

  /**
   * Get pending sales orders (for POS conversion)
   */
  async getPendingSalesOrders(branchId?: string): Promise<SalesOrderWithItems[]> {
    return await salesOrderRepository.findPendingOrders(branchId);
  }

  /**
   * Create a new sales order
   */
  async createSalesOrder(data: CreateSalesOrderInput): Promise<SalesOrderWithItems> {
    // Validate input
    const validationResult = salesOrderSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid sales order data', errors as Record<string, string>);
    }

    // Generate order number if not provided
    if (!data.orderNumber) {
      data.orderNumber = await this.generateOrderNumber();
    }

    // Check if order number already exists
    const existingOrder = await salesOrderRepository.findByOrderNumber(data.orderNumber);
    if (existingOrder) {
      throw new ValidationError('Order number already exists', {
        orderNumber: 'Order number must be unique',
      });
    }

    // Validate stock availability for all items
    await this.validateStockAvailability(data.warehouseId, data.items);

    // Get UOM selling prices and validate items
    const itemsWithPrices = await Promise.all(
      data.items.map(async (item) => {
        // Get the selling price for the specified UOM
        const sellingPrice = await productService.getUOMSellingPrice(
          item.productId,
          item.uom
        );

        // Calculate subtotal
        const subtotal = item.quantity * sellingPrice;

        return {
          ...item,
          unitPrice: sellingPrice,
          subtotal,
        };
      })
    );

    // Calculate total amount
    const totalAmount = itemsWithPrices.reduce((sum, item) => sum + item.subtotal, 0);

    // Create sales order
    const salesOrder = await salesOrderRepository.create({
      ...validationResult.data,
      items: itemsWithPrices,
      totalAmount,
    });

    return salesOrder;
  }

  /**
   * Update an existing sales order
   */
  async updateSalesOrder(
    id: string,
    data: UpdateSalesOrderInput
  ): Promise<SalesOrderWithItems> {
    // Check if sales order exists
    const existingSalesOrder = await salesOrderRepository.findById(id);
    if (!existingSalesOrder) {
      throw new NotFoundError('Sales Order');
    }

    // Only allow updates for Draft and Pending status
    if (existingSalesOrder.status !== 'draft' && existingSalesOrder.status !== 'pending') {
      throw new ValidationError('Cannot update sales order', {
        status: `Sales order with status '${existingSalesOrder.status}' cannot be updated`,
      });
    }

    // Validate input
    const validationResult = updateSalesOrderSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid sales order data', errors as Record<string, string>);
    }

    // If items are being updated, validate stock availability and recalculate prices
    if (data.items) {
      const warehouseId = data.warehouseId || existingSalesOrder.warehouseId;
      
      // Validate stock availability
      await this.validateStockAvailability(warehouseId, data.items);

      // Get UOM selling prices and validate items
      const itemsWithPrices = await Promise.all(
        data.items.map(async (item) => {
          const sellingPrice = await productService.getUOMSellingPrice(
            item.productId,
            item.uom
          );

          const subtotal = item.quantity * sellingPrice;

          return {
            ...item,
            unitPrice: sellingPrice,
            subtotal,
          };
        })
      );

      // Calculate total amount
      const totalAmount = itemsWithPrices.reduce((sum, item) => sum + item.subtotal, 0);

      // Update with recalculated items and total
      return await salesOrderRepository.update(id, {
        ...validationResult.data,
        items: itemsWithPrices,
        totalAmount,
      });
    }

    // Update without items
    return await salesOrderRepository.update(id, validationResult.data);
  }

  /**
   * Cancel a sales order
   */
  async cancelSalesOrder(id: string): Promise<SalesOrder> {
    // Check if sales order exists
    const salesOrder = await salesOrderRepository.findById(id);
    if (!salesOrder) {
      throw new NotFoundError('Sales Order');
    }

    // Check if already cancelled or converted
    if (salesOrder.status === 'cancelled') {
      throw new ValidationError('Sales order is already cancelled', {
        status: 'Cannot cancel an already cancelled order',
      });
    }

    if (salesOrder.salesOrderStatus === 'converted') {
      throw new ValidationError('Cannot cancel converted sales order', {
        status: 'Sales order has been converted to POS sale',
      });
    }

    // Update status to cancelled
    return await salesOrderRepository.updateStatus(id, 'cancelled');
  }

  /**
   * Mark sales order as converted (called from POS module)
   */
  async markAsConverted(id: string, convertedToSaleId: string): Promise<SalesOrder> {
    const salesOrder = await salesOrderRepository.findById(id);
    if (!salesOrder) {
      throw new NotFoundError('Sales Order');
    }

    return await salesOrderRepository.markAsConverted(id, convertedToSaleId);
  }

  /**
   * Get active sales orders count
   */
  async getActiveOrdersCount(branchId?: string): Promise<number> {
    return await salesOrderRepository.countActiveOrders(branchId);
  }

  /**
   * Calculate conversion rate (converted orders / total orders)
   */
  async getConversionRate(branchId?: string): Promise<number> {
    return await salesOrderRepository.calculateConversionRate(branchId);
  }
}

export const salesOrderService = new SalesOrderService();
