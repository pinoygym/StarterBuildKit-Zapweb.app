import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { Customer } from '../../types';

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  filters: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    customerType?: 'regular' | 'wholesale' | 'retail' | 'all';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: CustomersState = {
  customers: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',
    customerType: 'all',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params?: { 
    search?: string; 
    status?: string; 
    customerType?: string; 
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData: Partial<Customer>) => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, data }: { id: string; data: Partial<Customer> }) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  }
);

export const toggleCustomerStatus = createAsyncThunk(
  'customers/toggleCustomerStatus',
  async (customerId: string) => {
    const response = await apiClient.patch(`/customers/${customerId}/toggle-status`);
    return response.data;
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (customerId: string) => {
    await apiClient.delete(`/customers/${customerId}`);
    return customerId;
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<CustomersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filtering
    },
    
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        customerType: 'all',
      };
      state.pagination.page = 1;
    },
    
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    
    addCustomerLocally: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
    },
    
    updateCustomerLocally: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(customer => customer.id === action.payload.id);
      if (index >= 0) {
        state.customers[index] = action.payload;
      }
    },
    
    removeCustomerLocally: (state, action: PayloadAction<string>) => {
      state.customers = state.customers.filter(customer => customer.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.customers = payload.customers || payload;
        state.pagination = {
          ...state.pagination,
          total: payload.total || payload.length,
          hasMore: (payload.customers?.length || payload.length) >= state.pagination.limit,
        };
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      // Create customer
      .addCase(createCustomer.fulfilled, (state, action) => {
        const customer = action.payload as Customer;
        state.customers.unshift(customer);
      })
      // Update customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const customer = action.payload as Customer;
        const index = state.customers.findIndex(c => c.id === customer.id);
        if (index >= 0) {
          state.customers[index] = customer;
        }
      })
      // Toggle customer status
      .addCase(toggleCustomerStatus.fulfilled, (state, action) => {
        const customer = action.payload as Customer;
        const index = state.customers.findIndex(c => c.id === customer.id);
        if (index >= 0) {
          state.customers[index] = customer;
        }
      })
      // Delete customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(customer => customer.id !== action.payload);
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  addCustomerLocally,
  updateCustomerLocally,
  removeCustomerLocally,
} = customersSlice.actions;

export default customersSlice.reducer;