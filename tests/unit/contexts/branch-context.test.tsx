import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BranchProvider, useBranchContext } from '@/contexts/branch-context';
import React from 'react';

// Test component that uses the branch context
function TestComponent() {
  const { branches, selectedBranch, isLoading } = useBranchContext();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="branch-count">{branches.length}</div>
      <div data-testid="selected-branch">{selectedBranch?.name || 'No Branch'}</div>
    </div>
  );
}

describe('BranchContext', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Load - Unauthenticated State', () => {
    it('should handle 401 response gracefully without console errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock fetch to return 401
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      render(
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Should have no branches
      expect(screen.getByTestId('branch-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-branch')).toHaveTextContent('No Branch');

      // Console.error should NOT be called for 401 (regression test)
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Failed to load branches')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should set branches to empty array on 401', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      render(
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('branch-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-branch')).toHaveTextContent('No Branch');
    });

    it('should handle network errors and log them', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock fetch to throw network error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Should still set loading to false
      expect(screen.getByTestId('branch-count')).toHaveTextContent('0');

      // Console.error SHOULD be called for network errors
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load branches:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Initial Load - Authenticated State', () => {
    it('should load branches when API returns 200', async () => {
      const mockBranches = [
        { id: '1', name: 'Branch 1', code: 'B1', location: 'Location 1', manager: 'Manager 1', phone: '123', status: 'ACTIVE' },
        { id: '2', name: 'Branch 2', code: 'B2', location: 'Location 2', manager: 'Manager 2', phone: '456', status: 'ACTIVE' }
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockBranches
        })
      });

      render(
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('branch-count')).toHaveTextContent('2');
    });

    it('should restore selected branch from localStorage', async () => {
      const mockBranches = [
        { id: '1', name: 'Branch 1', code: 'B1', location: 'Location 1', manager: 'Manager 1', phone: '123', status: 'ACTIVE' },
        { id: '2', name: 'Branch 2', code: 'B2', location: 'Location 2', manager: 'Manager 2', phone: '456', status: 'ACTIVE' }
      ];

      (global.localStorage.getItem as any).mockReturnValue('2');

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockBranches
        })
      });

      render(
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('selected-branch')).toHaveTextContent('Branch 2');
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
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // The fix: 401 should NOT trigger console.error for "Failed to load branches"
      const errorCalls = consoleErrorSpy.mock.calls;
      const hasBranchLoadError = errorCalls.some(call =>
        call.some(arg => arg && arg.toString().includes('Failed to load branches'))
      );

      expect(hasBranchLoadError).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should properly handle empty branch list on 401', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      render(
        <BranchProvider>
          <TestComponent />
        </BranchProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      // Should have empty branches array, not undefined
      expect(screen.getByTestId('branch-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-branch')).toHaveTextContent('No Branch');
    });
  });
});
