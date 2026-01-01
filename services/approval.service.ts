import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { notificationService, NotificationType } from './notification.service';
import { inventoryService } from './inventory.service';
// import { posService } from './pos.service'; // Import when we have void logic
// import { productService } from './product.service'; // For price changes

export type ApprovalType = 'INVENTORY_ADJUSTMENT' | 'TRANSACTION_VOID' | 'PRICE_CHANGE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class ApprovalService {
    /**
     * Create a new approval request
     */
    async createRequest(
        type: ApprovalType,
        entityId: string,
        data: any,
        requestedById: string,
        reason?: string
    ) {
        const request = await prisma.approvalRequest.create({
            data: {
                id: randomUUID(),
                type,
                entityId,
                data: JSON.stringify(data),
                status: 'PENDING',
                requestedId: requestedById,
                reason,
            },
            include: {
                RequestedBy: true
            }
        });

        // Notify Admins
        const requesterName = request.RequestedBy.firstName + ' ' + request.RequestedBy.lastName;
        await notificationService.notifyAdmins(
            'New Approval Request',
            `${requesterName} requested ${type.replace('_', ' ')}`,
            'APPROVAL_REQUEST',
            `/approvals?id=${request.id}`
        );

        return request;
    }

    /**
     * Approve a request
     */
    async approveRequest(requestId: string, reviewedById: string, reviewNote?: string) {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId },
            include: { RequestedBy: true }
        });

        if (!request) throw new Error('Request not found');
        if (request.status !== 'PENDING') throw new Error('Request is not pending');

        const data = JSON.parse(request.data);

        // EXECUTE THE ACTION based on type
        if (request.type === 'INVENTORY_ADJUSTMENT') {
            const { action, ...payload } = data; // action: 'add' | 'deduct'
            if (action === 'add') {
                await inventoryService.addStock(payload);
            } else if (action === 'deduct') {
                await inventoryService.deductStock(payload);
            }
        } else if (request.type === 'TRANSACTION_VOID') {
            // await posService.voidTransaction(request.entityId, reviewedById);
            // Placeholder until void implemented
        } else if (request.type === 'PRICE_CHANGE') {
            // await productService.updatePrice(request.entityId, data);
        }

        // Update Request Status
        const updated = await prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                reviewedId: reviewedById,
                reviewNote,
            },
        });

        // Notify Requester
        await notificationService.notifyUser(
            request.requestedId,
            'Request Approved',
            `Your request for ${request.type} has been approved.`,
            'APPROVAL_RESULT'
        );

        return updated;
    }

    /**
     * Reject a request
     */
    async rejectRequest(requestId: string, reviewedById: string, reviewNote?: string) {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) throw new Error('Request not found');
        if (request.status !== 'PENDING') throw new Error('Request is not pending');

        const updated = await prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                reviewedId: reviewedById,
                reviewNote,
            },
        });

        // Notify Requester
        await notificationService.notifyUser(
            request.requestedId,
            'Request Rejected',
            `Your request for ${request.type} was rejected. Note: ${reviewNote || 'No reason provided'}`,
            'APPROVAL_RESULT'
        );

        return updated;
    }

    async getPendingRequests() {
        return await prisma.approvalRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                RequestedBy: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

export const approvalService = new ApprovalService();
