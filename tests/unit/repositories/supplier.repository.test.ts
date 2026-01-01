import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supplierRepository } from '@/repositories/supplier.repository';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        supplier: {
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

describe('SupplierRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all suppliers without filters', async () => {
            const mockSuppliers = [
                {
                    id: '1',
                    companyName: 'ABC Suppliers',
                    contactPerson: 'John Doe',
                    email: 'john@abc.com',
                },
            ];

            vi.mocked(prisma.supplier.findMany).mockResolvedValue(mockSuppliers as any);

            const result = await supplierRepository.findAll();

            expect(result).toHaveLength(1);
        });

        it('should apply pagination', async () => {
            vi.mocked(prisma.supplier.findMany).mockResolvedValue([]);

            await supplierRepository.findAll({}, { skip: 10, take: 20 });

            expect(prisma.supplier.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 20,
                })
            );
        });

        it('should filter by search term', async () => {
            vi.mocked(prisma.supplier.findMany).mockResolvedValue([]);

            await supplierRepository.findAll({ search: 'ABC' });

            expect(prisma.supplier.findMany).toHaveBeenCalled();
        });
    });

    describe('count', () => {
        it('should count all suppliers', async () => {
            vi.mocked(prisma.supplier.count).mockResolvedValue(15);

            const result = await supplierRepository.count();

            expect(result).toBe(15);
        });

        it('should count with search filter', async () => {
            vi.mocked(prisma.supplier.count).mockResolvedValue(5);

            const result = await supplierRepository.count({ search: 'ABC' });

            expect(result).toBe(5);
        });
    });

    describe('findById', () => {
        it('should return supplier by id', async () => {
            const mockSupplier = {
                id: '1',
                companyName: 'ABC Suppliers',
            };

            vi.mocked(prisma.supplier.findUnique).mockResolvedValue(mockSupplier as any);

            const result = await supplierRepository.findById('1');

            expect(result).toEqual(mockSupplier);
        });

        it('should return null for non-existent supplier', async () => {
            vi.mocked(prisma.supplier.findUnique).mockResolvedValue(null);

            const result = await supplierRepository.findById('999');

            expect(result).toBeNull();
        });
    });

    describe('findByCompanyName', () => {
        it('should return supplier by email', async () => {
            const mockSupplier = {
                id: '1',
                email: 'ABC Suppliers',
            };

            vi.mocked(prisma.supplier.findFirst).mockResolvedValue(mockSupplier as any);

            const result = await supplierRepository.findByCompanyName('ABC Suppliers');

            expect(result).toEqual(mockSupplier);
        });
    });

    describe('findActive', () => {
        it('should return only active suppliers', async () => {
            const mockSuppliers = [
                { id: '1', status: 'active', companyName: 'Supplier A' },
                { id: '2', status: 'active', companyName: 'Supplier B' },
            ];

            vi.mocked(prisma.supplier.findMany).mockResolvedValue(mockSuppliers as any);

            const result = await supplierRepository.findActive();

            expect(result).toHaveLength(2);
        });
    });

    describe('create', () => {
        it('should create a new supplier', async () => {
            const mockSupplier = {
                id: '1',
                companyName: 'New Supplier',
                contactPerson: 'Jane Smith',
                email: 'jane@newsupplier.com',
            };

            vi.mocked(prisma.supplier.create).mockResolvedValue(mockSupplier as any);

            const result = await supplierRepository.create({
                companyName: 'New Supplier',
                contactPerson: 'Jane Smith',
                email: 'jane@newsupplier.com',
            });

            expect(result.companyName).toBe('New Supplier');
            expect(prisma.supplier.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update supplier details', async () => {
            const mockSupplier = {
                id: '1',
                companyName: 'Updated Supplier',
            };

            vi.mocked(prisma.supplier.update).mockResolvedValue(mockSupplier as any);

            const result = await supplierRepository.update('1', {
                companyName: 'Updated Supplier',
            });

            expect(result.companyName).toBe('Updated Supplier');
            expect(prisma.supplier.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    companyName: 'Updated Supplier',
                }),
            });
        });
    });

    describe('delete', () => {
        it('should hard delete supplier', async () => {
            const mockSupplier = { id: '1', companyName: 'Deleted Supplier' };

            vi.mocked(prisma.supplier.delete).mockResolvedValue(mockSupplier as any);

            const result = await supplierRepository.delete('1');

            expect(result.id).toBe('1');
            expect(prisma.supplier.delete).toHaveBeenCalledWith({ where: { id: '1' } });
        });
    });

    describe('updateStatus', () => {
        it('should update supplier status', async () => {
            const mockSupplier = { id: '1', status: 'active' };

            vi.mocked(prisma.supplier.update).mockResolvedValue(mockSupplier as any);

            const result = await supplierRepository.updateStatus('1', 'active');

            expect(result.status).toBe('active');
        });
    });
});

