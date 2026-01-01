import { POSSale } from '@prisma/client';
import { posRepository } from '@/repositories/pos.repository';
import { inventoryService } from '@/services/inventory.service';
import { salesOrderService } from '@/services/sales-order.service';
import { productService } from '@/services/product.service';
import { arService } from '@/services/ar.service';
import { companySettingsService } from '@/services/company-settings.service';
import { discountExpenseService } from '@/services/discount-expense.service';
import { prisma } from '@/lib/prisma';
import {
  CreatePOSSaleInput,
  POSSaleWithItems,
  POSSaleFilters,
  POSTodaySummary,
  ProductWithStock,
} from '@/types/pos.types';
import { ValidationError, NotFoundError, InsufficientStockError } from '@/lib/errors';
import {
  calculateItemDiscount,
  calculateTotalDiscounts,
  calculateVAT
} from '@/lib/discount-calculator';
import { randomUUID } from 'crypto';

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
        productUOMs: true,
        Inventory: {
          where: {
            warehouseId,
            quantity: { gt: 0 },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product: any) => {
      const currentStock = product.Inventory.reduce(
        (sum: number, inv: any) => sum + Number(inv.quantity),
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
        alternateUOMs: product.productUOMs.map((uom: any) => ({
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
    // 1. PRE-VALIDATION & DATA FETCHING (OUTSIDE TRANSACTION)
    // =============================================================

    if (data.paymentMethod === 'credit' && (!data.customerId || !data.customerName)) {
      throw new ValidationError('Customer information is required for credit sales.', {
        customerId: 'Required',
        customerName: 'Required',
      });
    }

    if (!data.receiptNumber) {
      data.receiptNumber = await this.generateReceiptNumber();
    } else {
      const existingReceipt = await posRepository.findByReceiptNumber(data.receiptNumber);
      if (existingReceipt) {
        throw new ValidationError('Receipt number already exists.', { receiptNumber: 'Must be unique' });
      }
    }

    const settings = await companySettingsService.getSettings();
    const productIds = data.items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        productUOMs: true,
        Inventory: {
          where: {
            warehouseId: data.warehouseId,
          },
        },
      },
    });
    const productsById = new Map(products.map((p) => [p.id, p]));

    // 2. IN-MEMORY CALCULATIONS & SIMULATION
    // =============================================================

    const itemsWithCOGS: any[] = [];
    const inventoryDeductions: { productId: string; amount: number }[] = [];
    const stockMovements: any[] = [];
    const productUsage = new Map<string, number>(); // productId -> total quantity used so far

    for (const item of data.items) {
      const product = productsById.get(item.productId);
      if (!product) throw new NotFoundError(`Product with ID ${item.productId}`);

      const baseQuantity = await inventoryService.convertToBaseUOM(item.productId, item.quantity, item.uom);

      // Check total available stock against what we've already used + what we need now
      const currentProductUsage = productUsage.get(item.productId) || 0;

      // Get current stock from Inventory table
      const inventoryRecord = product.Inventory.find((inv: any) => inv.warehouseId === data.warehouseId);
      const totalAvailableStock = inventoryRecord ? Number(inventoryRecord.quantity) : 0;

      if (totalAvailableStock < (currentProductUsage + baseQuantity)) {
        throw new InsufficientStockError(product.name, totalAvailableStock, currentProductUsage + baseQuantity);
      }

      // Update product usage
      productUsage.set(item.productId, currentProductUsage + baseQuantity);

      // Calculate COGS using Average Cost
      const itemCOGS = baseQuantity * Number(product.averageCostPrice);

      // Prepare inventory deduction
      const existingDeduction = inventoryDeductions.find(d => d.productId === item.productId);
      if (existingDeduction) {
        existingDeduction.amount += baseQuantity;
      } else {
        inventoryDeductions.push({
          productId: item.productId,
          amount: baseQuantity
        });
      }

      stockMovements.push({
        productId: item.productId,
        warehouseId: data.warehouseId,
        type: 'OUT',
        quantity: baseQuantity,
        reason: `POS Sale ${data.receiptNumber}`,
        referenceId: data.receiptNumber,
        referenceType: 'POS',
      });

      const originalPrice = item.originalPrice || item.unitPrice;
      const itemDiscount = item.discount || calculateItemDiscount(originalPrice, item.discountType, item.discountValue);
      const discountedPrice = originalPrice - itemDiscount;

      itemsWithCOGS.push({
        ...item,
        originalPrice,
        unitPrice: discountedPrice,
        discount: itemDiscount,
        subtotal: discountedPrice * item.quantity,
        costOfGoodsSold: itemCOGS,
      });
    }

    const discountCalc = calculateTotalDiscounts(itemsWithCOGS, data.discountType, data.discountValue);
    const vatCalc = calculateVAT(discountCalc.subtotalAfterDiscount, settings);

    if (data.paymentMethod === 'cash') {
      if (!data.amountReceived || data.amountReceived < vatCalc.finalTotal) {
        throw new ValidationError('Amount received is less than total.', { amountReceived: `Must be >= ${vatCalc.finalTotal}` });
      }
      data.change = data.amountReceived - vatCalc.finalTotal;
    }

    // 3. DATABASE TRANSACTION (WRITES ONLY)
    // =============================================================

    return await prisma.$transaction(async (tx) => {
      // Create Sale Record
      const sale = await posRepository.create({
        ...data,
        subtotal: discountCalc.subtotalAfterDiscount,
        discount: discountCalc.totalDiscount,
        tax: vatCalc.vatAmount,
        totalAmount: vatCalc.finalTotal,
        items: itemsWithCOGS,
      }, tx);

      // Batch update inventory quantities (Atomic Decrement)
      for (const deduction of inventoryDeductions) {
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: deduction.productId,
              warehouseId: data.warehouseId
            }
          },
          data: {
            quantity: { decrement: deduction.amount },
          },
        });
      }

      // Batch create stock movements
      await tx.stockMovement.createMany({
        data: stockMovements.map(m => ({
          ...m,
          id: randomUUID(),
          referenceId: sale.id
        })),
      });

      // Create Discount Expense
      if (discountCalc.totalDiscount > 0) {
        await discountExpenseService.createDiscountExpense(
          discountCalc.totalDiscount, data.receiptNumber!, data.branchId, data.discountReason, tx
        );
      }

      // Mark Sales Order as Converted
      if (data.convertedFromOrderId) {
        await salesOrderService.markAsConverted(data.convertedFromOrderId, sale.id, tx);
      }

      // Create AR Record for Credit Sales
      if (data.paymentMethod === 'credit' && data.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
        let dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // Default
        if (customer?.paymentTerms) {
          const termsMap: { [key: string]: number } = { 'Net 15': 15, 'Net 30': 30, 'Net 60': 60, 'COD': 1 };
          if (termsMap[customer.paymentTerms]) {
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + termsMap[customer.paymentTerms]);
          }
        }

        await arService.createAR({
          branchId: data.branchId,
          customerId: data.customerId || undefined,
          customerName: data.customerName!,
          salesOrderId: undefined,
          totalAmount: vatCalc.finalTotal - (data.partialPayment || 0),
          dueDate,
        }, tx);
      }

      return sale;
    });
  }
}

export const posService = new POSService();
