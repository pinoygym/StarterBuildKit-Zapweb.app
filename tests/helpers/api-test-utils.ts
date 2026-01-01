import { randomUUID } from 'crypto';

/**
 * Test utilities for API integration tests
 */

/**
 * Create test data with correct Prisma relation names
 */
export const createTestSupplier = () => ({
    id: randomUUID(),
    companyName: `Test Supplier Co. ${Date.now()}`,
    contactPerson: 'John Doe',
    phone: '+63-123-456-7890',
    email: `supplier-${Date.now()}@test.com`,
    paymentTerms: 'Net 30',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createTestWarehouse = (branchId?: string) => ({
    id: randomUUID(),
    name: 'Test Warehouse',
    location: 'Test Location',
    manager: 'Test Warehouse Manager',
    maxCapacity: 10000,
    branchId: branchId || randomUUID(), // Provide a branchId or generate one
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createTestBranch = () => ({
    id: randomUUID(),
    name: 'Test Branch',
    code: `TB-${Date.now()}`,
    location: 'Test Branch Location',
    manager: 'Test Manager',
    phone: '+63-123-456-7890',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const createTestProduct = () => ({
    id: randomUUID(),
    name: 'Test Product',
    baseUOM: 'pcs',
    basePrice: 100,
    category: 'Test Category',
    status: 'active',
    minStockLevel: 10,
    shelfLifeDays: 365,
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

/**
 * Helper to delete all data from a specific table
 */
export async function deleteAllTableData(prisma: any, tableName: string) {
    // Handle case sensitivity for model names
    const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    if (!prisma[modelName]) {
        throw new Error(`Model ${modelName} not found in Prisma client`);
    }
    await prisma[modelName].deleteMany({});
}

/**
 * Helper to get record count from a table
 */
export async function getTableRecordCount(prisma: any, tableName: string): Promise<number> {
    const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
    if (!prisma[modelName]) {
        throw new Error(`Model ${modelName} not found in Prisma client`);
    }
    return await prisma[modelName].count();
}

/**
 * Helper to create a Super Mega Admin user for testing
 */
export async function createSuperMegaAdmin(prisma: any) {
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });

    if (!superAdminRole) {
        throw new Error('Super Admin role not found');
    }

    return await prisma.user.create({
        data: {
            id: randomUUID(),
            email: `supermega-${Date.now()}@test.com`,
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4hZ.tGj.2C', // "password"
            firstName: 'Super',
            lastName: 'Mega Admin',
            roleId: superAdminRole.id,
            status: 'ACTIVE',
            emailVerified: true,
            isSuperMegaAdmin: true,
            updatedAt: new Date(),
        },
    });
}
