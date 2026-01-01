import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export type NotificationType = 'NEW_TRANSACTION' | 'PRICE_CHANGE' | 'APPROVAL_REQUEST' | 'APPROVAL_RESULT';

export class NotificationService {
    /**
     * Notify specific user
     */
    async notifyUser(userId: string, title: string, message: string, type: NotificationType, link?: string) {
        return await prisma.notification.create({
            data: {
                id: randomUUID(),
                userId,
                title,
                message,
                type,
                link,
                isRead: false,
            },
        });
    }

    /**
     * Notify all admins/managers (users with relevant permissions)
     * For now, we'll fetch all users with specific roles or just broadcast to all if no role system is strict
     * Optimization: In a real app, use a many-to-many relation or separate notification entries.
     * Here, we'll find admin users and create a notification for each.
     */
    async notifyAdmins(title: string, message: string, type: NotificationType, link?: string) {
        // Find admins - assuming Role based, or just notify all who have 'MANAGE' permission on settings/products
        // For simplicity, let's notify users with 'admin' or 'superadmin' roles or check permissions
        // We'll query users with allowed roles.

        // First, get roles that should receive notifications
        const adminRoles = await prisma.role.findMany({
            where: {
                name: { in: ['Super Admin', 'Admin', 'Manager'] } // Adjust based on your role names
            }
        });

        const roleIds = adminRoles.map(r => r.id);

        const admins = await prisma.user.findMany({
            where: {
                roleId: { in: roleIds },
                status: 'active'
            }
        });

        if (admins.length === 0) return;

        // Bulk create notifications
        await prisma.notification.createMany({
            data: admins.map(admin => ({
                id: randomUUID(),
                userId: admin.id,
                title,
                message,
                type,
                link,
                isRead: false,
            }))
        });
    }

    async getUnreadCount(userId: string) {
        return await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }

    async getUserNotifications(userId: string, limit = 20) {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async markAsRead(notificationId: string) {
        return await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }
}

export const notificationService = new NotificationService();
