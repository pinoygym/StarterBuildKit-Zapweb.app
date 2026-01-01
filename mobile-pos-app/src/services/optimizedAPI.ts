import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheManager, CacheKeys, CacheTTL } from './cache';
import { API_BASE_URL, API_TIMEOUT } from '../config/constants';
import { useAuthStore } from '../store/hooks';

interface CachedRequestConfig extends AxiosRequestConfig {
  cacheKey?: string;
  cacheTTL?: number;
  skipCache?: boolean;
}

interface CachedResponse<T = any> extends AxiosResponse<T> {
  fromCache?: boolean;
  cacheHit?: boolean;
}

class OptimizedAPIClient {
  private client: AxiosInstance;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for caching
    this.client.interceptors.request.use(
      async (config: CachedRequestConfig) => {
        const { cacheKey, cacheTTL = CacheTTL.MEDIUM, skipCache } = config;

        if (skipCache || !cacheKey || config.method !== 'get') {
          return config;
        }

        // Check if we have a pending request for this cache key
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
          // Wait for the pending request instead of making a duplicate
          const cachedData = await pendingRequest;
          config.adapter = () => Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
        }

        // Check cache
        const cachedData = await cacheManager.get(cacheKey);
        if (cachedData) {
          config.adapter = () => Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config,
          });
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for caching
    this.client.interceptors.response.use(
      async (response: CachedResponse) => {
        const config = response.config as CachedRequestConfig;
        const { cacheKey, cacheTTL = CacheTTL.MEDIUM } = config;

        if (cacheKey && config.method === 'get' && response.status === 200) {
          // Cache the response
          await cacheManager.set(cacheKey, response.data, cacheTTL);
          
          // Remove from pending requests
          this.pendingRequests.delete(cacheKey);
          
          response.cacheHit = false;
        }

        return response;
      },
      async (error) => {
        const config = error.config as CachedRequestConfig;
        const { cacheKey } = config;

        if (cacheKey) {
          // Remove from pending requests
          this.pendingRequests.delete(cacheKey);
        }

        return Promise.reject(error);
      }
    );

    // Auth interceptor
    this.client.interceptors.request.use(
      (config) => {
        const { token } = useAuthStore();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Error handling interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
          const { refreshToken } = useAuthStore();
          if (refreshToken) {
            try {
              await this.refreshToken();
              // Retry the original request
              return this.client(error.config);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              const { logoutUser } = useAuthStore();
              logoutUser();
              throw refreshError;
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    const { refreshToken, setTokens } = useAuthStore();
    
    try {
      const response = await this.client.post('/auth/refresh', {
        refreshToken,
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      setTokens(accessToken, newRefreshToken);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async get<T>(url: string, config: CachedRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.client.delete(url, config);
  }

  // Optimized batch requests
  async batchGet<T>(urls: string[], config: CachedRequestConfig = {}): Promise<CachedResponse<T>[]> {
    const promises = urls.map(url => this.get<T>(url, config));
    return Promise.all(promises);
  }

  // Cache invalidation helpers
  async invalidateCache(pattern: string) {
    await cacheManager.invalidatePattern(pattern);
  }

  async clearCache() {
    await cacheManager.clear();
  }
}

export const optimizedAPI = new OptimizedAPIClient();

// Optimized API hooks
export function useOptimizedAPI() {
  const invalidateRelatedCache = async (resource: string) => {
    const patterns = {
      products: ['products', 'categories'],
      inventory: ['inventory'],
      customers: ['customers'],
      sales: ['sales_reports', 'sales'],
      reports: ['reports', 'sales_reports'],
    };

    const patternsToInvalidate = patterns[resource as keyof typeof patterns] || [resource];
    
    for (const pattern of patternsToInvalidate) {
      await cacheManager.invalidatePattern(pattern);
    }
  };

  const invalidateCacheKey = async (key: string) => {
    await cacheManager.invalidate(key);
  };

  return {
    invalidateRelatedCache,
    invalidateCacheKey,
    clearCache: () => cacheManager.clear(),
  };
}