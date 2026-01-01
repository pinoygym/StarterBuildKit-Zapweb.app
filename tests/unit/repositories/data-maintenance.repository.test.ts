import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataMaintenanceRepository } from '@/repositories/data-maintenance.repository';
import { prisma } from '@/lib/prisma';
import type { CreateSalesAgentInput, UpdateSalesAgentInput } from '@/types/data-maintenance.types';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    salesAgent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    productCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    expenseCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    paymentMethod: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    unitOfMeasure: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    expenseVendor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback: any) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      return callback(prisma);
    }),
  },
}));

describe('DataMaintenanceRepository - Sales Agents', () => {
  let repository: DataMaintenanceRepository;
  const type = 'sales-agents';

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new DataMaintenanceRepository();
  });

  describe('findAll', () => {
    it('should return all sales agents ordered by displayOrder and name', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent A',
          code: 'AG001',
          contactPerson: 'Contact A',
          phone: '09171234567',
          email: 'agenta@example.com',
          status: 'active',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'agent-2',
          name: 'Agent B',
          code: 'AG002',
          contactPerson: 'Contact B',
          phone: '09187654321',
          email: 'agentb@example.com',
          status: 'active',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.salesAgent.findMany).mockResolvedValue(mockAgents as any);

      const result = await repository.findAll(type);

      expect(prisma.salesAgent.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(mockAgents);
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockActiveAgents = [
        {
          id: 'agent-1',
          name: 'Active Agent',
          code: 'AG001',
          status: 'active',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.salesAgent.findMany).mockResolvedValue(mockActiveAgents as any);

      const result = await repository.findAll(type, { status: 'active' });

      expect(prisma.salesAgent.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(mockActiveAgents);
    });

    it('should filter by search term (case-insensitive)', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          code: 'AG001',
          status: 'active',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.salesAgent.findMany).mockResolvedValue(mockAgents as any);

      const result = await repository.findAll(type, { search: 'john' });

      expect(prisma.salesAgent.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'john',
            mode: 'insensitive',
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(mockAgents);
    });

    it('should filter by both status and search', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          code: 'AG001',
          status: 'active',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.salesAgent.findMany).mockResolvedValue(mockAgents as any);

      const result = await repository.findAll(type, { status: 'active', search: 'john' });

      expect(prisma.salesAgent.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          name: {
            contains: 'john',
            mode: 'insensitive',
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(mockAgents);
    });

    it('should return empty array if no agents found', async () => {
      vi.mocked(prisma.salesAgent.findMany).mockResolvedValue([]);

      const result = await repository.findAll(type);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return sales agent by id', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'John Doe',
        code: 'AG001',
        contactPerson: 'John Doe',
        phone: '09171234567',
        email: 'john@example.com',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.findUnique).mockResolvedValue(mockAgent as any);

      const result = await repository.findById(type, 'agent-1');

      expect(prisma.salesAgent.findUnique).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
      });
      expect(result).toEqual(mockAgent);
    });

    it('should return null if agent not found', async () => {
      vi.mocked(prisma.salesAgent.findUnique).mockResolvedValue(null);

      const result = await repository.findById(type, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return sales agent by code', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.findUnique).mockResolvedValue(mockAgent as any);

      const result = await repository.findByCode(type, 'AG001');

      expect(prisma.salesAgent.findUnique).toHaveBeenCalledWith({
        where: { code: 'AG001' },
      });
      expect(result).toEqual(mockAgent);
    });

    it('should return null if code not found', async () => {
      vi.mocked(prisma.salesAgent.findUnique).mockResolvedValue(null);

      const result = await repository.findByCode(type, 'NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return sales agent by name', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.findUnique).mockResolvedValue(mockAgent as any);

      const result = await repository.findByName(type, 'John Doe');

      expect(prisma.salesAgent.findUnique).toHaveBeenCalledWith({
        where: { name: 'John Doe' },
      });
      expect(result).toEqual(mockAgent);
    });

    it('should return null if name not found', async () => {
      vi.mocked(prisma.salesAgent.findUnique).mockResolvedValue(null);

      const result = await repository.findByName(type, 'Non Existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a sales agent', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'AG001',
        contactPerson: 'John Doe',
        phone: '09171234567',
        email: 'john@example.com',
        status: 'active',
        displayOrder: 0,
      };

      const mockCreated = {
        id: 'agent-1',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.create).mockResolvedValue(mockCreated as any);

      const result = await repository.create(type, input);

      expect(prisma.salesAgent.create).toHaveBeenCalledWith({
        data: input,
      });
      expect(result).toEqual(mockCreated);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.code).toBe('AG001');
    });

    it('should create agent with minimal required fields', async () => {
      const input: CreateSalesAgentInput = {
        name: 'Minimal Agent',
        code: 'AG999',
      };

      const mockCreated = {
        id: 'agent-2',
        ...input,
        contactPerson: null,
        phone: null,
        email: null,
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.create).mockResolvedValue(mockCreated as any);

      const result = await repository.create(type, input);

      expect(result.name).toBe('Minimal Agent');
      expect(result.code).toBe('AG999');
    });
  });

  describe('update', () => {
    it('should update a sales agent', async () => {
      const id = 'agent-1';
      const input: UpdateSalesAgentInput = {
        name: 'John Doe Updated',
        phone: '09199999999',
      };

      const mockUpdated = {
        id,
        name: 'John Doe Updated',
        code: 'AG001',
        contactPerson: 'John Doe',
        phone: '09199999999',
        email: 'john@example.com',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.update).mockResolvedValue(mockUpdated as any);

      const result = await repository.update(type, id, input);

      expect(prisma.salesAgent.update).toHaveBeenCalledWith({
        where: { id },
        data: input,
      });
      expect(result).toEqual(mockUpdated);
      expect(result.name).toBe('John Doe Updated');
      expect(result.phone).toBe('09199999999');
    });

    it('should update partial fields', async () => {
      const id = 'agent-1';
      const input: UpdateSalesAgentInput = {
        status: 'inactive',
      };

      const mockUpdated = {
        id,
        name: 'John Doe',
        code: 'AG001',
        contactPerson: 'John Doe',
        phone: '09171234567',
        email: 'john@example.com',
        status: 'inactive',
        displayOrder: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.update).mockResolvedValue(mockUpdated as any);

      const result = await repository.update(type, id, input);

      expect(result.status).toBe('inactive');
    });
  });

  describe('delete', () => {
    it('should delete a sales agent', async () => {
      const id = 'agent-1';
      const mockDeleted = {
        id,
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.salesAgent.delete).mockResolvedValue(mockDeleted as any);

      const result = await repository.delete(type, id);

      expect(prisma.salesAgent.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('count', () => {
    it('should count all sales agents', async () => {
      vi.mocked(prisma.salesAgent.count).mockResolvedValue(5);

      const result = await repository.count(type);

      expect(prisma.salesAgent.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(5);
    });

    it('should count with status filter', async () => {
      vi.mocked(prisma.salesAgent.count).mockResolvedValue(3);

      const result = await repository.count(type, { status: 'active' });

      expect(prisma.salesAgent.count).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
      expect(result).toBe(3);
    });

    it('should count with search filter', async () => {
      vi.mocked(prisma.salesAgent.count).mockResolvedValue(2);

      const result = await repository.count(type, { search: 'john' });

      expect(prisma.salesAgent.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'john',
            mode: 'insensitive',
          },
        },
      });
      expect(result).toBe(2);
    });

    it('should return 0 if no agents match filters', async () => {
      vi.mocked(prisma.salesAgent.count).mockResolvedValue(0);

      const result = await repository.count(type, { status: 'inactive' });

      expect(result).toBe(0);
    });
  });

  describe('updateDisplayOrder', () => {
    it('should update display order for multiple agents using transaction', async () => {
      const updates = [
        { id: 'agent-1', displayOrder: 2 },
        { id: 'agent-2', displayOrder: 1 },
        { id: 'agent-3', displayOrder: 0 },
      ];

      const mockUpdatedAgents = updates.map((update) => ({
        id: update.id,
        name: `Agent ${update.id}`,
        code: `AG00${update.id}`,
        status: 'active',
        displayOrder: update.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      vi.mocked(prisma.$transaction).mockResolvedValue(mockUpdatedAgents as any);

      await repository.updateDisplayOrder(type, updates);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
        ])
      );
    });

    it('should handle single display order update', async () => {
      const updates = [{ id: 'agent-1', displayOrder: 5 }];

      const mockUpdated = {
        id: 'agent-1',
        name: 'Agent 1',
        code: 'AG001',
        status: 'active',
        displayOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$transaction).mockResolvedValue([mockUpdated] as any);

      await repository.updateDisplayOrder(type, updates);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle empty updates array', async () => {
      const updates: { id: string; displayOrder: number }[] = [];

      vi.mocked(prisma.$transaction).mockResolvedValue([]);

      await repository.updateDisplayOrder(type, updates);

      expect(prisma.$transaction).toHaveBeenCalledWith([]);
    });
  });
});
