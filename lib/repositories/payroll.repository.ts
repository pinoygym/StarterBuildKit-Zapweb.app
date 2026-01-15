import { prisma } from '@/lib/prisma';
import { PayrollStatus } from '@prisma/client';

export class PayrollRepository {
    static async createPeriod(data: {
        startDate: Date;
        endDate: Date;
        status?: PayrollStatus;
    }) {
        return prisma.payrollPeriod.create({
            data: {
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status || 'DRAFT',
            },
        });
    }

    static async getPeriodById(id: string) {
        return prisma.payrollPeriod.findUnique({
            where: { id },
            include: {
                PayrollRecords: true,
            },
        });
    }

    static async createRecord(data: {
        payrollPeriodId: string;
        userId: string;
        regularHours: number;
        overtimeHours: number;
        grossPay: number;
        deductions: number;
        netPay: number;
    }) {
        return prisma.payrollRecord.create({
            data,
        });
    }

    static async getRecordsForPeriod(payrollPeriodId: string) {
        return prisma.payrollRecord.findMany({
            where: { payrollPeriodId },
            include: {
                User: {
                    include: {
                        EmployeeProfile: true,
                    },
                },
            },
        });
    }

    static async updateRecordStatus(recordId: string, status: string) {
        return prisma.payrollRecord.update({
            where: { id: recordId },
            data: { status },
        });
    }
}
