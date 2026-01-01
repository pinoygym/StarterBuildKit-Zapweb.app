import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataMaintenanceService } from '@/services/data-maintenance.service';
import { dataMaintenanceRepository } from '@/repositories/data-maintenance.repository';
import { ValidationError, NotFoundError } from '@/lib/api-error';
import type { CreateSalesAgentInput, UpdateSalesAgentInput } from '@/types/data-maintenance.types';

// Mock dependencies
vi.mock('@/repositories/data-maintenance.repository', () => ({
  dataMaintenanceRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    updateDisplayOrder: vi.fn(),
  },
}));

describe('DataMaintenanceService - Sales Agents', () => {
  let service: DataMaintenanceService;
  const type = 'sales-agents';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DataMaintenanceService();
  });

  describe('getAll', () => {
    it('should return all sales agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'John Doe',
          code: 'AG001',
          phone: '09171234567',
          email: 'john@example.com',
          status: 'active',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'agent-2',
          name: 'Jane Smith',
          code: 'AG002',
          phone: '09187654321',
          email: 'jane@example.com',
          status: 'active',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(dataMaintenanceRepository.findAll).mockResolvedValue(mockAgents);

      const result = await service.getAll(type);

      expect(dataMaintenanceRepository.findAll).toHaveBeenCalledWith(type, undefined);
      expect(result).toEqual(mockAgents);
      expect(result).toHaveLength(2);
    });

    it('should filter sales agents by status', async () => {
      const mockActiveAgents = [
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

      vi.mocked(dataMaintenanceRepository.findAll).mockResolvedValue(mockActiveAgents);

      const result = await service.getAll(type, { status: 'active' });

      expect(dataMaintenanceRepository.findAll).toHaveBeenCalledWith(type, { status: 'active' });
      expect(result).toEqual(mockActiveAgents);
    });

    it('should search sales agents by name', async () => {
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

      vi.mocked(dataMaintenanceRepository.findAll).mockResolvedValue(mockAgents);

      const result = await service.getAll(type, { search: 'John' });

      expect(dataMaintenanceRepository.findAll).toHaveBeenCalledWith(type, { search: 'John' });
      expect(result).toEqual(mockAgents);
    });
  });

  describe('getById', () => {
    it('should return sales agent if found', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'John Doe',
        code: 'AG001',
        phone: '09171234567',
        email: 'john@example.com',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(mockAgent);

      const result = await service.getById(type, 'agent-1');

      expect(dataMaintenanceRepository.findById).toHaveBeenCalledWith(type, 'agent-1');
      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundError if sales agent not found', async () => {
      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(null);

      await expect(service.getById(type, 'non-existent')).rejects.toThrow(NotFoundError);
      await expect(service.getById(type, 'non-existent')).rejects.toThrow('Sales Agent not found');
    });
  });

  describe('create', () => {
    it('should create a sales agent successfully', async () => {
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

      vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(null);
      vi.mocked(dataMaintenanceRepository.findByCode).mockResolvedValue(null);
      vi.mocked(dataMaintenanceRepository.create).mockResolvedValue(mockCreated);

      const result = await service.create(type, input);

      expect(dataMaintenanceRepository.findByName).toHaveBeenCalledWith(type, 'John Doe');
      expect(dataMaintenanceRepository.findByCode).toHaveBeenCalledWith(type, 'AG001');
      expect(dataMaintenanceRepository.create).toHaveBeenCalledWith(
        type,
        expect.objectContaining({
          name: 'John Doe',
          code: 'AG001',
        })
      );
      expect(result).toEqual(mockCreated);
    });

    it('should throw ValidationError if name is missing', async () => {
      const input = {
        code: 'AG001',
      } as CreateSalesAgentInput;

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if code is missing', async () => {
      const input = {
        name: 'John Doe',
      } as CreateSalesAgentInput;

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if code format is invalid', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'invalid code', // lowercase and spaces
      };

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if email format is invalid', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'AG001',
        email: 'invalid-email',
      };

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if phone format is invalid', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'AG001',
        phone: 'abc-invalid',
      };

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if name already exists', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'AG001',
      };

      const existingAgent = {
        id: 'agent-existing',
        name: 'John Doe',
        code: 'AG002',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(existingAgent);

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
      await expect(service.create(type, input)).rejects.toThrow('A record with this name already exists');
    });

    it('should throw ValidationError if code already exists', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'AG001',
      };

      const existingAgent = {
        id: 'agent-existing',
        name: 'Jane Smith',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(null);
      vi.mocked(dataMaintenanceRepository.findByCode).mockResolvedValue(existingAgent);

      await expect(service.create(type, input)).rejects.toThrow(ValidationError);
      await expect(service.create(type, input)).rejects.toThrow('A record with this code already exists');
    });

    it('should accept optional fields', async () => {
      const input: CreateSalesAgentInput = {
        name: 'John Doe',
        code: 'AG001',
        contactPerson: 'John Doe',
        phone: '09171234567',
        email: 'john@example.com',
      };

      const mockCreated = {
        id: 'agent-1',
        ...input,
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(null);
      vi.mocked(dataMaintenanceRepository.findByCode).mockResolvedValue(null);
      vi.mocked(dataMaintenanceRepository.create).mockResolvedValue(mockCreated);

      const result = await service.create(type, input);

      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('should update a sales agent successfully', async () => {
      const id = 'agent-1';
      const input: UpdateSalesAgentInput = {
        name: 'John Doe Updated',
        phone: '09199999999',
      };

      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        phone: '09171234567',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAgent = {
        ...existingAgent,
        ...input,
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(null);
      vi.mocked(dataMaintenanceRepository.update).mockResolvedValue(updatedAgent);

      const result = await service.update(type, id, input);

      expect(dataMaintenanceRepository.findById).toHaveBeenCalledWith(type, id);
      expect(dataMaintenanceRepository.update).toHaveBeenCalledWith(type, id, input);
      expect(result.name).toBe('John Doe Updated');
      expect(result.phone).toBe('09199999999');
    });

    it('should throw NotFoundError if agent does not exist', async () => {
      const input: UpdateSalesAgentInput = {
        name: 'Updated Name',
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(null);

      await expect(service.update(type, 'non-existent', input)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if new name already exists', async () => {
      const id = 'agent-1';
      const input: UpdateSalesAgentInput = {
        name: 'Existing Name',
      };

      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conflictingAgent = {
        id: 'agent-2',
        name: 'Existing Name',
        code: 'AG002',
        status: 'active',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(conflictingAgent);

      await expect(service.update(type, id, input)).rejects.toThrow(ValidationError);
      await expect(service.update(type, id, input)).rejects.toThrow('A record with this name already exists');
    });

    it('should throw ValidationError if new code already exists', async () => {
      const id = 'agent-1';
      const input: UpdateSalesAgentInput = {
        code: 'AG999',
      };

      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conflictingAgent = {
        id: 'agent-2',
        name: 'Jane Smith',
        code: 'AG999',
        status: 'active',
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.findByCode).mockResolvedValue(conflictingAgent);

      await expect(service.update(type, id, input)).rejects.toThrow(ValidationError);
      await expect(service.update(type, id, input)).rejects.toThrow('A record with this code already exists');
    });

    it('should allow updating with same name', async () => {
      const id = 'agent-1';
      const input: UpdateSalesAgentInput = {
        name: 'John Doe', // Same name
        phone: '09199999999',
      };

      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        phone: '09171234567',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAgent = {
        ...existingAgent,
        phone: '09199999999',
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.update).mockResolvedValue(updatedAgent);

      const result = await service.update(type, id, input);

      expect(result.phone).toBe('09199999999');
      expect(dataMaintenanceRepository.findByName).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a sales agent successfully', async () => {
      const id = 'agent-1';
      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.delete).mockResolvedValue(existingAgent);

      await service.delete(type, id);

      expect(dataMaintenanceRepository.findById).toHaveBeenCalledWith(type, id);
      expect(dataMaintenanceRepository.delete).toHaveBeenCalledWith(type, id);
    });

    it('should throw NotFoundError if agent does not exist', async () => {
      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(null);

      await expect(service.delete(type, 'non-existent')).rejects.toThrow(NotFoundError);
      expect(dataMaintenanceRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleStatus', () => {
    it('should toggle status from active to inactive', async () => {
      const id = 'agent-1';
      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        status: 'active',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAgent = {
        ...existingAgent,
        status: 'inactive',
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.update).mockResolvedValue(updatedAgent);

      const result = await service.toggleStatus(type, id);

      expect(dataMaintenanceRepository.update).toHaveBeenCalledWith(type, id, { status: 'inactive' });
      expect(result.status).toBe('inactive');
    });

    it('should toggle status from inactive to active', async () => {
      const id = 'agent-1';
      const existingAgent = {
        id,
        name: 'John Doe',
        code: 'AG001',
        status: 'inactive',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAgent = {
        ...existingAgent,
        status: 'active',
        updatedAt: new Date(),
      };

      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existingAgent);
      vi.mocked(dataMaintenanceRepository.update).mockResolvedValue(updatedAgent);

      const result = await service.toggleStatus(type, id);

      expect(dataMaintenanceRepository.update).toHaveBeenCalledWith(type, id, { status: 'active' });
      expect(result.status).toBe('active');
    });

    it('should throw NotFoundError if agent does not exist', async () => {
      vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(null);

      await expect(service.toggleStatus(type, 'non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateDisplayOrder', () => {
    it('should update display order for multiple agents', async () => {
      const updates = [
        { id: 'agent-1', displayOrder: 2 },
        { id: 'agent-2', displayOrder: 1 },
        { id: 'agent-3', displayOrder: 0 },
      ];

      const mockAgents = [
        { id: 'agent-1', name: 'Agent 1', code: 'AG001', status: 'active', displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'agent-2', name: 'Agent 2', code: 'AG002', status: 'active', displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 'agent-3', name: 'Agent 3', code: 'AG003', status: 'active', displayOrder: 2, createdAt: new Date(), updatedAt: new Date() },
      ];

      vi.mocked(dataMaintenanceRepository.findById)
        .mockResolvedValueOnce(mockAgents[0])
        .mockResolvedValueOnce(mockAgents[1])
        .mockResolvedValueOnce(mockAgents[2]);

      vi.mocked(dataMaintenanceRepository.updateDisplayOrder).mockResolvedValue(undefined);

      await service.updateDisplayOrder(type, updates);

      expect(dataMaintenanceRepository.findById).toHaveBeenCalledTimes(3);
      expect(dataMaintenanceRepository.updateDisplayOrder).toHaveBeenCalledWith(type, updates);
    });

    it('should throw NotFoundError if any agent does not exist', async () => {
      const updates = [
        { id: 'agent-1', displayOrder: 0 },
        { id: 'non-existent', displayOrder: 1 },
      ];

      vi.mocked(dataMaintenanceRepository.findById)
        .mockResolvedValueOnce({ id: 'agent-1', name: 'Agent 1', code: 'AG001', status: 'active', displayOrder: 0, createdAt: new Date(), updatedAt: new Date() })
        .mockResolvedValueOnce(null);

      await expect(service.updateDisplayOrder(type, updates)).rejects.toThrow(NotFoundError);
      expect(dataMaintenanceRepository.updateDisplayOrder).not.toHaveBeenCalled();
    });
  });
});
