import { AttendanceRepository } from '../repositories/attendance.repository';
import { AttendanceStatus } from '@prisma/client';


export class AttendanceService {
    static async clockIn(userId: string) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let status: AttendanceStatus = 'PRESENT';
        const startHour = 9;
        if (now.getHours() > startHour || (now.getHours() === startHour && now.getMinutes() > 0)) {
            status = 'LATE';
        }

        return AttendanceRepository.create({
            userId,
            date: today,
            checkIn: now,
            status,
        });
    }

    static async clockOut(userId: string) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const record = await AttendanceRepository.findByUserAndDate(userId, today);
        if (!record) {
            throw new Error('No check-in record found for today.');
        }

        let totalHours = 0;
        if (record.checkIn) {
            const diffMs = now.getTime() - record.checkIn.getTime();
            totalHours = diffMs / (1000 * 60 * 60);
        }

        return AttendanceRepository.update(record.id, {
            checkOut: now,
            totalHours,
        });
    }

    static async getDailySummary(date: Date) {
        const queryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return AttendanceRepository.getDailyStats(queryDate);
    }
}
