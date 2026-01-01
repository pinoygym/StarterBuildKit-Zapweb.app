import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { POSSale, SalesSummary } from '../../types';

interface SalesState {
  sales: POSSale[];
  todaySales: POSSale[];
  pendingOrders: POSSale[];
  salesSummary: SalesSummary | null;
  loading: boolean;
  error: string | null;
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    branchId?: string;
    paymentMethod?: string;
    status?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: SalesState = {
  sales: [],
  todaySales: [],
  pendingOrders: [],
  salesSummary: null,
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
export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params?: { dateFrom?: string; dateTo?: string; branchId?: string; paymentMethod?: string }) => {
    const response = await apiClient.get('/pos/sales', { params });
    return response.data;
  }
);

export const fetchTodaySales = createAsyncThunk(
  'sales/fetchTodaySales',
  async (branchId?: string) => {
    const response = await apiClient.get('/pos/sales/today-summary', { params: { branchId } });
    return response.data;
  }
);

export const fetchPendingOrders = createAsyncThunk(
  'sales/fetchPendingOrders',
  async (branchId?: string) => {
    const response = await apiClient.get('/pos/pending-orders', { params: { branchId } });
    return response.data;
  }
);

export const fetchSalesSummary = createAsyncThunk(
  'sales/fetchSalesSummary',
  async (params?: { dateFrom?: string; dateTo?: string; branchId?: string }) => {
    const response = await apiClient.get('/pos/sales/summary', { params });
    return response.data;
  }
);

export const createSale = createAsyncThunk(
  'sales/createSale',
  async (saleData: Partial<POSSale>) => {
    const response = await apiClient.createPOSSale(saleData);
    return response.data;
  }
);

export const voidSale = createAsyncThunk(
  'sales/voidSale',
  async ({ saleId, reason }: { saleId: string; reason: string }) => {
    const response = await apiClient.post(`/pos/sales/${saleId}/void`, { reason });
    return response.data;
  }
);

export const refundSale = createAsyncThunk(
  'sales/refundSale',
  async ({ saleId, items, reason }: { saleId: string; items: any[]; reason: string }) => {
    const response = await apiClient.post(`/pos/sales/${saleId}/refund`, { items, reason });
    return response.data;
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
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
    
    addSaleLocally: (state, action: PayloadAction<POSSale>) => {
      state.sales.unshift(action.payload);
      state.todaySales.unshift(action.payload);
      
      // Update sales summary
      if (state.salesSummary) {
        state.salesSummary.totalSales += action.payload.totalAmount;
        state.salesSummary.totalTransactions += 1;
        state.salesSummary.averageTransactionValue = 
          state.salesSummary.totalSales / state.salesSummary.totalTransactions;
      }
    },
    
    updateSaleLocally: (state, action: PayloadAction<POSSale>) => {
      const updateSaleInArray = (sales: POSSale[]) => {
        const index = sales.findIndex(sale => sale.id === action.payload.id);
        if (index >= 0) {
          sales[index] = action.payload;
        }
      };
      
      updateSaleInArray(state.sales);
      updateSaleInArray(state.todaySales);
      updateSaleInArray(state.pendingOrders);
    },
    
    removeSaleLocally: (state, action: PayloadAction<string>) => {
      const filterOutSale = (sales: POSSale[]) => 
        sales.filter(sale => sale.id !== action.payload);
      
      state.sales = filterOutSale(state.sales);
      state.todaySales = filterOutSale(state.todaySales);
      state.pendingOrders = filterOutSale(state.pendingOrders);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.sales = payload.sales || payload;
        state.pagination = {
          ...state.pagination,
          total: payload.total || payload.length,
          hasMore: (payload.sales?.length || payload.length) >= state.pagination.limit,
        };
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales';
      })
      // Fetch today sales
      .addCase(fetchTodaySales.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.todaySales = payload.sales || payload;
      })
      // Fetch pending orders
      .addCase(fetchPendingOrders.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.pendingOrders = payload.orders || payload;
      })
      // Fetch sales summary
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.salesSummary = action.payload as SalesSummary;
      })
      // Create sale
      .addCase(createSale.fulfilled, (state, action) => {
        state.sales.unshift(action.payload);
        if (state.salesSummary) {
          state.salesSummary.totalSales += action.payload.totalAmount;
          state.salesSummary.totalTransactions += 1;
          state.salesSummary.averageTransactionValue = 
            state.salesSummary.totalSales / state.salesSummary.totalTransactions;
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  addSaleLocally,
  updateSaleLocally,
  removeSaleLocally,
} = salesSlice.actions;

export default salesSlice.reducer;