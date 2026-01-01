import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Product } from '@prisma/client';
import { CreateProductInput, UpdateProductInput, ProductWithUOMs, ProductFilters } from '@/types/product.types';

export class ProductRepository {
  async findAll(filters?: ProductFilters): Promise<ProductWithUOMs[]> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        productUOMs: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map(product => ({
      ...product,
      alternateUOMs: product.productUOMs,
    }));
  }

  async findById(id: string): Promise<ProductWithUOMs | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productUOMs: true,
      },
    });

    if (!product) return null;

    return {
      ...product,
      alternateUOMs: product.productUOMs,
    };
  }

  async findByName(name: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { name },
    });
  }

  async findActive(): Promise<ProductWithUOMs[]> {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: {
        productUOMs: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map(product => ({
      ...product,
      alternateUOMs: product.productUOMs,
    }));
  }

  async create(data: CreateProductInput): Promise<ProductWithUOMs> {
    const { alternateUOMs, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        ...productData,
        updatedAt: new Date(),
        productUOMs: alternateUOMs && alternateUOMs.length > 0
          ? {
            create: alternateUOMs.map(u => ({ id: randomUUID(), ...u })),
          }
          : undefined,
      },
      include: {
        productUOMs: true,
      },
    });

    return {
      ...product,
      alternateUOMs: product.productUOMs,
    };
  }

  async update(id: string, data: UpdateProductInput): Promise<ProductWithUOMs> {
    const { alternateUOMs, ...productData } = data;

    // If alternateUOMs are provided, we need to handle them separately
    if (alternateUOMs !== undefined) {
      // Delete existing alternate UOMs and create new ones
      await prisma.productUOM.deleteMany({
        where: { productId: id },
      });

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          updatedAt: new Date(),
          productUOMs: alternateUOMs.length > 0
            ? {
              create: alternateUOMs.map(u => ({ id: randomUUID(), ...u })),
            }
            : undefined,
        },
        include: {
          productUOMs: true,
        },
      });

      return {
        ...product,
        alternateUOMs: product.productUOMs,
      };
    }

    // If no alternateUOMs provided, just update product data
    const product = await prisma.product.update({
      where: { id },
      data: { ...productData, updatedAt: new Date() },
      include: {
        productUOMs: true,
      },
    });

    return {
      ...product,
      alternateUOMs: product.productUOMs,
    };
  }

  async delete(id: string): Promise<Product> {
    return await prisma.product.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data: { status },
    });
  }
}

export const productRepository = new ProductRepository();
