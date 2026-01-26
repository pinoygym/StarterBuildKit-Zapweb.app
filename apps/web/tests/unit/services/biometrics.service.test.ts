process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BiometricsService } from '../../../services/biometrics.service';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';

// Mock prisma using relative path to match the import in BiometricsService if needed,
// but actually BiometricsService uses @/lib/prisma. 
// Let's standardise BiometricsService to use @/lib/prisma and the test to mock that.
// Wait, I already saw BiometricsService uses @/lib/prisma. 

vi.mock('@/lib/prisma', () => ({
    prisma: {
        employeeProfile: {
            update: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

vi.mock('../../../lib/prisma', () => ({
    prisma: {
        employeeProfile: {
            update: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));



describe('BiometricsService', () => {
    const mockUserId = 'user-123';
    const mockDescriptor = new Array(128).fill(0.1);
    const mockFingerprintData = { some: 'data' };

    // Generate real-ish keys for testing encryption/decryption logic if needed, 
    // but better to mock crypto.publicEncrypt and privateDecrypt for speed and isolation.

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.BIOMETRIC_PUBLIC_KEY = 'mock-public-key';
        process.env.BIOMETRIC_PRIVATE_KEY = 'mock-private-key';
    });

    describe('registerFace', () => {
        it('should encrypt and save face biometrics', async () => {
            console.log('Starting registerFace test');
            const mockEncrypted = Buffer.from('encrypted-data');
            const spyEncrypt = vi.spyOn(crypto, 'publicEncrypt').mockReturnValue(mockEncrypted);

            console.log('Prisma mock status:', !!prisma.employeeProfile.update);
            (prisma.employeeProfile.update as any).mockResolvedValue({ id: 1 });

            await BiometricsService.registerFace(mockUserId, mockDescriptor);
            console.log('BiometricsService.registerFace called');

            expect(spyEncrypt).toHaveBeenCalled();
            expect(prisma.employeeProfile.update).toHaveBeenCalledWith({
                where: { userId: mockUserId },
                data: { faceBiometrics: mockEncrypted.toString('base64') },
            });
        });
    });

    describe('registerFingerprint', () => {
        it('should encrypt and save fingerprint biometrics', async () => {
            const mockEncrypted = Buffer.from('encrypted-fingerprint');
            const spyEncrypt = vi.spyOn(crypto, 'publicEncrypt').mockReturnValue(mockEncrypted);

            (prisma.employeeProfile.update as any).mockResolvedValue({ id: 1 });

            await BiometricsService.registerFingerprint(mockUserId, mockFingerprintData);

            expect(spyEncrypt).toHaveBeenCalled();
            expect(prisma.employeeProfile.update).toHaveBeenCalledWith({
                where: { userId: mockUserId },
                data: { fingerprintBiometrics: mockEncrypted.toString('base64') },
            });
        });
    });

    describe('verifyFace', () => {
        it('should return true if face matches', async () => {
            const storedDescriptor = new Array(128).fill(0.1);
            const encryptedData = Buffer.from('encrypted').toString('base64');

            (prisma.employeeProfile.findUnique as any).mockResolvedValue({
                faceBiometrics: encryptedData
            });

            vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from(JSON.stringify(storedDescriptor)));

            const result = await BiometricsService.verifyFace(mockUserId, mockDescriptor);

            expect(result).toBe(true);
        });

        it('should return false if face does not match', async () => {
            const storedDescriptor = new Array(128).fill(0.9); // Very different
            const encryptedData = Buffer.from('encrypted').toString('base64');

            (prisma.employeeProfile.findUnique as any).mockResolvedValue({
                faceBiometrics: encryptedData
            });

            vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from(JSON.stringify(storedDescriptor)));

            const result = await BiometricsService.verifyFace(mockUserId, mockDescriptor);

            expect(result).toBe(false);
        });

        it('should return false if no biometrics stored', async () => {
            (prisma.employeeProfile.findUnique as any).mockResolvedValue(null);

            const result = await BiometricsService.verifyFace(mockUserId, mockDescriptor);

            expect(result).toBe(false);
        });
    });

    describe('verifyFingerprint', () => {
        it('should return true if fingerprint data matches', async () => {
            const encryptedData = Buffer.from('encrypted').toString('base64');

            (prisma.employeeProfile.findUnique as any).mockResolvedValue({
                fingerprintBiometrics: encryptedData
            });

            vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from(JSON.stringify(mockFingerprintData)));

            const result = await BiometricsService.verifyFingerprint(mockUserId, mockFingerprintData);

            expect(result).toBe(true);
        });

        it('should return false if fingerprint data does not match', async () => {
            const encryptedData = Buffer.from('encrypted').toString('base64');

            (prisma.employeeProfile.findUnique as any).mockResolvedValue({
                fingerprintBiometrics: encryptedData
            });

            vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from(JSON.stringify({ other: 'data' })));

            const result = await BiometricsService.verifyFingerprint(mockUserId, mockFingerprintData);

            expect(result).toBe(false);
        });
    });

    describe('getAllEmployeeFaceDescriptors', () => {
        it('should decrypt and return all face descriptors', async () => {
            const mockEmployees = [
                {
                    employeeId: 'EMP001',
                    faceBiometrics: Buffer.from('encrypted-eval').toString('base64'),
                    User: { firstName: 'John', lastName: 'Doe' }
                }
            ];
            const mockDescriptor = [0.1, 0.2];

            (prisma.employeeProfile.findMany as any).mockResolvedValue(mockEmployees);
            vi.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from(JSON.stringify(mockDescriptor)));

            const result = await BiometricsService.getAllEmployeeFaceDescriptors();

            expect(result).toHaveLength(1);
            expect(result[0].employeeId).toBe('EMP001');
            expect(result[0].descriptor).toEqual(mockDescriptor);
        });
    });
});

