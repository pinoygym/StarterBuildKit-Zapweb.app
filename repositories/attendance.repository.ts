import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRepository {
    static async create(data: {
        userId: string;
        date: Date;
        checkIn?: Date;
        checkOut?: Date;
        status: AttendanceStatus;
        notes?: string;
    }) {
        return prisma.attendanceRecord.upsert({
            where: {
                userId_date: {
                    userId: data.userId,
                    date: data.date,
                },
            },
            update: {
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                status: data.status,
                notes: data.notes,
            },
            create: {
                userId: data.userId,
                date: data.date,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                status: data.status,
                notes: data.notes,
            },
        });
    }

    static async update(id: string, data: Partial<{
        checkIn: Date;
        checkOut: Date;
        status: AttendanceStatus;
        totalHours: number;
        notes: string;
    }>) {
        return prisma.attendanceRecord.update({
            where: { id },
            data,
        });
    }

    static async findByUserAndDate(userId: string, date: Date) {
        return prisma.attendanceRecord.findUnique({
            where: {
                userId_date: {
                    userId,
                    date,
                },
            },
        });
    }

    static async getDailyStats(date: Date) {
        const records = await prisma.attendanceRecord.findMany({
            where: {
                date: date,
            },
        });

        const present = records.filter(r => r.status === 'PRESENT').length;
        const late = records.filter(r => r.status === 'LATE').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;
        const onLeave = records.filter(r => r.status === 'ON_LEAVE').length;

        return {
            present,
            late,
            absent,
            onLeave,
            total: records.length,
        };
    }
}
