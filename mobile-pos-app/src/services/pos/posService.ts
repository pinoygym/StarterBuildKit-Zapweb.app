import { databaseService } from '../database/databaseService';
import { syncService } from '../sync/syncService';
import { apiClient } from '../../api/client';
import { optimizedAPI } from '../optimizedAPI';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { cacheManager, CacheKeys, CacheTTL } from '../../utils/cache';
import { Product, POSSale, POSSaleItem, CartItem, PaymentMethod, SaleStatus, Customer } from '../../types';

export interface POSService {
  // Sale operations
  createSale(saleData: {
    cartItems: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'credit' | 'digital';
    amountReceived?: number;
    customerId?: string;
    customerName?: string;
    userId: string;
    branchId: string;
  }): Promise<POSSale>;

  voidSale(saleId: string, reason: string): Promise<void>;
  refundSale(saleId: string, items: CartItem[], reason: string): Promise<void>;

  // Sale queries
  getSaleById(saleId: string): Promise<POSSale | null>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<POSSale[]>;
  getSalesByCustomer(customerId: string): Promise<POSSale[]>;
  getTodaySales(branchId: string): Promise<POSSale[]>;
  getPendingOrders(branchId: string): Promise<POSSale[]>;

  // Inventory management
  checkProductAvailability(productId: string, quantity: number): Promise<boolean>;
  updateInventoryAfterSale(items: CartItem[]): Promise<void>;
  reserveInventory(items: CartItem[]): Promise<void>;
  releaseReservedInventory(items: CartItem[]): Promise<void>;

  // Receipt and reporting
  generateReceiptNumber(): string;
  getSalesSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      totalRevenue: number;
    }>;
  }>;

  // Payment processing
  processPayment(paymentData: {
    amount: number;
    method: 'cash' | 'card' | 'credit' | 'digital';
    reference?: string;
  }): Promise<{ success: boolean; reference?: string; error?: string }>;

  // Customer management
  getCustomerByCode(customerCode: string): Promise<Customer | null>;
  searchCustomers(searchTerm: string): Promise<Customer[]>;
  validateCustomerCredit(customerId: string, amount: number): Promise<boolean>;
}

class POSServiceImpl implements POSService {
  async createSale(saleData: {
    cartItems: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'credit' | 'digital';
    amountReceived?: number;
    customerId?: string;
    customerName?: string;
    userId: string;
    branchId: string;
  }): Promise<POSSale> {
    const endMonitoring = performanceMonitor.startMonitoring('createSale');
    
    try {
      // Validate inventory availability
      for (const item of saleData.cartItems) {
        const available = await this.checkProductAvailability(item.productId, item.quantity);
        if (!available) {
          throw new Error(`Insufficient stock for product: ${item.productName}`);
        }
      }

      // Generate receipt number
      const receiptNumber = this.generateReceiptNumber();

      // Create sale object
      const sale: POSSale = {
        id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        receiptNumber,
        branchId: saleData.branchId,
        userId: saleData.userId,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        totalAmount: saleData.total,
        paymentMethod: saleData.paymentMethod,
        amountReceived: saleData.amountReceived,
        change: saleData.amountReceived ? Math.max(0, saleData.amountReceived - saleData.total) : undefined,
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        items: saleData.cartItems.map(item => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          saleId: '', // Will be updated after sale creation
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          costOfGoodsSold: 0, // Will be calculated based on inventory
        })),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to local database first (offline-first approach)
      await this.saveSaleToLocalDatabase(sale);

      // Update inventory
      await this.updateInventoryAfterSale(saleData.cartItems);

      // Process payment
      const paymentResult = await this.processPayment({
        amount: saleData.total,
        method: saleData.paymentMethod,
      });

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

      // Invalidate related caches
      await cacheManager.invalidatePattern('sales');
      await cacheManager.invalidatePattern('inventory');

      // Sync with server if online
      if (await syncService.isOnline()) {
        try {
          await apiClient.createPOSSale(sale);
          await databaseService.markAsSynced('pos_sales', sale.id);
        } catch (error) {
          console.error('Failed to sync sale to server:', error);
          // Sale is still valid locally, will sync later
        }
      } else {
        // Add to sync queue
        await syncService.addPendingOperation({
          operationType: 'create',
          tableName: 'pos_sales',
          recordId: sale.id,
          operationData: sale,
        });
      }

      endMonitoring();
      return sale;
    } catch (error) {
      endMonitoring(error as Error);
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  async voidSale(saleId: string, reason: string): Promise<void> {
    try {
      // Get the sale
      const sale = await this.getSaleById(saleId);
      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status !== 'completed') {
        throw new Error('Only completed sales can be voided');
      }

      // Restore inventory
      for (const item of sale.items) {
        await this.restoreInventoryAfterVoid(item.productId, item.quantity);
      }

      // Update sale status
      sale.status = 'voided';
      sale.updatedAt = new Date();

      // Save to local database
      await databaseService.update('pos_sales', saleId, sale);

      // Sync with server if online
      if (await syncService.isOnline()) {
        try {
          await apiClient.post(`/pos/sales/${saleId}/void`, { reason });
          await databaseService.markAsSynced('pos_sales', saleId);
        } catch (error) {
          console.error('Failed to sync void operation:', error);
        }
      } else {
        // Add to sync queue
        await syncService.addPendingOperation({
          operationType: 'update',
          tableName: 'pos_sales',
          recordId: saleId,
          operationData: { status: 'voided', voidReason: reason },
        });
      }
    } catch (error) {
      console.error('Error voiding sale:', error);
      throw error;
    }
  }

