import { describe, it, expect } from 'vitest';
import {
    purchaseOrderSchema,
    purchaseOrderItemSchema,
    updatePurchaseOrderSchema,
} from '@/lib/validations/purchase-order.validation';

describe('Purchase Order Validation', () => {
    describe('purchaseOrderItemSchema', () => {
        it('should accept valid item data', () => {
            const validData = {
                productId: 'clabcdefg12345678',
                quantity: 100,
                unitPrice: 25.50,
                uom: 'PCS',
            };

            const result = purchaseOrderItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject negative quantity', () => {
            const invalidData = {
                productId: 'clabcdefg12345678',
                quantity: -10,
                unitPrice: 25.50,
                uom: 'PCS',
            };

            const result = purchaseOrderItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero quantity', () => {
            const invalidData = {
                productId: 'clabcdefg12345678',
                quantity: 0,
                unitPrice: 25.50,
                uom: 'PCS',
            };

            const result = purchaseOrderItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative unit price', () => {
            const invalidData = {
                productId: 'clabcdefg12345678',
                quantity: 100,
                unitPrice: -25.50,
                uom: 'PCS',
            };

            const result = purchaseOrderItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept decimal quantities and prices', () => {
            const validData = {
                productId: 'clabcdefg12345678',
                quantity: 10.5,
                unitPrice: 99.99,
                uom: 'KG',
            };

            const result = purchaseOrderItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('purchaseOrderSchema', () => {
        it('should accept valid purchase order', () => {
            const validData = {
                supplierId: 'clabcdefg12345678',
                branchId: 'clabcdefg12345679',
                warehouseId: 'clabcdefg12345680',
                expectedDeliveryDate: new Date('2025-02-01'),
                items: [
                    {
                        productId: 'clabcdefg12345681',
                        quantity: 100,
                        unitPrice: 50.00,
                        uom: 'PCS',
                    },
                ],
            };

            const result = purchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional notes field', () => {
            const validData = {
                supplierId: 'clabcdefg12345678',
                branchId: 'clabcdefg12345679',
                warehouseId: 'clabcdefg12345680',
                expectedDeliveryDate: new Date('2025-02-01'),
                notes: 'Urgent order - deliver ASAP',
                items: [
                    {
                        productId: 'clabcdefg12345681',
                        quantity: 50,
                        unitPrice: 25.00,
                        uom: 'BOX',
                    },
                ],
            };

            const result = purchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                supplierId: 'clabcdefg12345678',
                // missing branchId, warehouseId, expectedDeliveryDate, items
            };

            const result = purchaseOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty items array', () => {
            const invalidData = {
                supplierId: 'clabcdefg12345678',
                branchId: 'clabcdefg12345679',
                warehouseId: 'clabcdefg12345680',
                expectedDeliveryDate: new Date('2025-02-01'),
                items: [],
            };

            const result = purchaseOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should handle multiple items', () => {
            const validData = {
                supplierId: 'clabcdefg12345678',
                branchId: 'clabcdefg12345679',
                warehouseId: 'clabcdefg12345680',
                expectedDeliveryDate: new Date('2025-02-01'),
                items: [
                    {
                        productId: 'clabcdefg12345681',
                        quantity: 100,
                        unitPrice: 50.00,
                        uom: 'PCS',
                    },
                    {
                        productId: 'clabcdefg12345682',
                        quantity: 50,
                        unitPrice: 75.00,
                        uom: 'BOX',
                    },
                    {
                        productId: 'clabcdefg12345683',
                        quantity: 25.5,
                        unitPrice: 100.00,
                        uom: 'KG',
                    },
                ],
            };

            const result = purchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate delivery date is a valid date', () => {
            const validData = {
                supplierId: 'clabcdefg12345678',
                branchId: 'clabcdefg12345679',
                warehouseId: 'clabcdefg12345680',
                expectedDeliveryDate: new Date('2025-03-15T14:30:00'),
                items: [
                    {
                        productId: 'clabcdefg12345681',
                        quantity: 100,
                        unitPrice: 50.00,
                        uom: 'PCS',
                    },
                ],
            };

            const result = purchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate all items have positive quantities', () => {
            const invalidData = {
                supplierId: 'clabcdefg12345678',
                branchId: 'clabcdefg12345679',
                warehouseId: 'clabcdefg12345680',
                expectedDeliveryDate: new Date('2025-02-01'),
                items: [
                    {
                        productId: 'clabcdefg12345681',
                        quantity: 100,
                        unitPrice: 50.00,
                        uom: 'PCS',
                    },
                    {
                        productId: 'clabcdefg12345682',
                        quantity: -10, // invalid
                        unitPrice: 75.00,
                        uom: 'BOX',
                    },
                ],
            };

            const result = purchaseOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('updatePurchaseOrderSchema', () => {
        it('should accept partial updates', () => {
            const validData = {
                notes: 'Updated delivery instructions',
            };

            const result = updatePurchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept delivery date update', () => {
            const validData = {
                expectedDeliveryDate: new Date('2025-03-01'),
            };

            const result = updatePurchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept items update', () => {
            const validData = {
                items: [
                    {
                        productId: 'clabcdefg12345681',
                        quantity: 150,
                        unitPrice: 55.00,
                        uom: 'PCS',
                    },
                ],
            };

            const result = updatePurchaseOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty items array in update', () => {
            const invalidData = {
                items: [],
            };

            const result = updatePurchaseOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
