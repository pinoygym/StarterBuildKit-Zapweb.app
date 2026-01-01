
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupService } from '@/services/backup.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn(),
        branch: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        warehouse: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        role: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        permission: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        rolePermission: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        user: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        userBranchAccess: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        productCategory: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        unitOfMeasure: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        expenseCategory: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        expenseVendor: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        paymentMethod: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        supplier: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        customer: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        salesAgent: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        product: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        productUOM: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        inventory: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        stockMovement: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        purchaseOrder: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        purchaseOrderItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        receivingVoucher: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        receivingVoucherItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        salesOrder: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        salesOrderItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        pOSSale: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        pOSSaleItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        pOSReceipt: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        promotionUsage: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        customerPurchaseHistory: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        accountsPayable: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        aPPayment: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        accountsReceivable: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        aRPayment: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        expense: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        employeePerformance: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        dailySalesSummary: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        auditLog: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        session: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        passwordResetToken: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        reportExport: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        reportTemplate: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        companySettings: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        fundSource: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        fundTransaction: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        fundTransfer: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        inventoryAdjustment: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        inventoryAdjustmentItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        jobOrder: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        jobComment: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        jobImage: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        jobPerformed: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        partsReplacement: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        roadmapItem: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        roadmapComment: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        approvalRequest: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
        notification: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    },
}));

describe('BackupService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createBackup', () => {
        it('should collect data from all models and return backup object', async () => {
            // Default all models to return empty array
            Object.keys(prisma).forEach((key) => {
                if (key !== '$transaction' && (prisma as any)[key]?.findMany) {
                    vi.mocked((prisma as any)[key].findMany).mockResolvedValue([]);
                }
            });

            // Override specific models with data
            vi.mocked(prisma.branch.findMany).mockResolvedValue([{ id: 'branch-1', name: 'Main' } as any]);
            vi.mocked(prisma.supplier.findMany).mockResolvedValue([{
                id: 'supp-1',
                companyName: 'Supp',
                taxId: '123'
            } as any]);
            vi.mocked(prisma.companySettings.findMany).mockResolvedValue([]);

            const backup = await BackupService.createBackup();

            expect(backup).toBeDefined();
            expect(backup.version).toBe('1.1');
            expect(backup.timestamp).toBeDefined();
            expect(backup.data.branches).toHaveLength(1);
            expect(backup.data.branches[0].name).toBe('Main');
            expect(backup.data.suppliers).toHaveLength(1);
            expect(backup.data.suppliers[0].taxId).toBe('123'); // Verify taxId extraction
        });
    });

    describe('restoreBackup', () => {
        it('should execute transaction with deleteMany and createMany calls', async () => {
            const backupData = {
                version: '1.1',
                timestamp: new Date().toISOString(),
                data: {
                    branches: [{ id: 'branch-1', name: 'Main' }],
                    suppliers: [{ id: 'supp-1', companyName: 'Supp', taxId: '123' }],
                    // ... other empty arrays implied
                },
            };

            // Mock transaction execution
            vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
                return callback(prisma);
            });

            await BackupService.restoreBackup(backupData as any);

            // Verify transaction was called
            expect(prisma.$transaction).toHaveBeenCalled();

            // Verify deleteMany called (reverse order check simplified)
            expect(prisma.companySettings.deleteMany).toHaveBeenCalled();
            expect(prisma.branch.deleteMany).toHaveBeenCalled();

            // Verify createMany called (order check simplified)
            expect(prisma.branch.createMany).toHaveBeenCalledWith({ data: backupData.data.branches });
            expect(prisma.supplier.createMany).toHaveBeenCalledWith({ data: backupData.data.suppliers });
        });
    });
});
