import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  branchId?: string;
}

export interface AuthResponse {
  user: any;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !(originalRequest as any)._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.client.request(originalRequest as any);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          (originalRequest as any)._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            
            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => {
              resolve();
            });
            this.failedQueue = [];
            
            // Retry the original request
            return this.client.request(originalRequest as AxiosRequestConfig);
          } catch (refreshError) {
            // Process queued requests with error
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];
            
            // Refresh failed, redirect to login
            await this.logout();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return {
        message: data?.message || 'Server error occurred',
        code: data?.code || error.response.status.toString(),
        details: data?.details,
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, refreshToken } = response.data.data;
        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      
      return response.data.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await this.client.post('/auth/logout');
    } catch (error) {
      // Even if logout fails, we still clear local storage
      console.error('Server logout failed:', error);
    } finally {
      // Clear all stored credentials
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.post<ApiResponse<{ token: string }>>('/auth/refresh', {
        refreshToken,
      });

      if (response.data.success) {
        const { token } = response.data.data;
        await SecureStore.setItemAsync('authToken', token);
        return token;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      throw this.handleError(error as AxiosError);
    }
  }

  async getCurrentUser(): Promise<ApiResponse> {
    try {
      const response = await this.client.get<ApiResponse>('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.client.post<ApiResponse>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // POS-specific methods
  async getProducts(params?: any): Promise<ApiResponse> {
    return this.get('/products', { params });
  }

  async getProduct(id: string): Promise<ApiResponse> {
    return this.get(`/products/${id}`);
  }

  async getCustomers(params?: any): Promise<ApiResponse> {
    return this.get('/customers', { params });
  }

  async getPOSSales(params?: any): Promise<ApiResponse> {
    return this.get('/pos/sales', { params });
  }

  async createPOSSale(sale: any): Promise<ApiResponse> {
    return this.post('/pos/sales', sale);
  }

  async getBranches(): Promise<ApiResponse> {
    return this.get('/branches');
  }

  async getInventory(params?: any): Promise<ApiResponse> {
    return this.get('/inventory', { params });
  }

  // File upload
  async uploadFile(uri: string, filename: string, type: string, folder: string = 'uploads'): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    formData.append('folder', folder);

    return this.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Sync methods for offline-first architecture
  async syncData(data: any): Promise<ApiResponse> {
    return this.post('/sync', data);
  }

  async getPendingChanges(since?: string): Promise<ApiResponse> {
    return this.get('/sync/pending', {
      params: since ? { since } : undefined,
    });
  }

  // Utility methods
  async isOnline(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Method to set auth token manually (useful for testing)
  async setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('authToken', token);
  }

  // Method to clear auth token
  async clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }
}

export const apiClient = new ApiClient();