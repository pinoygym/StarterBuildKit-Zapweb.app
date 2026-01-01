import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { InventoryBatch, StockMovement } from '../../types';

interface InventoryState {
  batches: InventoryBatch[];
  movements: StockMovement[];
  lowStockItems: InventoryBatch[];
  expiringItems: InventoryBatch[];
  loading: boolean;
  error: string | null;
  filters: {
    warehouseId?: string;
    productId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: InventoryState = {
  batches: [],
  movements: [],
  lowStockItems: [],
  expiringItems: [],
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const fetchInventoryBatches = createAsyncThunk(
  'inventory/fetchBatches',
  async (params?: { warehouseId?: string; productId?: string; status?: string }) => {
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  }
);

export const fetchStockMovements = createAsyncThunk(
  'inventory/fetchMovements',
  async (params?: { warehouseId?: string; productId?: string; dateFrom?: string; dateTo?: string }) => {
    const response = await apiClient.get('/inventory/movements', { params });
    return response.data;
  }
);

export const addStock = createAsyncThunk(
  'inventory/addStock',
  async ({ batchId, quantity, reason }: { batchId: string; quantity: number; reason?: string }) => {
    const response = await apiClient.post(`/inventory/${batchId}/add-stock`, { quantity, reason });
    return response.data;
  }
);

export const deductStock = createAsyncThunk(
  'inventory/deductStock',
  async ({ batchId, quantity, reason }: { batchId: string; quantity: number; reason?: string }) => {
    const response = await apiClient.post(`/inventory/${batchId}/deduct-stock`, { quantity, reason });
    return response.data;
  }
);

export const transferStock = createAsyncThunk(
  'inventory/transferStock',
  async ({ fromBatchId, toWarehouseId, quantity, reason }: { 
    fromBatchId: string; 
    toWarehouseId: string; 
    quantity: number; 
    reason?: string;
  }) => {
    const response = await apiClient.post('/inventory/transfer', {
      fromBatchId,
      toWarehouseId,
      quantity,
      reason,
    });
    return response.data;
  }
);

export const adjustStock = createAsyncThunk(
  'inventory/adjustStock',
  async ({ batchId, newQuantity, reason }: { batchId: string; newQuantity: number; reason: string }) => {
    const response = await apiClient.post(`/inventory/${batchId}/adjust`, { newQuantity, reason });
    return response.data;
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<InventoryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filtering
    },
    
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    
    updateBatchLocally: (state, action: PayloadAction<InventoryBatch>) => {
      const index = state.batches.findIndex(batch => batch.id === action.payload.id);
      if (index >= 0) {
        state.batches[index] = action.payload;
      } else {
        state.batches.push(action.payload);
      }
    },
    
    addMovementLocally: (state, action: PayloadAction<StockMovement>) => {
      state.movements.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventory batches
      .addCase(fetchInventoryBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryBatches.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.batches = payload.batches || payload;
        state.pagination = {
          ...state.pagination,
          total: payload.total || payload.length,
          hasMore: (payload.batches?.length || payload.length) >= state.pagination.limit,
        };
      })
      .addCase(fetchInventoryBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch inventory batches';
      })
      // Fetch stock movements
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.movements = payload.movements || payload;
      })
      // Add stock
      .addCase(addStock.fulfilled, (state, action) => {
        const batch = action.payload as InventoryBatch;
        const index = state.batches.findIndex(b => b.id === batch.id);
        if (index >= 0) {
          state.batches[index] = batch;
        }
      })
      // Deduct stock
      .addCase(deductStock.fulfilled, (state, action) => {
        const batch = action.payload as InventoryBatch;
        const index = state.batches.findIndex(b => b.id === batch.id);
        if (index >= 0) {
          state.batches[index] = batch;
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  updateBatchLocally,
  addMovementLocally,
} = inventorySlice.actions;

// Selectors
export const selectInventoryBatches = (state: { inventory: InventoryState }) => state.inventory.batches;
export const selectStockMovements = (state: { inventory: InventoryState }) => state.inventory.movements;
export const selectLowStockItems = (state: { inventory: InventoryState }) => state.inventory.lowStockItems;
export const selectExpiringItems = (state: { inventory: InventoryState }) => state.inventory.expiringItems;
export const selectInventoryLoading = (state: { inventory: InventoryState }) => state.inventory.loading;
export const selectInventoryError = (state: { inventory: InventoryState }) => state.inventory.error;
export const selectInventoryFilters = (state: { inventory: InventoryState }) => state.inventory.filters;
export const selectInventoryPagination = (state: { inventory: InventoryState }) => state.inventory.pagination;

export default inventorySlice.reducer;