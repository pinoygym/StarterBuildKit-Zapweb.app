import { describe, it, expect } from 'vitest';
import {
    receivingVoucherItemSchema,
    createReceivingVoucherSchema,
} from '@/lib/validations/receiving-voucher.validation';

describe('Receiving Voucher Validation', () => {
    describe('receivingVoucherItemSchema', () => {
        it('should accept valid item data', () => {
            const validData = {
                productId: 'clabcdefg12345678',
                poItemId: 'clabcdefg12345679',
                uom: 'PCS',
                orderedQuantity: 100,
                receivedQuantity: 100,
                unitPrice: 50.00,
            };

            const result = receivingVoucherItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept partial delivery', () => {
            const validData = {
                productId: 'clabcdefg12345678',
                poItemId: 'clabcdefg12345679',
                uom: 'PCS',
                orderedQuantity: 100,
                receivedQuantity: 75,
                unitPrice: 50.00,
                varianceReason: 'Partial delivery - remaining items next week',
            };

            const result = receivingVoucherItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept zero receivedQuantity with reason', () => {
            const validData = {
                productId: 'clabcdefg12345678',
                poItemId: 'clabcdefg12345679',
                uom: 'PCS',
                orderedQuantity: 100,
                receivedQuantity: 0,
                unitPrice: 50.00,
                varianceReason: 'Item out of stock',
            };

            const result = receivingVoucherItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject negative receivedQuantity', () => {
            const invalidData = {
                productId: 'clabcdefg12345678',
                poItemId: 'clabcdefg12345679',
                uom: 'PCS',
                orderedQuantity: 100,
                receivedQuantity: -10,
                unitPrice: 50.00,
            };

            const result = receivingVoucherItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative orderedQuantity', () => {
            const invalidData = {
                productId: 'clabcdefg12345678',
                poItemId: 'clabcdefg12345679',
                uom: 'PCS',
                orderedQuantity: -100,
                receivedQuantity: 50,
                unitPrice: 50.00,
            };

            const result = receivingVoucherItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept decimal quantities', () => {
            const validData = {
                productId: 'clabcdefg12345678',
                poItemId: 'clabcdefg12345679',
                uom: 'KG',
                orderedQuantity: 25.5,
                receivedQuantity: 25.5,
                unitPrice: 100.00,
            };

            const result = receivingVoucherItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('createReceivingVoucherSchema', () => {
        it('should accept valid receiving voucher', () => {
            const validData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 100,
                        unitPrice: 50.00,
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept optional fields', () => {
            const validData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'Jane Smith',
                deliveryNotes: 'Items delivered in good condition',
                supplierDiscount: 500.00,
                supplierDiscountType: 'fixed' as const,
                additionalFees: 100.00,
                additionalFeesDescription: 'Delivery fee',
                recomputeAverageCost: true,
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 100,
                        unitPrice: 50.00,
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                purchaseOrderId: 'clabcdefg12345678',
                // missing receiverName and items
            };

            const result = createReceivingVoucherSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty items array', () => {
            const invalidData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                items: [],
            };

            const result = createReceivingVoucherSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should handle multiple items with mixed received quantities', () => {
            const validData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 100,
                        unitPrice: 50.00,
                    },
                    {
                        productId: 'clabcdefg12345681',
                        poItemId: 'clabcdefg12345682',
                        uom: 'BOX',
                        orderedQuantity: 50,
                        receivedQuantity: 40,
                        unitPrice: 75.00,
                        varianceReason: 'Partial delivery',
                    },
                    {
                        productId: 'clabcdefg12345683',
                        poItemId: 'clabcdefg12345684',
                        uom: 'KG',
                        orderedQuantity: 25,
                        receivedQuantity: 0,
                        unitPrice: 100.00,
                        varianceReason: 'Out of stock',
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should require at least one item with receivedQuantity > 0', () => {
            const invalidData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 0,
                        unitPrice: 50.00,
                    },
                    {
                        productId: 'clabcdefg12345681',
                        poItemId: 'clabcdefg12345682',
                        uom: 'BOX',
                        orderedQuantity: 50,
                        receivedQuantity: 0,
                        unitPrice: 75.00,
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject percentage discount > 100', () => {
            const invalidData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                supplierDiscount: 150,
                supplierDiscountType: 'percentage' as const,
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 100,
                        unitPrice: 50.00,
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept percentage discount <= 100', () => {
            const validData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                supplierDiscount: 10,
                supplierDiscountType: 'percentage' as const,
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 100,
                        unitPrice: 50.00,
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject negative additional fees', () => {
            const invalidData = {
                purchaseOrderId: 'clabcdefg12345678',
                receiverName: 'John Doe',
                additionalFees: -100.00,
                items: [
                    {
                        productId: 'clabcdefg12345679',
                        poItemId: 'clabcdefg12345680',
                        uom: 'PCS',
                        orderedQuantity: 100,
                        receivedQuantity: 100,
                        unitPrice: 50.00,
                    },
                ],
            };

            const result = createReceivingVoucherSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
