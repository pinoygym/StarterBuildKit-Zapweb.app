import { Supplier } from '@prisma/client';
import { supplierRepository } from '@/repositories/supplier.repository';
import {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierFilters
} from '@/types/supplier.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { supplierSchema, updateSupplierSchema } from '@/lib/validations/supplier.validation';

export class SupplierService {
  async getAllSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
    console.log('[SupplierService] getAllSuppliers called with filters:', filters);
    try {
      const suppliers = await supplierRepository.findAll(filters);
      console.log(`[SupplierService] Found ${suppliers.length} suppliers`);
      return suppliers;
    } catch (error) {
      console.error('[SupplierService] Error in getAllSuppliers:', error);
      throw error;
    }
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

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
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

    return await supplierRepository.create(validationResult.data);
  }

  async updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {
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

    return await supplierRepository.update(id, validationResult.data);
  }

  async deleteSupplier(id: string): Promise<void> {
    // Check if supplier exists
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier');
    }

    // Perform soft delete (set status to inactive)
    await supplierRepository.softDelete(id);
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
