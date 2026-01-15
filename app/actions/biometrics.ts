'use server';

import { BiometricsService } from '@/services/biometrics.service';
import { revalidatePath } from 'next/cache';

export async function registerFace(userId: string, descriptor: number[]) {
    try {
        await BiometricsService.saveFaceBiometrics(userId, descriptor);
        revalidatePath('/hr/biometrics');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function registerFingerprint(userId: string, data: any) {
    try {
        await BiometricsService.saveFingerprintBiometrics(userId, data);
        revalidatePath('/hr/biometrics');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getEmployeeByCode(employeeId: string) {
    try {
        const profile = await BiometricsService.getEmployeeBiometrics(employeeId);
        if (!profile) return { success: false, error: 'Employee not found' };
        return { success: true, data: profile };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllFaceDescriptors() {
    try {
        const descriptors = await BiometricsService.getAllEmployeeFaceDescriptors();
        return { success: true, data: descriptors };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
