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
  UpdateSalesAgentInput,
  CreateSalesAgentInput,
  ReferenceDataFilters,
} from '@/types/data-maintenance.types';
import { withErrorHandling } from '@/lib/errors';

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
  : T extends 'sales-agents'
  ? CreateSalesAgentInput
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
  : T extends 'sales-agents'
  ? UpdateSalesAgentInput
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
      case 'sales-agents':
        return prisma.salesAgent;
      default:
        throw new Error(`Unknown reference data type: ${type}`);
    }
  }

  async findAll<T extends ReferenceDataType>(type: T, filters?: ReferenceDataFilters) {
    return withErrorHandling(async () => {
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

      return await (model as any).findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
    }, 'DataMaintenanceRepository.findAll');
  }

  async findById<T extends ReferenceDataType>(type: T, id: string) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);
      return await (model as any).findUnique({
        where: { id },
      });
    }, 'DataMaintenanceRepository.findById');
  }

  async findByCode<T extends ReferenceDataType>(type: T, code: string) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);
      return await (model as any).findUnique({
        where: { code },
      });
    }, 'DataMaintenanceRepository.findByCode');
  }

  async findByName<T extends ReferenceDataType>(type: T, name: string) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);
      return await (model as any).findUnique({
        where: { name },
      });
    }, 'DataMaintenanceRepository.findByName');
  }

  async create<T extends ReferenceDataType>(type: T, data: CreateInput<T>) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);
      return await (model as any).create({
        data: data as any,
      });
    }, 'DataMaintenanceRepository.create');
  }

  async update<T extends ReferenceDataType>(type: T, id: string, data: UpdateInput<T>) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);
      return await (model as any).update({
        where: { id },
        data: data as any,
      });
    }, 'DataMaintenanceRepository.update');
  }

  async delete<T extends ReferenceDataType>(type: T, id: string) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);
      return await (model as any).delete({
        where: { id },
      });
    }, 'DataMaintenanceRepository.delete');
  }

  async count<T extends ReferenceDataType>(type: T, filters?: ReferenceDataFilters) {
    return withErrorHandling(async () => {
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

      return await (model as any).count({ where });
    }, 'DataMaintenanceRepository.count');
  }

  async updateDisplayOrder<T extends ReferenceDataType>(type: T, updates: { id: string; displayOrder: number }[]) {
    return withErrorHandling(async () => {
      const model = this.getModel(type);

      // Use transaction to update all display orders
      await prisma.$transaction(
        updates.map((update) =>
          (model as any).update({
            where: { id: update.id },
            data: { displayOrder: update.displayOrder },
          })
        )
      );
    }, 'DataMaintenanceRepository.updateDisplayOrder');
  }

  // Expense Vendor specific method to increment usage count
  async incrementVendorUsage(vendorId: string) {
    return withErrorHandling(async () => {
      return await prisma.expenseVendor.update({
        where: { id: vendorId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    }, 'DataMaintenanceRepository.incrementVendorUsage');
  }
}

export const dataMaintenanceRepository = new DataMaintenanceRepository();
