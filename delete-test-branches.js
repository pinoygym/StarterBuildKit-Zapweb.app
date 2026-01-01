
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Find branches to delete
    const branches = await prisma.branch.findMany({
        where: {
            OR: [
                { name: { startsWith: 'Test Branch' } },
                { code: { startsWith: 'TB' } }
            ]
        }
    });

    console.log(`Found ${branches.length} branches to delete.`);

    for (const branch of branches) {
        console.log(`Deleting branch: [${branch.code}] ${branch.name} (ID: ${branch.id})...`);
        const branchId = branch.id;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. ReceivingVoucher & Items
                // ReceivingVoucherItem cascades on ReceivingVoucher delete
                await tx.receivingVoucher.deleteMany({ where: { branchId } });

                // 2. PurchaseOrder & Items
                // PurchaseOrderItem cascades on PurchaseOrder delete
                await tx.purchaseOrder.deleteMany({ where: { branchId } });

                // 3. SalesOrder & Items
                // SalesOrderItem cascades on SalesOrder delete
                await tx.salesOrder.deleteMany({ where: { branchId } });

                // 4. AccountsPayable & Payments
                // APPayment cascades on AccountsPayable delete
                await tx.accountsPayable.deleteMany({ where: { branchId } });

                // 5. AccountsReceivable & Payments
                // ARPayment cascades on AccountsReceivable delete
                await tx.accountsReceivable.deleteMany({ where: { branchId } });

                // 6. DailySalesSummary
                await tx.dailySalesSummary.deleteMany({ where: { branchId } });

                // 7. Warehouse & Inventory
                const warehouses = await tx.warehouse.findMany({ where: { branchId } });
                const warehouseIds = warehouses.map(w => w.id);

                if (warehouseIds.length > 0) {
                    const batches = await tx.inventoryBatch.findMany({ where: { warehouseId: { in: warehouseIds } } });
                    const batchIds = batches.map(b => b.id);

                    if (batchIds.length > 0) {
                        // StockMovement depends on InventoryBatch
                        await tx.stockMovement.deleteMany({ where: { batchId: { in: batchIds } } });
                        // InventoryBatch depends on Warehouse
                        await tx.inventoryBatch.deleteMany({ where: { id: { in: batchIds } } });
                    }
                    // Warehouse depends on Branch
                    await tx.warehouse.deleteMany({ where: { id: { in: warehouseIds } } });
                }

                // 8. POSSale
                // POSSaleItem, POSReceipt, CustomerPurchaseHistory, PromotionUsage cascade on POSSale delete
                await tx.pOSSale.deleteMany({ where: { branchId } });

                // 9. User (unlink)
                await tx.user.updateMany({
                    where: { branchId },
                    data: { branchId: null }
                });

                // 10. Delete the Branch itself
                // Cascades: UserBranchAccess, EmployeePerformance, Expense, POSReceipt (if any), PromotionUsage (if any), CustomerPurchaseHistory (if any)
                await tx.branch.delete({ where: { id: branchId } });
            });
            console.log(`Successfully deleted branch: ${branch.code}`);
        } catch (error) {
            console.error(`Failed to delete branch ${branch.code}:`, error);
        }
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
