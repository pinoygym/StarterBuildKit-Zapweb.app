import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../../types';

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerId?: string;
  customerName?: string;
  paymentMethod: 'cash' | 'card' | 'credit' | 'digital';
  amountReceived?: string;
  change?: number;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  paymentMethod: 'cash',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === newItem.productId && item.uom === newItem.uom
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        updatedItems[existingItemIndex].subtotal = 
          updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
        state.items = updatedItems;
      } else {
        // Add new item
        state.items.push({ ...newItem, subtotal: newItem.quantity * newItem.unitPrice });
      }
      
      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.id === itemId);
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items.splice(itemIndex, 1);
        } else {
          // Update quantity and subtotal
          state.items[itemIndex].quantity = quantity;
          state.items[itemIndex].subtotal = quantity * state.items[itemIndex].unitPrice;
        }
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.customerId = undefined;
      state.customerName = undefined;
      state.amountReceived = undefined;
      state.change = undefined;
    },
    
    setPaymentMethod: (state, action: PayloadAction<CartState['paymentMethod']>) => {
      state.paymentMethod = action.payload;
      // Reset payment-related fields when changing payment method
      if (action.payload !== 'cash') {
        state.amountReceived = undefined;
        state.change = undefined;
      }
    },
    
    setCustomer: (state, action: PayloadAction<{ customerId?: string; customerName?: string }>) => {
      state.customerId = action.payload.customerId;
      state.customerName = action.payload.customerName;
    },
    
    setCustomerInfo: (state, action: PayloadAction<{ customerId?: string; customerName?: string }>) => {
      state.customerId = action.payload.customerId;
      state.customerName = action.payload.customerName;
    },
    
    setAmountReceived: (state, action: PayloadAction<string>) => {
      state.amountReceived = action.payload;
      // Calculate change if amount received is provided
      const amount = parseFloat(action.payload) || 0;
      if (amount > 0) {
        state.change = Math.max(0, amount - state.total);
      } else {
        state.change = undefined;
      }
    },
    
    calculateTotals: (state) => {
      const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.12; // 12% VAT for Philippines
      const total = subtotal + tax;
      
      state.subtotal = subtotal;
      state.tax = tax;
      state.total = total;
      
      // Recalculate change if amount received is set
      if (state.amountReceived !== undefined && state.amountReceived !== '') {
        const amount = parseFloat(state.amountReceived) || 0;
        state.change = Math.max(0, amount - total);
      }
    },
  },
});

export const addToCart = cartSlice.actions.addItem;
export const removeFromCart = cartSlice.actions.removeItem;
export const updateCartItemQuantity = cartSlice.actions.updateQuantity;
export const clearCart = cartSlice.actions.clearCart;
export const setPaymentMethod = cartSlice.actions.setPaymentMethod;
export const setCustomer = cartSlice.actions.setCustomer;
export const setCustomerInfo = cartSlice.actions.setCustomerInfo;
export const setAmountReceived = cartSlice.actions.setAmountReceived;
export const calculateTotals = cartSlice.actions.calculateTotals;

export default cartSlice.reducer;