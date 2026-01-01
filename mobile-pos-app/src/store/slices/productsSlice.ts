import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { Product } from '../../types';

interface ProductsState {
  items: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  sortBy: 'name' | 'price' | 'category' | 'stock';
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: ProductsState = {
  items: [],
  categories: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
  sortBy: 'name',
  sortOrder: 'asc',
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params?: { search?: string; category?: string; page?: number; limit?: number }) => {
    const response = await apiClient.getProducts(params);
    return response.data;
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id: string) => {
    const response = await apiClient.getProduct(id);
    return response.data;
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async () => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: Partial<Product>) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: { id: string; data: Partial<Product> }) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string) => {
    await apiClient.delete(`/products/${id}`);
    return id;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.pagination.page = 1; // Reset to first page when searching
    },
    
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.pagination.page = 1; // Reset to first page when filtering
    },
    
    setSortBy: (state, action: PayloadAction<ProductsState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    
    clearFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = null;
      state.sortBy = 'name';
      state.sortOrder = 'asc';
      state.pagination.page = 1;
    },
    
    updateProductLocally: (state, action: PayloadAction<Product>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
    
    removeProductLocally: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products || action.payload;
        state.pagination = {
          ...state.pagination,
          total: action.payload.total || action.payload.length,
          hasMore: (action.payload.products?.length || action.payload.length) >= state.pagination.limit,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // Fetch categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload as string[];
      })
      // Create product
      .addCase(createProduct.fulfilled, (state, action) => {
        const product = action.payload as Product;
        state.items.unshift(product);
      })
      // Update product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const product = action.payload as Product;
        const index = state.items.findIndex(item => item.id === product.id);
        if (index >= 0) {
          state.items[index] = product;
        }
      })
      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setSortBy,
  setSortOrder,
  setPage,
  clearFilters,
  updateProductLocally,
  removeProductLocally,
} = productsSlice.actions;

export default productsSlice.reducer;

// Selectors
export const selectProducts = (state: { products: ProductsState }) => state.products.items;
export const selectProductsLoading = (state: { products: ProductsState }) => state.products.loading;
export const selectProductsError = (state: { products: ProductsState }) => state.products.error;
export const selectProductCategories = (state: { products: ProductsState }) => state.products.categories;
export const selectProductsFilters = (state: { products: ProductsState }) => ({
  searchQuery: state.products.searchQuery,
  selectedCategory: state.products.selectedCategory,
  sortBy: state.products.sortBy,
  sortOrder: state.products.sortOrder,
});
export const selectProductsPagination = (state: { products: ProductsState }) => state.products.pagination;