import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_SIZE = 100; // Maximum items in memory cache

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      return memoryEntry.data;
    }

    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (entry.expiresAt > Date.now()) {
          // Restore to memory cache
          this.setMemoryCache(key, entry);
          return entry.data;
        } else {
          // Expired, remove from storage
          await AsyncStorage.removeItem(`cache:${key}`);
        }
      }
    } catch (error) {
      console.warn('Cache retrieval error:', error);
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    // Set in memory cache
    this.setMemoryCache(key, entry);

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache storage error:', error);
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate memory cache
    const keysToDelete = Array.from(this.memoryCache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Invalidate AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key: string) =>
        key.startsWith('cache:') && key.includes(pattern)
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Pattern invalidation error:', error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key: string) => key.startsWith('cache:'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  private setMemoryCache<T>(key: string, entry: CacheEntry<T>): void {
    // Implement LRU eviction
    if (this.memoryCache.size >= this.MAX_MEMORY_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
    this.memoryCache.set(key, entry);
  }
}

export const cacheManager = CacheManager.getInstance();

// Cache keys generator
export const CacheKeys = {
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
  SALES_REPORTS: 'sales_reports',
  CATEGORIES: 'categories',
  USER_PROFILE: 'user_profile',
  BRANCH_INFO: 'branch_info',
  Products: 'products',
  Inventory: 'inventory',
  Customers: 'customers',
  SalesReports: 'sales_reports',
  Categories: 'categories',
  UserProfile: 'user_profile',
  BranchInfo: 'branch_info',
  
  // Dynamic keys
  productById: (id: string) => `product:${id}`,
  inventoryByProduct: (productId: string) => `inventory:${productId}`,
  customerById: (id: string) => `customer:${id}`,
  salesByDate: (date: string) => `sales:${date}`,
  reportsByDateRange: (start: string, end: string) => `reports:${start}:${end}`,
} as const;

// Cache TTL configurations
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
  DAY: 24 * 60 * 60 * 1000,  // 24 hours
} as const;