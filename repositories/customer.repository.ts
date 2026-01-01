import { prisma } from '@/lib/prisma';
import { Customer } from '@prisma/client';
import { 
  CreateCustomerInput, 
  UpdateCustomerInput, 
  CustomerFilters,
  CustomerWithRelations 
} from '@/types/customer.types';

export class CustomerRepository {
  async findAll(filters?: CustomerFilters): Promise<CustomerWithRelations[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerType) {
      where.customerType = filters.customerType;
    }

    if (filters?.search) {
      where.OR = [
        { customerCode: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
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
  }

  async findById(id: string): Promise<CustomerWithRelations | null> {
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
  }

  async findByCustomerCode(customerCode: string): Promise<Customer | null> {
    return await prisma.customer.findUnique({
      where: { customerCode },
    });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return await prisma.customer.findFirst({
      where: { 
        email: {
          equals: email,
          mode: 'insensitive',
        }
      },
    });
  }

  async findActive(): Promise<Customer[]> {
    return await prisma.customer.findMany({
      where: { status: 'active' },
      orderBy: { contactPerson: 'asc' },
    });
  }

  async search(searchTerm: string): Promise<Customer[]> {
    return await prisma.customer.findMany({
      where: {
        OR: [
          { customerCode: { contains: searchTerm, mode: 'insensitive' } },
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
        ],
      },
      orderBy: { contactPerson: 'asc' },
    });
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    return await prisma.customer.create({
      data: {
        ...data,
        creditLimit: data.creditLimit ? data.creditLimit : undefined,
        status: data.status || 'active',
      },
    });
  }

  async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
    return await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        creditLimit: data.creditLimit !== undefined ? data.creditLimit : undefined,
      },
    });
  }

  async softDelete(id: string): Promise<Customer> {
    return await prisma.customer.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  async delete(id: string): Promise<Customer> {
    return await prisma.customer.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Customer> {
    return await prisma.customer.update({
      where: { id },
      data: { status },
    });
  }

  async getNextCustomerCode(): Promise<string> {
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
  }

  async getCustomerStats(customerId: string) {
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
  }
}

export const customerRepository = new CustomerRepository();
