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

function InteractionComponent() {
  const { login, logout, hasPermission, isSuperMegaAdmin } = useAuth();
  const [result, setResult] = React.useState<any>(null);

  const handleLogin = async () => {
    const res = await login({ email: 'test@example.com', password: 'password' });
    setResult(res);
  };

  return (
    <div>
      <button data-testid="login-btn" onClick={handleLogin}>Login</button>
      <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
      <div data-testid="action-result">{JSON.stringify(result)}</div>
      <div data-testid="has-permission">{hasPermission('PRODUCTS', 'READ') ? 'Yes' : 'No'}</div>
      <div data-testid="is-super">{isSuperMegaAdmin() ? 'Yes' : 'No'}</div>
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

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
        'Failed to fetch current user:',
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

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

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      });

      // Unmount to clear state
      unmount();

      // Now simulate 401 (session expired)
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      // Re-render (simulate page refresh or new session)
      render(
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

  describe('Auth Actions', () => {
    it('should successfully login and refresh user', async () => {
      // 1. Mock success login
      (global.fetch as any)
        .mockResolvedValueOnce({ // Initial check
          ok: false, status: 401, json: async () => ({ success: false })
        })
        .mockResolvedValueOnce({ // Login call
          ok: true,
          json: async () => ({ success: true, user: { id: '123' } })
        })
        .mockResolvedValueOnce({ // Refresh user call
          ok: true,
          json: async () => ({ success: true, user: { id: '123', email: 'test@example.com' } })
        });

      render(
        <AuthProvider>
          <InteractionComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => screen.getByTestId('login-btn'));

      // Click login
      screen.getByTestId('login-btn').click();

      // Check result
      await waitFor(() => {
        expect(screen.getByTestId('action-result')).toHaveTextContent('{"success":true');
      });

      // Should have called fetch for login
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' })
        })
      );
    });

    it('should handle login failure', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ // Initial check
          ok: false, status: 401, json: async () => ({ success: false })
        })
        .mockResolvedValueOnce({ // Login call
          ok: false,
          status: 401,
          json: async () => ({ success: false, message: 'Invalid credentials' })
        });

      render(
        <AuthProvider>
          <InteractionComponent />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('login-btn'));
      screen.getByTestId('login-btn').click();

      await waitFor(() => {
        expect(screen.getByTestId('action-result')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should logout and redirect', async () => {
      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '/dashboard' },
        writable: true
      });

      (global.fetch as any).mockResolvedValue({ // Default ok
        ok: true, json: async () => ({ success: true })
      });

      render(
        <AuthProvider>
          <InteractionComponent />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('logout-btn'));
      screen.getByTestId('logout-btn').click();

      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      // Cleanup
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation
      });
    });
  });

  describe('Permissions', () => {
    it('should check permissions correctly', async () => {
      (global.fetch as any).mockResolvedValue({ // Initial load
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '123' },
          permissions: ['PRODUCTS:READ']
        })
      });

      render(
        <AuthProvider>
          <InteractionComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-permission')).toHaveTextContent('Yes');
      });
    });

    it('should return true for SuperMegaAdmin regardless of permissions', async () => {
      (global.fetch as any).mockResolvedValue({ // Initial load
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '123', isSuperMegaAdmin: true },
          permissions: []
        })
      });

      render(
        <AuthProvider>
          <InteractionComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-super')).toHaveTextContent('Yes');
        // Even though permission is not in list (empty), admin has it. 
        expect(screen.getByTestId('has-permission')).toHaveTextContent('Yes');
      });
    });
  });
});
