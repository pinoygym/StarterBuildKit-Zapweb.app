import { POSSale } from '@prisma/client';
import { posRepository } from '@/repositories/pos.repository';
import { inventoryService } from '@/services/inventory.service';
import { salesOrderService } from '@/services/sales-order.service';
import { productService } from '@/services/product.service';
import { arService } from '@/services/ar.service';
import { prisma } from '@/lib/prisma';
import {
  CreatePOSSaleInput,
  POSSaleWithItems,
  POSSaleFilters,
  POSTodaySummary,
  ProductWithStock,
} from '@/types/pos.types';
import { ValidationError, NotFoundError } from '@/lib/errors';

export class POSService {
  /**
   * Generate unique receipt number in format RCP-YYYYMMDD-XXXX
   */
  async generateReceiptNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `RCP-${year}${month}${day}`;

    // Find the last receipt number for today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastSales = await posRepository.findAll({
      startDate: today,
      endDate: tomorrow,
    });

    // Extract sequence numbers from today's receipts
    const sequenceNumbers = lastSales
      .map((sale) => {
        const match = sale.receiptNumber.match(/RCP-\d{8}-(\d{4})/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) + 1 : 1;
    const sequenceStr = String(nextSequence).padStart(4, '0');

    return `${datePrefix}-${sequenceStr}`;
  }

  /**
   * Get all POS sales with optional filters
   */
  async getAllSales(filters?: POSSaleFilters): Promise<POSSaleWithItems[]> {
    return await posRepository.findAll(filters);
  }

  /**
   * Get POS sale by ID
   */
  async getSaleById(id: string): Promise<POSSaleWithItems> {
    const sale = await posRepository.findById(id);
    if (!sale) {
      throw new NotFoundError('POS Sale');
    }
    return sale;
  }

  /**
   * Get active products with stock for POS
   */
  async getActiveProductsWithStock(warehouseId: string): Promise<ProductWithStock[]> {
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
      },
      include: {
        ProductUOM: true,
        InventoryBatch: {
          where: {
            warehouseId,
            status: 'active',
            quantity: { gt: 0 },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product: any) => {
      const currentStock = product.InventoryBatch.reduce(
        (sum: number, batch: any) => sum + Number(batch.quantity),
        0
      );

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        imageUrl: product.imageUrl,
        basePrice: Number(product.basePrice),
        baseUOM: product.baseUOM,
        status: product.status,
        alternateUOMs: product.ProductUOM.map((uom: any) => ({
          id: uom.id,
          name: uom.name,
          conversionFactor: Number(uom.conversionFactor),
          sellingPrice: Number(uom.sellingPrice),
        })),
        currentStock,
        inStock: currentStock > 0,
      };
    });
  }

  /**
   * Get today's POS summary
   */
  async getTodaySummary(branchId?: string): Promise<POSTodaySummary> {
    return await posRepository.getTodaySummary(branchId);
  }

  /**
   * Process a POS sale with inventory deduction, COGS calculation, and AR creation for credit sales
   */
  async processSale(data: CreatePOSSaleInput): Promise<POSSaleWithItems> {
    // Validate credit sale
    if (data.paymentMethod === 'credit') {
      if (!data.customerId || !data.customerName) {
        throw new ValidationError('Customer information is required for credit sales', {
          customerId: 'Required for credit payment',
          customerName: 'Required for credit payment',
        });
      }

      // Validate partial payment
      if (data.partialPayment) {
        if (data.partialPayment < 0) {
          throw new ValidationError('Partial payment cannot be negative', {
            partialPayment: 'Must be positive',
          });
        }
        if (data.partialPayment >= data.totalAmount) {
          throw new ValidationError('Partial payment must be less than total amount', {
            partialPayment: `Must be less than ${data.totalAmount}`,
          });
        }
      }
    }

    // Validate payment method
    if (data.paymentMethod === 'cash') {
      if (!data.amountReceived) {
        throw new ValidationError('Amount received is required for cash payment', {
          amountReceived: 'Required for cash payment',
        });
      }

      if (data.amountReceived < data.totalAmount) {
        throw new ValidationError('Amount received is less than total amount', {
          amountReceived: `Must be at least ${data.totalAmount}`,
        });
      }

      // Calculate change
      data.change = data.amountReceived - data.totalAmount;
    }

    // Generate receipt number if not provided
    if (!data.receiptNumber) {
      data.receiptNumber = await this.generateReceiptNumber();
    }

    // Check if receipt number already exists
    const existingReceipt = await posRepository.findByReceiptNumber(data.receiptNumber);
    if (existingReceipt) {
      throw new ValidationError('Receipt number already exists', {
        receiptNumber: 'Receipt number must be unique',
      });
    }

    // Process sale in transaction
    return await prisma.$transaction(async (tx) => {
      // Process each item: calculate COGS and deduct inventory
      const itemsWithCOGS = await Promise.all(
        data.items.map(async (item) => {
          // Get weighted average cost
          const avgCost = await inventoryService.calculateWeightedAverageCost(
            item.productId,
            data.warehouseId
          );

          // Convert quantity to base UOM for COGS calculation
          const baseQuantity = await inventoryService.convertToBaseUOM(
            item.productId,
            item.quantity,
            item.uom
          );

          // Calculate COGS
          const costOfGoodsSold = avgCost * baseQuantity;

          // Deduct inventory (FIFO for expiry dates)
          await inventoryService.deductStock({
            productId: item.productId,
            warehouseId: data.warehouseId,
            quantity: item.quantity,
            uom: item.uom,
            reason: `POS Sale ${data.receiptNumber}`,
            referenceId: data.receiptNumber!,
            referenceType: 'POS',
          });

          return {
            ...item,
            costOfGoodsSold,
          };
        })
      );

      // Create POS sale with COGS
      const sale = await posRepository.create({
        ...data,
        items: itemsWithCOGS,
      });

      // If converted from sales order, mark it as converted
      if (data.convertedFromOrderId) {
        await salesOrderService.markAsConverted(data.convertedFromOrderId, sale.id);
      }

      // Create AR record for credit sales
      if (data.paymentMethod === 'credit' && data.customerId && data.customerName) {
        const outstandingBalance = data.totalAmount - (data.partialPayment || 0);

        // Get customer to determine payment terms
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });

        // Calculate due date based on payment terms
        let dueDate = new Date();
        if (customer?.paymentTerms) {
          const terms = customer.paymentTerms;
          if (terms === 'Net 15') {
            dueDate.setDate(dueDate.getDate() + 15);
          } else if (terms === 'Net 30') {
            dueDate.setDate(dueDate.getDate() + 30);
          } else if (terms === 'Net 60') {
            dueDate.setDate(dueDate.getDate() + 60);
          } else if (terms === 'COD') {
            dueDate.setDate(dueDate.getDate() + 1);
          }
        } else {
          // Default to Net 30
          dueDate.setDate(dueDate.getDate() + 30);
        }

        // Create AR record
        await arService.createAR({
          branchId: data.branchId,
          customerId: data.customerId,
          customerName: data.customerName,
          salesOrderId: undefined, // Not from sales order, from POS
          totalAmount: outstandingBalance,
          dueDate,
        });

        // If partial payment was made, record it as initial payment
        if (data.partialPayment && data.partialPayment > 0) {
          // Note: This would require recording the partial payment separately
          // For now, we'll just create the AR with the outstanding balance
          // The partial payment is already reflected in the POS sale record
        }
      }

      return sale;
    });
  }
}

export const posService = new POSService();
