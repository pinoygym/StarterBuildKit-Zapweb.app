import { prisma } from '@/lib/prisma';
import { purchaseOrderRepository } from '@/repositories/purchase-order.repository';
import { productRepository } from '@/repositories/product.repository';
import { supplierRepository } from '@/repositories/supplier.repository';
import { inventoryService } from '@/services/inventory.service';
import { randomUUID } from 'crypto';
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  CancelPurchaseOrderInput,
  PurchaseOrderWithDetails,
  PurchaseOrderFilters,
} from '@/types/purchase-order.types';
import { ValidationError, NotFoundError } from '@/lib/errors';

export class PurchaseOrderService {
  /**
   * Generate PO number in format: PO-YYYYMMDD-XXXX
   */
  private async generatePONumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `PO-${year}${month}${day}`;

    // Find the last PO number for today
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        poNumber: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        poNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastPO) {
      const lastSequence = parseInt(lastPO.poNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${datePrefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Calculate due date based on payment terms
   */
  calculateDueDate(paymentTerms: string, receivedDate: Date = new Date()): Date {
    const dueDate = new Date(receivedDate);

    switch (paymentTerms) {
      case 'Net 15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'COD':
        // Due immediately
        break;
      default:
        // Default to Net 30
        dueDate.setDate(dueDate.getDate() + 30);
    }

    return dueDate;
  }

  /**
    * Get all purchase orders with optional filters
    */
  async getAllPurchaseOrders(filters?: PurchaseOrderFilters): Promise<PurchaseOrderWithDetails[]> {
    console.log('=== PURCHASE ORDER SERVICE: getAllPurchaseOrders START ===');
    console.log('Filters:', JSON.stringify(filters, null, 2));
    console.log('Calling purchaseOrderRepository.findAll...');
    const result = await purchaseOrderRepository.findAll(filters);
    console.log('Purchase orders found:', result.length);
    return result;
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithDetails> {
    const po = await purchaseOrderRepository.findById(id);
    if (!po) {
      throw new NotFoundError('Purchase Order');
    }
    return po;
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(data: CreatePurchaseOrderInput, userId?: string): Promise<PurchaseOrderWithDetails> {
    // Validate supplier is active
    const supplier = await supplierRepository.findById(data.supplierId);
    if (!supplier) {
      throw new NotFoundError('Supplier');
    }
    if (supplier.status !== 'active') {
      throw new ValidationError('Cannot create PO with inactive supplier', {
        supplierId: 'Supplier must be active',
      });
    }

    // Validate all products exist and are active
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Purchase order must have at least one item', {
        items: 'At least one item is required',
      });
    }

    for (const item of data.items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId}`);
      }
      if (product.status !== 'active') {
        throw new ValidationError(`Product ${product.name} is inactive`, {
          productId: 'All products must be active',
        });
      }

      // Validate quantity and unit price
      if (item.quantity <= 0) {
        throw new ValidationError('Invalid quantity', {
          quantity: 'Quantity must be greater than 0',
        });
      }
      if (item.unitPrice <= 0) {
        throw new ValidationError('Invalid unit price', {
          unitPrice: 'Unit price must be greater than 0',
        });
      }
    }

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Generate PO number
    const poNumber = await this.generatePONumber();

    // Create purchase order
    try {
      const po = await purchaseOrderRepository.create({
        ...data,
        poNumber,
        totalAmount,
        status: 'draft',
        createdById: userId,
      });
      return po;
    } catch (error) {
      console.error('Error in purchaseOrderService.createPurchaseOrder:', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Update purchase order (only Draft/Pending status)
   */
  async updatePurchaseOrder(
    id: string,
    data: UpdatePurchaseOrderInput,
    isSuperAdmin: boolean = false
  ): Promise<PurchaseOrderWithDetails> {
    // Check if PO exists
    const existingPO = await purchaseOrderRepository.findById(id);
    if (!existingPO) {
      throw new NotFoundError('Purchase Order');
    }

    // If only updating status (e.g., draft -> ordered), allow it
    const isStatusOnlyUpdate = Object.keys(data).length === 1 && data.status !== undefined;

    if (isStatusOnlyUpdate) {
      // If Super Admin, allow any status change
      if (isSuperAdmin) {
        return await purchaseOrderRepository.update(id, { status: data.status });
      }

      // Validate status transition
      if (data.status === 'ordered' && (existingPO.status === 'draft' || existingPO.status === 'pending')) {
        // Allow draft/pending -> ordered transition
        return await purchaseOrderRepository.update(id, { status: data.status });
      }
      throw new ValidationError('Invalid status transition', {
        status: 'Cannot change status from ' + existingPO.status + ' to ' + data.status,
      });
    }

    // For other updates, only allow updates for Draft and Pending status (unless Super Admin)
    if (!isSuperAdmin && existingPO.status !== 'draft' && existingPO.status !== 'pending') {
      throw new ValidationError('Cannot update purchase order', {
        status: 'Only Draft and Pending purchase orders can be updated',
      });
    }

    // Validate supplier if being updated
    if (data.supplierId) {
      const supplier = await supplierRepository.findById(data.supplierId);
      if (!supplier) {
        throw new NotFoundError('Supplier');
      }
      if (supplier.status !== 'active') {
        throw new ValidationError('Cannot update PO with inactive supplier', {
          supplierId: 'Supplier must be active',
        });
      }
    }

    // Validate products if items are being updated
    if (data.items) {
      if (data.items.length === 0) {
        throw new ValidationError('Purchase order must have at least one item', {
          items: 'At least one item is required',
        });
      }

      for (const item of data.items) {
        const product = await productRepository.findById(item.productId);
        if (!product) {
          throw new NotFoundError(`Product with ID ${item.productId}`);
        }
        if (product.status !== 'active') {
          throw new ValidationError(`Product ${product.name} is inactive`, {
            productId: 'All products must be active',
          });
        }

        // Validate quantity and unit price
        if (item.quantity <= 0) {
          throw new ValidationError('Invalid quantity', {
            quantity: 'Quantity must be greater than 0',
          });
        }
        if (item.unitPrice <= 0) {
          throw new ValidationError('Invalid unit price', {
            unitPrice: 'Unit price must be greater than 0',
          });
        }
      }
    }

    // Calculate new total amount if items are being updated
    let totalAmount: number | undefined;
    if (data.items) {
      totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
    }

    // Update purchase order
    return await purchaseOrderRepository.update(id, {
      ...data,
      totalAmount,
    });
  }

  /**
   * Cancel purchase order with reason
   */
  async cancelPurchaseOrder(id: string, data: CancelPurchaseOrderInput): Promise<PurchaseOrderWithDetails> {
    // Check if PO exists
    const existingPO = await purchaseOrderRepository.findById(id);
    if (!existingPO) {
      throw new NotFoundError('Purchase Order');
    }

    // Cannot cancel already received or cancelled POs
    if (existingPO.status === 'received') {
      throw new ValidationError('Cannot cancel received purchase order', {
        status: 'Purchase order has already been received',
      });
    }
    if (existingPO.status === 'cancelled') {
      throw new ValidationError('Purchase order is already cancelled', {
        status: 'Purchase order is already cancelled',
      });
    }

    // Update status to cancelled and add reason to notes
    const cancelNote = `CANCELLED: ${data.reason}${existingPO.notes ? `\n\nOriginal Notes: ${existingPO.notes}` : ''}`;

    // Update status using the repository method
    await purchaseOrderRepository.updateStatus(id, 'cancelled');

    // Update notes separately
    return await purchaseOrderRepository.update(id, {
      notes: cancelNote,
    });
  }

  /**
   * Receive purchase order - creates inventory batches and AP record
   */
  async receivePurchaseOrder(id: string): Promise<PurchaseOrderWithDetails> {
    return await prisma.$transaction(async (tx) => {
      // Get PO with items
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          PurchaseOrderItem: {
            include: {
              Product: true,
            },
          },
          Supplier: true,
        },
      });

      if (!po) {
        throw new NotFoundError('Purchase Order');
      }

      // Validate PO status
      if (po.status === 'received') {
        throw new ValidationError('Purchase order already received', {
          status: 'This purchase order has already been received',
        });
      }
      if (po.status === 'cancelled') {
        throw new ValidationError('Cannot receive cancelled purchase order', {
          status: 'This purchase order has been cancelled',
        });
      }

      const receivedDate = new Date();

      // Create inventory batches for each item
      for (const item of po.PurchaseOrderItem) {
        // Calculate remaining quantity to receive
        const orderedQty = Number(item.quantity);
        const receivedQty = Number(item.receivedQuantity);
        const remainingQty = orderedQty - receivedQty;

        if (remainingQty <= 0) {
          continue; // Skip items that are already fully received
        }

        // Add stock using inventory service
        // Note: inventory service will calculate expiry date based on product shelf life
        await inventoryService.addStock({
          productId: item.productId,
          warehouseId: po.warehouseId,
          quantity: remainingQty, // Only add remaining quantity
          uom: item.uom, // Use the UOM from the PO item
          unitCost: Number(item.unitPrice),
          referenceId: po.id,
          referenceType: 'PO',
          reason: `Received from PO ${po.poNumber} (Receive All)`,
        });

        // Update item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQuantity: {
              increment: remainingQty,
            },
          },
        });
      }

      // Update PO status to received
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'received',
          actualDeliveryDate: receivedDate,
        },
      });

      // Create Accounts Payable record
      // Calculate the amount for this specific receipt (remaining items)
      // Note: If we want to track AP for the *entire* PO, we might need to check if an AP already exists.
      // However, the current logic seems to assume one AP per PO or one AP per receipt.
      // Given "Receive All" completes the PO, let's check if we should create a new AP or update existing?
      // The original code created a NEW AP for the TOTAL amount.
      // If we are doing "Receive All" on a partially received PO, we should probably only create AP for the *remaining* amount
      // OR if the previous receipts didn't create AP (which they should have via Receiving Voucher), then we might have a mix.

      // Assumption: Receiving Vouchers create their own APs.
      // "Receive All" is a shortcut. If used on partially received PO, it implies the rest is delivered now.
      // So we should create AP for the *remaining* value.

      const remainingTotalAmount = po.PurchaseOrderItem.reduce((sum, item) => {
        const remaining = Number(item.quantity) - Number(item.receivedQuantity);
        return sum + (Math.max(0, remaining) * Number(item.unitPrice));
      }, 0);

      if (remainingTotalAmount > 0) {
        const dueDate = this.calculateDueDate(po.Supplier.paymentTerms, receivedDate);

        await tx.accountsPayable.create({
          data: {
            id: randomUUID(),
            branchId: po.branchId,
            supplierId: po.supplierId,
            purchaseOrderId: po.id,
            totalAmount: remainingTotalAmount,
            paidAmount: 0,
            balance: remainingTotalAmount,
            dueDate,
            status: 'pending',
            updatedAt: new Date(),
          },
        });
      }

      // Return updated PO
      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          Supplier: true,
          Warehouse: true,
          Branch: true,
          PurchaseOrderItem: {
            include: {
              Product: {
                select: {
                  id: true,
                  name: true,
                  baseUOM: true,
                },
              },
            },
          },
        },
      });

      return updatedPO!;
    });
  }
}

export const purchaseOrderService = new PurchaseOrderService();
