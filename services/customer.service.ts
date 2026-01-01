import { Customer } from '@prisma/client';
import { customerRepository } from '@/repositories/customer.repository';
import { 
  CreateCustomerInput, 
  UpdateCustomerInput, 
  CustomerFilters,
  CustomerWithRelations,
  CustomerStats
} from '@/types/customer.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { customerSchema, updateCustomerSchema } from '@/lib/validations/customer.validation';

export class CustomerService {
  async getAllCustomers(filters?: CustomerFilters): Promise<CustomerWithRelations[]> {
    return await customerRepository.findAll(filters);
  }

  async getCustomerById(id: string): Promise<CustomerWithRelations> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer');
    }
    return customer;
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return await customerRepository.findActive();
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await customerRepository.findAll();
    }
    return await customerRepository.search(searchTerm.trim());
  }

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    // Validate input
    const validationResult = customerSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid customer data', errors as Record<string, string>);
    }

    // Check if email already exists
    const existingCustomer = await customerRepository.findByEmail(data.email);
    if (existingCustomer) {
      throw new ValidationError('Customer email already exists', { 
        email: 'Email must be unique' 
      });
    }

    // Generate customer code if not provided
    let customerCode = data.customerCode;
    if (!customerCode) {
      customerCode = await customerRepository.getNextCustomerCode();
    } else {
      // Check if customer code already exists
      const existingCode = await customerRepository.findByCustomerCode(customerCode);
      if (existingCode) {
        throw new ValidationError('Customer code already exists', { 
          customerCode: 'Customer code must be unique' 
        });
      }
    }

    return await customerRepository.create({
      ...validationResult.data,
      customerCode,
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    // Check if customer exists
    const existingCustomer = await customerRepository.findById(id);
    if (!existingCustomer) {
      throw new NotFoundError('Customer');
    }

    // Validate input
    const validationResult = updateCustomerSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid customer data', errors as Record<string, string>);
    }

    // Check if email is being updated and if it already exists
    if (data.email && data.email !== existingCustomer.email) {
      const customerWithEmail = await customerRepository.findByEmail(data.email);
      if (customerWithEmail) {
        throw new ValidationError('Customer email already exists', { 
          email: 'Email must be unique' 
        });
      }
    }

    return await customerRepository.update(id, validationResult.data);
  }

  async deleteCustomer(id: string): Promise<void> {
    // Check if customer exists
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer');
    }

    // Check if customer has associated records
    if (customer._count && (customer._count.salesOrders || 0) > 0) {
      throw new ValidationError('Cannot delete customer with existing sales orders', {
        customer: 'Please delete or reassign sales orders first'
      });
    }

    if (customer._count && (customer._count.arRecords || 0) > 0) {
      throw new ValidationError('Cannot delete customer with outstanding receivables', {
        customer: 'Please settle all receivables first'
      });
    }

    // Perform soft delete (set status to inactive)
    await customerRepository.softDelete(id);
  }

  async toggleCustomerStatus(id: string): Promise<Customer> {
    const customer = await this.getCustomerById(id);
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    return await customerRepository.updateStatus(id, newStatus);
  }

  async getCustomerStats(id: string): Promise<CustomerStats> {
    // Verify customer exists
    await this.getCustomerById(id);
    return await customerRepository.getCustomerStats(id);
  }

  /**
   * Validate that a customer is active before using in transactions
   */
  async validateCustomerActive(id: string): Promise<void> {
    const customer = await this.getCustomerById(id);
    if (customer.status !== 'active') {
      throw new ValidationError('Customer is not active', {
        customerId: 'Only active customers can be used in transactions'
      });
    }
  }

  /**
   * Check if customer has available credit limit
   */
  async checkCreditLimit(id: string, requestedAmount: number): Promise<boolean> {
    const customer = await this.getCustomerById(id);
    
    // If no credit limit set, allow transaction
    if (!customer.creditLimit) {
      return true;
    }

    const stats = await this.getCustomerStats(id);
    const availableCredit = Number(customer.creditLimit) - stats.outstandingBalance;
    
    return availableCredit >= requestedAmount;
  }
}

export const customerService = new CustomerService();
