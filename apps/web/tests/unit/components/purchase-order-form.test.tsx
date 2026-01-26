import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PurchaseOrderForm } from '@/components/purchase-orders/purchase-order-form';
import { Supplier, Warehouse, Branch } from '@prisma/client';
import { ProductWithUOMs } from '@/types/product.types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies components to avoid rendering issues
vi.mock('@/components/shared/product-search-combobox', () => ({
    ProductSearchCombobox: () => <div data-testid="product-search">Product Search</div>
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('PurchaseOrderForm', () => {
    const mockSubmit = vi.fn();
    const mockCancel = vi.fn();
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const defaultProps = {
        suppliers: [] as Supplier[],
        warehouses: [] as Warehouse[],
        branches: [] as Branch[],
        products: [] as ProductWithUOMs[],
        onSubmit: mockSubmit,
        onCancel: mockCancel,
    };

    it('sets default expected delivery date to today', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <PurchaseOrderForm {...defaultProps} />
            </QueryClientProvider>
        );

        // Get today's date in YYYY-MM-DD format
        // Note: The component uses new Date() which uses local time
        // The input type="date" expects YYYY-MM-DD
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const dateInput = screen.getByLabelText(/expected delivery date/i);
        expect(dateInput).toHaveValue(today);
    });
});
