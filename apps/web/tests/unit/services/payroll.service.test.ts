import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollService } from '@/services/payroll.service';
import { PayrollRepository } from '@/repositories/payroll.repository';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/repositories/payroll.repository', () => ({
    PayrollRepository: {
        createPeriod: vi.fn(),
        createRecord: vi.fn(),
    },
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: vi.fn(),
        },
        attendanceRecord: {
            findMany: vi.fn(),
        },
    },
}));

describe('PayrollService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generatePayroll', () => {
        it('should generate payroll records for eligible employees', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-15');
            const mockPeriod = { id: 'period-1', startDate, endDate };

            vi.mocked(PayrollRepository.createPeriod).mockResolvedValue(mockPeriod as any);

            // Mock users
            const mockUser = {
                id: 'user-1',
                EmployeeProfile: { hourlyRate: 100 },
            };
            vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser as any]);

            // Mock attendance
            const mockAttendance = [
                { totalHours: 8 },
                { totalHours: 8 },
            ]; // 16 hours total
            vi.mocked(prisma.attendanceRecord.findMany).mockResolvedValue(mockAttendance as any);

            vi.mocked(PayrollRepository.createRecord).mockResolvedValue({} as any);

            const result = await PayrollService.generatePayroll(startDate, endDate);

            expect(PayrollRepository.createPeriod).toHaveBeenCalledWith({ startDate, endDate });
            expect(prisma.user.findMany).toHaveBeenCalled();
            expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    date: { gte: startDate, lte: endDate },
                },
            });

            // Verification: 16 hours * 100 rate = 1600 gross pay
            expect(PayrollRepository.createRecord).toHaveBeenCalledWith({
                payrollPeriodId: 'period-1',
                userId: 'user-1',
                regularHours: 16,
                overtimeHours: 0,
                grossPay: 1600,
                deductions: 0,
                netPay: 1600,
            });

            expect(result.recordCount).toBe(1);
        });
    });
});
