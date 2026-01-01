import { Session, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { CreateSessionInput, SessionFilters } from '@/types/session.types';
import { withErrorHandling } from '@/lib/errors';

export class SessionRepository {
  /**
   * Create new session
   */
  async create(data: CreateSessionInput) {
    return withErrorHandling(async () => {
      return prisma.session.create({
        data: { id: randomUUID(), ...data },
      });
    }, 'SessionRepository.create');
  }

  /**
   * Find session by token
   */
  async findByToken(token: string) {
    return withErrorHandling(async () => {
      return prisma.session.findUnique({
        where: { token },
        include: {
          User: {
            include: {
              Role: {
                include: {
                  RolePermission: {
                    include: {
                      Permission: true,
                    },
                  },
                },
              },
              Branch: true,
            },
          },
        },
      });
    }, 'SessionRepository.findByToken');
  }

  /**
   * Find sessions by user
   */
  async findByUser(userId: string, filters?: SessionFilters) {
    return withErrorHandling(async () => {
      const where: Prisma.SessionWhereInput = { userId };

      if (filters?.expired !== undefined) {
        if (filters.expired) {
          where.expiresAt = { lte: new Date() };
        } else {
          where.expiresAt = { gt: new Date() };
        }
      }

      return prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }, 'SessionRepository.findByUser');
  }

  /**
   * Delete session by token
   */
  async deleteByToken(token: string) {
    return withErrorHandling(async () => {
      return prisma.session.delete({
        where: { token },
      });
    }, 'SessionRepository.deleteByToken');
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUser(userId: string) {
    return withErrorHandling(async () => {
      return prisma.session.deleteMany({
        where: { userId },
      });
    }, 'SessionRepository.deleteByUser');
  }

  /**
   * Delete all sessions for users with a specific role
   */
  async deleteByRoleId(roleId: string) {
    return withErrorHandling(async () => {
      return prisma.session.deleteMany({
        where: {
          User: {
            roleId,
          },
        },
      });
    }, 'SessionRepository.deleteByRoleId');
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired() {
    return withErrorHandling(async () => {
      return prisma.session.deleteMany({
        where: {
          expiresAt: { lte: new Date() },
        },
      });
    }, 'SessionRepository.deleteExpired');
  }

  /**
   * Update session expiration
   */
  async updateExpiration(sessionId: string, expiresAt: Date) {
    return withErrorHandling(async () => {
      return prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt },
      });
    }, 'SessionRepository.updateExpiration');
  }

  /**
   * Check if session is valid
   */
  async isValid(token: string) {
    return withErrorHandling(async () => {
      const session = await prisma.session.findUnique({
        where: { token },
      });

      if (!session) return false;

      return session.expiresAt > new Date();
    }, 'SessionRepository.isValid');
  }

  /**
   * Count active sessions for a user
   */
  async countActiveByUser(userId: string) {
    return withErrorHandling(async () => {
      return prisma.session.count({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
      });
    }, 'SessionRepository.countActiveByUser');
  }
}

export const sessionRepository = new SessionRepository();
