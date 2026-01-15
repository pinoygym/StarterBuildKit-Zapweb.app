import { PayrollRepository } from '@/lib/repositories/payroll.repository';
import { prisma } from '@/lib/prisma';

export class PayrollService {
    static async generatePayroll(startDate: Date, endDate: Date) {
        const period = await PayrollRepository.createPeriod({
            startDate,
            endDate,
        });

        const users = await prisma.user.findMany({
            where: {
                status: 'ACTIVE',
                EmployeeProfile: {
                    isNot: null
                }
            },
            include: {
                EmployeeProfile: true,
            }
        });

        const records = [];

        for (const user of users) {
            if (!user.EmployeeProfile?.hourlyRate) continue;

            const attendance = await prisma.attendanceRecord.findMany({
                where: {
                    userId: user.id,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    }
                }
            });

            const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);

            const rate = user.EmployeeProfile.hourlyRate;
            const grossPay = totalHours * rate;
            const deductions = 0;
            const netPay = grossPay - deductions;

            const record = await PayrollRepository.createRecord({
                payrollPeriodId: period.id,
                userId: user.id,
                regularHours: totalHours,
                overtimeHours: 0,
                grossPay,
                deductions,
                netPay,
            });
            records.push(record);
        }

        return { period, recordCount: records.length };
    }
}
