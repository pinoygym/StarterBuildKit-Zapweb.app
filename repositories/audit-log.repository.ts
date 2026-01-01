import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { CreateAuditLogInput, AuditLogFilters } from '@/types/audit.types';
import { withErrorHandling } from '@/lib/errors';

export class AuditLogRepository {
  /**
   * Create audit log entry
   */
  async create(data: CreateAuditLogInput) {
    return withErrorHandling(async () => {
      return prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          // @ts-expect-error - Prisma JSON type handling issue
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    }, 'AuditLogRepository.create');
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(filters?: AuditLogFilters, page = 1, limit = 50) {
    return withErrorHandling(async () => {
      const where: Prisma.AuditLogWhereInput = {};

      if (filters?.userId) {
        where.userId = filters.userId;
      }

      if (filters?.resource) {
        where.resource = filters.resource;
      }

      if (filters?.resourceId) {
        where.resourceId = filters.resourceId;
      }

      if (filters?.action) {
        where.action = filters.action;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            User: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }, 'AuditLogRepository.findAll');
  }

  /**
   * Find audit log by ID
   */
  async findById(logId: string) {
    return withErrorHandling(async () => {
      return prisma.auditLog.findUnique({
        where: { id: logId },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }, 'AuditLogRepository.findById');
  }

  /**
   * Find audit logs by user
   */
  async findByUser(userId: string, filters?: AuditLogFilters) {
    return withErrorHandling(async () => {
      const where: Prisma.AuditLogWhereInput = { userId };

      if (filters?.resource) {
        where.resource = filters.resource;
      }

      if (filters?.action) {
        where.action = filters.action;
      }

      return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }, 'AuditLogRepository.findByUser');
  }

  /**
   * Find audit logs by resource
   */
  async findByResource(resource: string, resourceId?: string) {
    return withErrorHandling(async () => {
      const where: Prisma.AuditLogWhereInput = { resource };

      if (resourceId) {
        where.resourceId = resourceId;
      }

      return prisma.auditLog.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }, 'AuditLogRepository.findByResource');
  }

  /**
   * Delete old audit logs
   */
  async deleteOlderThan(date: Date) {
    return withErrorHandling(async () => {
      return prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: date },
        },
      });
    }, 'AuditLogRepository.deleteOlderThan');
  }
}

export const auditLogRepository = new AuditLogRepository();
