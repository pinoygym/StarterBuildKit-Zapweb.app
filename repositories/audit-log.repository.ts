import { PrismaClient, Prisma } from '@prisma/client';
import { CreateAuditLogInput, AuditLogFilters } from '@/types/audit.types';

const prisma = new PrismaClient();

export class AuditLogRepository {
  /**
   * Create audit log entry
   */
  async create(data: CreateAuditLogInput) {return prisma.auditLog.create({
      data: {
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
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(filters?: AuditLogFilters, page = 1, limit = 50) {
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
          user: {
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
  }

  /**
   * Find audit log by ID
   */
  async findById(logId: string) {
    return prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Find audit logs by user
   */
  async findByUser(userId: string, filters?: AuditLogFilters) {
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
  }

  /**
   * Find audit logs by resource
   */
  async findByResource(resource: string, resourceId?: string) {
    const where: Prisma.AuditLogWhereInput = { resource };

    if (resourceId) {
      where.resourceId = resourceId;
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
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
  }

  /**
   * Delete old audit logs
   */
  async deleteOlderThan(date: Date) {
    return prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: date },
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
