'use server';

import { AttendanceService } from '@/services/attendance.service';
import { PayrollService } from '@/services/payroll.service';
import { revalidatePath } from 'next/cache';

export async function clockIn(userId: string) {
    try {
        const result = await AttendanceService.clockIn(userId);
        revalidatePath('/hr/kiosk');
        revalidatePath('/hr/attendance');
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clockOut(userId: string) {
    try {
        const result = await AttendanceService.clockOut(userId);
        revalidatePath('/hr/kiosk');
        revalidatePath('/hr/attendance');
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDailyAttendanceStats(dateStr?: string) {
    try {
        const date = dateStr ? new Date(dateStr) : new Date();
        const stats = await AttendanceService.getDailySummary(date);
        return { success: true, data: stats };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generatePayrollAction(startDateStr: string, endDateStr: string) {
    try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const result = await PayrollService.generatePayroll(startDate, endDate);
        revalidatePath('/hr/payroll');
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
