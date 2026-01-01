import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheManager, CacheTTL } from '../utils/cache';
import * as SecureStore from 'expo-secure-store';
const API_BASE_URL = '';
const API_TIMEOUT = 10000;

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
  private client: AxiosInstance | null = null;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {}

  private getClient(): AxiosInstance {
    if (!this.client) {
      this.client = axios.create({
        baseURL: API_BASE_URL,
        timeout: API_TIMEOUT,
      });
      this.setupInterceptors();
    }
    return this.client;
  }

  private setupInterceptors() {
    // Request interceptor for caching
    this.getClient().interceptors.request.use(
      async (config: any) => {
        const { cacheKey, cacheTTL = CacheTTL.MEDIUM, skipCache } = config;

        if (skipCache || !cacheKey || config.method !== 'get') {
          return config;
        }

        // Check if we have a pending request for this cache key
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
          // Wait for the pending request instead of making a duplicate
          const cachedData = await pendingRequest;
          (config as any).adapter = () => Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            fromCache: true,
            cacheHit: true,
          });
        }

        // Check cache
        const cachedData = await cacheManager.get(cacheKey);
        if (cachedData) {
          (config as any).adapter = () => Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config,
            fromCache: true,
            cacheHit: true,
          });
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for caching
    this.getClient().interceptors.response.use(
      async (response: CachedResponse) => {
        const config = (response.config || {}) as CachedRequestConfig;
        const { cacheKey, cacheTTL = CacheTTL.MEDIUM } = config;

        if (cacheKey && (config.method === 'get' || config.method === 'GET') && response.status === 200 && !response.fromCache) {
          // Cache the response
          await cacheManager.set(cacheKey, response.data, cacheTTL);
          
          // Remove from pending requests
          this.pendingRequests.delete(cacheKey);
          
          response.cacheHit = false;
        }

        return response;
      },
      async (error) => {
        const config = (error?.config || {}) as CachedRequestConfig;
        const { cacheKey } = config;

        if (cacheKey) {
          // Remove from pending requests
          this.pendingRequests.delete(cacheKey);
        }

        return Promise.reject(error);
      }
    );

    // Auth interceptor
    this.getClient().interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          (config.headers = config.headers || {}).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Error handling interceptor
    this.getClient().interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.config && !(error.config as any)._retry) {
          (error.config as any)._retry = true;
          try {
            await this.refreshToken();
            return this.getClient().request(error.config);
          } catch (refreshError) {
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('refreshToken');
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await this.getClient().post('/auth/refresh', {
      refreshToken: storedRefreshToken,
    });
    const { token, refreshToken: newRefreshToken } = response.data?.data || response.data;
    if (!token) {
      throw new Error('Failed to refresh token');
    }
    await SecureStore.setItemAsync('authToken', token);
    if (newRefreshToken) {
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);
    }
    return response.data;
  }

  async get<T>(url: string, config: CachedRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.getClient().get(url, config);
  }

  async post<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.getClient().post(url, data, config);
  }

  async put<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.getClient().put(url, data, config);
  }

  async patch<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.getClient().patch(url, data, config);
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<CachedResponse<T>> {
    return this.getClient().delete(url, config);
  }

  // Optimized batch requests
  async batchGet<T>(urls: string[], config: CachedRequestConfig = {}): Promise<CachedResponse<T>[]> {
    const promises = urls.map(url => this.get<T>(url, config));
    return Promise.all(promises);
  }

  // Cache invalidation helpers
  async invalidateCache(pattern: string) {
    if (pattern.includes('*') || pattern.includes(':')) {
      await cacheManager.invalidatePattern(pattern);
    } else {
      await cacheManager.invalidate(pattern);
    }
  }

  async clearCache() {
    await cacheManager.clear();
  }

  // Test-only helper
  __resetClientForTests() {
    this.client = null;
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
