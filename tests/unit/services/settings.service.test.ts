
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsService } from '@/services/settings.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        // Generic count mock for all models
        $transaction: vi.fn((cb) => cb({
            pOSSaleItem: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            purchaseOrderItem: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            inventory: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            user: { updateMany: vi.fn() },
            branch: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            // Add other deleteMany mocks as needed for deleteTransactions
            stockMovement: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            pOSReceipt: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            pOSSale: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            salesOrderItem: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            salesOrder: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            receivingVoucherItem: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            receivingVoucher: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            purchaseOrder: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            arPayment: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            accountsReceivable: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            apPayment: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            accountsPayable: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            expense: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            customerPurchaseHistory: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            dailySalesSummary: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            employeePerformance: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            promotionUsage: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
            auditLog: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        })),
    },
}));

// Mock all prisma models with a count method
const models = [
    'user', 'role', 'permission', 'rolePermission', 'branch', 'warehouse', 'product',
    'productUOM', 'customer', 'supplier', 'purchaseOrder', 'purchaseOrderItem',
    'receivingVoucher', 'receivingVoucherItem', 'salesOrder', 'salesOrderItem',
    'pOSSale', 'pOSSaleItem', 'stockMovement', 'accountsReceivable', 'aRPayment',
    'accountsPayable', 'aPPayment', 'expense', 'session'
];

models.forEach(model => {
    // @ts-ignore
    if (!prisma[model]) prisma[model] = {};
    // @ts-ignore
    prisma[model].count = vi.fn().mockResolvedValue(5);
});

describe('SettingsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDatabaseStats', () => {
        it('should return stats', async () => {
            vi.mocked(prisma.user.count).mockResolvedValue(5);
            const result = await settingsService.getDatabaseStats();
            expect(result.totalRecords).toBeGreaterThan(0);
        });
    });
});
