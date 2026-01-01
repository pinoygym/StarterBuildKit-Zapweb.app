
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdjustmentForm } from '@/components/inventory/adjustment-form';
import { Warehouse, Branch, ProductUOM } from '@prisma/client';
import { ProductWithUOMs } from '@/types/product.types';

// Mock ProductSearchCombobox to avoid complex rendering and event handling
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

describe('AdjustmentForm', () => {
    const mockSubmit = vi.fn();
    const mockCancel = vi.fn();

    const mockWarehouses: Warehouse[] = [
        { id: 'w1', name: 'Warehouse 1', location: 'Location 1', manager: 'Manager 1', maxCapacity: 1000, branchId: 'b1', createdAt: new Date(), updatedAt: new Date() }
    ];
    const mockBranches: Branch[] = [
        { id: 'b1', name: 'Branch 1', code: 'B001', location: 'Location 1', manager: 'Manager 1', phone: '1234567890', status: 'active', createdAt: new Date(), updatedAt: new Date() }
    ];
    const mockProducts: ProductWithUOMs[] = [
        {
            id: 'p1',
            name: 'Product 1',
            baseUOM: 'PCS',
            category: 'Category 1',
            basePrice: 100,
            alternateUOMs: [],
            minStockLevel: 10,
            shelfLifeDays: 365,
            description: 'Description 1',
            imageUrl: 'image.jpg',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            averageCostPrice: 80,
            productCategoryId: null,
            supplierId: null,
            createdById: null,
            updatedById: null
        }
    ];

    const defaultProps = {
        warehouses: mockWarehouses,
        branches: mockBranches,
        products: mockProducts,
        onSubmit: mockSubmit,
        onCancel: mockCancel,
    };

    it('renders the form correctly', () => {
        render(<AdjustmentForm {...defaultProps} />);

        // Check for key fields to ensure it rendered
        expect(screen.getByLabelText(/Branch/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Warehouse/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
    });

    it('renders the Current Stock label (Regression Test for context error)', () => {
        render(<AdjustmentForm {...defaultProps} />);

        // This verifies that "Current Stock" is rendered as a Label (or at least visible text associated with the input structure)
        // Prior to the fix, this might have crashed the render if it was inside an invalid Form context structure.
        expect(screen.getByText(/Current Stock/i)).toBeInTheDocument();
    });

    it('renders Base UOM and Conversion columns', () => {
        render(<AdjustmentForm {...defaultProps} />);

        // Verify that Base UOM and Conversion labels are rendered
        expect(screen.getByText(/Base UOM/i)).toBeInTheDocument();
        expect(screen.getByText(/Conversion/i)).toBeInTheDocument();
    });

    it('displays Base UOM for products with alternate UOMs', () => {
        const productsWithAlternateUOMs: ProductWithUOMs[] = [
            {
                id: 'p1',
                name: 'Product 1',
                baseUOM: 'Bottles',
                category: 'Beverages',
                basePrice: 25,
                alternateUOMs: [
                    {
                        id: 'uom-1',
                        productId: 'p1',
                        name: 'Case',
                        conversionFactor: 24,
                        sellingPrice: 600,
                        createdAt: new Date()
                    }
                ],
                minStockLevel: 10,
                shelfLifeDays: 365,
                description: 'Test Product',
                imageUrl: null,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                averageCostPrice: 20,
                productCategoryId: null,
                supplierId: null,
                createdById: null,
                updatedById: null
            }
        ];

        render(<AdjustmentForm {...defaultProps} products={productsWithAlternateUOMs} />);

        // Verify Base UOM and Conversion columns are present
        expect(screen.getByText(/Base UOM/i)).toBeInTheDocument();
        expect(screen.getByText(/Conversion/i)).toBeInTheDocument();
    });
});
