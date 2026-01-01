import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface BackupData {
    version: string;
    timestamp: string;
    data: {
        branches: any[];
        warehouses: any[];
        roles: any[];
        permissions: any[];
        rolePermissions: any[];
        users: any[];
        userBranchAccess: any[];
        productCategories: any[];
        unitOfMeasures: any[];
        expenseCategories: any[];
        expenseVendors: any[];
        paymentMethods: any[];
        suppliers: any[];
        customers: any[];
        salesAgents: any[];
        products: any[];
        productUOMs: any[];
        inventory: any[];
        stockMovements: any[];
        purchaseOrders: any[];
        purchaseOrderItems: any[];
        receivingVouchers: any[];
        receivingVoucherItems: any[];
        salesOrders: any[];
        salesOrderItems: any[];
        posSales: any[];
        posSaleItems: any[];
        posReceipts: any[];
        promotionUsages: any[];
        customerPurchaseHistories: any[];
        accountsPayables: any[];
        apPayments: any[];
        accountsReceivables: any[];
        arPayments: any[];
        expenses: any[];
        employeePerformances: any[];
        dailySalesSummaries: any[];
        auditLogs: any[];
        sessions: any[];
        passwordResetTokens: any[];
        reportExports: any[];
        reportTemplates: any[];
        companySettings: any[];
        fundSources: any[];
        fundTransactions: any[];
        fundTransfers: any[];
        inventoryAdjustments: any[];
        inventoryAdjustmentItems: any[];
        jobOrders: any[];
        jobComments: any[];
        jobImages: any[];
        jobPerformed: any[];
        partsReplacements: any[];
        roadmapItems: any[];
        roadmapComments: any[];
        approvalRequests: any[];
        notifications: any[];
    };
}

export class BackupService {
    static async createBackup(): Promise<BackupData> {
        const [
            branches,
            warehouses,
            roles,
            permissions,
            rolePermissions,
            users,
            userBranchAccess,
            productCategories,
            unitOfMeasures,
            expenseCategories,
            expenseVendors,
            paymentMethods,
            suppliers,
            customers,
            salesAgents,
            products,
            productUOMs,
            inventory,
            stockMovements,
            purchaseOrders,
            purchaseOrderItems,
            receivingVouchers,
            receivingVoucherItems,
            salesOrders,
            salesOrderItems,
            posSales,
            posSaleItems,
            posReceipts,
            promotionUsages,
            customerPurchaseHistories,
            accountsPayables,
            apPayments,
            accountsReceivables,
            arPayments,
            expenses,
            employeePerformances,
            dailySalesSummaries,
            auditLogs,
            sessions,
            passwordResetTokens,
            reportExports,
            reportTemplates,
            companySettings,
            fundSources,
            fundTransactions,
            fundTransfers,
            inventoryAdjustments,
            inventoryAdjustmentItems,
            jobOrders,
            jobComments,
            jobImages,
            jobPerformed,
            partsReplacements,
            roadmapItems,
            roadmapComments,
            approvalRequests,
            notifications,
        ] = await Promise.all([
            prisma.branch.findMany(),
            prisma.warehouse.findMany(),
            prisma.role.findMany(),
            prisma.permission.findMany(),
            prisma.rolePermission.findMany(),
            prisma.user.findMany(),
            prisma.userBranchAccess.findMany(),
            prisma.productCategory.findMany(),
            prisma.unitOfMeasure.findMany(),
            prisma.expenseCategory.findMany(),
            prisma.expenseVendor.findMany(),
            prisma.paymentMethod.findMany(),
            prisma.supplier.findMany(),
            prisma.customer.findMany(),
            prisma.salesAgent.findMany(),
            prisma.product.findMany(),
            prisma.productUOM.findMany(),
            prisma.inventory.findMany(),
            prisma.stockMovement.findMany(),
            prisma.purchaseOrder.findMany(),
            prisma.purchaseOrderItem.findMany(),
            prisma.receivingVoucher.findMany(),
            prisma.receivingVoucherItem.findMany(),
            prisma.salesOrder.findMany(),
            prisma.salesOrderItem.findMany(),
            prisma.pOSSale.findMany(),
            prisma.pOSSaleItem.findMany(),
            prisma.pOSReceipt.findMany(),
            prisma.promotionUsage.findMany(),
            prisma.customerPurchaseHistory.findMany(),
            prisma.accountsPayable.findMany(),
            prisma.aPPayment.findMany(),
            prisma.accountsReceivable.findMany(),
            prisma.aRPayment.findMany(),
            prisma.expense.findMany(),
            prisma.employeePerformance.findMany(),
            prisma.dailySalesSummary.findMany(),
            prisma.auditLog.findMany(),
            prisma.session.findMany(),
            prisma.passwordResetToken.findMany(),
            prisma.reportExport.findMany(),
            prisma.reportTemplate.findMany(),
            prisma.companySettings.findMany(),
            prisma.fundSource.findMany(),
            prisma.fundTransaction.findMany(),
            prisma.fundTransfer.findMany(),
            prisma.inventoryAdjustment.findMany(),
            prisma.inventoryAdjustmentItem.findMany(),
            prisma.jobOrder.findMany(),
            prisma.jobComment.findMany(),
            prisma.jobImage.findMany(),
            prisma.jobPerformed.findMany(),
            prisma.partsReplacement.findMany(),
            prisma.roadmapItem.findMany(),
            prisma.roadmapComment.findMany(),
            prisma.approvalRequest.findMany(),
            prisma.notification.findMany(),
        ]);

        return {
            version: '1.1',
            timestamp: new Date().toISOString(),
            data: {
                branches,
                warehouses,
                roles,
                permissions,
                rolePermissions,
                users,
                userBranchAccess,
                productCategories,
                unitOfMeasures,
                expenseCategories,
                expenseVendors,
                paymentMethods,
                suppliers,
                customers,
                salesAgents,
                products,
                productUOMs,
                inventory,
                stockMovements,
                purchaseOrders,
                purchaseOrderItems,
                receivingVouchers,
                receivingVoucherItems,
                salesOrders,
                salesOrderItems,
                posSales,
                posSaleItems,
                posReceipts,
                promotionUsages,
                customerPurchaseHistories,
                accountsPayables,
                apPayments,
                accountsReceivables,
                arPayments,
                expenses,
                employeePerformances,
                dailySalesSummaries,
                auditLogs,
                sessions,
                passwordResetTokens,
                reportExports,
                reportTemplates,
                companySettings,
                fundSources,
                fundTransactions,
                fundTransfers,
                inventoryAdjustments,
                inventoryAdjustmentItems,
                jobOrders,
                jobComments,
                jobImages,
                jobPerformed,
                partsReplacements,
                roadmapItems,
                roadmapComments,
                approvalRequests,
                notifications,
            },
        };
    }

    static async restoreBackup(backup: BackupData): Promise<void> {
        const { data } = backup;
        console.log('[BackupService] Starting restore backup process...');
        console.log('[BackupService] Backup version:', backup.version);
        console.log('[BackupService] Backup timestamp:', backup.timestamp);

        try {
            await prisma.$transaction(async (tx) => {
                console.log('[BackupService] Transaction started');
                console.log('[BackupService] Deleting existing data...');

                try {
                    // 1. Delete all data in reverse dependency order
                    // Wrap each delete in individual try-catch to handle missing tables
                    try { await tx.fundTransfer.deleteMany(); console.log('[BackupService] ✓ Deleted fundTransfers'); } catch (e) { console.log('[BackupService] ⚠ Skipped fundTransfers:', (e as Error).message); }
                    try { await tx.fundTransaction.deleteMany(); console.log('[BackupService] ✓ Deleted fundTransactions'); } catch (e) { console.log('[BackupService] ⚠ Skipped fundTransactions:', (e as Error).message); }
                    try { await tx.notification.deleteMany(); console.log('[BackupService] ✓ Deleted notifications'); } catch (e) { console.log('[BackupService] ⚠ Skipped notifications:', (e as Error).message); }
                    try { await tx.approvalRequest.deleteMany(); console.log('[BackupService] ✓ Deleted approvalRequests'); } catch (e) { console.log('[BackupService] ⚠ Skipped approvalRequests:', (e as Error).message); }
                    try { await tx.roadmapComment.deleteMany(); console.log('[BackupService] ✓ Deleted roadmapComments'); } catch (e) { console.log('[BackupService] ⚠ Skipped roadmapComments:', (e as Error).message); }
                    try { await tx.roadmapItem.deleteMany(); console.log('[BackupService] ✓ Deleted roadmapItems'); } catch (e) { console.log('[BackupService] ⚠ Skipped roadmapItems:', (e as Error).message); }
                    try { await tx.partsReplacement.deleteMany(); console.log('[BackupService] ✓ Deleted partsReplacements'); } catch (e) { console.log('[BackupService] ⚠ Skipped partsReplacements:', (e as Error).message); }
                    try { await tx.jobPerformed.deleteMany(); console.log('[BackupService] ✓ Deleted jobPerformed'); } catch (e) { console.log('[BackupService] ⚠ Skipped jobPerformed:', (e as Error).message); }
                    try { await tx.jobImage.deleteMany(); console.log('[BackupService] ✓ Deleted jobImages'); } catch (e) { console.log('[BackupService] ⚠ Skipped jobImages:', (e as Error).message); }
                    try { await tx.jobComment.deleteMany(); console.log('[BackupService] ✓ Deleted jobComments'); } catch (e) { console.log('[BackupService] ⚠ Skipped jobComments:', (e as Error).message); }
                    try { await tx.jobOrder.deleteMany(); console.log('[BackupService] ✓ Deleted jobOrders'); } catch (e) { console.log('[BackupService] ⚠ Skipped jobOrders:', (e as Error).message); }
                    try { await tx.inventoryAdjustmentItem.deleteMany(); console.log('[BackupService] ✓ Deleted inventoryAdjustmentItems'); } catch (e) { console.log('[BackupService] ⚠ Skipped inventoryAdjustmentItems:', (e as Error).message); }
                    try { await tx.inventoryAdjustment.deleteMany(); console.log('[BackupService] ✓ Deleted inventoryAdjustments'); } catch (e) { console.log('[BackupService] ⚠ Skipped inventoryAdjustments:', (e as Error).message); }
                    try { await tx.companySettings.deleteMany(); console.log('[BackupService] ✓ Deleted companySettings'); } catch (e) { console.log('[BackupService] ⚠ Skipped companySettings:', (e as Error).message); }
                    try { await tx.reportTemplate.deleteMany(); console.log('[BackupService] ✓ Deleted reportTemplates'); } catch (e) { console.log('[BackupService] ⚠ Skipped reportTemplates:', (e as Error).message); }
                    try { await tx.reportExport.deleteMany(); console.log('[BackupService] ✓ Deleted reportExports'); } catch (e) { console.log('[BackupService] ⚠ Skipped reportExports:', (e as Error).message); }
                    try { await tx.passwordResetToken.deleteMany(); console.log('[BackupService] ✓ Deleted passwordResetTokens'); } catch (e) { console.log('[BackupService] ⚠ Skipped passwordResetTokens:', (e as Error).message); }
                    try { await tx.session.deleteMany(); console.log('[BackupService] ✓ Deleted sessions'); } catch (e) { console.log('[BackupService] ⚠ Skipped sessions:', (e as Error).message); }
                    try { await tx.auditLog.deleteMany(); console.log('[BackupService] ✓ Deleted auditLogs'); } catch (e) { console.log('[BackupService] ⚠ Skipped auditLogs:', (e as Error).message); }
                    try { await tx.dailySalesSummary.deleteMany(); console.log('[BackupService] ✓ Deleted dailySalesSummaries'); } catch (e) { console.log('[BackupService] ⚠ Skipped dailySalesSummaries:', (e as Error).message); }
                    try { await tx.employeePerformance.deleteMany(); console.log('[BackupService] ✓ Deleted employeePerformances'); } catch (e) { console.log('[BackupService] ⚠ Skipped employeePerformances:', (e as Error).message); }
                    try { await tx.expense.deleteMany(); console.log('[BackupService] ✓ Deleted expenses'); } catch (e) { console.log('[BackupService] ⚠ Skipped expenses:', (e as Error).message); }
                    try { await tx.aRPayment.deleteMany(); console.log('[BackupService] ✓ Deleted arPayments'); } catch (e) { console.log('[BackupService] ⚠ Skipped arPayments:', (e as Error).message); }
                    try { await tx.accountsReceivable.deleteMany(); console.log('[BackupService] ✓ Deleted accountsReceivables'); } catch (e) { console.log('[BackupService] ⚠ Skipped accountsReceivables:', (e as Error).message); }
                    try { await tx.aPPayment.deleteMany(); console.log('[BackupService] ✓ Deleted apPayments'); } catch (e) { console.log('[BackupService] ⚠ Skipped apPayments:', (e as Error).message); }
                    try { await tx.accountsPayable.deleteMany(); console.log('[BackupService] ✓ Deleted accountsPayables'); } catch (e) { console.log('[BackupService] ⚠ Skipped accountsPayables:', (e as Error).message); }
                    try { await tx.customerPurchaseHistory.deleteMany(); console.log('[BackupService] ✓ Deleted customerPurchaseHistories'); } catch (e) { console.log('[BackupService] ⚠ Skipped customerPurchaseHistories:', (e as Error).message); }
                    try { await tx.promotionUsage.deleteMany(); console.log('[BackupService] ✓ Deleted promotionUsages'); } catch (e) { console.log('[BackupService] ⚠ Skipped promotionUsages:', (e as Error).message); }
                    try { await tx.pOSReceipt.deleteMany(); console.log('[BackupService] ✓ Deleted posReceipts'); } catch (e) { console.log('[BackupService] ⚠ Skipped posReceipts:', (e as Error).message); }
                    try { await tx.pOSSaleItem.deleteMany(); console.log('[BackupService] ✓ Deleted posSaleItems'); } catch (e) { console.log('[BackupService] ⚠ Skipped posSaleItems:', (e as Error).message); }
                    try { await tx.pOSSale.deleteMany(); console.log('[BackupService] ✓ Deleted posSales'); } catch (e) { console.log('[BackupService] ⚠ Skipped posSales:', (e as Error).message); }
                    try { await tx.salesOrderItem.deleteMany(); console.log('[BackupService] ✓ Deleted salesOrderItems'); } catch (e) { console.log('[BackupService] ⚠ Skipped salesOrderItems:', (e as Error).message); }
                    try { await tx.salesOrder.deleteMany(); console.log('[BackupService] ✓ Deleted salesOrders'); } catch (e) { console.log('[BackupService] ⚠ Skipped salesOrders:', (e as Error).message); }
                    try { await tx.receivingVoucherItem.deleteMany(); console.log('[BackupService] ✓ Deleted receivingVoucherItems'); } catch (e) { console.log('[BackupService] ⚠ Skipped receivingVoucherItems:', (e as Error).message); }
                    try { await tx.receivingVoucher.deleteMany(); console.log('[BackupService] ✓ Deleted receivingVouchers'); } catch (e) { console.log('[BackupService] ⚠ Skipped receivingVouchers:', (e as Error).message); }
                    try { await tx.purchaseOrderItem.deleteMany(); console.log('[BackupService] ✓ Deleted purchaseOrderItems'); } catch (e) { console.log('[BackupService] ⚠ Skipped purchaseOrderItems:', (e as Error).message); }
                    try { await tx.purchaseOrder.deleteMany(); console.log('[BackupService] ✓ Deleted purchaseOrders'); } catch (e) { console.log('[BackupService] ⚠ Skipped purchaseOrders:', (e as Error).message); }
                    try { await tx.stockMovement.deleteMany(); console.log('[BackupService] ✓ Deleted stockMovements'); } catch (e) { console.log('[BackupService] ⚠ Skipped stockMovements:', (e as Error).message); }
                    try { await tx.inventory.deleteMany(); console.log('[BackupService] ✓ Deleted inventory'); } catch (e) { console.log('[BackupService] ⚠ Skipped inventory:', (e as Error).message); }
                    try { await tx.productUOM.deleteMany(); console.log('[BackupService] ✓ Deleted productUOMs'); } catch (e) { console.log('[BackupService] ⚠ Skipped productUOMs:', (e as Error).message); }
                    try { await tx.product.deleteMany(); console.log('[BackupService] ✓ Deleted products'); } catch (e) { console.log('[BackupService] ⚠ Skipped products:', (e as Error).message); }
                    try { await tx.salesAgent.deleteMany(); console.log('[BackupService] ✓ Deleted salesAgents'); } catch (e) { console.log('[BackupService] ⚠ Skipped salesAgents:', (e as Error).message); }
                    try { await tx.customer.deleteMany(); console.log('[BackupService] ✓ Deleted customers'); } catch (e) { console.log('[BackupService] ⚠ Skipped customers:', (e as Error).message); }
                    try { await tx.supplier.deleteMany(); console.log('[BackupService] ✓ Deleted suppliers'); } catch (e) { console.log('[BackupService] ⚠ Skipped suppliers:', (e as Error).message); }
                    try { await tx.paymentMethod.deleteMany(); console.log('[BackupService] ✓ Deleted paymentMethods'); } catch (e) { console.log('[BackupService] ⚠ Skipped paymentMethods:', (e as Error).message); }
                    try { await tx.expenseVendor.deleteMany(); console.log('[BackupService] ✓ Deleted expenseVendors'); } catch (e) { console.log('[BackupService] ⚠ Skipped expenseVendors:', (e as Error).message); }
                    try { await tx.expenseCategory.deleteMany(); console.log('[BackupService] ✓ Deleted expenseCategories'); } catch (e) { console.log('[BackupService] ⚠ Skipped expenseCategories:', (e as Error).message); }
                    try { await tx.unitOfMeasure.deleteMany(); console.log('[BackupService] ✓ Deleted unitOfMeasures'); } catch (e) { console.log('[BackupService] ⚠ Skipped unitOfMeasures:', (e as Error).message); }
                    try { await tx.productCategory.deleteMany(); console.log('[BackupService] ✓ Deleted productCategories'); } catch (e) { console.log('[BackupService] ⚠ Skipped productCategories:', (e as Error).message); }
                    try { await tx.userBranchAccess.deleteMany(); console.log('[BackupService] ✓ Deleted userBranchAccess'); } catch (e) { console.log('[BackupService] ⚠ Skipped userBranchAccess:', (e as Error).message); }
                    try { await tx.user.deleteMany(); console.log('[BackupService] ✓ Deleted users'); } catch (e) { console.log('[BackupService] ⚠ Skipped users:', (e as Error).message); }
                    try { await tx.rolePermission.deleteMany(); console.log('[BackupService] ✓ Deleted rolePermissions'); } catch (e) { console.log('[BackupService] ⚠ Skipped rolePermissions:', (e as Error).message); }
                    try { await tx.permission.deleteMany(); console.log('[BackupService] ✓ Deleted permissions'); } catch (e) { console.log('[BackupService] ⚠ Skipped permissions:', (e as Error).message); }
                    try { await tx.role.deleteMany(); console.log('[BackupService] ✓ Deleted roles'); } catch (e) { console.log('[BackupService] ⚠ Skipped roles:', (e as Error).message); }
                    try { await tx.warehouse.deleteMany(); console.log('[BackupService] ✓ Deleted warehouses'); } catch (e) { console.log('[BackupService] ⚠ Skipped warehouses:', (e as Error).message); }
                    try { await tx.branch.deleteMany(); console.log('[BackupService] ✓ Deleted branches'); } catch (e) { console.log('[BackupService] ⚠ Skipped branches:', (e as Error).message); }

                    console.log('[BackupService] Deletion phase complete.');
                } catch (deleteError) {
                    console.error('[BackupService] Error during deletion phase:', deleteError);
                    throw new Error(`Failed to delete existing data: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
                }

                // 2. Insert data in dependency order
                try {
                    console.log('[BackupService] Starting data restoration...');

                    if (data.branches?.length) {
                        await tx.branch.createMany({ data: data.branches });
                        console.log(`[BackupService] ✓ Restored ${data.branches.length} branches`);
                    }

                    if (data.warehouses?.length) {
                        await tx.warehouse.createMany({ data: data.warehouses });
                        console.log(`[BackupService] ✓ Restored ${data.warehouses.length} warehouses`);
                    }

                    if (data.roles?.length) {
                        await tx.role.createMany({ data: data.roles });
                        console.log(`[BackupService] ✓ Restored ${data.roles.length} roles`);
                    }

                    if (data.permissions?.length) {
                        await tx.permission.createMany({ data: data.permissions });
                        console.log(`[BackupService] ✓ Restored ${data.permissions.length} permissions`);
                    }

                    if (data.rolePermissions?.length) {
                        await tx.rolePermission.createMany({ data: data.rolePermissions });
                        console.log(`[BackupService] ✓ Restored ${data.rolePermissions.length} rolePermissions`);
                    }

                    if (data.users?.length) {
                        await tx.user.createMany({ data: data.users });
                        console.log(`[BackupService] ✓ Restored ${data.users.length} users`);
                    }

                    if (data.userBranchAccess?.length) {
                        await tx.userBranchAccess.createMany({ data: data.userBranchAccess });
                        console.log(`[BackupService] ✓ Restored ${data.userBranchAccess.length} userBranchAccess`);
                    }

                    if (data.fundSources?.length) {
                        await tx.fundSource.createMany({ data: data.fundSources });
                        console.log(`[BackupService] ✓ Restored ${data.fundSources.length} fundSources`);
                    }

                    if (data.productCategories?.length) {
                        await tx.productCategory.createMany({ data: data.productCategories });
                        console.log(`[BackupService] ✓ Restored ${data.productCategories.length} productCategories`);
                    }

                    if (data.unitOfMeasures?.length) {
                        await tx.unitOfMeasure.createMany({ data: data.unitOfMeasures });
                        console.log(`[BackupService] ✓ Restored ${data.unitOfMeasures.length} unitOfMeasures`);
                    }

                    if (data.expenseCategories?.length) {
                        await tx.expenseCategory.createMany({ data: data.expenseCategories });
                        console.log(`[BackupService] ✓ Restored ${data.expenseCategories.length} expenseCategories`);
                    }

                    if (data.expenseVendors?.length) {
                        await tx.expenseVendor.createMany({ data: data.expenseVendors });
                        console.log(`[BackupService] ✓ Restored ${data.expenseVendors.length} expenseVendors`);
                    }

                    if (data.paymentMethods?.length) {
                        await tx.paymentMethod.createMany({ data: data.paymentMethods });
                        console.log(`[BackupService] ✓ Restored ${data.paymentMethods.length} paymentMethods`);
                    }

                    if (data.suppliers?.length) {
                        await tx.supplier.createMany({ data: data.suppliers });
                        console.log(`[BackupService] ✓ Restored ${data.suppliers.length} suppliers`);
                    }

                    if (data.customers?.length) {
                        await tx.customer.createMany({ data: data.customers });
                        console.log(`[BackupService] ✓ Restored ${data.customers.length} customers`);
                    }

                    if (data.salesAgents?.length) {
                        await tx.salesAgent.createMany({ data: data.salesAgents });
                        console.log(`[BackupService] ✓ Restored ${data.salesAgents.length} salesAgents`);
                    }

                    if (data.products?.length) {
                        await tx.product.createMany({ data: data.products });
                        console.log(`[BackupService] ✓ Restored ${data.products.length} products`);
                    }

                    if (data.productUOMs?.length) {
                        await tx.productUOM.createMany({ data: data.productUOMs });
                        console.log(`[BackupService] ✓ Restored ${data.productUOMs.length} productUOMs`);
                    }

                    if (data.inventory?.length) {
                        await tx.inventory.createMany({ data: data.inventory });
                        console.log(`[BackupService] ✓ Restored ${data.inventory.length} inventory`);
                    }

                    if (data.stockMovements?.length) {
                        await tx.stockMovement.createMany({ data: data.stockMovements });
                        console.log(`[BackupService] ✓ Restored ${data.stockMovements.length} stockMovements`);
                    }

                    if (data.purchaseOrders?.length) {
                        await tx.purchaseOrder.createMany({ data: data.purchaseOrders });
                        console.log(`[BackupService] ✓ Restored ${data.purchaseOrders.length} purchaseOrders`);
                    }

                    if (data.purchaseOrderItems?.length) {
                        await tx.purchaseOrderItem.createMany({ data: data.purchaseOrderItems });
                        console.log(`[BackupService] ✓ Restored ${data.purchaseOrderItems.length} purchaseOrderItems`);
                    }

                    if (data.receivingVouchers?.length) {
                        await tx.receivingVoucher.createMany({ data: data.receivingVouchers });
                        console.log(`[BackupService] ✓ Restored ${data.receivingVouchers.length} receivingVouchers`);
                    }

                    if (data.receivingVoucherItems?.length) {
                        await tx.receivingVoucherItem.createMany({ data: data.receivingVoucherItems });
                        console.log(`[BackupService] ✓ Restored ${data.receivingVoucherItems.length} receivingVoucherItems`);
                    }

                    if (data.salesOrders?.length) {
                        await tx.salesOrder.createMany({ data: data.salesOrders });
                        console.log(`[BackupService] ✓ Restored ${data.salesOrders.length} salesOrders`);
                    }

                    if (data.salesOrderItems?.length) {
                        await tx.salesOrderItem.createMany({ data: data.salesOrderItems });
                        console.log(`[BackupService] ✓ Restored ${data.salesOrderItems.length} salesOrderItems`);
                    }

                    if (data.posSales?.length) {
                        await tx.pOSSale.createMany({ data: data.posSales });
                        console.log(`[BackupService] ✓ Restored ${data.posSales.length} posSales`);
                    }

                    if (data.posSaleItems?.length) {
                        await tx.pOSSaleItem.createMany({ data: data.posSaleItems });
                        console.log(`[BackupService] ✓ Restored ${data.posSaleItems.length} posSaleItems`);
                    }

                    if (data.posReceipts?.length) {
                        await tx.pOSReceipt.createMany({ data: data.posReceipts });
                        console.log(`[BackupService] ✓ Restored ${data.posReceipts.length} posReceipts`);
                    }

                    if (data.promotionUsages?.length) {
                        await tx.promotionUsage.createMany({ data: data.promotionUsages });
                        console.log(`[BackupService] ✓ Restored ${data.promotionUsages.length} promotionUsages`);
                    }

                    if (data.customerPurchaseHistories?.length) {
                        await tx.customerPurchaseHistory.createMany({ data: data.customerPurchaseHistories });
                        console.log(`[BackupService] ✓ Restored ${data.customerPurchaseHistories.length} customerPurchaseHistories`);
                    }

                    if (data.accountsPayables?.length) {
                        await tx.accountsPayable.createMany({ data: data.accountsPayables });
                        console.log(`[BackupService] ✓ Restored ${data.accountsPayables.length} accountsPayables`);
                    }

                    if (data.apPayments?.length) {
                        await tx.aPPayment.createMany({ data: data.apPayments });
                        console.log(`[BackupService] ✓ Restored ${data.apPayments.length} apPayments`);
                    }

                    if (data.accountsReceivables?.length) {
                        await tx.accountsReceivable.createMany({ data: data.accountsReceivables });
                        console.log(`[BackupService] ✓ Restored ${data.accountsReceivables.length} accountsReceivables`);
                    }

                    if (data.arPayments?.length) {
                        await tx.aRPayment.createMany({ data: data.arPayments });
                        console.log(`[BackupService] ✓ Restored ${data.arPayments.length} arPayments`);
                    }

                    if (data.expenses?.length) {
                        await tx.expense.createMany({ data: data.expenses });
                        console.log(`[BackupService] ✓ Restored ${data.expenses.length} expenses`);
                    }

                    if (data.employeePerformances?.length) {
                        await tx.employeePerformance.createMany({ data: data.employeePerformances });
                        console.log(`[BackupService] ✓ Restored ${data.employeePerformances.length} employeePerformances`);
                    }

                    if (data.dailySalesSummaries?.length) {
                        await tx.dailySalesSummary.createMany({ data: data.dailySalesSummaries });
                        console.log(`[BackupService] ✓ Restored ${data.dailySalesSummaries.length} dailySalesSummaries`);
                    }

                    if (data.auditLogs?.length) {
                        await tx.auditLog.createMany({ data: data.auditLogs });
                        console.log(`[BackupService] ✓ Restored ${data.auditLogs.length} auditLogs`);
                    }

                    if (data.sessions?.length) {
                        await tx.session.createMany({ data: data.sessions });
                        console.log(`[BackupService] ✓ Restored ${data.sessions.length} sessions`);
                    }

                    if (data.passwordResetTokens?.length) {
                        await tx.passwordResetToken.createMany({ data: data.passwordResetTokens });
                        console.log(`[BackupService] ✓ Restored ${data.passwordResetTokens.length} passwordResetTokens`);
                    }

                    if (data.reportExports?.length) {
                        await tx.reportExport.createMany({ data: data.reportExports });
                        console.log(`[BackupService] ✓ Restored ${data.reportExports.length} reportExports`);
                    }

                    if (data.reportTemplates?.length) {
                        await tx.reportTemplate.createMany({ data: data.reportTemplates });
                        console.log(`[BackupService] ✓ Restored ${data.reportTemplates.length} reportTemplates`);
                    }

                    if (data.companySettings?.length) {
                        await tx.companySettings.createMany({ data: data.companySettings });
                        console.log(`[BackupService] ✓ Restored ${data.companySettings.length} companySettings`);
                    }

                    if (data.inventoryAdjustments?.length) {
                        await tx.inventoryAdjustment.createMany({ data: data.inventoryAdjustments });
                        console.log(`[BackupService] ✓ Restored ${data.inventoryAdjustments.length} inventoryAdjustments`);
                    }

                    if (data.inventoryAdjustmentItems?.length) {
                        await tx.inventoryAdjustmentItem.createMany({ data: data.inventoryAdjustmentItems });
                        console.log(`[BackupService] ✓ Restored ${data.inventoryAdjustmentItems.length} inventoryAdjustmentItems`);
                    }

                    if (data.jobOrders?.length) {
                        await tx.jobOrder.createMany({ data: data.jobOrders });
                        console.log(`[BackupService] ✓ Restored ${data.jobOrders.length} jobOrders`);
                    }

                    if (data.jobComments?.length) {
                        await tx.jobComment.createMany({ data: data.jobComments });
                        console.log(`[BackupService] ✓ Restored ${data.jobComments.length} jobComments`);
                    }

                    if (data.jobImages?.length) {
                        await tx.jobImage.createMany({ data: data.jobImages });
                        console.log(`[BackupService] ✓ Restored ${data.jobImages.length} jobImages`);
                    }

                    if (data.jobPerformed?.length) {
                        await tx.jobPerformed.createMany({ data: data.jobPerformed });
                        console.log(`[BackupService] ✓ Restored ${data.jobPerformed.length} jobPerformed`);
                    }

                    if (data.partsReplacements?.length) {
                        await tx.partsReplacement.createMany({ data: data.partsReplacements });
                        console.log(`[BackupService] ✓ Restored ${data.partsReplacements.length} partsReplacements`);
                    }

                    if (data.roadmapItems?.length) {
                        await tx.roadmapItem.createMany({ data: data.roadmapItems });
                        console.log(`[BackupService] ✓ Restored ${data.roadmapItems.length} roadmapItems`);
                    }

                    if (data.roadmapComments?.length) {
                        await tx.roadmapComment.createMany({ data: data.roadmapComments });
                        console.log(`[BackupService] ✓ Restored ${data.roadmapComments.length} roadmapComments`);
                    }

                    if (data.approvalRequests?.length) {
                        await tx.approvalRequest.createMany({ data: data.approvalRequests });
                        console.log(`[BackupService] ✓ Restored ${data.approvalRequests.length} approvalRequests`);
                    }

                    if (data.notifications?.length) {
                        await tx.notification.createMany({ data: data.notifications });
                        console.log(`[BackupService] ✓ Restored ${data.notifications.length} notifications`);
                    }

                    if (data.fundTransactions?.length) {
                        await tx.fundTransaction.createMany({ data: data.fundTransactions });
                        console.log(`[BackupService] ✓ Restored ${data.fundTransactions.length} fundTransactions`);
                    }

                    if (data.fundTransfers?.length) {
                        await tx.fundTransfer.createMany({ data: data.fundTransfers });
                        console.log(`[BackupService] ✓ Restored ${data.fundTransfers.length} fundTransfers`);
                    }

                    console.log('[BackupService] Data restoration complete.');
                } catch (restoreError) {
                    console.error('[BackupService] Error during restoration phase:', restoreError);
                    throw new Error(`Failed to restore data: ${restoreError instanceof Error ? restoreError.message : 'Unknown error'}`);
                }

                console.log('[BackupService] Restore completed successfully.');
            }, {
                maxWait: 20000, // 20s
                timeout: 120000, // 120s - increased timeout
            });
        } catch (error) {
            console.error('[BackupService] Transaction failed:', error);
            if (error instanceof Error) {
                throw new Error(`Restore failed: ${error.message}`);
            }
            throw error;
        }
    }

}
