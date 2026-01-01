import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '@/services/audit.service';
import { auditLogRepository } from '@/repositories/audit-log.repository';

// Mock dependencies
vi.mock('@/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    findAll: vi.fn(),
    findByUser: vi.fn(),
    findByResource: vi.fn(),
    create: vi.fn(),
  },
}));

describe('AuditService', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
    vi.clearAllMocks();
  });

  describe('getAllAuditLogs', () => {
    it('should return audit logs with pagination', async () => {
      const mockLogs = { data: [{ id: 'log-1' }], total: 1 };
      vi.mocked(auditLogRepository.findAll).mockResolvedValue(mockLogs as any);

      const result = await auditService.getAllAuditLogs({ action: 'TEST' }, 1, 10);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findAll).toHaveBeenCalledWith({ action: 'TEST' }, 1, 10);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for a user', async () => {
      const mockLogs = [{ id: 'log-1' }];
      vi.mocked(auditLogRepository.findByUser).mockResolvedValue(mockLogs as any);

      const result = await auditService.getUserAuditLogs('user-1', { action: 'TEST' });

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findByUser).toHaveBeenCalledWith('user-1', { action: 'TEST' });
    });
  });

  describe('getResourceAuditLogs', () => {
    it('should return audit logs for a resource', async () => {
      const mockLogs = [{ id: 'log-1' }];
      vi.mocked(auditLogRepository.findByResource).mockResolvedValue(mockLogs as any);

      const result = await auditService.getResourceAuditLogs('order', 'order-1');

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findByResource).toHaveBeenCalledWith('order', 'order-1');
    });
  });

  describe('getRecentAuditLogs', () => {
    it('should return recent audit logs', async () => {
      const mockLogs = { data: [{ id: 'log-1' }], total: 1 };
      vi.mocked(auditLogRepository.findAll).mockResolvedValue(mockLogs as any);

      const result = await auditService.getRecentAuditLogs(10);

      expect(result).toEqual(mockLogs.data);
      expect(auditLogRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should return audit logs filtered by action', async () => {
      const mockLogs = { data: [{ id: 'log-1' }], total: 1 };
      vi.mocked(auditLogRepository.findAll).mockResolvedValue(mockLogs as any);

      const result = await auditService.getAuditLogsByAction('TEST_ACTION', 1, 10);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findAll).toHaveBeenCalledWith({ action: 'TEST_ACTION' }, 1, 10);
    });
  });

  describe('getAuditLogsByDateRange', () => {
    it('should return audit logs filtered by date range', async () => {
      const mockLogs = { data: [{ id: 'log-1' }], total: 1 };
      vi.mocked(auditLogRepository.findAll).mockResolvedValue(mockLogs as any);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const result = await auditService.getAuditLogsByDateRange(startDate, endDate, 1, 10);

      expect(result).toEqual(mockLogs);
      expect(auditLogRepository.findAll).toHaveBeenCalledWith({ startDate, endDate }, 1, 10);
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs', async () => {
      const mockLogs = { data: [{ id: 'log-1' }], total: 1 };
      vi.mocked(auditLogRepository.findAll).mockResolvedValue(mockLogs as any);

      const result = await auditService.exportAuditLogs({ action: 'TEST' });

      expect(result).toEqual(mockLogs.data);
      expect(auditLogRepository.findAll).toHaveBeenCalledWith({ action: 'TEST' }, 1, 10000);
    });
  });
});
