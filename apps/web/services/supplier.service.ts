import { Supplier } from '@prisma/client';
import { supplierRepository } from '@/repositories/supplier.repository';
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierFilters
} from '@/types/supplier.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { supplierSchema, updateSupplierSchema } from '@/lib/validations/supplier.validation';
import { auditService } from './audit.service';

export class SupplierService {
  async getAllSuppliers(filters?: SupplierFilters, options?: { skip?: number; limit?: number }): Promise<Supplier[]> {
    console.log('[SupplierService] getAllSuppliers called with filters:', filters);
    try {
      const suppliers = await supplierRepository.findAll(filters, {
        skip: options?.skip,
        take: options?.limit
      });
      console.log(`[SupplierService] Found ${suppliers.length} suppliers`);
      return suppliers;
    } catch (error) {
      console.error('[SupplierService] Error in getAllSuppliers:', error);
      throw error;
    }
  }

  async getSupplierCount(filters?: SupplierFilters): Promise<number> {
    return await supplierRepository.count(filters);
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier');
    }
    return supplier;
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return await supplierRepository.findActive();
  }

  async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await supplierRepository.findAll();
    }
    return await supplierRepository.searchByCompanyName(searchTerm.trim());
  }

  async createSupplier(data: CreateSupplierInput, userId?: string): Promise<Supplier> {
    // Validate input
    const validationResult = supplierSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid supplier data', errors as Record<string, string>);
    }

    // Check if supplier company name already exists
    const existingSupplier = await supplierRepository.findByCompanyName(data.companyName);
    if (existingSupplier) {
      throw new ValidationError('Supplier company name already exists', {
        companyName: 'Company name must be unique'
      });
    }

    const supplier = await supplierRepository.create({ ...validationResult.data, createdById: userId });

    // Log the action
    await auditService.log({
      userId,
      action: 'CREATE',
      resource: 'SUPPLIER',
      resourceId: supplier.id,
      details: { companyName: supplier.companyName }
    });

    return supplier;
  }

  async updateSupplier(id: string, data: UpdateSupplierInput, userId?: string): Promise<Supplier> {
    // Check if supplier exists
    const existingSupplier = await supplierRepository.findById(id);
    if (!existingSupplier) {
      throw new NotFoundError('Supplier');
    }

    // Validate input
    const validationResult = updateSupplierSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid supplier data', errors as Record<string, string>);
    }

    // Check if company name is being updated and if it already exists
    if (data.companyName && data.companyName !== existingSupplier.companyName) {
      const supplierWithName = await supplierRepository.findByCompanyName(data.companyName);
      if (supplierWithName) {
        throw new ValidationError('Supplier company name already exists', {
          companyName: 'Company name must be unique'
        });
      }
    }

    const supplier = await supplierRepository.update(id, { ...validationResult.data, updatedById: userId });

    // Log the action
    await auditService.log({
      userId,
      action: 'UPDATE',
      resource: 'SUPPLIER',
      resourceId: id,
      details: { changedFields: Object.keys(data) }
    });

    return supplier;
  }

  async deleteSupplier(id: string, userId?: string): Promise<void> {
    // Check if supplier exists
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier');
    }

    // Perform soft delete (set status to inactive)
    await supplierRepository.softDelete(id);

    // Log the action
    await auditService.log({
      userId,
      action: 'DELETE',
      resource: 'SUPPLIER',
      resourceId: id,
      details: { companyName: supplier.companyName, status: 'inactive' }
    });
  }

  async toggleSupplierStatus(id: string): Promise<Supplier> {
    const supplier = await this.getSupplierById(id);
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
    return await supplierRepository.updateStatus(id, newStatus);
  }

  /**
   * Validate that a supplier is active before using in transactions
   */
  async validateSupplierActive(id: string): Promise<void> {
    const supplier = await this.getSupplierById(id);
    if (supplier.status !== 'active') {
      throw new ValidationError('Supplier is not active', {
        supplierId: 'Only active suppliers can be used in transactions'
      });
    }
  }
}

export const supplierService = new SupplierService();
