import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataMaintenanceService } from '@/services/data-maintenance.service';
import { dataMaintenanceRepository } from '@/repositories/data-maintenance.repository';
import { ReferenceDataType } from '@/types/data-maintenance.types';

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

const TEST_CASES: { type: ReferenceDataType; input: any }[] = [
    {
        type: 'product-categories',
        input: { name: 'Test Category', code: 'TEST_CAT', description: 'Test Description' },
    },
    {
        type: 'expense-categories',
        input: { name: 'Test Expense', code: 'TEST_EXP', description: '' }, // Empty description
    },
    {
        type: 'payment-methods',
        input: { name: 'Test Payment', code: 'TEST_PAY', applicableTo: ['pos', 'expense'] },
    },
    {
        type: 'units-of-measure',
        input: { name: 'Test UOM', code: 'TEST_UOM', description: null }, // Null description
    },
    {
        type: 'expense-vendors',
        input: { name: 'Test Vendor', contactPerson: 'John', phone: '123', email: 'test@test.com' },
    },
    {
        type: 'sales-agents',
        input: { name: 'Test Agent', code: 'TEST_AGT', contactPerson: '', phone: null, email: undefined },
    },
];

describe('DataMaintenanceService - All Types', () => {
    let service: DataMaintenanceService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DataMaintenanceService();
    });

    TEST_CASES.forEach(({ type, input }) => {
        describe(`Type: ${type}`, () => {
            it('should create successfully with valid input', async () => {
                const mockCreated = {
                    id: 'test-id',
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
                expect(dataMaintenanceRepository.create).toHaveBeenCalledWith(type, expect.objectContaining(input));
            });

            it('should update successfully', async () => {
                const id = 'test-id';
                const updateInput = { ...input, name: input.name + ' Updated' };

                const existing = {
                    id,
                    ...input,
                    status: 'active',
                    displayOrder: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const updated = {
                    ...existing,
                    ...updateInput,
                    updatedAt: new Date(),
                };

                vi.mocked(dataMaintenanceRepository.findById).mockResolvedValue(existing);
                vi.mocked(dataMaintenanceRepository.findByName).mockResolvedValue(null);
                vi.mocked(dataMaintenanceRepository.update).mockResolvedValue(updated);

                const result = await service.update(type, id, updateInput);

                expect(result).toEqual(updated);
                expect(dataMaintenanceRepository.update).toHaveBeenCalledWith(type, id, expect.objectContaining(updateInput));
            });
        });
    });
});
