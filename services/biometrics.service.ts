import { prisma } from '@/lib/prisma';

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
}
