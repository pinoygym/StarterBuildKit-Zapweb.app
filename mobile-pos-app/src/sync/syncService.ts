import { apiClient } from '../api/client';
import { databaseService } from '../database/database';
import { store } from '../store';
import { setSyncStatus, setIsOnline, setLastSyncAt } from '../store/slices/appSlice';

let syncIntervalId: ReturnType<typeof setInterval> | null = null;

// Run a single sync cycle: update online status, push local changes, pull server changes
export const runSyncOnce = async () => {
  try {
    store.dispatch(setSyncStatus({ syncInProgress: true }));

    // 1) Check connectivity
    const online = await apiClient.isOnline();
    store.dispatch(setIsOnline(online));
    if (!online) {
      setSyncStatus({ syncInProgress: false });
      return;
    }

    // 2) Load pending local changes from SQLite sync_log
    const pendingLogs = await databaseService.getPendingSync();

    // 3) Push to backend if there are changes
    if (pendingLogs.length > 0) {
      try {
        const payload = { changes: pendingLogs };
        const response = await apiClient.syncData(payload);

        if (response.success) {
          // If backend returns specific IDs that were applied, use them.
          const syncedIds: string[] =
            (response.data as any)?.syncedLogIds || pendingLogs.map((log: any) => log.id);

          for (const id of syncedIds) {
            await databaseService.markSyncCompleted(id);
          }
        }
      } catch (pushError) {
        console.error('Error pushing local changes:', pushError);
        // Keep logs as pending; they will retry on next sync.
      }
    }

    // 4) Pull updates from backend (basic implementation: products + customers)
    try {
      const productsResponse = await apiClient.get<any[]>('/products');
      if (productsResponse.success && Array.isArray(productsResponse.data)) {
        const products = productsResponse.data;
        await databaseService.transaction(async () => {
          for (const p of products) {
            // Upsert products
            await databaseService.executeRaw(
              `INSERT INTO products (
                id, name, description, category, imageUrl,
                basePrice, baseUOM, minStockLevel, shelfLifeDays,
                status, createdAt, updatedAt, syncStatus, lastModified
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
              )
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                category = excluded.category,
                imageUrl = excluded.imageUrl,
                basePrice = excluded.basePrice,
                baseUOM = excluded.baseUOM,
                minStockLevel = excluded.minStockLevel,
                shelfLifeDays = excluded.shelfLifeDays,
                status = excluded.status,
                updatedAt = excluded.updatedAt,
                syncStatus = 'synced',
                lastModified = excluded.lastModified;
              `,
              [
                p.id,
                p.name,
                p.description ?? null,
                p.category,
                p.imageUrl ?? null,
                p.basePrice,
                p.baseUOM,
                p.minStockLevel ?? 0,
                p.shelfLifeDays ?? 0,
                p.status ?? 'active',
                p.createdAt ?? new Date().toISOString(),
                p.updatedAt ?? new Date().toISOString(),
                'synced',
                p.updatedAt ?? new Date().toISOString(),
              ],
            );

            // Upsert product UOMs if present
            if (Array.isArray(p.alternateUOMs)) {
              for (const uom of p.alternateUOMs) {
                await databaseService.executeRaw(
                  `INSERT INTO product_uoms (
                    id, productId, name, conversionFactor, sellingPrice, createdAt
                  ) VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    conversionFactor = excluded.conversionFactor,
                    sellingPrice = excluded.sellingPrice;
                  `,
                  [
                    uom.id,
                    p.id,
                    uom.name,
                    uom.conversionFactor,
                    uom.sellingPrice,
                    uom.createdAt ?? new Date().toISOString(),
                  ],
                );
              }
            }
          }
        });
      }

      const customersResponse = await apiClient.get<any[]>('/customers');
      if (customersResponse.success && Array.isArray(customersResponse.data)) {
        const customers = customersResponse.data;
        await databaseService.transaction(async () => {
          for (const c of customers) {
            await databaseService.executeRaw(
              `INSERT INTO customers (
                id, customerCode, companyName, contactPerson, phone,
                email, address, city, region, postalCode,
                paymentTerms, creditLimit, taxId, customerType,
                notes, status, createdAt, updatedAt, syncStatus, lastModified
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
              )
              ON CONFLICT(id) DO UPDATE SET
                customerCode = excluded.customerCode,
                companyName = excluded.companyName,
                contactPerson = excluded.contactPerson,
                phone = excluded.phone,
                email = excluded.email,
                address = excluded.address,
                city = excluded.city,
                region = excluded.region,
                postalCode = excluded.postalCode,
                paymentTerms = excluded.paymentTerms,
                creditLimit = excluded.creditLimit,
                taxId = excluded.taxId,
                customerType = excluded.customerType,
                notes = excluded.notes,
                status = excluded.status,
                updatedAt = excluded.updatedAt,
                syncStatus = 'synced',
                lastModified = excluded.lastModified;
              `,
              [
                c.id,
                c.customerCode,
                c.companyName ?? null,
                c.contactPerson,
                c.phone,
                c.email,
                c.address ?? null,
                c.city ?? null,
                c.region ?? null,
                c.postalCode ?? null,
                c.paymentTerms ?? 'Net 30',
                c.creditLimit ?? null,
                c.taxId ?? null,
                c.customerType ?? 'regular',
                c.notes ?? null,
                c.status ?? 'active',
                c.createdAt ?? new Date().toISOString(),
                c.updatedAt ?? new Date().toISOString(),
                'synced',
                c.updatedAt ?? new Date().toISOString(),
              ],
            );
          }
        });
      }
    } catch (pullError) {
      console.error('Error pulling master data from server:', pullError);
      // Pull errors do not fail the whole sync; they will retry later.
    }

    // 5) Update sync status in store
    const remaining = await databaseService.getPendingSync();
    setSyncStatus({
      pendingChanges: remaining.length,
      syncInProgress: false,
      lastError: undefined,
    });
    setLastSyncAt(new Date());
  } catch (error: any) {
    console.error('Sync error:', error);
    const { setSyncStatus } = useAppStore.getState();
    setSyncStatus({
      syncInProgress: false,
      lastError: error?.message || 'Unknown sync error',
    });
  }
};

// Start background sync loop based on app settings (interval in minutes)
export const startSyncService = () => {
  if (syncIntervalId) return; // already running

  // Get settings from Redux store
  const state = store.getState();
  const settings = state.app.settings;
  const intervalMinutes = settings.syncInterval || 30;
  const intervalMs = intervalMinutes * 60 * 1000;

  // Run an initial sync when service starts
  void runSyncOnce();

  syncIntervalId = setInterval(() => {
    void runSyncOnce();
  }, intervalMs);
};

export const stopSyncService = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};
