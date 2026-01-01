import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncStatus, BackupStatus } from '../../types';

interface AppState {
  // Sync state
  syncStatus: SyncStatus;
  backupStatus: BackupStatus;
  
  // Network state
  isOnline: boolean;
  lastSyncAt?: Date;
  
  // Settings
  settings: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'fil';
    currency: 'PHP' | 'USD';
    autoSync: boolean;
    syncInterval: number; // minutes
    offlineMode: boolean;
    notifications: boolean;
    soundEnabled: boolean;
    hapticFeedback: boolean;
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AppState = {
  syncStatus: {
    isConnected: false,
    pendingChanges: 0,
    syncInProgress: false,
  },
  
  backupStatus: {
    backupInProgress: false,
    availableBackups: [],
  },
  
  isOnline: false,
  lastSyncAt: undefined,
  
  settings: {
    theme: 'auto',
    language: 'en',
    currency: 'PHP',
    autoSync: true,
    syncInterval: 30, // 30 minutes
    offlineMode: false,
    notifications: true,
    soundEnabled: true,
    hapticFeedback: true,
  },
  
  isLoading: false,
  error: null,
  successMessage: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    loadSettings: (state) => {
      // Settings would be loaded from storage or API
      // For now, we'll just return the current settings
      return state;
    },
    setSyncStatus: (state, action: PayloadAction<Partial<SyncStatus>>) => {
      state.syncStatus = { ...state.syncStatus, ...action.payload };
    },
    
    setBackupStatus: (state, action: PayloadAction<Partial<BackupStatus>>) => {
      state.backupStatus = { ...state.backupStatus, ...action.payload };
    },
    
    setIsOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.syncStatus.isConnected = action.payload;
    },
    
    setLastSyncAt: (state, action: PayloadAction<Date>) => {
      state.lastSyncAt = action.payload;
    },
    
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.successMessage = null;
    },
    
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
      state.error = null;
    },
    
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const {
  loadSettings,
  setSyncStatus,
  setBackupStatus,
  setIsOnline,
  setLastSyncAt,
  updateSettings,
  setLoading,
  setError,
  setSuccessMessage,
  clearMessages,
} = appSlice.actions;

// Selectors
export const selectAppSettings = (state: any) => state.app.settings;
export const selectIsOnline = (state: any) => state.app.isOnline;
export const selectSyncStatus = (state: any) => state.app.syncStatus;
export const selectAppLoading = (state: any) => state.app.isLoading;
export const selectAppError = (state: any) => state.app.error;
export const selectAppSuccessMessage = (state: any) => state.app.successMessage;
export const selectLastSyncAt = (state: any) => state.app.lastSyncAt;

export default appSlice.reducer;