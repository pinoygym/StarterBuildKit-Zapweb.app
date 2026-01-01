import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying transaction data cleanup...');

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

    let hasError = false;

    for (const table of tables) {
        try {
            // @ts-ignore
            const count = await prisma[table].count();
            if (count > 0) {
                console.error(`FAILURE: ${table} still has ${count} records.`);
                hasError = true;
            } else {
                console.log(`SUCCESS: ${table} is empty.`);
            }
        } catch (error) {
            console.error(`Error checking ${table}:`, error);
            hasError = true;
        }
    }

    if (hasError) {
        console.error('Verification FAILED.');
        process.exit(1);
    } else {
        console.log('Verification PASSED. All transaction tables are empty.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