  async refundSale(saleId: string, items: CartItem[], reason: string): Promise<void> {
    try {
      // Get the sale
      const sale = await this.getSaleById(saleId);
      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status !== 'completed') {
        throw new Error('Only completed sales can be refunded');
      }

      // Process refund for each item
      for (const refundItem of items) {
        const originalItem = sale.items.find(item => item.productId === refundItem.productId);
        if (!originalItem) {
          throw new Error(`Product ${refundItem.productName} not found in original sale`);
        }

        if (refundItem.quantity > originalItem.quantity) {
          throw new Error(`Refund quantity exceeds original sale quantity for ${refundItem.productName}`);
        }

        // Restore inventory
        await this.restoreInventoryAfterVoid(refundItem.productId, refundItem.quantity);
      }

      // Update sale status
      sale.status = 'refunded';
      sale.updatedAt = new Date();

      // Save to local database
      await databaseService.update('pos_sales', saleId, sale);

      // Sync with server if online
      if (await syncService.isOnline()) {
        try {
          await apiClient.post(`/pos/sales/${saleId}/refund`, { items, reason });
          await databaseService.markAsSynced('pos_sales', saleId);
        } catch (error) {
          console.error('Failed to sync refund operation:', error);
        }
      } else {
        // Add to sync queue
        await syncService.addPendingOperation({
          operationType: 'update',
          tableName: 'pos_sales',
          recordId: saleId,
          operationData: { status: 'refunded', refundItems: items, refundReason: reason },
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  async getSaleById(saleId: string): Promise<POSSale | null> {
    try {
      const sale = await databaseService.findById('pos_sales', saleId);
      if (sale) {
        // Get sale items
        const items = await databaseService.findAll('pos_sale_items', 'WHERE sale_id = ?', [saleId]);
        sale.items = items;
      }
      return sale;
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      throw error;
    }
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<POSSale[]> {
    const endMonitoring = performanceMonitor.startMonitoring('getSalesByDateRange');
    const cacheKey = CacheKeys.reportsByDateRange(startDate.toISOString(), endDate.toISOString());
    
    try {
      // Check cache first
      const cachedSales = await cacheManager.get<POSSale[]>(cacheKey);
      if (cachedSales) {
        endMonitoring();
        return cachedSales;
      }

      // Fetch from database
      const sales = await databaseService.getSalesByDateRange(startDate, endDate);
      
      // Cache the result
      await cacheManager.set(cacheKey, sales, CacheTTL.MEDIUM);
      
      endMonitoring();
      return sales;
    } catch (error) {
      endMonitoring(error as Error);
      console.error('Error getting sales by date range:', error);
      throw error;
    }
  }

  async getSalesByCustomer(customerId: string): Promise<POSSale[]> {
    try {
      return await databaseService.getSalesByCustomer(customerId);
    } catch (error) {
      console.error('Error getting sales by customer:', error);
      throw error;
    }
  }

  async getTodaySales(branchId: string): Promise<POSSale[]> {
    const endMonitoring = performanceMonitor.startMonitoring('getTodaySales');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const cacheKey = `sales:today:${branchId}:${today}`;
    
    try {
      // Check cache first
      const cachedSales = await cacheManager.get<POSSale[]>(cacheKey);
      if (cachedSales) {
        endMonitoring();
        return cachedSales;
      }

      // Fetch from database
      const sales = await databaseService.getTodaySales(branchId);
      
      // Cache the result with shorter TTL for today's sales
      await cacheManager.set(cacheKey, sales, CacheTTL.SHORT);
      
      endMonitoring();
      return sales;
    } catch (error) {
      endMonitoring(error as Error);
      console.error('Error getting today sales:', error);
      throw error;
    }
  }

  async getPendingOrders(branchId: string): Promise<POSSale[]> {
    try {
      return await databaseService.getPendingOrders(branchId);
    } catch (error) {
      console.error('Error getting pending orders:', error);
      throw error;
    }
  }

  async checkProductAvailability(productId: string, quantity: number): Promise<boolean> {
    try {
      const inventory = await databaseService.getInventoryByProduct(productId);
      const totalAvailable = inventory.reduce((sum, batch) => {
        const available = (batch as any).quantity ?? batch.currentStock;
        return sum + available;
      }, 0);
      return totalAvailable >= quantity;
    } catch (error) {
      console.error('Error checking product availability:', error);
      return false;
    }
  }

  async updateInventoryAfterSale(items: CartItem[]): Promise<void> {
    try {
      for (const item of items) {
        const inventory = await databaseService.getInventoryByProduct(item.productId);
        let remainingQuantity = item.quantity;

        // Use FIFO (First In, First Out) method
        for (const batch of inventory) {
          if (remainingQuantity <= 0) break;

          const available = (batch as any).quantity ?? batch.currentStock;
          const quantityToDeduct = Math.min(remainingQuantity, available);
          const newQuantity = available - quantityToDeduct;
          remainingQuantity -= quantityToDeduct;

          // Update batch in database
          await databaseService.update('inventory_batches', batch.id, { quantity: newQuantity });

          // Record stock movement
          await databaseService.recordStockMovement({
            batchId: batch.id,
            productId: item.productId,
            warehouseId: batch.warehouseId,
            movementType: 'out',
            quantity: quantityToDeduct,
            referenceType: 'sale',
            referenceId: item.id,
            notes: 'Sale transaction',
          });
        }
      }
    } catch (error) {
      console.error('Error updating inventory after sale:', error);
      throw error;
    }
  }

  async restoreInventoryAfterVoid(productId: string, quantity: number): Promise<void> {
    try {
      // Find the most recent batch for this product
      const inventory = await databaseService.getInventoryByProduct(productId);
      if (inventory.length > 0) {
        const batch = inventory[0]; // Use the first available batch
        const available = (batch as any).quantity ?? batch.currentStock;
        const newQuantity = available + quantity;

        await databaseService.update('inventory_batches', batch.id, { quantity: newQuantity });

        // Record stock movement
        await databaseService.recordStockMovement({
          batchId: batch.id,
          productId: productId,
          warehouseId: batch.warehouseId,
          movementType: 'in',
          quantity: quantity,
          referenceType: 'void',
          notes: 'Sale voided',
        });
      }
    } catch (error) {
      console.error('Error restoring inventory after void:', error);
      throw error;
    }
  }

  async reserveInventory(items: CartItem[]): Promise<void> {
    // Implementation for inventory reservation (for pending orders)
    // This would typically involve creating a reservation record
    console.log('Reserving inventory:', items);
  }

  async releaseReservedInventory(items: CartItem[]): Promise<void> {
    // Implementation for releasing inventory reservations
    console.log('Releasing reserved inventory:', items);
  }

  generateReceiptNumber(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP-${datePart}-${randomPart}`;
  }

  async getSalesSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      totalRevenue: number;
    }>;
  }> {
    try {
      const sales = await databaseService.getSalesByDateRange(startDate, endDate);
      const summary = await databaseService.getSalesSummary(startDate, endDate);

      // Calculate top products
      const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
      
      for (const sale of sales) {
        for (const item of sale.items) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: '', quantity: 0, revenue: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.subtotal;
        }
      }

      const topProducts = Object.entries(productSales)
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          quantitySold: data.quantity,
          totalRevenue: data.revenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      return {
        ...summary,
        topProducts,
      };
    } catch (error) {
      console.error('Error getting sales summary:', error);
      throw error;
    }
  }

  async processPayment(paymentData: {
    amount: number;
    method: 'cash' | 'card' | 'credit' | 'digital';
    reference?: string;
  }): Promise<{ success: boolean; reference?: string; error?: string }> {
    try {
      // Simulate payment processing
      // In a real app, this would integrate with payment gateways
      
      switch (paymentData.method) {
        case 'cash':
          // Cash payments are always successful
          return { success: true, reference: `CASH-${Date.now()}` };
        
        case 'card':
          // Simulate card payment processing
          const cardSuccess = Math.random() > 0.1; // 90% success rate
          if (cardSuccess) {
            return { success: true, reference: `CARD-${Date.now()}` };
          } else {
            return { success: false, error: 'Card declined' };
          }
        
        case 'credit':
          // Credit payments would require customer validation
          return { success: true, reference: `CREDIT-${Date.now()}` };
        
        case 'digital':
          // Simulate digital payment processing
          const digitalSuccess = Math.random() > 0.05; // 95% success rate
          if (digitalSuccess) {
            return { success: true, reference: `DIGITAL-${Date.now()}` };
          } else {
            return { success: false, error: 'Digital payment failed' };
          }
        
        default:
          return { success: false, error: 'Unsupported payment method' };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Payment processing error' };
    }
  }

  async getCustomerByCode(customerCode: string): Promise<Customer | null> {
    try {
      return await databaseService.getCustomerByCode(customerCode);
    } catch (error) {
      console.error('Error getting customer by code:', error);
      throw error;
    }
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      return await databaseService.searchCustomers(searchTerm);
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  async validateCustomerCredit(customerId: string, amount: number): Promise<boolean> {
    try {
      const customer = await databaseService.findById('customers', customerId);
      if (!customer) {
        return false;
      }

      // Calculate customer's current credit usage
      const customerSales = await databaseService.getSalesByCustomer(customerId);
      const outstandingAmount = customerSales
        .filter(sale => sale.status === 'completed' && sale.paymentMethod === 'credit')
        .reduce((sum, sale) => sum + sale.totalAmount, 0);

      return (outstandingAmount + amount) <= (customer.creditLimit || 0);
    } catch (error) {
      console.error('Error validating customer credit:', error);
      return false;
    }
  }

  private async saveSaleToLocalDatabase(sale: POSSale): Promise<void> {
    try {
      // Save sale
      await databaseService.insert('pos_sales', {
        id: sale.id,
        receipt_number: sale.receiptNumber,
        branch_id: sale.branchId,
        user_id: sale.userId,
        subtotal: sale.subtotal,
        tax: sale.tax,
        total_amount: sale.totalAmount,
        payment_method: sale.paymentMethod,
        amount_received: sale.amountReceived,
        change_amount: sale.change,
        customer_id: sale.customerId,
        customer_name: sale.customerName,
        status: sale.status,
        created_at: sale.createdAt.toISOString(),
        updated_at: sale.updatedAt.toISOString(),
        sync_status: 'pending',
      });

      // Save sale items
      for (const item of sale.items) {
        await databaseService.insert('pos_sale_items', {
          id: item.id,
          sale_id: sale.id,
          product_id: item.productId,
          quantity: item.quantity,
          uom: item.uom,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          cost_of_goods_sold: item.costOfGoodsSold,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving sale to local database:', error);
      throw error;
    }
  }
}

export const posService = new POSServiceImpl();