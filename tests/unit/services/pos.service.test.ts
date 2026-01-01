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
        findByReceiptNumber: vi.fn(),
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        deductStock: vi.fn(),
        getCurrentStockLevel: vi.fn(),
        convertToBaseUOM: vi.fn(),
    },
}));

vi.mock('@/services/sales-order.service', () => ({
    salesOrderService: {
        createSalesOrder: vi.fn(),
        markAsConverted: vi.fn(),
    },
}));

const mockTx = {
    inventory: { update: vi.fn() },
    stockMovement: { createMany: vi.fn() },
    customer: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(mockTx)),
    },
}));

vi.mock('@/services/company-settings.service', () => ({
    companySettingsService: {
        getSettings: vi.fn(),
    },
}));

vi.mock('@/services/ar.service', () => ({
    arService: {
        createAR: vi.fn(),
    },
}));

vi.mock('@/services/discount-expense.service', () => ({
    discountExpenseService: {
        createDiscountExpense: vi.fn(),
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

        it('should throw NotFoundError if sale not found', async () => {
            vi.mocked(posRepository.findById).mockResolvedValue(null);

            await expect(service.getSaleById('non-existent')).rejects.toThrow('POS Sale');
        });
    });

    describe('getTodaySummary', () => {
        it('should return today summary', async () => {
            const mockSummary = {
                totalSales: 1000,
                totalTransactions: 10,
                cashSales: 500,
                creditSales: 500,
            };

            vi.mocked(posRepository.getTodaySummary).mockResolvedValue(mockSummary as any);

            const result = await service.getTodaySummary();

            expect(result).toEqual(mockSummary);
        });

        it('should filter by branch', async () => {
            const mockSummary = { totalSales: 500 };
            vi.mocked(posRepository.getTodaySummary).mockResolvedValue(mockSummary as any);

            await service.getTodaySummary('branch-1');

            expect(posRepository.getTodaySummary).toHaveBeenCalledWith('branch-1');
        });
    });

    describe('generateReceiptNumber', () => {
        it('should generate first receipt of the day', async () => {
            vi.mocked(posRepository.findAll).mockResolvedValue([]);

            const result = await service.generateReceiptNumber();

            expect(result).toMatch(/^RCP-\d{8}-0001$/);
        });

        it('should increment sequence number', async () => {
            const existingSales = [
                { receiptNumber: 'RCP-20250101-0001' },
                { receiptNumber: 'RCP-20250101-0002' },
            ];
            vi.mocked(posRepository.findAll).mockResolvedValue(existingSales as any);

            const result = await service.generateReceiptNumber();

            expect(result).toMatch(/^RCP-\d{8}-0003$/);
        });
    });
});
