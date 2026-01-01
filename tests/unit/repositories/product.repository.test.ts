import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productRepository } from '@/repositories/product.repository';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        productUOM: {
            deleteMany: vi.fn(),
        },
    },
}));

describe('ProductRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all products without filters', async () => {
            const mockProducts = [
                {
                    id: '1',
                    name: 'Product 1',
                    category: 'Electronics',
                    basePrice: 100,
                    status: 'active',
                    productUOMs: [],
                    Supplier: null,
                },
            ];

            vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

            const result = await productRepository.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].alternateUOMs).toEqual([]);
            expect(prisma.product.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    productUOMs: true,
                    Supplier: { select: { id: true, companyName: true } },
                },
                orderBy: { name: 'asc' },
                skip: undefined,
                take: undefined,
            });
        });

        it('should filter by category', async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValue([]);

            await productRepository.findAll({ category: 'Electronics' });

            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { category: 'Electronics' },
                })
            );
        });

        it('should filter by status', async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValue([]);

            await productRepository.findAll({ status: 'active' });

            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'active' },
                })
            );
        });

        it('should filter by search term', async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValue([]);

            await productRepository.findAll({ search: 'laptop' });

            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { name: { contains: 'laptop', mode: 'insensitive' } },
                            { description: { contains: 'laptop', mode: 'insensitive' } },
                            { category: { contains: 'laptop', mode: 'insensitive' } },
                        ],
                    },
                })
            );
        });

        it('should apply pagination', async () => {
            vi.mocked(prisma.product.findMany).mockResolvedValue([]);

            await productRepository.findAll({}, { skip: 10, limit: 20 });

            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 20,
                })
            );
        });
    });

    describe('count', () => {
        it('should count all products without filters', async () => {
            vi.mocked(prisma.product.count).mockResolvedValue(42);

            const result = await productRepository.count();

            expect(result).toBe(42);
            expect(prisma.product.count).toHaveBeenCalledWith({ where: {} });
        });

        it('should count with filters', async () => {
            vi.mocked(prisma.product.count).mockResolvedValue(10);

            const result = await productRepository.count({ category: 'Electronics', status: 'active' });

            expect(result).toBe(10);
            expect(prisma.product.count).toHaveBeenCalledWith({
                where: { category: 'Electronics', status: 'active' },
            });
        });
    });

    describe('findById', () => {
        it('should return product with UOMs', async () => {
            const mockProduct = {
                id: '1',
                name: 'Product 1',
                productUOMs: [{ id: 'uom1', name: 'Box', conversionFactor: 12 }],
                Supplier: { id: 'sup1', companyName: 'Supplier Inc' },
            };

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

            const result = await productRepository.findById('1');

            expect(result).toBeDefined();
            expect(result?.alternateUOMs).toHaveLength(1);
            expect(result?.Supplier).toEqual({ id: 'sup1', companyName: 'Supplier Inc' });
        });

        it('should return null for non-existent product', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            const result = await productRepository.findById('999');

            expect(result).toBeNull();
        });
    });

    describe('findByName', () => {
        it('should return product by name', async () => {
            const mockProduct = { id: '1', name: 'Laptop' };

            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

            const result = await productRepository.findByName('Laptop');

            expect(result).toEqual(mockProduct);
            expect(prisma.product.findUnique).toHaveBeenCalledWith({
                where: { name: 'Laptop' },
            });
        });
    });

    describe('findActive', () => {
        it('should return only active products', async () => {
            const mockProducts = [
                { id: '1', name: 'Product 1', status: 'active', productUOMs: [] },
                { id: '2', name: 'Product 2', status: 'active', productUOMs: [] },
            ];

            vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);

            const result = await productRepository.findActive();

            expect(result).toHaveLength(2);
            expect(prisma.product.findMany).toHaveBeenCalledWith({
                where: { status: 'active' },
                include: { productUOMs: true },
                orderBy: { name: 'asc' },
            });
        });
    });

    describe('create', () => {
        it('should create product without alternate UOMs', async () => {
            const mockProduct = {
                id: '1',
                name: 'New Product',
                category: 'Electronics',
                basePrice: 100,
                productUOMs: [],
            };

            vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

            const result = await productRepository.create({
                name: 'New Product',
                category: 'Electronics',
                basePrice: 100,
                baseUOM: 'piece',
                minStockLevel: 10,
                shelfLifeDays: 90,
            });

            expect(result.alternateUOMs).toEqual([]);
            expect(prisma.product.create).toHaveBeenCalled();
        });

        it('should create product with alternate UOMs', async () => {
            const mockProduct = {
                id: '1',
                name: 'New Product',
                productUOMs: [{ id: 'uom1', name: 'Box', conversionFactor: 12, sellingPrice: 100 }],
            };

            vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

            const result = await productRepository.create({
                name: 'New Product',
                category: 'Electronics',
                basePrice: 100,
                baseUOM: 'piece',
                minStockLevel: 10,
                shelfLifeDays: 90,
                alternateUOMs: [{ name: 'Box', conversionFactor: 12, sellingPrice: 100 }],
            });

            expect(result.alternateUOMs).toHaveLength(1);
        });
    });

    describe('update', () => {
        it('should update product without changing UOMs', async () => {
            const mockProduct = {
                id: '1',
                name: 'Updated Product',
                productUOMs: [],
            };

            vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

            const result = await productRepository.update('1', {
                name: 'Updated Product',
            });

            expect(result.name).toBe('Updated Product');
            expect(prisma.productUOM.deleteMany).not.toHaveBeenCalled();
        });

        it('should update product and replace UOMs', async () => {
            const mockProduct = {
                id: '1',
                name: 'Product',
                productUOMs: [{ id: 'new-uom', name: 'Case', conversionFactor: 24, sellingPrice: 200 }],
            };

            vi.mocked(prisma.productUOM.deleteMany).mockResolvedValue({ count: 1 } as any);
            vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

            const result = await productRepository.update('1', {
                alternateUOMs: [{ name: 'Case', conversionFactor: 24, sellingPrice: 200 }],
            });

            expect(prisma.productUOM.deleteMany).toHaveBeenCalledWith({
                where: { productId: '1' },
            });
            expect(result.alternateUOMs).toHaveLength(1);
        });
    });

    describe('delete', () => {
        it('should soft delete by setting status to inactive', async () => {
            const mockProduct = { id: '1', status: 'inactive' };

            vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

            const result = await productRepository.delete('1');

            expect(result.status).toBe('inactive');
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: 'inactive' },
            });
        });
    });

    describe('updateStatus', () => {
        it('should update product status', async () => {
            const mockProduct = { id: '1', status: 'active' };

            vi.mocked(prisma.product.update).mockResolvedValue(mockProduct as any);

            const result = await productRepository.updateStatus('1', 'active');

            expect(result.status).toBe('active');
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: 'active' },
            });
        });
    });
});
