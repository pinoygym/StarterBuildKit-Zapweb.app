// Main test utilities export file
// This file provides a centralized import point for all test utilities

import React from 'react';

// Mock implementations
export { MockSQLiteDatabase, mockDatabaseService } from './__mocks__/database';
export { MockApiClient, mockApiClient } from './__mocks__/apiClient';
export { MockReduxStore, mockStore } from './__mocks__/reduxStore';

// Test helpers and factories
export {
  TestDataFactory,
  DatabaseTestHelper,
  ApiTestHelper,
  ReduxTestHelper,
  setupTestEnvironment,
  waitFor,
  expectAsyncThrow,
  createMockAsyncThunk,
} from './test-helpers';

// Setup file (side-effect import for test environment)
import './setup';

// Re-export commonly used testing libraries
export { jest } from '@jest/globals';

// Note: Testing library exports are commented out as they may not be available
// Uncomment these when the testing library is installed
// export { render, screen, fireEvent, waitFor as waitForRTL } from '@testing-library/react-native';
// export { act } from 'react-test-renderer';

// Type definitions for test utilities
export interface TestEnvironment {
  dbHelper: import('./test-helpers').DatabaseTestHelper;
  apiHelper: import('./test-helpers').ApiTestHelper;
  reduxHelper: import('./test-helpers').ReduxTestHelper;
  database: import('./__mocks__/database').MockSQLiteDatabase;
  apiClient: import('./__mocks__/apiClient').MockApiClient;
  store: import('./__mocks__/reduxStore').MockReduxStore;
}

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  basePrice: number;
  baseUOM: string;
  minStockLevel: number;
  shelfLifeDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastModified: string;
}

export interface MockCustomer {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  paymentTerms: string;
  creditLimit: number;
  taxId: string | null;
  customerType: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastModified: string;
}

export interface MockCartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
  imageUrl: string | null;
}

export interface MockPOSSale {
  id: string;
  receiptNumber: string;
  branchId: string;
  userId: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  customerId: string;
  customerName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  lastModified: string;
  items: MockCartItem[];
}

export interface MockInventoryBatch {
  id: string;
  batchNumber: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  expiryDate: string;
  receivedDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
}

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: string;
  branchId: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

// Common test patterns
export const createTestSuite = (name: string, tests: Record<string, () => void | Promise<void>>) => {
  describe(name, () => {
    Object.entries(tests).forEach(([testName, testFn]) => {
      it(testName, testFn as any);
    });
  });
};

export const createAsyncTestSuite = (
  name: string,
  tests: Record<string, () => Promise<void>>
) => {
  describe(name, () => {
    Object.entries(tests).forEach(([testName, testFn]) => {
      it(testName, testFn);
    });
  });
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void>, iterations: number = 1) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times,
  };
};

// Memory testing utilities
export const getMemoryUsage = () => {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Error boundary testing utilities
export const createErrorBoundary = (fallback: React.ComponentType<{ error: Error }>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
      if (this.state.hasError && this.state.error) {
        return React.createElement(fallback, { error: this.state.error });
      }

      return this.props.children;
    }
  };
};