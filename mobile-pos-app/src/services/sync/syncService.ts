import NetInfo from '@react-native-community/netinfo';
import { databaseService } from '../database/databaseService';
import { apiClient } from '../../api/client';
import { store } from '../../store';
import { setSyncStatus, addSyncHistoryEntry, addPendingOperation, removePendingOperation } from '../../store/slices/syncSlice';

export interface SyncService {
  initialize(): Promise<void>;
  checkAndSync(): Promise<void>;
  syncData(type?: 'full' | 'partial' | 'push' | 'pull'): Promise<void>;
  addPendingOperation(operation: any): Promise<void>;
  resolveConflicts(conflicts: any[]): Promise<void>;
  isOnline(): Promise<boolean>;
}

class SyncManager implements SyncService {
  private syncInProgress = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private networkState: any = null;

  async initialize(): Promise<void> {
    try {
      // Set up network state monitoring
      this.networkState = await NetInfo.fetch();
      
      NetInfo.addEventListener((state) => {
        this.networkState = state;
        store.dispatch(setSyncStatus({ isConnected: state.isConnected || false }));
        
        // Auto-sync when coming back online
        if (state.isConnected && !this.syncInProgress) {
          this.checkAndSync();
        }
      });

      // Initial sync check
      await this.checkAndSync();
      
      // Set up periodic sync (every 30 minutes by default)
      this.setupPeriodicSync();
      
      console.log('Sync service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
      throw error;
    }
  }

  private setupPeriodicSync(): void {
    const syncInterval = 30 * 60 * 1000; // 30 minutes
    
    this.syncInterval = setInterval(() => {
      if (!this.syncInProgress) {
        this.checkAndSync();
      }
    }, syncInterval);
  }

  async checkAndSync(): Promise<void> {
    try {
      const isOnline = await this.isOnline();
      
      if (!isOnline) {
        console.log('No internet connection, skipping sync');
        return;
      }

      const pendingOperations = await databaseService.getPendingSyncOperations();
      
      if (pendingOperations.length > 0) {
        console.log(`Found ${pendingOperations.length} pending operations, starting sync...`);
        await this.syncData('push');
      } else {
        console.log('No pending operations, checking for remote updates...');
        await this.syncData('pull');
      }
    } catch (error) {
      console.error('Error during sync check:', error);
      store.dispatch(setSyncStatus({ lastError: (error as Error).message }));
    }
  }

  async syncData(type: 'full' | 'partial' | 'push' | 'pull' = 'full'): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      store.dispatch(setSyncStatus({ syncInProgress: true, lastError: undefined }));

      const startTime = Date.now();
      let recordsProcessed = 0;

      switch (type) {
        case 'push':
          recordsProcessed = await this.pushPendingOperations();
          break;
        case 'pull':
          recordsProcessed = await this.pullRemoteUpdates();
          break;
        case 'full':
        case 'partial':
          recordsProcessed = await this.performFullSync();
          break;
      }

      const duration = Date.now() - startTime;
      console.log(`Sync completed in ${duration}ms, processed ${recordsProcessed} records`);

      // Add sync history entry
      store.dispatch(addSyncHistoryEntry({
        id: `sync-${Date.now()}`,
        timestamp: new Date(),
        type,
        status: 'success',
        recordsProcessed,
      }));

      store.dispatch(setSyncStatus({ 
        syncInProgress: false, 
        lastSyncAt: new Date(),
        pendingChanges: 0,
      }));

    } catch (error) {
      console.error('Sync failed:', error);
      
      store.dispatch(setSyncStatus({ 
        syncInProgress: false, 
        lastError: (error as Error).message,
      }));

      store.dispatch(addSyncHistoryEntry({
        id: `sync-${Date.now()}`,
        timestamp: new Date(),
        type,
        status: 'failed',
        recordsProcessed: 0,
        error: (error as Error).message,
      }));

      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async pushPendingOperations(): Promise<number> {
    const pendingOperations = await databaseService.getPendingSyncOperations();
    let recordsProcessed = 0;

    for (const operation of pendingOperations) {
      try {
        await this.processPendingOperation(operation);
        recordsProcessed++;
        
        // Remove from pending operations
        await databaseService.delete('sync_operations', operation.id);
        store.dispatch(removePendingOperation(operation.id));
        
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Update attempt count
        await databaseService.execute(
          'UPDATE sync_operations SET attempts = attempts + 1, last_attempt_at = CURRENT_TIMESTAMP WHERE id = ?',
          [operation.id]
        );
      }
    }

    return recordsProcessed;
  }

  private async processPendingOperation(operation: any): Promise<void> {
    const { operation_type, table_name, record_id, operation_data } = operation;
    const data = JSON.parse(operation_data);

    switch (operation_type) {
      case 'create':
        await apiClient.post(`/${table_name}`, data);
        break;
      case 'update':
        await apiClient.put(`/${table_name}/${record_id}`, data);
        break;
      case 'delete':
        await apiClient.delete(`/${table_name}/${record_id}`);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation_type}`);
    }
  }

  private async pullRemoteUpdates(): Promise<number> {
    const lastSyncAt = store.getState().sync.status.lastSyncAt;
    const since = lastSyncAt ? lastSyncAt.toISOString() : undefined;
    
    const response = await apiClient.getPendingChanges(since);
    const changes = response.data.changes || response.data;
    
    let recordsProcessed = 0;
    
    for (const change of changes) {
      try {
        await this.applyRemoteChange(change);
        recordsProcessed++;
      } catch (error) {
        console.error(`Failed to apply remote change:`, error);
      }
    }

    return recordsProcessed;
  }

  private async applyRemoteChange(change: any): Promise<void> {
    const { table_name, record_id, operation_type, data } = change;

    switch (operation_type) {
      case 'create':
      case 'update':
        await databaseService.insert(table_name, { ...data, sync_status: 'synced' });
        break;
      case 'delete':
        await databaseService.delete(table_name, record_id);
        break;
    }
  }

  private async performFullSync(): Promise<number> {
    // First push local changes
    const pushedRecords = await this.pushPendingOperations();
    
    // Then pull remote updates
    const pulledRecords = await this.pullRemoteUpdates();
    
    return pushedRecords + pulledRecords;
  }

  async addPendingOperation(operation: any): Promise<void> {
    // Add to local database
    await databaseService.addSyncOperation(operation);
    
    // Add to Redux store
    store.dispatch(addPendingOperation(operation));
    
    // Try to sync immediately if online
    if (await this.isOnline()) {
      this.syncData('push').catch(error => {
        console.error('Immediate sync failed:', error);
      });
    }
  }

  async resolveConflicts(conflicts: any[]): Promise<void> {
    const strategy = store.getState().sync.conflictResolution.strategy;
    
    for (const conflict of conflicts) {
      try {
        let resolution;
        
        switch (strategy) {
          case 'server_wins':
            resolution = 'server';
            break;
          case 'client_wins':
            resolution = 'local';
            break;
          case 'manual':
            // In a real app, this would show a UI for manual resolution
            resolution = 'server'; // Default to server for now
            break;
          default:
            resolution = 'server';
        }
        
        await apiClient.post('/sync/resolve-conflict', {
          conflictId: conflict.id,
          resolution,
        });
        
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
      }
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return (state.isConnected && state.isInternetReachable) || false;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncManager();