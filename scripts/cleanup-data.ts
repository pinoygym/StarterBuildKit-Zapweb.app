import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanupData() {
    console.log('Starting data cleanup...');

    try {
        // Level 5: Transaction Details / Items
        console.log('Deleting transaction items...');
        await prisma.pOSSaleItem.deleteMany({});
        await prisma.purchaseOrderItem.deleteMany({});
        await prisma.salesOrderItem.deleteMany({});
        await prisma.receivingVoucherItem.deleteMany({});
        await prisma.aPPayment.deleteMany({});
        await prisma.aRPayment.deleteMany({});
        console.log(' - Transaction items deleted.');

        // Level 4: Transactional Records & Supporting Data
        console.log('Deleting transactional records...');
        await prisma.pOSReceipt.deleteMany({});
        await prisma.promotionUsage.deleteMany({});
        await prisma.customerPurchaseHistory.deleteMany({});
        await prisma.stockMovement.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.dailySalesSummary.deleteMany({});
        await prisma.employeePerformance.deleteMany({});
        // We strictly delete inventory records as they are warehouse-dependent
        await prisma.inventory.deleteMany({});
        console.log(' - Transactional records deleted.');

        // Level 3: Transaction Headers
        console.log('Deleting transaction headers...');
        await prisma.pOSSale.deleteMany({});
        await prisma.receivingVoucher.deleteMany({}); // Must be before PO if there is a relation, usually PO -> RV but local key check... RV has purchaseOrderId.
        // RV has purchaseOrderId, so RV depends on PO. Deleting RV first is correct.
        await prisma.purchaseOrder.deleteMany({});
        await prisma.salesOrder.deleteMany({});
        await prisma.accountsPayable.deleteMany({});
        await prisma.accountsReceivable.deleteMany({});
        console.log(' - Transaction headers deleted.');

        // Level 2.5: User-Branch Access (Must be deleted before Branches/Users if constraints exist)
        // UserBranchAccess has branchId and userId.
        console.log('Deleting user branch access...');
        await prisma.userBranchAccess.deleteMany({});
        console.log(' - User branch access deleted.');

        // Level 2: Master Data Entities
        console.log('Deleting warehouses, customers, suppliers, products...');
        await prisma.warehouse.deleteMany({});
        await prisma.customer.deleteMany({});
        await prisma.supplier.deleteMany({});
        // SalesAgent is often linked to POSSale, delete if exists
        await prisma.salesAgent.deleteMany({});

        // Products and UOMs
        await prisma.productUOM.deleteMany({});
        await prisma.product.deleteMany({});
        console.log(' - Master data entities deleted.');

        // Level 1: Core Units
        console.log('Deleting branches...');
        // Note: Users have branchId often as nullable or relation.
        // If Users have branchId set, we might need to nullify it first if we want to keep users.
        // Check User model in schema: User -> Branch (branchId String?`)
        // So we can disconnect users from branches.

        console.log('Disconnecting users from branches...');
        await prisma.user.updateMany({
            data: { branchId: null },
        });

        await prisma.branch.deleteMany({});
        console.log(' - Branches deleted.');

        console.log('Data cleanup completed successfully.');

        // Verification
        console.log('\n--- Verification ---');
        const counts = {
            branches: await prisma.branch.count(),
            warehouses: await prisma.warehouse.count(),
            customers: await prisma.customer.count(),
            suppliers: await prisma.supplier.count(),
            transactions: (
                await prisma.purchaseOrder.count() +
                await prisma.salesOrder.count() +
                await prisma.pOSSale.count()
            ),
            users: await prisma.user.count(),
            products: await prisma.product.count(),
        };
        console.table(counts);

    } catch (error) {
        console.error('Error cleaning up data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupData();
