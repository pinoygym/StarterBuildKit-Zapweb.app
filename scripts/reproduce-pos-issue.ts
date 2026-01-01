
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posService } from '@/services/pos.service';
import { prisma } from '@/lib/prisma';
import { inventoryService } from '@/services/inventory.service';
import { posRepository } from '@/repositories/pos.repository';
import { companySettingsService } from '@/services/company-settings.service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
        inventoryBatch: {
            update: vi.fn(),
        },
        stockMovement: {
            createMany: vi.fn(),
        },
        customer: {
            findUnique: vi.fn(),
        }
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        convertToBaseUOM: vi.fn(),
    },
}));

vi.mock('@/repositories/pos.repository', () => ({
    posRepository: {
        findByReceiptNumber: vi.fn(),
        create: vi.fn(),
        findAll: vi.fn(),
        getTodaySummary: vi.fn(),
        findById: vi.fn(),
    },
}));

vi.mock('@/services/company-settings.service', () => ({
    companySettingsService: {
        getSettings: vi.fn(),
    },
}));

vi.mock('@/services/discount-expense.service', () => ({
    discountExpenseService: {
        createDiscountExpense: vi.fn(),
    }
}));

vi.mock('@/services/sales-order.service', () => ({
    salesOrderService: {
        markAsConverted: vi.fn(),
    }
}));

vi.mock('@/services/ar.service', () => ({
    arService: {
        createAR: vi.fn(),
    }
}));


describe('POSService - Inventory Update Reproduction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly deduct inventory for multiple line items of the same product', async () => {
        // Setup
        const productId = 'prod-1';
        const warehouseId = 'wh-1';
        const batchId = 'batch-1';

        // Product with 10 items in stock in one batch
        const mockProduct = {
            id: productId,
            name: 'Test Product',
            InventoryBatch: [
                {
                    id: batchId,
                    quantity: 10,
                    unitCost: 10,
                    warehouseId: warehouseId,
                    status: 'active',
                },
            ],
        };

        // Mock responses
        (prisma.product.findMany as any).mockResolvedValue([mockProduct]);
        (inventoryService.convertToBaseUOM as any).mockImplementation((pid, qty) => Promise.resolve(qty)); // Assume 1:1 conversion
        (posRepository.findByReceiptNumber as any).mockResolvedValue(null);
        (companySettingsService.getSettings as any).mockResolvedValue({ vatRate: 12 });
        (posRepository.create as any).mockResolvedValue({ id: 'sale-1' });

        // Input: Buy 6 items, then buy another 6 items (Total 12)
        // Available: 10.
        // Should fail with InsufficientStockError or similar, OR if it passes, check the batch updates.

        const input = {
            branchId: 'branch-1',
            warehouseId: warehouseId,
            items: [
                { productId, quantity: 6, uom: 'pcs', unitPrice: 100 },
                { productId, quantity: 6, uom: 'pcs', unitPrice: 100 },
            ],
            paymentMethod: 'cash',
            amountReceived: 2000,
            totalAmount: 1200,
        };

        // Execute
        try {
            await posService.processSale(input as any);
        } catch (e: any) {
            console.log('Caught error:', e);
        }

        // Verification
        // Check how many times inventoryBatch.update was called and with what values
        const updateCalls = (prisma.inventoryBatch.update as any).mock.calls;
        console.log('Update calls:', JSON.stringify(updateCalls, null, 2));

        // Expectation: If bug exists, we see update with negative quantity or weird values.
        // If fixed, we shouldn't reach here or updates should be correct (if we had enough stock).
        // In this case (12 > 10), it SHOULD fail.
    });
});
