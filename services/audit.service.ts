// @ts-nocheck
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { AuditLogFilters } from '@/types/audit.types';

export class AuditService {
  /**
   * Get all audit logs with filtering and pagination
   */
  async getAllAuditLogs(filters?: AuditLogFilters, page = 1, limit = 50) {
    return await auditLogRepository.findAll(filters, page, limit);
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, filters?: AuditLogFilters, page = 1, limit = 50) {
    return await auditLogRepository.findByUser(userId, filters);
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(resource: string, resourceId?: string) {
    return await auditLogRepository.findByResource(resource, resourceId);
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit = 100) {
    // Use findAll with pagination to get recent logs
    const result = await auditLogRepository.findAll(undefined, 1, limit);
    return result.data;
  }

  /**
   * Get audit logs by action
   */
  async getAuditLogsByAction(action: string, page = 1, limit = 50) {
    const filters: AuditLogFilters = { action };
    return await auditLogRepository.findAll(filters, page, limit);
  }

  /**
   * Get audit logs within date range
   */
  async getAuditLogsByDateRange(startDate: Date, endDate: Date, page = 1, limit = 50) {
    const filters: AuditLogFilters = { startDate, endDate };
    return await auditLogRepository.findAll(filters, page, limit);
  }

  /**
   * Export audit logs to JSON
   * This would typically export to a file, but returns data for now
   */
  async exportAuditLogs(filters?: AuditLogFilters) {
    // Get all matching logs without pagination
    const result = await auditLogRepository.findAll(filters, 1, 10000);
    return result.data;
  }
}

export const auditService = new AuditService();
