import { randomUUID } from 'crypto';

/**
 * Test utilities for API integration tests
 */

/**
 * Create test data with correct Prisma relation names
 */
export const createTestSupplier = () => ({
    id: randomUUID(),
    companyName: 'Test Supplier Co.',
    contactPerson: 'John Doe',
    phone: '+63-123-456-7890',
    email: 'supplier@test.com',
    paymentTerms: 'Net 30',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createTestWarehouse = () => ({
    id: randomUUID(),
    name: 'Test Warehouse',
    location: 'Test Location',
    capacity: 1000,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createTestBranch = () => ({
    id: randomUUID(),
    name: 'Test Branch',
    location: 'Test Branch Location',
    phone: '+63-123-456-7890',
    email: 'branch@test.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createTestProduct = () => ({
    id: randomUUID(),
    name: 'Test Product',
    sku: `TEST-${Date.now()}`,
    baseUOM: 'pcs',
    category: 'Test Category',
    status: 'active',
    reorderLevel: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
});

/**
 * Helper to make authenticated API requests in tests
 */
export async function makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    token?: string
) {
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    return {
        status: response.status,
        ok: response.ok,
        data,
    };
}

/**
 * Helper to clean up test data
 */
export async function cleanupTestData(prisma: any, ids: { [key: string]: string[] }) {
    // Delete in reverse order of dependencies
    if (ids.receivingVoucherItems) {
        await prisma.receivingVoucherItem.deleteMany({
            where: { id: { in: ids.receivingVoucherItems } },
        });
    }

    if (ids.receivingVouchers) {
        await prisma.receivingVoucher.deleteMany({
            where: { id: { in: ids.receivingVouchers } },
        });
    }

    if (ids.purchaseOrderItems) {
        await prisma.purchaseOrderItem.deleteMany({
            where: { id: { in: ids.purchaseOrderItems } },
        });
    }

    if (ids.purchaseOrders) {
        await prisma.purchaseOrder.deleteMany({
            where: { id: { in: ids.purchaseOrders } },
        });
    }

    if (ids.inventoryBatches) {
        await prisma.inventoryBatch.deleteMany({
            where: { id: { in: ids.inventoryBatches } },
        });
    }

    if (ids.products) {
        await prisma.product.deleteMany({
            where: { id: { in: ids.products } },
        });
    }

    if (ids.suppliers) {
        await prisma.supplier.deleteMany({
            where: { id: { in: ids.suppliers } },
        });
    }

    if (ids.warehouses) {
        await prisma.warehouse.deleteMany({
            where: { id: { in: ids.warehouses } },
        });
    }

    if (ids.branches) {
        await prisma.branch.deleteMany({
            where: { id: { in: ids.branches } },
        });
    }
}

/**
 * Assert that response has correct property names (capital letters for Prisma relations)
 */
export function assertCorrectPropertyNames(obj: any, path = ''): void {
    const lowercaseRelations = ['supplier', 'warehouse', 'branch', 'product', 'items', 'purchaseOrder'];

    if (typeof obj !== 'object' || obj === null) {
        return;
    }

    for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;

        // Check if this is a lowercase relation name
        if (lowercaseRelations.includes(key)) {
            throw new Error(
                `Property name violation: Found lowercase relation '${key}' at ${currentPath}. ` +
                `Should use capital letter (e.g., 'Supplier', 'Warehouse', 'PurchaseOrderItem')`
            );
        }

        // Recursively check nested objects and arrays
        if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
                assertCorrectPropertyNames(item, `${currentPath}[${index}]`);
            });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            assertCorrectPropertyNames(obj[key], currentPath);
        }
    }
}
