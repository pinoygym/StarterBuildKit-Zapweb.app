import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POSService } from '@/services/pos.service';
import { posRepository } from '@/repositories/pos.repository';

// Mock dependencies
vi.mock('@/repositories/pos.repository', () => ({
    posRepository: {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        getTodaySummary: vi.fn(),
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        deductStock: vi.fn(),
        getCurrentStockLevel: vi.fn(),
    },
}));

vi.mock('@/services/sales-order.service', () => ({
    salesOrderService: {
        createSalesOrder: vi.fn(),
    },
}));

describe('POSService', () => {
    let service: POSService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new POSService();
    });

    describe('generateReceiptNumber', () => {
        it('should generate receipt number successfully', async () => {
            // Mock findAll to return empty array (no previous sales today)
            vi.mocked(posRepository.findAll).mockResolvedValue([]);

            const result = await service.generateReceiptNumber();

            expect(result).toMatch(/^RCP-\d{8}-\d{4}$/);
            expect(posRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('getAllSales', () => {
        it('should return all sales', async () => {
            const mockSales = [
                { id: 'sale-1', receiptNumber: 'RCP-001', totalAmount: 100 },
            ];

            vi.mocked(posRepository.findAll).mockResolvedValue(mockSales as any);

            const result = await service.getAllSales();

            expect(posRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockSales);
        });
    });

    describe('getSaleById', () => {
        it('should return sale by ID', async () => {
            const mockSale = { id: 'sale-1', receiptNumber: 'RCP-001', totalAmount: 100 };

            vi.mocked(posRepository.findById).mockResolvedValue(mockSale as any);

            const result = await service.getSaleById('sale-1');

            expect(posRepository.findById).toHaveBeenCalledWith('sale-1');
            expect(result).toEqual(mockSale);
        });
    });
});
