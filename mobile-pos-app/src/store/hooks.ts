import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { useCallback } from 'react';
import { login, logout, getCurrentUser, setCurrentBranch, clearError, setLoading } from './slices/authSlice';
import { selectCurrentUser, selectCurrentBranch, selectIsAuthenticated, selectAuthLoading, selectAuthError } from './slices/authSlice';
import { setIsOnline, setLastSyncAt, setSyncStatus, setLoading as setAppLoading, setError as setAppError, setSuccessMessage } from './slices/appSlice';
import { selectAppSettings, selectIsOnline, selectSyncStatus, selectAppLoading, selectAppError, selectAppSuccessMessage } from './slices/appSlice';
import cartSlice from './slices/cartSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth store hook - combines auth selectors and actions
export const useAuthStore = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const user = useSelector(selectCurrentUser);
  const currentBranch = useSelector(selectCurrentBranch);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Actions
  const loginUser = useCallback(async (credentials: any) => {
    return await dispatch(login(credentials));
  }, [dispatch]);
  
  const logoutUser = useCallback(async () => {
    return await dispatch(logout());
  }, [dispatch]);
  
  const loadUser = useCallback(async () => {
    return await dispatch(getCurrentUser());
  }, [dispatch]);
  
  const setBranch = useCallback((branch: any) => {
    dispatch(setCurrentBranch(branch));
  }, [dispatch]);
  
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  const setAuthLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading));
  }, [dispatch]);
  
  return {
    user,
    currentBranch,
    isAuthenticated,
    isLoading,
    error,
    login: loginUser,
    logout: logoutUser,
    loadUser,
    setCurrentBranch: setBranch,
    clearError: clearAuthError,
    setLoading: setAuthLoading,
  };
};

// Cart store hook - combines cart selectors and actions
export const useCartStore = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const items = useAppSelector(state => state.cart.items);
  const subtotal = useAppSelector(state => state.cart.subtotal);
  const tax = useAppSelector(state => state.cart.tax);
  const total = useAppSelector(state => state.cart.total);
  const customerId = useAppSelector(state => state.cart.customerId);
  const customerName = useAppSelector(state => state.cart.customerName);
  const paymentMethod = useAppSelector(state => state.cart.paymentMethod);
  const amountReceived = useAppSelector(state => state.cart.amountReceived);
  const change = useAppSelector(state => state.cart.change);
  
  // Actions
  const addItem = useCallback((item: any) => {
    dispatch(cartSlice.actions.addItem(item));
  }, [dispatch]);
  
  const removeItem = useCallback((productId: string) => {
    dispatch(cartSlice.actions.removeItem(productId));
  }, [dispatch]);
  
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch(cartSlice.actions.updateQuantity({ productId, quantity }));
  }, [dispatch]);
  
  const clearCart = useCallback(() => {
    dispatch(cartSlice.actions.clearCart());
  }, [dispatch]);
  
  const setPaymentMethodType = useCallback((method: 'cash' | 'card' | 'credit' | 'digital') => {
    dispatch(cartSlice.actions.setPaymentMethod(method));
  }, [dispatch]);
  
  const setCustomerInfo = useCallback((customer: { customerId?: string; customerName?: string }) => {
    dispatch(cartSlice.actions.setCustomerInfo(customer));
  }, [dispatch]);
  
  const setAmountReceived = useCallback((amount: string) => {
    dispatch(cartSlice.actions.setAmountReceived(amount));
  }, [dispatch]);
  
  const calculateTotals = useCallback(() => {
    dispatch(cartSlice.actions.calculateTotals());
  }, [dispatch]);
  
  return {
    items,
    subtotal,
    tax,
    total,
    customerId,
    customerName,
    paymentMethod,
    amountReceived,
    change,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setPaymentMethod: setPaymentMethodType,
    setCustomerInfo,
    setAmountReceived,
    calculateTotals,
  };
};

// App store hook - combines app selectors and actions
export const useAppStore = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const settings = useSelector(selectAppSettings);
  const isOnline = useSelector(selectIsOnline);
  const syncStatus = useSelector(selectSyncStatus);
  const isLoading = useSelector(selectAppLoading);
  const error = useSelector(selectAppError);
  const successMessage = useSelector(selectAppSuccessMessage);
  const lastSyncAt = useSelector(selectLastSyncAt);
  
  // Actions
  const loadAppSettings = useCallback(async () => {
    // Settings would be loaded from storage or API
    // For now, we'll just return the current settings
    return settings;
  }, [settings]);
  
  const setAppLoadingState = useCallback((loading: boolean) => {
    dispatch(setAppLoading(loading));
  }, [dispatch]);
  
  const setAppErrorState = useCallback((error: string | null) => {
    dispatch(setAppError(error));
  }, [dispatch]);
  
  const setAppSuccessMessage = useCallback((message: string | null) => {
    dispatch(setSuccessMessage(message));
  }, [dispatch]);
  
  return {
    settings,
    isOnline,
    syncStatus,
    isLoading,
    error,
    successMessage,
    lastSyncAt,
    loadSettings: loadAppSettings,
    setLoading: setAppLoadingState,
    setError: setAppErrorState,
    setSuccessMessage: setAppSuccessMessage,
  };
};