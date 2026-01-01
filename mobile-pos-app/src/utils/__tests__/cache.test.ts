import { cacheManager, CacheKeys, CacheTTL } from '../cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('CacheManager', () => {
  beforeEach(async () => {
    await cacheManager.clear();
    jest.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should set and get data from cache', async () => {
      const testData = { name: 'test', value: 123 };
      const key = 'test-key';

      await cacheManager.set(key, testData);
      const retrieved = await cacheManager.get(key);

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should invalidate specific cache entries', async () => {
      const testData = { name: 'test' };
      const key = 'test-key';

      await cacheManager.set(key, testData);
      await cacheManager.invalidate(key);
      
      const result = await cacheManager.get(key);
      expect(result).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await cacheManager.set('key1', { data: 1 });
      await cacheManager.set('key2', { data: 2 });
      
      await cacheManager.clear();
      
      expect(await cacheManager.get('key1')).toBeNull();
      expect(await cacheManager.get('key2')).toBeNull();
    });
  });

  describe('TTL Functionality', () => {
    it('should respect TTL and expire data', async () => {
      const testData = { name: 'test' };
      const key = 'test-key';
      const shortTTL = 100; // 100ms

      await cacheManager.set(key, testData, shortTTL);
      
      // Should be available immediately
      expect(await cacheManager.get(key)).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, shortTTL + 50));
      
      // Should be expired
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const testData = { name: 'test' };
      const key = 'test-key';

      await cacheManager.set(key, testData);
      
      // Should be available immediately
      expect(await cacheManager.get(key)).toEqual(testData);
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate cache entries by pattern', async () => {
      await cacheManager.set('user:123', { id: 123 });
      await cacheManager.set('user:456', { id: 456 });
      await cacheManager.set('product:789', { id: 789 });

      await cacheManager.invalidatePattern('user:');

      expect(await cacheManager.get('user:123')).toBeNull();
      expect(await cacheManager.get('user:456')).toBeNull();
      expect(await cacheManager.get('product:789')).toEqual({ id: 789 });
    });
  });

  describe('Memory Management', () => {
    it('should implement LRU eviction for memory cache', async () => {
      // Fill memory cache to capacity
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`key-${i}`, { index: i });
      }

      // Add one more to trigger eviction
      await cacheManager.set('key-100', { index: 100 });

      // First key should be evicted
      expect(await cacheManager.get('key-0')).toBeNull();
      expect(await cacheManager.get('key-100')).toEqual({ index: 100 });
    });
  });

  describe('Persistence', () => {
    it('should persist data to AsyncStorage', async () => {
      const testData = { name: 'persisted' };
      const key = 'persist-key';

      await cacheManager.set(key, testData);

      // Verify AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `cache:${key}`,
        expect.stringContaining('persisted')
      );
    });

    it('should restore data from AsyncStorage', async () => {
      const testData = { name: 'restored' };
      const key = 'restore-key';

      // Mock AsyncStorage to return our test data
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000,
      }));

      const result = await cacheManager.get(key);
      expect(result).toEqual(testData);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const key = 'error-key';
      
      // Mock AsyncStorage to throw an error
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw, but return null
      const result = await cacheManager.get(key);
      expect(result).toBeNull();
    });
  });

  describe('Cache Keys', () => {
    it('should generate correct cache keys', () => {
      expect(CacheKeys.Products).toBe('products');
      expect(CacheKeys.INVENTORY).toBe('inventory');
      expect(CacheKeys.CUSTOMERS).toBe('customers');
      
      expect(CacheKeys.productById('123')).toBe('product:123');
      expect(CacheKeys.customerById('456')).toBe('customer:456');
      expect(CacheKeys.salesByDate('2024-01-01')).toBe('sales:2024-01-01');
      expect(CacheKeys.reportsByDateRange('2024-01-01', '2024-01-31')).toBe('reports:2024-01-01:2024-01-31');
    });
  });

  describe('Cache TTL Constants', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SHORT).toBe(60000); // 1 minute
      expect(CacheTTL.MEDIUM).toBe(300000); // 5 minutes
      expect(CacheTTL.LONG).toBe(900000); // 15 minutes
      expect(CacheTTL.VERY_LONG).toBe(3600000); // 1 hour
      expect(CacheTTL.DAY).toBe(86400000); // 24 hours
    });
  });
});