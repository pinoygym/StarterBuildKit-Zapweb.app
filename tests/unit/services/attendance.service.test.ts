import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceService } from '@/services/attendance.service';
import { AttendanceRepository } from '@/repositories/attendance.repository';


// Mock the repository
vi.mock('@/repositories/attendance.repository', () => ({
    AttendanceRepository: {
        create: vi.fn(),
        findByUserAndDate: vi.fn(),
        update: vi.fn(),
        getDailyStats: vi.fn(),
    },
}));

describe('AttendanceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('clockIn', () => {
        it('should create an attendance record with PRESENT status if on time', async () => {
            // Mock Date to be 8:00 AM
            const mockDate = new Date('2024-01-01T08:00:00');
            vi.useFakeTimers();
            vi.setSystemTime(mockDate);

            const userId = 'user-1';
            const expectedRecord = { id: '1', userId, status: 'PRESENT' };

            vi.mocked(AttendanceRepository.create).mockResolvedValue(expectedRecord as any);

            const result = await AttendanceService.clockIn(userId);

            expect(AttendanceRepository.create).toHaveBeenCalledWith({
                userId,
                date: expect.any(Date), // Normalized date
                checkIn: mockDate,
                status: 'PRESENT',
            });
            expect(result).toEqual(expectedRecord);

            vi.useRealTimers();
        });

        it('should create an attendance record with LATE status if after 9:00 AM', async () => {
            // Mock Date to be 9:01 AM
            const mockDate = new Date('2024-01-01T09:01:00');
            vi.useFakeTimers();
            vi.setSystemTime(mockDate);

            const userId = 'user-1';
            vi.mocked(AttendanceRepository.create).mockResolvedValue({} as any);

            await AttendanceService.clockIn(userId);

            expect(AttendanceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                status: 'LATE',
            }));

            vi.useRealTimers();
        });
    });

    describe('clockOut', () => {
        it('should update the record with checkout time and total hours', async () => {
            const mockCheckIn = new Date('2024-01-01T09:00:00');
            const mockCheckOut = new Date('2024-01-01T17:00:00');

            vi.useFakeTimers();
            vi.setSystemTime(mockCheckOut);

            const userId = 'user-1';
            const mockRecord = { id: '1', checkIn: mockCheckIn };

            vi.mocked(AttendanceRepository.findByUserAndDate).mockResolvedValue(mockRecord as any);
            vi.mocked(AttendanceRepository.update).mockResolvedValue({ ...mockRecord, checkOut: mockCheckOut } as any);

            await AttendanceService.clockOut(userId);

            expect(AttendanceRepository.findByUserAndDate).toHaveBeenCalled();
            expect(AttendanceRepository.update).toHaveBeenCalledWith('1', {
                checkOut: mockCheckOut,
                totalHours: 8, // 17 - 9 = 8 hours
            });

            vi.useRealTimers();
        });

        it('should throw error if no check-in record found', async () => {
            const userId = 'user-1';
            vi.mocked(AttendanceRepository.findByUserAndDate).mockResolvedValue(null);

            await expect(AttendanceService.clockOut(userId)).rejects.toThrow('No check-in record found for today.');
        });
    });
});
