import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authSlice, { setCurrentBranch } from './slices/authSlice';
import appSlice, { setIsOnline, setLastSyncAt, setSyncStatus, setLoading as setAppLoading, setError as setAppError, setSuccessMessage } from './slices/appSlice';
import cartSlice from './slices/cartSlice';
import productsSlice from './slices/productsSlice';
import inventorySlice from './slices/inventorySlice';
import salesSlice from './slices/salesSlice';
import customersSlice from './slices/customersSlice';
import syncSlice from './slices/syncSlice';

// Configure persistence
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'currentBranch', 'isAuthenticated'],
};

const appPersistConfig = {
  key: 'app',
  storage: AsyncStorage,
  whitelist: ['settings', 'lastSyncAt'],
};

export const store = configureStore({
  reducer: ({
    auth: persistReducer(authPersistConfig, authSlice as any),
    app: persistReducer(appPersistConfig, appSlice as any),
    cart: cartSlice,
    products: productsSlice,
    inventory: inventorySlice,
    sales: salesSlice,
    customers: customersSlice,
    sync: syncSlice,
  } as any),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks
export { useAppDispatch, useAppSelector, useAuthStore, useAppStore, useCartStore } from './hooks';