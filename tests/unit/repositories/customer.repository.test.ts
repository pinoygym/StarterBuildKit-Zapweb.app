import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerRepository } from '@/repositories/customer.repository';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        customer: {
            findMany: vi.fn(),
            count: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

describe('CustomerRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all customers without filters', async () => {
            const mockCustomers = [
                {
                    id: '1',
                    customerCode: 'CUST-00001',
                    companyName: 'ABC Corp',
                    contactPerson: 'John Doe',
                    email: 'john@abc.com',
                    _count: { SalesOrder: 5, AccountsReceivable: 2 },
                },
            ];

            vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);

            const result = await customerRepository.findAll();

            expect(result).toHaveLength(1);
            expect(result[0]._count).toEqual({ salesOrders: 5, arRecords: 2 });
        });

        it('should apply pagination', async () => {
            vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

            await customerRepository.findAll({}, { skip: 10, limit: 20 });

            expect(prisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 20,
                })
            );
        });

        it('should filter by status', async () => {
            vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

            await customerRepository.findAll({ status: 'active' });

            expect(prisma.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'active' },
                })
            );
        });

        it('should filter by search term', async () => {
            vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

            await customerRepository.findAll({ search: 'john' });

            expect(prisma.customer.findMany).toHaveBeenCalled();
        });
    });

    describe('count', () => {
        it('should count all customers', async () => {
            vi.mocked(prisma.customer.count).mockResolvedValue(25);

            const result = await customerRepository.count();

            expect(result).toBe(25);
        });

        it('should count with filters', async () => {
            vi.mocked(prisma.customer.count).mockResolvedValue(10);

            const result = await customerRepository.count({ status: 'active' });

            expect(result).toBe(10);
        });
    });

    describe('findById', () => {
        it('should return customer with relations', async () => {
            const mockCustomer = {
                id: '1',
                customerCode: 'CUST-00001',
                companyName: 'ABC Corp',
                _count: { SalesOrder: 5, AccountsReceivable: 2 },
            };

            vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.findById('1');

            expect(result).toBeDefined();
            expect(result?._count).toEqual({ salesOrders: 5, arRecords: 2 });
        });

        it('should return null for non-existent customer', async () => {
            vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

            const result = await customerRepository.findById('999');

            expect(result).toBeNull();
        });
    });

    describe('findByCustomerCode', () => {
        it('should return customer by code', async () => {
            const mockCustomer = {
                id: '1',
                customerCode: 'CUST-00001',
                companyName: 'ABC Corp',
            };

            vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.findByCustomerCode('CUST-00001');

            expect(result).toEqual(mockCustomer);
            expect(prisma.customer.findUnique).toHaveBeenCalledWith({
                where: { customerCode: 'CUST-00001' },
            });
        });
    });

    describe('findByEmail', () => {
        it('should return customer by email', async () => {
            const mockCustomer = {
                id: '1',
                email: 'john@example.com',
            };

            vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.findByEmail('john@example.com');

            expect(result).toEqual(mockCustomer);
            expect(prisma.customer.findFirst).toHaveBeenCalled();
        });
    });

    describe('findActive', () => {
        it('should return only active customers', async () => {
            const mockCustomers = [
                { id: '1', status: 'active', contactPerson: 'Alice' },
                { id: '2', status: 'active', contactPerson: 'Bob' },
            ];

            vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);

            const result = await customerRepository.findActive();

            expect(result).toHaveLength(2);
            expect(prisma.customer.findMany).toHaveBeenCalledWith({
                where: { status: 'active' },
                orderBy: { contactPerson: 'asc' },
            });
        });
    });

    describe('create', () => {
        it('should create customer with generated code', async () => {
            const mockCustomer = {
                id: '1',
                customerCode: 'CUST-00001',
                companyName: 'New Corp',
            };

            vi.mocked(prisma.customer.findFirst).mockResolvedValue(null); // No previous customers
            vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.create({
                companyName: 'New Corp',
                contactPerson: 'Jane Smith',
                email: 'jane@newcorp.com',
            });

            expect(result).toBeDefined();
            expect(prisma.customer.create).toHaveBeenCalled();
        });

        it('should create customer with provided code', async () => {
            const mockCustomer = {
                id: '1',
                customerCode: 'CUSTOM-001',
                companyName: 'Custom Corp',
            };

            vi.mocked(prisma.customer.create).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.create({
                customerCode: 'CUSTOM-001',
                companyName: 'Custom Corp',
                contactPerson: 'John Doe',
                email: 'john@custom.com',
            });

            expect(result).toBeDefined();
        });
    });

    describe('update', () => {
        it('should update customer details', async () => {
            const mockCustomer = {
                id: '1',
                companyName: 'Updated Corp',
            };

            vi.mocked(prisma.customer.update).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.update('1', {
                companyName: 'Updated Corp',
            });

            expect(result.companyName).toBe('Updated Corp');
            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    companyName: 'Updated Corp',
                }),
            });
        });
    });

    describe('softDelete', () => {
        it('should soft delete by setting status to inactive', async () => {
            const mockCustomer = { id: '1', status: 'inactive' };

            vi.mocked(prisma.customer.update).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.softDelete('1');

            expect(result.status).toBe('inactive');
            expect(prisma.customer.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { status: 'inactive' },
            });
        });
    });

    describe('delete', () => {
        it('should hard delete customer', async () => {
            const mockCustomer = { id: '1' };

            vi.mocked(prisma.customer.delete).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.delete('1');

            expect(result.id).toBe('1');
            expect(prisma.customer.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
    });

    describe('updateStatus', () => {
        it('should update customer status', async () => {
            const mockCustomer = { id: '1', status: 'active' };

            vi.mocked(prisma.customer.update).mockResolvedValue(mockCustomer as any);

            const result = await customerRepository.updateStatus('1', 'active');

            expect(result.status).toBe('active');
        });
    });

    describe('getNextCustomerCode', () => {
        it('should generate first code if no customers exist', async () => {
            vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

            const code = await customerRepository.getNextCustomerCode();

            expect(code).toBe('CUST-00001');
        });

        it('should increment last customerCode', async () => {
            vi.mocked(prisma.customer.findFirst).mockResolvedValue({
                customerCode: 'CUST-00005',
            } as any);

            const code = await customerRepository.getNextCustomerCode();

            expect(code).toBe('CUST-00006');
        });
    });
});
