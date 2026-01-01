import { describe, it, expect } from 'vitest';
import {
    productSchema,
    alternateUOMSchema,
} from '@/lib/validations/product.validation';

describe('Product Validation', () => {
    describe('productSchema', () => {
        it('should accept valid product data', () => {
            const validData = {
                name: 'Coca Cola 1.5L',
                category: 'Beverages',
                baseUOM: 'bottle',
                basePrice: 45.00,
                minStockLevel: 20,
                shelfLifeDays: 365,
            };

            const result = productSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional fields', () => {
            const validData = {
                name: 'Sample Product',
                description: 'A sample product description',
                category: 'Electronics',
                imageUrl: '/images/sample.jpg',
                basePrice: 100.00,
                averageCostPrice: 60.00,
                baseUOM: 'piece',
                minStockLevel: 10,
                shelfLifeDays: 180,
                status: 'active' as const,
                alternateUOMs: [],
            };

            const result = productSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                name: 'Product Name',
                // missing category, baseUOM, basePrice, minStockLevel, shelfLifeDays
            };

            const result = productSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative base price', () => {
            const invalidData = {
                name: 'Product',
                category: 'Test',
                baseUOM: 'piece',
                basePrice: -10.00,
                minStockLevel: 10,
                shelfLifeDays: 90,
            };

            const result = productSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty product name', () => {
            const invalidData = {
                name: '',
                category: 'Test',
                baseUOM: 'piece',
                basePrice: 100.00,
                minStockLevel: 10,
                shelfLifeDays: 90,
            };

            const result = productSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept valid image URL', () => {
            const validData = {
                name: 'Product',
                category: 'Test',
                imageUrl: 'https://example.com/image.jpg',
                baseUOM: 'piece',
                basePrice: 100.00,
                minStockLevel: 10,
                shelfLifeDays: 90,
            };

            const result = productSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should handle decimal prices', () => {
            const validData = {
                name: 'Product',
                category: 'Test',
                basePrice: 99.99,
                averageCostPrice: 55.25,
                baseUOM: 'piece',
                minStockLevel: 10,
                shelfLifeDays: 90,
            };

            const result = productSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept valid status values', () => {
            const validDataActive = {
                name: 'Product',
                category: 'Test',
                basePrice: 100.00,
                baseUOM: 'piece',
                minStockLevel: 10,
                shelfLifeDays: 90,
                status: 'active' as const,
            };

            const result = productSchema.safeParse(validDataActive);
            expect(result.success).toBe(true);
        });

        it('should require positive minStockLevel', () => {
            const invalidData = {
                name: 'Product',
                category: 'Test',
                basePrice: 100.00,
                baseUOM: 'piece',
                minStockLevel: 0,
                shelfLifeDays: 90,
            };

            const result = productSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should require positive shelfLifeDays', () => {
            const invalidData = {
                name: 'Product',
                category: 'Test',
                basePrice: 100.00,
                baseUOM: 'piece',
                minStockLevel: 10,
                shelfLifeDays: 0,
            };

            const result = productSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('alternateUOMSchema', () => {
        it('should accept valid alternate UOM', () => {
            const validData = {
                name: 'case',
                conversionFactor: 12,
                sellingPrice: 500.00,
            };

            const result = alternateUOMSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject zero conversion factor', () => {
            const invalidData = {
                name: 'case',
                conversionFactor: 0,
                sellingPrice: 500.00,
            };

            const result = alternateUOMSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative conversion factor', () => {
            const invalidData = {
                name: 'case',
                conversionFactor: -6,
                sellingPrice: 500.00,
            };

            const result = alternateUOMSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative selling price', () => {
            const invalidData = {
                name: 'case',
                conversionFactor: 12,
                sellingPrice: -100.00,
            };

            const result = alternateUOMSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept decimal conversion factors', () => {
            const validData = {
                name: 'kilogram',
                conversionFactor: 0.5,
                sellingPrice: 25.00,
            };

            const result = alternateUOMSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should require UOM name', () => {
            const invalidData = {
                name: '',
                conversionFactor: 12,
                sellingPrice: 500.00,
            };

            const result = alternateUOMSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
