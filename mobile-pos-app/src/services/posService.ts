import { databaseService } from '../database/database';
import { POSSale, POSSaleItem, CartItem, User, Branch } from '../types';
import { useAppStore } from '../store';

interface CreateSaleParams {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: POSSale['paymentMethod'];
  amountReceived?: number;
  customerId?: string;
  customerName?: string;
  currentUser: User | null;
  currentBranch: Branch | null;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const generateReceiptNumber = () => {
  const now = new Date();
  return `RCP-${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now
    .getDate()
    .toString()
    .padStart(2, '0')}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`;
};

export const createSale = async (params: CreateSaleParams): Promise<POSSale> => {
  const {
    cartItems,
    subtotal,
    tax,
    total,
    paymentMethod,
    amountReceived,
    customerId,
    customerName,
    currentUser,
    currentBranch,
  } = params;

  if (!currentUser || !currentBranch) {
    throw new Error('User and branch must be selected before creating a sale');
  }

  if (cartItems.length === 0) {
    throw new Error('Cannot create a sale with an empty cart');
  }

  const saleId = generateId();
  const receiptNumber = generateReceiptNumber();
  const createdAt = new Date();
  const updatedAt = createdAt;

  const change =
    paymentMethod === 'cash' && typeof amountReceived === 'number'
      ? amountReceived - total
      : undefined;

  const sale: POSSale = {
    id: saleId,
    receiptNumber,
    branchId: currentBranch.id,
    subtotal,
    tax,
    totalAmount: total,
    paymentMethod,
    amountReceived,
    change,
    customerId,
    customerName,
    items: cartItems.map((item) => ({
      id: generateId(),
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      uom: item.uom,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      costOfGoodsSold: 0,
    })),
    status: 'completed',
    createdAt,
    updatedAt,
  };

  await databaseService.transaction(async () => {
    // Insert into pos_sales
    await databaseService.insert('pos_sales', {
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      branchId: sale.branchId,
      subtotal: sale.subtotal,
      tax: sale.tax,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      amountReceived: sale.amountReceived ?? null,
      change: sale.change ?? null,
      customerId: sale.customerId ?? null,
      customerName: sale.customerName ?? null,
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      syncStatus: 'pending',
      lastModified: sale.updatedAt.toISOString(),
    });

    // Insert items
    for (const item of sale.items) {
      await databaseService.insert('pos_sale_items', {
        id: item.id,
        saleId: item.saleId,
        productId: item.productId,
        quantity: item.quantity,
        uom: item.uom,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        costOfGoodsSold: item.costOfGoodsSold,
      });
    }

    // Mark sale for sync
    await databaseService.markForSync('pos_sales', sale.id, 'INSERT');
  });

  // Update pending sync count in app store
  try {
    const pending = await databaseService.getPendingSync();
    const { setSyncStatus } = useAppStore.getState();
    setSyncStatus({ pendingChanges: pending.length });
  } catch (error) {
    console.error('Error updating pending sync count after sale:', error);
  }

  return sale;
};