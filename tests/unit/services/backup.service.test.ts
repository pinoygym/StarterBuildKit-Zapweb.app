
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupService } from '@/services/backup.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma with dynamic proxy
vi.mock('@/lib/prisma', async () => {
    const { vi } = await import('vitest');

    const prismaBase = {
        $transaction: vi.fn(),
    };

    const proxyPrisma = new Proxy(prismaBase, {
        get(target: any, prop) {
            if (prop in target) return target[prop];
            // For any model name (e.g., prisma.branch, prisma.user)
            if (typeof prop === 'string' && !prop.startsWith('$') && prop !== 'then') {
                if (!target[prop]) {
                    target[prop] = {
                        findMany: vi.fn().mockResolvedValue([]),
                        createMany: vi.fn().mockResolvedValue({ count: 0 }),
                        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
                    }
                }
                return target[prop];
            }
            return undefined;
        }
    });

    return {
        prisma: proxyPrisma
    };
});

describe('BackupService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createBackup', () => {
        it('should collect data from all models and return backup object', async () => {
            const prismaAny = prisma as any;

            // Setup specific return values
            prismaAny.branch.findMany.mockResolvedValue([{ id: 'branch-1', name: 'Main' }]);

            prismaAny.supplier.findMany.mockResolvedValue([{
                id: 'supp-1',
                companyName: 'Supp',
                taxId: '123'
            }]);

            const backup = await BackupService.createBackup();

            expect(backup).toBeDefined();
            expect(backup.version).toBe('2.0');
            expect(backup.timestamp).toBeDefined();

            // Verify data using SINGULAR keys matching prisma model names
            expect(backup.data.branch).toHaveLength(1);
            expect(backup.data.branch[0].name).toBe('Main');
            expect(backup.data.supplier).toHaveLength(1);
            expect(backup.data.supplier[0].taxId).toBe('123');

            expect(backup.data.user).toEqual([]);
        });
    });

    describe('restoreBackup', () => {
        it('should execute transaction with deleteMany and createMany calls', async () => {
            const backupData = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                data: {
                    branch: [{ id: 'branch-1', name: 'Main' }],
                    supplier: [{ id: 'supp-1', companyName: 'Supp', taxId: '123' }],
                },
            };

            vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
                return callback(prisma);
            });

            await BackupService.restoreBackup(backupData as any);

            expect(prisma.$transaction).toHaveBeenCalled();

            const prismaAny = prisma as any;
            expect(prismaAny.companySettings.deleteMany).toHaveBeenCalled();
            expect(prismaAny.branch.deleteMany).toHaveBeenCalled();
            expect(prismaAny.branch.createMany).toHaveBeenCalledWith({ data: backupData.data.branch });
            expect(prismaAny.supplier.createMany).toHaveBeenCalledWith({ data: backupData.data.supplier });
        });

        it('should handle v1.1 backups by normalizing keys before restoration', async () => {
            const v1Backup = {
                version: '1.1',
                timestamp: new Date().toISOString(),
                data: {
                    branches: [{ id: 'branch-1', name: 'Main' }],
                    suppliers: [{ id: 'supp-1', companyName: 'Supp' }],
                },
            };

            vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
                return callback(prisma);
            });

            await BackupService.restoreBackup(v1Backup as any);

            const prismaAny = prisma as any;
            // Should have been normalized to singular "branch" and "supplier"
            expect(prismaAny.branch.createMany).toHaveBeenCalledWith({ data: v1Backup.data.branches });
            expect(prismaAny.supplier.createMany).toHaveBeenCalledWith({ data: v1Backup.data.suppliers });
        });
    });

    describe('normalizeBackupData', () => {
        it('should return 2.0 backup as is', () => {
            const backup = { version: '2.0', data: { branch: [] } };
            const result = BackupService.normalizeBackupData(backup as any);
            expect(result).toEqual(backup);
        });

        it('should convert plural keys to singular for v1.1 backups', () => {
            const v1Backup = {
                version: '1.1',
                data: {
                    users: [{ id: 1 }],
                    branches: [{ id: 2 }],
                    posSales: [{ id: 3 }],
                    apPayments: [{ id: 4 }]
                }
            };
            const result = BackupService.normalizeBackupData(v1Backup as any);
            expect(result.version).toBe('2.0');
            expect(result.data.user).toEqual([{ id: 1 }]);
            expect(result.data.branch).toEqual([{ id: 2 }]);
            expect(result.data.pOSSale).toEqual([{ id: 3 }]);
            expect(result.data.aPPayment).toEqual([{ id: 4 }]);
        });
    });
});
