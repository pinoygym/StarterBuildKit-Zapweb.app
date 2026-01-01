import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { SyncStatus } from '../../types';

interface SyncState {
  status: SyncStatus;
  pendingOperations: any[];
  syncHistory: Array<{
    id: string;
    timestamp: Date;
    type: 'full' | 'partial' | 'push' | 'pull';
    status: 'success' | 'failed' | 'in_progress';
    recordsProcessed: number;
    error?: string;
  }>;
  conflictResolution: {
    strategy: 'server_wins' | 'client_wins' | 'manual';
    conflicts: Array<{
      id: string;
      type: string;
      localData: any;
      serverData: any;
      resolved?: boolean;
      resolution?: 'local' | 'server' | 'merge';
    }>;
  };
}

const initialState: SyncState = {
  status: {
    isConnected: false,
    pendingChanges: 0,
    syncInProgress: false,
  },
  pendingOperations: [],
  syncHistory: [],
  conflictResolution: {
    strategy: 'server_wins',
    conflicts: [],
  },
};

// Async thunks
export const performSync = createAsyncThunk(
  'sync/performSync',
  async ({ type = 'full' }: { type?: 'full' | 'partial' | 'push' | 'pull' } = {}) => {
    const response = await apiClient.syncData({ type });
    return response.data;
  }
);

export const getPendingChanges = createAsyncThunk(
  'sync/getPendingChanges',
  async (since?: string) => {
    const response = await apiClient.getPendingChanges(since);
    return response.data;
  }
);

export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async ({ conflictId, resolution }: { conflictId: string; resolution: 'local' | 'server' | 'merge' }) => {
    const response = await apiClient.post('/sync/resolve-conflict', { conflictId, resolution });
    return response.data;
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncStatus: (state, action: PayloadAction<Partial<SyncState['status']>>) => {
      state.status = { ...state.status, ...action.payload };
    },
    
    addPendingOperation: (state, action: PayloadAction<any>) => {
      state.pendingOperations.push(action.payload);
      state.status.pendingChanges = state.pendingOperations.length;
    },
    
    removePendingOperation: (state, action: PayloadAction<string>) => {
      state.pendingOperations = state.pendingOperations.filter(
        (op) => op.id !== action.payload
      );
      state.status.pendingChanges = state.pendingOperations.length;
    },
    
    clearPendingOperations: (state) => {
      state.pendingOperations = [];
      state.status.pendingChanges = 0;
    },
    
    setConflictResolutionStrategy: (state, action: PayloadAction<SyncState['conflictResolution']['strategy']>) => {
      state.conflictResolution.strategy = action.payload;
    },
    
    addConflict: (state, action: PayloadAction<SyncState['conflictResolution']['conflicts'][0]>) => {
      state.conflictResolution.conflicts.push(action.payload);
    },
    
    resolveConflictLocally: (state, action: PayloadAction<{ conflictId: string; resolution: 'local' | 'server' | 'merge' }>) => {
      const conflict = state.conflictResolution.conflicts.find(
        (c) => c.id === action.payload.conflictId
      );
      
      if (conflict) {
        conflict.resolved = true;
        conflict.resolution = action.payload.resolution;
      }
    },
    
    clearResolvedConflicts: (state) => {
      state.conflictResolution.conflicts = state.conflictResolution.conflicts.filter(
        (c) => !c.resolved
      );
    },
    
    addSyncHistoryEntry: (state, action: PayloadAction<SyncState['syncHistory'][0]>) => {
      state.syncHistory.unshift(action.payload);
      // Keep only last 50 entries
      if (state.syncHistory.length > 50) {
        state.syncHistory = state.syncHistory.slice(0, 50);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Perform sync
      .addCase(performSync.pending, (state) => {
        state.status.syncInProgress = true;
        state.status.lastError = undefined;
      })
      .addCase(performSync.fulfilled, (state, action) => {
        state.status.syncInProgress = false;
        state.status.lastSyncAt = new Date();
        
        // Clear pending operations that were successfully synced
        if (action.payload.syncedOperations) {
          state.pendingOperations = state.pendingOperations.filter(
            (op) => !action.payload.syncedOperations.includes(op.id)
          );
          state.status.pendingChanges = state.pendingOperations.length;
        }
        
        // Add sync history entry
        const historyEntry = {
          id: `sync-${Date.now()}`,
          timestamp: new Date(),
          type: action.meta.arg.type || 'full',
          status: 'success' as const,
          recordsProcessed: action.payload.recordsProcessed || 0,
        };
        state.syncHistory.unshift(historyEntry);
      })
      .addCase(performSync.rejected, (state, action) => {
        state.status.syncInProgress = false;
        state.status.lastError = action.error.message;
        
        // Add sync history entry
        const historyEntry = {
          id: `sync-${Date.now()}`,
          timestamp: new Date(),
          type: action.meta.arg.type || 'full',
          status: 'failed' as const,
          recordsProcessed: 0,
          error: action.error.message,
        };
        state.syncHistory.unshift(historyEntry);
      })
      // Get pending changes
      .addCase(getPendingChanges.fulfilled, (state, action) => {
        state.pendingOperations = action.payload.changes || action.payload;
        state.status.pendingChanges = state.pendingOperations.length;
      })
      // Resolve conflict
      .addCase(resolveConflict.fulfilled, (state, action) => {
        const conflict = state.conflictResolution.conflicts.find(
          (c) => c.id === action.meta.arg.conflictId
        );
        
        if (conflict) {
          conflict.resolved = true;
          conflict.resolution = action.meta.arg.resolution;
        }
      });
  },
});

export const {
  setSyncStatus,
  addPendingOperation,
  removePendingOperation,
  clearPendingOperations,
  setConflictResolutionStrategy,
  addConflict,
  resolveConflictLocally,
  clearResolvedConflicts,
  addSyncHistoryEntry,
} = syncSlice.actions;

export default syncSlice.reducer;