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
        ]);

        return {
            version: '1.0',
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
            },
        };
    }

    static async restoreBackup(backup: BackupData): Promise<void> {
        const { data } = backup;
        console.log('Starting restore backup process...');

        try {
            await prisma.$transaction(async (tx) => {
                console.log('Deleting existing data...');
                // 1. Delete all data in reverse dependency order
                await tx.companySettings.deleteMany();
                await tx.reportTemplate.deleteMany();
                await tx.reportExport.deleteMany();
                await tx.passwordResetToken.deleteMany();
                await tx.session.deleteMany();
                await tx.auditLog.deleteMany();
                await tx.dailySalesSummary.deleteMany();
                await tx.employeePerformance.deleteMany();
                await tx.expense.deleteMany();
                await tx.aRPayment.deleteMany();
                await tx.accountsReceivable.deleteMany();
                await tx.aPPayment.deleteMany();
                await tx.accountsPayable.deleteMany();
                await tx.customerPurchaseHistory.deleteMany();
                await tx.promotionUsage.deleteMany();
                await tx.pOSReceipt.deleteMany();
                await tx.pOSSaleItem.deleteMany();
                await tx.pOSSale.deleteMany();
                await tx.salesOrderItem.deleteMany();
                await tx.salesOrder.deleteMany();
                await tx.receivingVoucherItem.deleteMany();
                await tx.receivingVoucher.deleteMany();
                await tx.purchaseOrderItem.deleteMany();
                await tx.purchaseOrder.deleteMany();
                await tx.stockMovement.deleteMany();
                await tx.inventory.deleteMany();
                await tx.productUOM.deleteMany();
                await tx.product.deleteMany();
                await tx.salesAgent.deleteMany();
                await tx.customer.deleteMany();
                await tx.supplier.deleteMany();
                await tx.paymentMethod.deleteMany();
                await tx.expenseVendor.deleteMany();
                await tx.expenseCategory.deleteMany();
                await tx.unitOfMeasure.deleteMany();
                await tx.productCategory.deleteMany();
                await tx.userBranchAccess.deleteMany();
                await tx.user.deleteMany();
                await tx.rolePermission.deleteMany();
                await tx.permission.deleteMany();
                await tx.role.deleteMany();
                await tx.warehouse.deleteMany();
                await tx.branch.deleteMany();
                console.log('Deletion complete.');

                // 2. Insert data in dependency order
                console.log('Restoring branches...');
                if (data.branches?.length) await tx.branch.createMany({ data: data.branches });

                console.log('Restoring warehouses...');
                if (data.warehouses?.length) await tx.warehouse.createMany({ data: data.warehouses });

                console.log('Restoring roles...');
                if (data.roles?.length) await tx.role.createMany({ data: data.roles });

                console.log('Restoring permissions...');
                if (data.permissions?.length) await tx.permission.createMany({ data: data.permissions });

                console.log('Restoring rolePermissions...');
                if (data.rolePermissions?.length) await tx.rolePermission.createMany({ data: data.rolePermissions });

                console.log('Restoring users...');
                if (data.users?.length) await tx.user.createMany({ data: data.users });

                console.log('Restoring userBranchAccess...');
                if (data.userBranchAccess?.length) await tx.userBranchAccess.createMany({ data: data.userBranchAccess });

                console.log('Restoring productCategories...');
                if (data.productCategories?.length) await tx.productCategory.createMany({ data: data.productCategories });

                console.log('Restoring unitOfMeasures...');
                if (data.unitOfMeasures?.length) await tx.unitOfMeasure.createMany({ data: data.unitOfMeasures });

                console.log('Restoring expenseCategories...');
                if (data.expenseCategories?.length) await tx.expenseCategory.createMany({ data: data.expenseCategories });

                console.log('Restoring expenseVendors...');
                if (data.expenseVendors?.length) await tx.expenseVendor.createMany({ data: data.expenseVendors });

                console.log('Restoring paymentMethods...');
                if (data.paymentMethods?.length) await tx.paymentMethod.createMany({ data: data.paymentMethods });

                console.log('Restoring suppliers...');
                if (data.suppliers?.length) await tx.supplier.createMany({ data: data.suppliers });

                console.log('Restoring customers...');
                if (data.customers?.length) await tx.customer.createMany({ data: data.customers });

                console.log('Restoring salesAgents...');
                if (data.salesAgents?.length) await tx.salesAgent.createMany({ data: data.salesAgents });

                console.log('Restoring products...');
                if (data.products?.length) await tx.product.createMany({ data: data.products });

                console.log('Restoring productUOMs...');
                if (data.productUOMs?.length) await tx.productUOM.createMany({ data: data.productUOMs });

                console.log('Restoring inventory...');
                if (data.inventory?.length) await tx.inventory.createMany({ data: data.inventory });

                console.log('Restoring stockMovements...');
                if (data.stockMovements?.length) await tx.stockMovement.createMany({ data: data.stockMovements });

                console.log('Restoring purchaseOrders...');
                if (data.purchaseOrders?.length) await tx.purchaseOrder.createMany({ data: data.purchaseOrders });

                console.log('Restoring purchaseOrderItems...');
                if (data.purchaseOrderItems?.length) await tx.purchaseOrderItem.createMany({ data: data.purchaseOrderItems });

                console.log('Restoring receivingVouchers...');
                if (data.receivingVouchers?.length) await tx.receivingVoucher.createMany({ data: data.receivingVouchers });

                console.log('Restoring receivingVoucherItems...');
                if (data.receivingVoucherItems?.length) await tx.receivingVoucherItem.createMany({ data: data.receivingVoucherItems });

                console.log('Restoring salesOrders...');
                if (data.salesOrders?.length) await tx.salesOrder.createMany({ data: data.salesOrders });

                console.log('Restoring salesOrderItems...');
                if (data.salesOrderItems?.length) await tx.salesOrderItem.createMany({ data: data.salesOrderItems });

                console.log('Restoring posSales...');
                if (data.posSales?.length) await tx.pOSSale.createMany({ data: data.posSales });

                console.log('Restoring posSaleItems...');
                if (data.posSaleItems?.length) await tx.pOSSaleItem.createMany({ data: data.posSaleItems });

                console.log('Restoring posReceipts...');
                if (data.posReceipts?.length) await tx.pOSReceipt.createMany({ data: data.posReceipts });

                console.log('Restoring promotionUsages...');
                if (data.promotionUsages?.length) await tx.promotionUsage.createMany({ data: data.promotionUsages });

                console.log('Restoring customerPurchaseHistories...');
                if (data.customerPurchaseHistories?.length) await tx.customerPurchaseHistory.createMany({ data: data.customerPurchaseHistories });

                console.log('Restoring accountsPayables...');
                if (data.accountsPayables?.length) await tx.accountsPayable.createMany({ data: data.accountsPayables });

                console.log('Restoring apPayments...');
                if (data.apPayments?.length) await tx.aPPayment.createMany({ data: data.apPayments });

                console.log('Restoring accountsReceivables...');
                if (data.accountsReceivables?.length) await tx.accountsReceivable.createMany({ data: data.accountsReceivables });

                console.log('Restoring arPayments...');
                if (data.arPayments?.length) await tx.aRPayment.createMany({ data: data.arPayments });

                console.log('Restoring expenses...');
                if (data.expenses?.length) await tx.expense.createMany({ data: data.expenses });

                console.log('Restoring employeePerformances...');
                if (data.employeePerformances?.length) await tx.employeePerformance.createMany({ data: data.employeePerformances });

                console.log('Restoring dailySalesSummaries...');
                if (data.dailySalesSummaries?.length) await tx.dailySalesSummary.createMany({ data: data.dailySalesSummaries });

                console.log('Restoring auditLogs...');
                if (data.auditLogs?.length) await tx.auditLog.createMany({ data: data.auditLogs });

                console.log('Restoring sessions...');
                if (data.sessions?.length) await tx.session.createMany({ data: data.sessions });

                console.log('Restoring passwordResetTokens...');
                if (data.passwordResetTokens?.length) await tx.passwordResetToken.createMany({ data: data.passwordResetTokens });

                console.log('Restoring reportExports...');
                if (data.reportExports?.length) await tx.reportExport.createMany({ data: data.reportExports });

                console.log('Restoring reportTemplates...');
                if (data.reportTemplates?.length) await tx.reportTemplate.createMany({ data: data.reportTemplates });

                console.log('Restoring companySettings...');
                if (data.companySettings?.length) await tx.companySettings.createMany({ data: data.companySettings });

                console.log('Restore completed successfully.');
            }, {
                maxWait: 20000, // 20s
                timeout: 120000, // 120s - increased timeout
            });
        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        }
    }
}
