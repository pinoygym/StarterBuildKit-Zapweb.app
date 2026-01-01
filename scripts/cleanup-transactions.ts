import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting transaction data cleanup...');

    // Array of table names to clear, in order of dependency (child first)
    const tables = [
        'APPayment',
        'ARPayment',
        'AccountsPayable',
        'AccountsReceivable',
        'Expense',
        'DailySalesSummary',
        'EmployeePerformance',
        'POSSaleItem',
        'POSReceipt',
        'PromotionUsage',
        'CustomerPurchaseHistory',
        'POSSale',
        'SalesOrderItem',
        'SalesOrder',
        'ReceivingVoucherItem',
        'ReceivingVoucher',
        'PurchaseOrderItem',
        'PurchaseOrder',
        'StockMovement',
        'InventoryBatch',
        'AuditLog',
        'ReportExport',
    ];

    for (const table of tables) {
        try {
            // @ts-ignore - Dynamic access to prisma models
            const result = await prisma[table].deleteMany({});
            console.log(`Deleted ${result.count} records from ${table}`);
        } catch (error) {
            console.error(`Error deleting from ${table}:`, error);
        }
    }

    console.log('Cleanup completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
