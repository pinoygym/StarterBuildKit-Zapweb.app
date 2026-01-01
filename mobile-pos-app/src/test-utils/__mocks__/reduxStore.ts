import { jest } from '@jest/globals';

// Mock Redux store for testing
export class MockReduxStore {
  private state: any = {};
  private listeners: Array<() => void> = [];
  private actions: any[] = [];

  constructor(initialState: any = {}) {
    this.state = { ...initialState };
  }

  getState(): any {
    return { ...this.state };
  }

  dispatch(action: any): any {
    this.actions.push(action);

    // Handle specific action types for testing
    if (action.type === 'auth/login/fulfilled') {
      this.state.auth = {
        ...this.state.auth,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    } else if (action.type === 'auth/logout') {
      this.state.auth = {
        ...this.state.auth,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    } else if (action.type === 'cart/addItem') {
      const cart = this.state.cart || { items: [], subtotal: 0, tax: 0, total: 0 };
      const existingItem = cart.items.find((item: any) => item.productId === action.payload.productId);

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
      } else {
        cart.items.push(action.payload);
      }

      // Recalculate totals
      cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
      cart.total = cart.subtotal + cart.tax;

      this.state.cart = cart;
    } else if (action.type === 'cart/removeItem') {
      const cart = this.state.cart || { items: [], subtotal: 0, tax: 0, total: 0 };
      cart.items = cart.items.filter((item: any) => item.productId !== action.payload);
      cart.subtotal = cart.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
      cart.total = cart.subtotal + cart.tax;
      this.state.cart = cart;
    } else if (action.type === 'products/setProducts') {
      this.state.products = {
        ...this.state.products,
        items: action.payload,
        loading: false,
      };
    } else if (action.type === 'customers/setCustomers') {
      this.state.customers = {
        ...this.state.customers,
        items: action.payload,
        loading: false,
      };
    } else if (action.type === 'app/setSyncStatus') {
      this.state.app = {
        ...this.state.app,
        syncStatus: action.payload,
      };
    }

    // Notify listeners
    this.listeners.forEach(listener => listener());

    return action;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  replaceReducer(nextReducer: any): void {
    // Mock implementation
  }

  // Test utility methods
  setState(newState: any): void {
    this.state = { ...newState };
    this.listeners.forEach(listener => listener());
  }

  getActions(): any[] {
    return [...this.actions];
  }

  clearActions(): void {
    this.actions = [];
  }

  getListeners(): Array<() => void> {
    return [...this.listeners];
  }
}

// Create mock store instance
export const mockStore = new MockReduxStore({
  auth: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  app: {
    syncStatus: {
      isConnected: false,
      pendingChanges: 0,
      syncInProgress: false,
    },
    isOnline: false,
    settings: {
      theme: 'light',
      language: 'en',
      currency: 'PHP',
      autoSync: true,
      syncInterval: 30,
      offlineMode: false,
      notifications: true,
      soundEnabled: true,
      hapticFeedback: true,
    },
    loading: false,
    error: null,
    successMessage: null,
  },
  cart: {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    customerId: null,
    customerName: null,
    paymentMethod: null,
    amountReceived: null,
    change: null,
  },
  products: {
    items: [],
    loading: false,
    error: null,
  },
  customers: {
    items: [],
    loading: false,
    error: null,
  },
  sales: {
    items: [],
    loading: false,
    error: null,
  },
  sync: {
    pendingOperations: [],
    lastSyncAt: null,
    error: null,
  },
});

// Mock Redux Toolkit's configureStore
jest.mock('@reduxjs/toolkit', () => ({
  configureStore: jest.fn(() => mockStore),
  createSlice: jest.fn((config: any) => ({
    name: config.name,
    reducer: config.reducer,
    actions: Object.keys(config.reducers || {}).reduce((actions, key) => {
      actions[key] = jest.fn((payload) => ({
        type: `${config.name}/${key}`,
        payload,
      }));
      return actions;
    }, {} as any),
  })),
  createAsyncThunk: jest.fn((typePrefix: string, payloadCreator: any) => {
    const asyncThunk = jest.fn(async (arg, { dispatch, getState }) => {
      try {
        const result = await payloadCreator(arg, { dispatch, getState: () => mockStore.getState() });
        dispatch({ type: `${typePrefix}/fulfilled`, payload: result });
        return result;
      } catch (error) {
        dispatch({ type: `${typePrefix}/rejected`, error });
        throw error;
      }
    });
    (asyncThunk as any).pending = { type: `${typePrefix}/pending` };
    (asyncThunk as any).fulfilled = { type: `${typePrefix}/fulfilled` };
    (asyncThunk as any).rejected = { type: `${typePrefix}/rejected` };
    return asyncThunk;
  }),
}));

// Mock react-redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: any) => selector(mockStore.getState())),
  useDispatch: jest.fn(() => mockStore.dispatch.bind(mockStore)),
  Provider: ({ children }: { children: React.ReactNode }) => children,
  connect: jest.fn((mapStateToProps, mapDispatchToProps) => (Component: any) => Component),
}));

// Mock redux-persist
jest.mock('redux-persist', () => ({
  persistStore: jest.fn(() => ({
    persist: jest.fn(),
    purge: jest.fn(),
  })),
  persistReducer: jest.fn((config, reducer) => reducer),
  FLUSH: 'persist/FLUSH',
  REHYDRATE: 'persist/REHYDRATE',
  PAUSE: 'persist/PAUSE',
  PERSIST: 'persist/PERSIST',
  PURGE: 'persist/PURGE',
  REGISTER: 'persist/REGISTER',
}));

// Export for testing
export { mockStore as store };