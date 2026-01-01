import { z } from 'zod';

/**
 * Schema validators for API responses
 * These ensure that API responses use correct Prisma relation names (capital letters)
 */

// Base schemas for common entities
export const SupplierSchema = z.object({
    id: z.string(),
    companyName: z.string(),
    contactPerson: z.string(),
    phone: z.string(),
    email: z.string(),
    paymentTerms: z.string(),
});

export const WarehouseSchema = z.object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
});

export const BranchSchema = z.object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
});

export const ProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    baseUOM: z.string(),
});

// Purchase Order schemas
export const PurchaseOrderItemSchema = z.object({
    id: z.string(),
    productId: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    subtotal: z.number(),
    Product: ProductSchema,
});

export const PurchaseOrderSchema = z.object({
    id: z.string(),
    poNumber: z.string(),
    supplierId: z.string(),
    warehouseId: z.string(),
    branchId: z.string(),
    totalAmount: z.number(),
    status: z.string(),
    expectedDeliveryDate: z.string().or(z.date()),
    Supplier: SupplierSchema,
    Warehouse: WarehouseSchema,
    Branch: BranchSchema,
    PurchaseOrderItem: z.array(PurchaseOrderItemSchema),
});

// Receiving Voucher schemas
export const ReceivingVoucherItemSchema = z.object({
    id: z.string(),
    productId: z.string(),
    orderedQuantity: z.number(),
    receivedQuantity: z.number(),
    varianceQuantity: z.number(),
    Product: ProductSchema,
});

export const ReceivingVoucherSchema = z.object({
    id: z.string(),
    rvNumber: z.string(),
    purchaseOrderId: z.string(),
    warehouseId: z.string(),
    branchId: z.string(),
    receivedDate: z.string().or(z.date()),
    totalOrderedAmount: z.number(),
    totalReceivedAmount: z.number(),
    varianceAmount: z.number(),
    PurchaseOrder: z.object({
        poNumber: z.string(),
        Supplier: SupplierSchema,
    }),
    Warehouse: WarehouseSchema,
    Branch: BranchSchema,
    ReceivingVoucherItem: z.array(ReceivingVoucherItemSchema),
});

// Inventory schemas
export const InventoryBatchSchema = z.object({
    id: z.string(),
    batchNumber: z.string(),
    productId: z.string(),
    warehouseId: z.string(),
    quantity: z.number(),
    Product: ProductSchema,
    Warehouse: WarehouseSchema,
});

// Generic API response wrapper
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.literal(true),
        data: dataSchema,
        message: z.string().optional(),
    });

export const ApiErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.string(),
});

/**
 * Helper to validate that a response uses capital letter Prisma relations
 * Returns an array of property name violations
 */
export function validatePrismaRelationNames(obj: any, path = ''): string[] {
    const violations: string[] = [];
    const lowercaseRelations = ['supplier', 'warehouse', 'branch', 'product', 'items', 'purchaseOrder'];

    if (typeof obj !== 'object' || obj === null) {
        return violations;
    }

    for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;

        // Check if this is a lowercase relation name
        if (lowercaseRelations.includes(key)) {
            violations.push(`Found lowercase relation '${key}' at ${currentPath}. Should be capitalized (e.g., 'Supplier', 'Warehouse', 'PurchaseOrderItem')`);
        }

        // Recursively check nested objects and arrays
        if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
                violations.push(...validatePrismaRelationNames(item, `${currentPath}[${index}]`));
            });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            violations.push(...validatePrismaRelationNames(obj[key], currentPath));
        }
    }

    return violations;
}
