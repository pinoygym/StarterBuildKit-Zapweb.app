import { Session, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { CreateSessionInput, SessionFilters } from '@/types/session.types';

export class SessionRepository {
  /**
   * Create new session
   */
  async create(data: CreateSessionInput) {
    return prisma.session.create({
      data: { id: randomUUID(), ...data },
    });
  }

  /**
   * Find session by token
   */
  async findByToken(token: string) {
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
  }

  /**
   * Find sessions by user
   */
  async findByUser(userId: string, filters?: SessionFilters) {
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
  }

  /**
   * Delete session by token
   */
  async deleteByToken(token: string) {
    return prisma.session.delete({
      where: { token },
    });
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUser(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
  }

  /**
   * Update session expiration
   */
  async updateExpiration(sessionId: string, expiresAt: Date) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt },
    });
  }

  /**
   * Check if session is valid
   */
  async isValid(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) return false;
    
    return session.expiresAt > new Date();
  }

  /**
   * Count active sessions for a user
   */
  async countActiveByUser(userId: string) {
    return prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
