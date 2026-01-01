import { prisma } from '@/lib/prisma';
import {
  ReferenceDataType,
  CreateProductCategoryInput,
  CreateExpenseCategoryInput,
  CreatePaymentMethodInput,
  CreateUnitOfMeasureInput,
  CreateExpenseVendorInput,
  UpdateProductCategoryInput,
  UpdateExpenseCategoryInput,
  UpdatePaymentMethodInput,
  UpdateUnitOfMeasureInput,
  UpdateExpenseVendorInput,
  ReferenceDataFilters,
} from '@/types/data-maintenance.types';

// Generic type for create/update inputs
type CreateInput<T extends ReferenceDataType> = T extends 'product-categories'
  ? CreateProductCategoryInput
  : T extends 'expense-categories'
  ? CreateExpenseCategoryInput
  : T extends 'payment-methods'
  ? CreatePaymentMethodInput
  : T extends 'units-of-measure'
  ? CreateUnitOfMeasureInput
  : T extends 'expense-vendors'
  ? CreateExpenseVendorInput
  : never;

type UpdateInput<T extends ReferenceDataType> = T extends 'product-categories'
  ? UpdateProductCategoryInput
  : T extends 'expense-categories'
  ? UpdateExpenseCategoryInput
  : T extends 'payment-methods'
  ? UpdatePaymentMethodInput
  : T extends 'units-of-measure'
  ? UpdateUnitOfMeasureInput
  : T extends 'expense-vendors'
  ? UpdateExpenseVendorInput
  : never;

export class DataMaintenanceRepository {
  // Map reference data type to Prisma model
  private getModel(type: ReferenceDataType) {
    switch (type) {
      case 'product-categories':
        return prisma.productCategory;
      case 'expense-categories':
        return prisma.expenseCategory;
      case 'payment-methods':
        return prisma.paymentMethod;
      case 'units-of-measure':
        return prisma.unitOfMeasure;
      case 'expense-vendors':
        return prisma.expenseVendor;
      default:
        throw new Error(`Unknown reference data type: ${type}`);
    }
  }

  async findAll<T extends ReferenceDataType>(type: T, filters?: ReferenceDataFilters) {
    const model = this.getModel(type);
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    return await model.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findById<T extends ReferenceDataType>(type: T, id: string) {
    const model = this.getModel(type);
    return await model.findUnique({
      where: { id },
    });
  }

  async findByCode<T extends ReferenceDataType>(type: T, code: string) {
    const model = this.getModel(type);
    return await model.findUnique({
      where: { code },
    });
  }

  async findByName<T extends ReferenceDataType>(type: T, name: string) {
    const model = this.getModel(type);
    return await model.findUnique({
      where: { name },
    });
  }

  async create<T extends ReferenceDataType>(type: T, data: CreateInput<T>) {
    const model = this.getModel(type);
    return await model.create({
      data: data as any,
    });
  }

  async update<T extends ReferenceDataType>(type: T, id: string, data: UpdateInput<T>) {
    const model = this.getModel(type);
    return await model.update({
      where: { id },
      data: data as any,
    });
  }

  async delete<T extends ReferenceDataType>(type: T, id: string) {
    const model = this.getModel(type);
    return await model.delete({
      where: { id },
    });
  }

  async count<T extends ReferenceDataType>(type: T, filters?: ReferenceDataFilters) {
    const model = this.getModel(type);
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    return await model.count({ where });
  }

  async updateDisplayOrder<T extends ReferenceDataType>(type: T, updates: { id: string; displayOrder: number }[]) {
    const model = this.getModel(type);

    // Use transaction to update all display orders
    await prisma.$transaction(
      updates.map((update) =>
        model.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder },
        })
      )
    );
  }

  // Expense Vendor specific method to increment usage count
  async incrementVendorUsage(vendorId: string) {
    return await prisma.expenseVendor.update({
      where: { id: vendorId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }
}

export const dataMaintenanceRepository = new DataMaintenanceRepository();
