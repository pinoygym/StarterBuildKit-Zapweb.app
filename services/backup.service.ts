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

        await prisma.$transaction(async (tx) => {
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

            // 2. Insert data in dependency order
            if (data.branches.length) await tx.branch.createMany({ data: data.branches });
            if (data.warehouses.length) await tx.warehouse.createMany({ data: data.warehouses });
            if (data.roles.length) await tx.role.createMany({ data: data.roles });
            if (data.permissions.length) await tx.permission.createMany({ data: data.permissions });
            if (data.rolePermissions.length) await tx.rolePermission.createMany({ data: data.rolePermissions });
            if (data.users.length) await tx.user.createMany({ data: data.users });
            if (data.userBranchAccess.length) await tx.userBranchAccess.createMany({ data: data.userBranchAccess });
            if (data.productCategories.length) await tx.productCategory.createMany({ data: data.productCategories });
            if (data.unitOfMeasures.length) await tx.unitOfMeasure.createMany({ data: data.unitOfMeasures });
            if (data.expenseCategories.length) await tx.expenseCategory.createMany({ data: data.expenseCategories });
            if (data.expenseVendors.length) await tx.expenseVendor.createMany({ data: data.expenseVendors });
            if (data.paymentMethods.length) await tx.paymentMethod.createMany({ data: data.paymentMethods });
            if (data.suppliers.length) await tx.supplier.createMany({ data: data.suppliers });
            if (data.customers.length) await tx.customer.createMany({ data: data.customers });
            if (data.salesAgents.length) await tx.salesAgent.createMany({ data: data.salesAgents });
            if (data.products.length) await tx.product.createMany({ data: data.products });
            if (data.productUOMs.length) await tx.productUOM.createMany({ data: data.productUOMs });
            if (data.inventory.length) await tx.inventory.createMany({ data: data.inventory });
            if (data.stockMovements.length) await tx.stockMovement.createMany({ data: data.stockMovements });
            if (data.purchaseOrders.length) await tx.purchaseOrder.createMany({ data: data.purchaseOrders });
            if (data.purchaseOrderItems.length) await tx.purchaseOrderItem.createMany({ data: data.purchaseOrderItems });
            if (data.receivingVouchers.length) await tx.receivingVoucher.createMany({ data: data.receivingVouchers });
            if (data.receivingVoucherItems.length) await tx.receivingVoucherItem.createMany({ data: data.receivingVoucherItems });
            if (data.salesOrders.length) await tx.salesOrder.createMany({ data: data.salesOrders });
            if (data.salesOrderItems.length) await tx.salesOrderItem.createMany({ data: data.salesOrderItems });
            if (data.posSales.length) await tx.pOSSale.createMany({ data: data.posSales });
            if (data.posSaleItems.length) await tx.pOSSaleItem.createMany({ data: data.posSaleItems });
            if (data.posReceipts.length) await tx.pOSReceipt.createMany({ data: data.posReceipts });
            if (data.promotionUsages.length) await tx.promotionUsage.createMany({ data: data.promotionUsages });
            if (data.customerPurchaseHistories.length) await tx.customerPurchaseHistory.createMany({ data: data.customerPurchaseHistories });
            if (data.accountsPayables.length) await tx.accountsPayable.createMany({ data: data.accountsPayables });
            if (data.apPayments.length) await tx.aPPayment.createMany({ data: data.apPayments });
            if (data.accountsReceivables.length) await tx.accountsReceivable.createMany({ data: data.accountsReceivables });
            if (data.arPayments.length) await tx.aRPayment.createMany({ data: data.arPayments });
            if (data.expenses.length) await tx.expense.createMany({ data: data.expenses });
            if (data.employeePerformances.length) await tx.employeePerformance.createMany({ data: data.employeePerformances });
            if (data.dailySalesSummaries.length) await tx.dailySalesSummary.createMany({ data: data.dailySalesSummaries });
            if (data.auditLogs.length) await tx.auditLog.createMany({ data: data.auditLogs });
            if (data.sessions.length) await tx.session.createMany({ data: data.sessions });
            if (data.passwordResetTokens.length) await tx.passwordResetToken.createMany({ data: data.passwordResetTokens });
            if (data.reportExports.length) await tx.reportExport.createMany({ data: data.reportExports });
            if (data.reportTemplates.length) await tx.reportTemplate.createMany({ data: data.reportTemplates });
            if (data.companySettings.length) await tx.companySettings.createMany({ data: data.companySettings });
        }, {
            maxWait: 10000, // 10s
            timeout: 60000, // 60s
        });
    }
}
