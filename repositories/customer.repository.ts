import { prisma } from '@/lib/prisma';
import { Customer } from '@prisma/client';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
  CustomerWithRelations
} from '@/types/customer.types';
import { randomUUID } from 'crypto';
import { withErrorHandling } from '@/lib/errors';

export class CustomerRepository {
  async findAll(filters?: CustomerFilters): Promise<CustomerWithRelations[]> {
    return withErrorHandling(async () => {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.customerType) {
        where.customerType = filters.customerType;
      }

      if (filters?.search) {
        where.OR = [
          { customerCode: { contains: filters.search } },
          { companyName: { contains: filters.search } },
          { contactPerson: { contains: filters.search } },
          { email: { contains: filters.search } },
          { phone: { contains: filters.search } },
        ];
      }

      const rows = await prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              SalesOrder: true,
              AccountsReceivable: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((c: any) => ({
        ...c,
        _count: c._count
          ? { salesOrders: c._count.SalesOrder || 0, arRecords: c._count.AccountsReceivable || 0 }
          : undefined,
      }));
    }, 'CustomerRepository.findAll');
  }

  async findById(id: string): Promise<CustomerWithRelations | null> {
    return withErrorHandling(async () => {
      const row = await prisma.customer.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              SalesOrder: true,
              AccountsReceivable: true,
            },
          },
        },
      });
      if (!row) return null;
      return {
        ...row,
        _count: row._count
          ? { salesOrders: (row as any)._count.SalesOrder || 0, arRecords: (row as any)._count.AccountsReceivable || 0 }
          : undefined,
      } as any;
    }, 'CustomerRepository.findById');
  }

  async findByCustomerCode(customerCode: string): Promise<Customer | null> {
    return withErrorHandling(async () => {
      return await prisma.customer.findUnique({
        where: { customerCode },
      });
    }, 'CustomerRepository.findByCustomerCode');
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return withErrorHandling(async () => {
      return await prisma.customer.findFirst({
        where: {
          email: {
            equals: email,
          }
        },
      });
    }, 'CustomerRepository.findByEmail');
  }

  async findActive(): Promise<Customer[]> {
    return withErrorHandling(async () => {
      return await prisma.customer.findMany({
        where: { status: 'active' },
        orderBy: { contactPerson: 'asc' },
      });
    }, 'CustomerRepository.findActive');
  }

  async search(searchTerm: string): Promise<Customer[]> {
    return withErrorHandling(async () => {
      return await prisma.customer.findMany({
        where: {
          OR: [
            { customerCode: { contains: searchTerm } },
            { companyName: { contains: searchTerm } },
            { contactPerson: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
          ],
        },
        orderBy: { contactPerson: 'asc' },
      });
    }, 'CustomerRepository.search');
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    return withErrorHandling(async () => {
      const customerCode = data.customerCode || await this.getNextCustomerCode();

      return await prisma.customer.create({
        data: {
          id: randomUUID(),
          ...data,
          customerCode,
          creditLimit: data.creditLimit ? data.creditLimit : undefined,
          status: data.status || 'active',
          updatedAt: new Date(),
        },
      });
    }, 'CustomerRepository.create');
  }

  async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
    return withErrorHandling(async () => {
      return await prisma.customer.update({
        where: { id },
        data: {
          ...data,
          creditLimit: data.creditLimit !== undefined ? data.creditLimit : undefined,
        },
      });
    }, 'CustomerRepository.update');
  }

  async softDelete(id: string): Promise<Customer> {
    return withErrorHandling(async () => {
      return await prisma.customer.update({
        where: { id },
        data: { status: 'inactive' },
      });
    }, 'CustomerRepository.softDelete');
  }

  async delete(id: string): Promise<Customer> {
    return withErrorHandling(async () => {
      return await prisma.customer.delete({
        where: { id },
      });
    }, 'CustomerRepository.delete');
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Customer> {
    return withErrorHandling(async () => {
      return await prisma.customer.update({
        where: { id },
        data: { status },
      });
    }, 'CustomerRepository.updateStatus');
  }

  async getNextCustomerCode(): Promise<string> {
    return withErrorHandling(async () => {
      const lastCustomer = await prisma.customer.findFirst({
        where: {
          customerCode: {
            startsWith: 'CUST-',
          },
        },
        orderBy: {
          customerCode: 'desc',
        },
      });

      if (!lastCustomer) {
        return 'CUST-00001';
      }

      const lastNumber = parseInt(lastCustomer.customerCode.split('-')[1]);
      const nextNumber = lastNumber + 1;
      return `CUST-${nextNumber.toString().padStart(5, '0')}`;
    }, 'CustomerRepository.getNextCustomerCode');
  }

  async getCustomerStats(customerId: string) {
    return withErrorHandling(async () => {
      const [salesOrders, arRecords] = await Promise.all([
        prisma.salesOrder.findMany({
          where: { customerId },
          select: {
            totalAmount: true,
            createdAt: true,
          },
        }),
        prisma.accountsReceivable.findMany({
          where: {
            customerId,
            status: 'pending',
          },
          select: {
            balance: true,
          },
        }),
      ]);

      const totalOrders = salesOrders.length;
      const totalRevenue = salesOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );
      const outstandingBalance = arRecords.reduce(
        (sum, ar) => sum + Number(ar.balance),
        0
      );
      const lastOrderDate = salesOrders.length > 0
        ? salesOrders[0].createdAt
        : undefined;

      return {
        totalOrders,
        totalRevenue,
        outstandingBalance,
        lastOrderDate,
      };
    }, 'CustomerRepository.getCustomerStats');
  }
}

export const customerRepository = new CustomerRepository();
