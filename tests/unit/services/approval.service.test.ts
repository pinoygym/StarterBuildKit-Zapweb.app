
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approvalService } from '@/services/approval.service';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification.service';
import { inventoryService } from '@/services/inventory.service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        approvalRequest: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

vi.mock('@/services/notification.service', () => ({
    notificationService: {
        notifyAdmins: vi.fn(),
        notifyUser: vi.fn(),
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        addStock: vi.fn(),
        deductStock: vi.fn(),
    },
}));

describe('ApprovalService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createRequest', () => {
        it('should create a request and notify admins', async () => {
            const mockRequest = {
                id: 'req-1',
                type: 'INVENTORY_ADJUSTMENT',
                RequestedBy: { firstName: 'John', lastName: 'Doe' }
            };

            vi.mocked(prisma.approvalRequest.create).mockResolvedValue(mockRequest as any);

            await approvalService.createRequest(
                'INVENTORY_ADJUSTMENT',
                'entity-1',
                { action: 'add' },
                'user-1',
                'Inventory fix'
            );

            expect(prisma.approvalRequest.create).toHaveBeenCalled();
            expect(notificationService.notifyAdmins).toHaveBeenCalledWith(
                'New Approval Request',
                expect.stringContaining('John Doe'),
                'APPROVAL_REQUEST',
                expect.stringContaining('req-1')
            );
        });
    });

    describe('approveRequest', () => {
        it('should approve request and execute inventory addition', async () => {
            const mockRequest = {
                id: 'req-1',
                status: 'PENDING',
                type: 'INVENTORY_ADJUSTMENT',
                data: JSON.stringify({ action: 'add', productId: 'p1', quantity: 10 }),
                requestedId: 'user-1',
                RequestedBy: { firstName: 'John', lastName: 'Doe' }
            };

            vi.mocked(prisma.approvalRequest.findUnique).mockResolvedValue(mockRequest as any);
            vi.mocked(prisma.approvalRequest.update).mockResolvedValue({ ...mockRequest, status: 'APPROVED' } as any);

            await approvalService.approveRequest('req-1', 'admin-1');

            expect(inventoryService.addStock).toHaveBeenCalledWith({ productId: 'p1', quantity: 10 });
            expect(prisma.approvalRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'req-1' }, data: expect.objectContaining({ status: 'APPROVED' }) })
            );
            expect(notificationService.notifyUser).toHaveBeenCalledWith(
                'user-1',
                'Request Approved',
                expect.any(String),
                'APPROVAL_RESULT'
            );
        });

        it('should throw error if request not pending', async () => {
            const mockRequest = {
                id: 'req-1',
                status: 'APPROVED',
            };
            vi.mocked(prisma.approvalRequest.findUnique).mockResolvedValue(mockRequest as any);

            await expect(approvalService.approveRequest('req-1', 'admin-1')).rejects.toThrow('Request is not pending');
        });
    });

    describe('rejectRequest', () => {
        it('should reject request and notify user', async () => {
            const mockRequest = {
                id: 'req-1',
                status: 'PENDING',
                type: 'INVENTORY_ADJUSTMENT',
                requestedId: 'user-1',
            };

            vi.mocked(prisma.approvalRequest.findUnique).mockResolvedValue(mockRequest as any);
            vi.mocked(prisma.approvalRequest.update).mockResolvedValue({ ...mockRequest, status: 'REJECTED' } as any);

            await approvalService.rejectRequest('req-1', 'admin-1', 'Bad reason');

            expect(prisma.approvalRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'req-1' },
                    data: expect.objectContaining({ status: 'REJECTED', reviewNote: 'Bad reason' })
                })
            );
            expect(notificationService.notifyUser).toHaveBeenCalled();
        });
    });
});
