import { jest } from '@jest/globals';

// Mock API client for testing
export class MockApiClient {
  private responses: Map<string, any> = new Map();
  private errors: Map<string, any> = new Map();
  private callHistory: Array<{ method: string; endpoint: string; data?: any; config?: any }> = [];
  private onlineStatus: boolean = true;
  private delay: number = 0;

  constructor() {
    this.setupDefaultResponses();
  }

  private setupDefaultResponses() {
    // Default successful responses
    this.responses.set('GET /products', { data: [], success: true });
    this.responses.set('GET /customers', { data: [], success: true });
    this.responses.set('GET /pos/sales', { data: [], success: true });
    this.responses.set('GET /inventory', { data: [], success: true });
    this.responses.set('GET /branches', { data: [], success: true });
    this.responses.set('GET /health', { data: { status: 'ok' }, success: true });
  }

  // Mock API methods
  async get(endpoint: string, config?: any): Promise<any> {
    this.callHistory.push({ method: 'GET', endpoint, config });
    await this.delayResponse();

    const error = this.errors.get(`GET ${endpoint}`);
    if (error) {
      throw error;
    }

    const response = this.responses.get(`GET ${endpoint}`);
    if (response) {
      return response;
    }

    // Default response for unknown endpoints
    return { data: [], success: true };
  }

  async post(endpoint: string, data?: any, config?: any): Promise<any> {
    this.callHistory.push({ method: 'POST', endpoint, data, config });
    await this.delayResponse();

    const error = this.errors.get(`POST ${endpoint}`);
    if (error) {
      throw error;
    }

    const response = this.responses.get(`POST ${endpoint}`);
    if (response) {
      return response;
    }

    // Default response for unknown endpoints
    return { data: { id: 'mock-id' }, success: true };
  }

  async put(endpoint: string, data?: any, config?: any): Promise<any> {
    this.callHistory.push({ method: 'PUT', endpoint, data, config });
    await this.delayResponse();

    const error = this.errors.get(`PUT ${endpoint}`);
    if (error) {
      throw error;
    }

    const response = this.responses.get(`PUT ${endpoint}`);
    if (response) {
      return response;
    }

    return { data: { id: 'mock-id' }, success: true };
  }

  async patch(endpoint: string, data?: any, config?: any): Promise<any> {
    this.callHistory.push({ method: 'PATCH', endpoint, data, config });
    await this.delayResponse();

    const error = this.errors.get(`PATCH ${endpoint}`);
    if (error) {
      throw error;
    }

    const response = this.responses.get(`PATCH ${endpoint}`);
    if (response) {
      return response;
    }

    return { data: { id: 'mock-id' }, success: true };
  }

  async delete(endpoint: string, config?: any): Promise<any> {
    this.callHistory.push({ method: 'DELETE', endpoint, config });
    await this.delayResponse();

    const error = this.errors.get(`DELETE ${endpoint}`);
    if (error) {
      throw error;
    }

    const response = this.responses.get(`DELETE ${endpoint}`);
    if (response) {
      return response;
    }

    return { data: { success: true }, success: true };
  }

  // Specific API methods
  async getProducts(params?: any): Promise<any> {
    return this.get('/products', { params });
  }

  async getProduct(id: string): Promise<any> {
    return this.get(`/products/${id}`);
  }

  async getCustomers(params?: any): Promise<any> {
    return this.get('/customers', { params });
  }

  async getPOSSales(params?: any): Promise<any> {
    return this.get('/pos/sales', { params });
  }

  async createPOSSale(sale: any): Promise<any> {
    return this.post('/pos/sales', sale);
  }

  async getBranches(): Promise<any> {
    return this.get('/branches');
  }

  async getInventory(params?: any): Promise<any> {
    return this.get('/inventory', { params });
  }

  async syncData(data: any): Promise<any> {
    return this.post('/sync', data);
  }

  async getPendingChanges(since?: string): Promise<any> {
    return this.get('/sync/pending', { params: since ? { since } : undefined });
  }

  async isOnline(): Promise<boolean> {
    await this.delayResponse();
    return this.onlineStatus;
  }

  // Test utility methods
  setResponse(method: string, endpoint: string, response: any): void {
    this.responses.set(`${method} ${endpoint}`, response);
  }

  setError(method: string, endpoint: string, error: any): void {
    this.errors.set(`${method} ${endpoint}`, error);
  }

  setOnlineStatus(online: boolean): void {
    this.onlineStatus = online;
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  getCallHistory(): Array<{ method: string; endpoint: string; data?: any; config?: any }> {
    return [...this.callHistory];
  }

  clearCallHistory(): void {
    this.callHistory = [];
  }

  clearResponses(): void {
    this.responses.clear();
    this.errors.clear();
    this.setupDefaultResponses();
  }

  private async delayResponse(): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
  }
}

// Create mock instance
export const mockApiClient = new MockApiClient();

// Mock the apiClient module
jest.mock('../../api/client', () => ({
  apiClient: mockApiClient,
  ApiClient: jest.fn().mockImplementation(() => mockApiClient),
}));

// Mock axios for the API client
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  AxiosError: jest.fn().mockImplementation((message, config, code, request, response) => ({
    message,
    config,
    code,
    request,
    response,
    isAxiosError: true,
    toJSON: () => ({ message, config, code }),
  })),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));