import { dataMaintenanceRepository } from '@/repositories/data-maintenance.repository';
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
import {
  createProductCategorySchema,
  updateProductCategorySchema,
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  createUnitOfMeasureSchema,
  updateUnitOfMeasureSchema,
  createExpenseVendorSchema,
  updateExpenseVendorSchema,
} from '@/lib/validations/data-maintenance.validation';
import { ValidationError, NotFoundError } from '@/lib/api-error';

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

export class DataMaintenanceService {
  // Get validation schema for create
  private getCreateSchema(type: ReferenceDataType) {
    switch (type) {
      case 'product-categories':
        return createProductCategorySchema;
      case 'expense-categories':
        return createExpenseCategorySchema;
      case 'payment-methods':
        return createPaymentMethodSchema;
      case 'units-of-measure':
        return createUnitOfMeasureSchema;
      case 'expense-vendors':
        return createExpenseVendorSchema;
      default:
        throw new Error(`Unknown reference data type: ${type}`);
    }
  }

  // Get validation schema for update
  private getUpdateSchema(type: ReferenceDataType) {
    switch (type) {
      case 'product-categories':
        return updateProductCategorySchema;
      case 'expense-categories':
        return updateExpenseCategorySchema;
      case 'payment-methods':
        return updatePaymentMethodSchema;
      case 'units-of-measure':
        return updateUnitOfMeasureSchema;
      case 'expense-vendors':
        return updateExpenseVendorSchema;
      default:
        throw new Error(`Unknown reference data type: ${type}`);
    }
  }

  // Get human-readable name for the type
  private getTypeName(type: ReferenceDataType): string {
    switch (type) {
      case 'product-categories':
        return 'Product Category';
      case 'expense-categories':
        return 'Expense Category';
      case 'payment-methods':
        return 'Payment Method';
      case 'units-of-measure':
        return 'Unit of Measure';
      case 'expense-vendors':
        return 'Expense Vendor';
      default:
        return 'Reference Data';
    }
  }

  async getAll<T extends ReferenceDataType>(type: T, filters?: ReferenceDataFilters) {
    return await dataMaintenanceRepository.findAll(type, filters);
  }

  async getById<T extends ReferenceDataType>(type: T, id: string) {
    const item = await dataMaintenanceRepository.findById(type, id);
    if (!item) {
      throw new NotFoundError(this.getTypeName(type));
    }
    return item;
  }

  async create<T extends ReferenceDataType>(type: T, data: CreateInput<T>) {
    // Validate input
    const schema = this.getCreateSchema(type);
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid data', errors);
    }

    const validatedData = validationResult.data;

    // Check for duplicate name
    const existingByName = await dataMaintenanceRepository.findByName(type, validatedData.name);
    if (existingByName) {
      throw new ValidationError('A record with this name already exists', {
        name: ['Name must be unique'],
      });
    }

    // Check for duplicate code (if code exists in the data)
    if ('code' in validatedData) {
      const existingByCode = await dataMaintenanceRepository.findByCode(type, (validatedData as any).code);
      if (existingByCode) {
        throw new ValidationError('A record with this code already exists', {
          code: ['Code must be unique'],
        });
      }
    }

    return await dataMaintenanceRepository.create(type, validatedData as CreateInput<T>);
  }

  async update<T extends ReferenceDataType>(type: T, id: string, data: UpdateInput<T>) {
    // Check if item exists
    const existing = await this.getById(type, id);

    // Validate input
    const schema = this.getUpdateSchema(type);
    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid data', errors);
    }

    const validatedData = validationResult.data;

    // Check for duplicate name (if name is being updated)
    if (validatedData.name && validatedData.name !== (existing as any).name) {
      const existingByName = await dataMaintenanceRepository.findByName(type, validatedData.name);
      if (existingByName) {
        throw new ValidationError('A record with this name already exists', {
          name: ['Name must be unique'],
        });
      }
    }

    // Check for duplicate code (if code is being updated and exists in the data)
    if ('code' in validatedData && validatedData.code && validatedData.code !== (existing as any).code) {
      const existingByCode = await dataMaintenanceRepository.findByCode(type, (validatedData as any).code);
      if (existingByCode) {
        throw new ValidationError('A record with this code already exists', {
          code: ['Code must be unique'],
        });
      }
    }

    return await dataMaintenanceRepository.update(type, id, validatedData as UpdateInput<T>);
  }

  async delete<T extends ReferenceDataType>(type: T, id: string) {
    // Check if item exists
    const existing = await this.getById(type, id);

    // Prevent deletion of system-defined records
    if ('isSystemDefined' in existing && (existing as any).isSystemDefined) {
      throw new ValidationError('Cannot delete system-defined records', {
        _general: ['This is a system-defined record and cannot be deleted'],
      });
    }

    return await dataMaintenanceRepository.delete(type, id);
  }

  async updateDisplayOrder<T extends ReferenceDataType>(
    type: T,
    updates: { id: string; displayOrder: number }[]
  ) {
    // Verify all items exist
    for (const update of updates) {
      await this.getById(type, update.id);
    }

    return await dataMaintenanceRepository.updateDisplayOrder(type, updates);
  }

  async toggleStatus<T extends ReferenceDataType>(type: T, id: string) {
    const existing = await this.getById(type, id);
    const newStatus = (existing as any).status === 'active' ? 'inactive' : 'active';

    return await dataMaintenanceRepository.update(type, id, { status: newStatus } as UpdateInput<T>);
  }
}

export const dataMaintenanceService = new DataMaintenanceService();
