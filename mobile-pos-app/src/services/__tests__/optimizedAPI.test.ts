import { optimizedAPI, useOptimizedAPI } from '../optimizedAPI';
import { cacheManager } from '../../utils/cache';
import axios from 'axios';

// Mock dependencies
jest.mock('../../utils/cache');
jest.mock('../../store/hooks', () => ({
  useAuthStore: () => ({
    token: 'test-token',
    refreshToken: 'test-refresh-token',
    setTokens: jest.fn(),
    logoutUser: jest.fn(),
  }),
}));

describe('OptimizedAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cache manager mocks
    (cacheManager.get as jest.Mock).mockResolvedValue(null);
    (cacheManager.set as jest.Mock).mockResolvedValue(undefined);
    (cacheManager.invalidate as jest.Mock).mockResolvedValue(undefined);
    (cacheManager.invalidatePattern as jest.Mock).mockResolvedValue(undefined);
    (cacheManager.clear as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Basic HTTP Methods', () => {
    it('should make GET requests', async () => {
      const mockResponse = { data: { id: 1, name: 'test' } };
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const result = await optimizedAPI.get('/test');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {});
      expect(result).toEqual(mockResponse);
    });

    it('should make POST requests', async () => {
      const mockResponse = { data: { id: 1 } };
      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const postData = { name: 'test' };
      const result = await optimizedAPI.post('/test', postData);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, {});
      expect(result).toEqual(mockResponse);
    });

    it('should make PUT requests', async () => {
      const mockResponse = { data: { id: 1 } };
      const mockAxiosInstance = {
        put: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const putData = { name: 'updated' };
      const result = await optimizedAPI.put('/test/1', putData);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, {});
      expect(result).toEqual(mockResponse);
    });

    it('should make DELETE requests', async () => {
      const mockResponse = { data: { success: true } };
      const mockAxiosInstance = {
        delete: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const result = await optimizedAPI.delete('/test/1');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', {});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Caching', () => {
    it('should use cached data when available', async () => {
      const cachedData = { id: 1, name: 'cached' };
      (cacheManager.get as jest.Mock).mockResolvedValue(cachedData);

      const mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const result = await optimizedAPI.get('/test', { cacheKey: 'test-cache' });
      
      expect(cacheManager.get).toHaveBeenCalledWith('test-cache');
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
      expect(result.data).toEqual(cachedData);
    });

    it('should cache GET requests by default', async () => {
      const responseData = { id: 1, name: 'test' };
      const mockResponse = { data: responseData, status: 200 };
      
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn((handler) => {
            // Simulate the request interceptor
            return Promise.resolve({
              config: { cacheKey: 'test-cache', cacheTTL: 300000 },
            });
          }) },
          response: { use: jest.fn((successHandler) => {
            // Simulate the response interceptor
            successHandler(mockResponse);
          }) },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      await optimizedAPI.get('/test', { cacheKey: 'test-cache' });
      
      expect(cacheManager.set).toHaveBeenCalledWith('test-cache', responseData, 300000);
    });

    it('should skip cache when skipCache is true', async () => {
      const mockResponse = { data: { id: 1 } };
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      await optimizedAPI.get('/test', { skipCache: true });
      
      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });
  });

  describe('Batch Requests', () => {
    it('should handle batch GET requests', async () => {
      const mockResponses = [
        { data: { id: 1 } },
        { data: { id: 2 } },
        { data: { id: 3 } },
      ];
      
      const mockAxiosInstance = {
        get: jest.fn()
          .mockResolvedValueOnce(mockResponses[0])
          .mockResolvedValueOnce(mockResponses[1])
          .mockResolvedValueOnce(mockResponses[2]),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      const urls = ['/test/1', '/test/2', '/test/3'];
      const results = await optimizedAPI.batchGet(urls);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(results).toEqual(mockResponses);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific cache keys', async () => {
      await optimizedAPI.invalidateCache('test-key');
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('test-key');
    });

    it('should invalidate cache by pattern', async () => {
      await optimizedAPI.invalidateCache('products:*');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('products:*');
    });

    it('should clear all cache', async () => {
      await optimizedAPI.clearCache();
      
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('useOptimizedAPI Hook', () => {
    it('should provide cache invalidation functions', () => {
      const { invalidateRelatedCache, invalidateCacheKey, clearCache } = useOptimizedAPI();
      
      expect(typeof invalidateRelatedCache).toBe('function');
      expect(typeof invalidateCacheKey).toBe('function');
      expect(typeof clearCache).toBe('function');
    });

    it('should invalidate related caches for products', async () => {
      const { invalidateRelatedCache } = useOptimizedAPI();
      
      await invalidateRelatedCache('products');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('products');
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('categories');
    });

    it('should invalidate related caches for sales', async () => {
      const { invalidateRelatedCache } = useOptimizedAPI();
      
      await invalidateRelatedCache('sales');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('sales_reports');
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('sales');
    });

    it('should invalidate related caches for inventory', async () => {
      const { invalidateRelatedCache } = useOptimizedAPI();
      
      await invalidateRelatedCache('inventory');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('inventory');
    });

    it('should invalidate related caches for customers', async () => {
      const { invalidateRelatedCache } = useOptimizedAPI();
      
      await invalidateRelatedCache('customers');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('customers');
    });

    it('should invalidate related caches for reports', async () => {
      const { invalidateRelatedCache } = useOptimizedAPI();
      
      await invalidateRelatedCache('reports');
      
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('reports');
      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('sales_reports');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockError = new Error('Network error');
      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(mockError),
        interceptors: {
          request: { use: jest.fn() },
          response: { 
            use: jest.fn((successHandler, errorHandler) => {
              // Simulate the error handler
              errorHandler(mockError).catch(() => {});
            }) 
          },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      try {
        await optimizedAPI.get('/test');
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });

    it('should handle cache errors gracefully', async () => {
      (cacheManager.get as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const mockResponse = { data: { id: 1 } };
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

      // Should not throw even if cache fails
      const result = await optimizedAPI.get('/test', { cacheKey: 'test-cache' });
      expect(result).toEqual(mockResponse);
    });
  });
});