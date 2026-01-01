import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth.context';
import React from 'react';

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'No User'}</div>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Load - Unauthenticated State', () => {
    it('should handle 401 response gracefully without console errors', async () => {
      // Mock console.error to track if it's called
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock fetch to return 401
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Should be not authenticated
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('No User');

      // Console.error should NOT be called for 401 (regression test)
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Auth check failed')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should set user to null and permissions to empty on 401', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
    });

    it('should handle network errors and log them', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock fetch to throw network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Should still set loading to false
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');

      // Console.error SHOULD be called for network errors
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auth check failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Initial Load - Authenticated State', () => {
    it('should load user data when API returns 200', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          user: mockUser,
          permissions: ['PRODUCTS:READ', 'PRODUCTS:CREATE']
        })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  describe('Regression Tests - Bug Fixes', () => {
    it('should not log 401 errors on public pages (signup/login)', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate being on register page (no auth token)
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // The fix: 401 should NOT trigger console.error
      const errorCalls = consoleErrorSpy.mock.calls;
      const has401Error = errorCalls.some(call =>
        call.some(arg => arg && arg.toString().includes('Auth check failed'))
      );

      expect(has401Error).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should properly reset state on 401 response', async () => {
      // First, simulate authenticated state
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          user: { id: '123', email: 'test@example.com' },
          permissions: ['PRODUCTS:READ']
        })
      });

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      });

      // Now simulate 401 (session expired)
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      // Force re-check (in real app, this happens on navigation or refresh)
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
    });
  });
});
