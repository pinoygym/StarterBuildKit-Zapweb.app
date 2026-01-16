import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export class BiometricsService {
    static async saveFaceBiometrics(userId: string, descriptor: number[]) {
        return prisma.employeeProfile.update({
            where: { userId },
            data: {
                faceBiometrics: descriptor as any,
            },
        });
    }

    static async saveFingerprintBiometrics(userId: string, data: any) {
        return prisma.employeeProfile.update({
            where: { userId },
            data: {
                fingerprintBiometrics: data,
            },
        });
    }

    static async getEmployeeBiometrics(employeeId: string) {
        const profile = await prisma.employeeProfile.findUnique({
            where: { employeeId },
            include: {
                User: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return profile;
    }

    static async getAllEmployeeFaceDescriptors() {
        const employees = await prisma.employeeProfile.findMany({
            where: {
                faceBiometrics: { not: null },
            },
            select: {
                employeeId: true,
                faceBiometrics: true,
                User: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return employees.map((emp: any) => ({
            employeeId: emp.employeeId,
            fullName: `${emp.User.firstName} ${emp.User.lastName}`,
            descriptor: emp.faceBiometrics as unknown as number[],
        }));
    }
    static async registerFace(userId: string, descriptor: number[]) {
        const encrypted = crypto.publicEncrypt({
            key: process.env.BIOMETRIC_PUBLIC_KEY!,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        }, Buffer.from(JSON.stringify(descriptor)));
        return prisma.employeeProfile.update({
            where: { userId },
            data: { faceBiometrics: encrypted.toString('base64') as any },
        });
    }

    static async registerFingerprint(userId: string, data: any) {
        const encrypted = crypto.publicEncrypt({
            key: process.env.BIOMETRIC_PUBLIC_KEY!,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        }, Buffer.from(JSON.stringify(data)));
        return prisma.employeeProfile.update({
            where: { userId },
            data: { fingerprintBiometrics: encrypted.toString('base64') as any },
        });
    }

    static async verifyFace(userId: string, descriptor: number[]) {
        const profile = await prisma.employeeProfile.findUnique({
            where: { userId },
            select: { faceBiometrics: true },
        });
        if (!profile?.faceBiometrics) return false;
        const decrypted = crypto.privateDecrypt({
            key: process.env.BIOMETRIC_PRIVATE_KEY!,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        }, Buffer.from(profile.faceBiometrics as string, 'base64'));
        const stored = JSON.parse(decrypted.toString()) as number[];
        const distance = Math.sqrt(stored.reduce((sum, v, i) => sum + Math.pow(v - descriptor[i], 2), 0));
        return distance < 0.6;
    }

    static async verifyFingerprint(userId: string, data: any) {
        const profile = await prisma.employeeProfile.findUnique({
            where: { userId },
            select: { fingerprintBiometrics: true },
        });
        if (!profile?.fingerprintBiometrics) return false;
        const decrypted = crypto.privateDecrypt({
            key: process.env.BIOMETRIC_PRIVATE_KEY!,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        }, Buffer.from(profile.fingerprintBiometrics as string, 'base64'));
        const stored = JSON.parse(decrypted.toString());
        return JSON.stringify(stored) === JSON.stringify(data);
    }

}
