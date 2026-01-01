
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '@/services/notification.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        notification: { create: vi.fn(), createMany: vi.fn(), count: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
        role: { findMany: vi.fn() },
        user: { findMany: vi.fn() },
    },
}));

describe('NotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('notifyUser', () => {
        it('should create notification', async () => {
            await notificationService.notifyUser('u1', 'Title', 'Msg', 'NEW_TRANSACTION');
            expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ userId: 'u1', title: 'Title' })
            }));
        });
    });

    describe('notifyAdmins', () => {
        it('should find admins and bulk create notifications', async () => {
            vi.mocked(prisma.role.findMany).mockResolvedValue([{ id: 'r1' }] as any);
            vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'a1' }, { id: 'a2' }] as any);

            await notificationService.notifyAdmins('Alert', 'Msg', 'PRICE_CHANGE');

            expect(prisma.user.findMany).toHaveBeenCalled();
            expect(prisma.notification.createMany).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ userId: 'a1' }),
                    expect.objectContaining({ userId: 'a2' })
                ])
            }));
        });
    });
});
