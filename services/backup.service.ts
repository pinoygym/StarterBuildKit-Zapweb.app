import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

function logDebug(msg: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${msg}`);
}

export interface BackupData {
    version: string;
    timestamp: string;
    data: {
        // Core
        user?: any[];
        role?: any[];
        permission?: any[];
        rolePermission?: any[];
        session?: any[];
        passwordResetToken?: any[];

        // Organization
        branch?: any[];
        warehouse?: any[];
        userBranchAccess?: any[];
        companySettings?: any[];

        // Master Data
        customer?: any[];
        supplier?: any[];
        salesAgent?: any[];
        product?: any[];
        productCategory?: any[];
        productUOM?: any[];
        unitOfMeasure?: any[];
        paymentMethod?: any[];
        expenseCategory?: any[];
        expenseVendor?: any[];

        // Inventory
        inventory?: any[];
        stockMovement?: any[];
        inventoryAdjustment?: any[];
        inventoryAdjustmentItem?: any[];
        inventoryTransfer?: any[];
        inventoryTransferItem?: any[];

        // Purchasing
        purchaseOrder?: any[];
        purchaseOrderItem?: any[];
        receivingVoucher?: any[];
        receivingVoucherItem?: any[];
        accountsPayable?: any[];
        aPPayment?: any[];

        // Sales
        salesOrder?: any[];
        salesOrderItem?: any[];
        pOSSale?: any[];
        pOSSaleItem?: any[];
        pOSReceipt?: any[];
        promotionUsage?: any[];
        customerPurchaseHistory?: any[];
        dailySalesSummary?: any[];
        accountsReceivable?: any[];
        aRPayment?: any[];
        employeePerformance?: any[];

        // Financials
        expense?: any[];
        fundSource?: any[];
        fundTransaction?: any[];
        fundTransfer?: any[];

        // Services / Jobs
        jobOrder?: any[];
        jobComment?: any[];
        jobImage?: any[];
        jobPerformed?: any[];
        partsReplacement?: any[];

        // Others
        auditLog?: any[];
        reportExport?: any[];
        reportTemplate?: any[];
        roadmapItem?: any[];
        roadmapComment?: any[];
        approvalRequest?: any[];
        notification?: any[];
    } & Record<string, any[]>; // Allow dynamic access
}

export interface BackupDataWithMetadata extends BackupData {
    _filename: string;
    _reason: string;
}

export class BackupService {
    static async createBackup(): Promise<BackupData> {
        // Define all models to backup in order
        // Note: Order here determines the order in the backup file object, but keys are what matters
        const models = [
            'user', 'role', 'permission', 'rolePermission', 'session', 'passwordResetToken',
            'branch', 'warehouse', 'userBranchAccess', 'companySettings',
            'customer', 'supplier', 'salesAgent',
            'productCategory', 'unitOfMeasure', 'paymentMethod', 'expenseCategory', 'expenseVendor',
            'product', 'productUOM',
            'inventory', 'stockMovement',
            'inventoryAdjustment', 'inventoryAdjustmentItem',
            'inventoryTransfer', 'inventoryTransferItem',
            'purchaseOrder', 'purchaseOrderItem', 'receivingVoucher', 'receivingVoucherItem',
            'accountsPayable', 'aPPayment',
            'salesOrder', 'salesOrderItem',
            'pOSSale', 'pOSSaleItem', 'pOSReceipt', 'promotionUsage',
            'customerPurchaseHistory', 'dailySalesSummary',
            'accountsReceivable', 'aRPayment', 'employeePerformance',
            'expense',
            'fundSource', 'fundTransaction', 'fundTransfer',
            'jobOrder', 'jobComment', 'jobImage', 'jobPerformed', 'partsReplacement',
            'auditLog', 'reportExport', 'reportTemplate',
            'roadmapItem', 'roadmapComment',
            'approvalRequest', 'notification'
        ];

        const data: Record<string, any[]> = {};

        // Fetch all data in parallel
        await Promise.all(models.map(async (model) => {
            try {
                // @ts-ignore - Dynamic access to prisma models
                data[model] = await prisma[model].findMany();
            } catch (error) {
                console.error(`[BackupService] Failed to fetch data for model ${model}:`, error);
                data[model] = [];
            }
        }));

        return {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: data
        };
    }

    /**
     * Create a backup with metadata including filename and reason
     * @param reason - The reason for creating this backup (e.g., "before_adjustment_post", "before_database_clear")
     * @returns Backup data with metadata
     */
    static async createBackupWithMetadata(reason: string): Promise<BackupDataWithMetadata> {
        const backup = await this.createBackup();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedReason = reason.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        // Get company name for filename
        const companySettings = await prisma.companySettings.findFirst();
        const companyName = companySettings?.companyName || 'backup';
        const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        return {
            ...backup,
            _filename: `${sanitizedCompanyName}_${sanitizedReason}_${timestamp}.json`,
            _reason: reason
        };
    }

    static async restoreBackup(backup: BackupData): Promise<void> {
        logDebug(`Starting restore backup process... version: ${backup.version}`);

        // Normalize data keys if coming from older version (plural to singular)
        const normalizedBackup = this.normalizeBackupData(backup);
        const { data } = normalizedBackup;
        logDebug(`Normalized data keys: ${Object.keys(data).join(', ')}`);

        try {
            await prisma.$transaction(async (tx) => {
                console.log('[BackupService] Transaction started');
                console.log('[BackupService] Deleting existing data...');

                // 1. Delete all data in reverse dependency order
                // This order is critical to avoid foreign key constraint violations
                const deleteOrder = [
                    // Financial / Funds (Depend on many)
                    'fundTransfer', 'fundTransaction', 'aPPayment', 'aRPayment', 'expense',

                    // Sales / POS / AR (Depend on Orders, Customers, Products, Branches)
                    'customerPurchaseHistory', 'promotionUsage', 'pOSReceipt', 'pOSSaleItem', 'pOSSale',
                    'salesOrderItem', 'salesOrder', 'accountsReceivable', 'dailySalesSummary', 'employeePerformance',

                    // Purchasing / AP / Inventory (Depend on PO, Suppliers, Warehouses)
                    'receivingVoucherItem', 'receivingVoucher', 'purchaseOrderItem', 'purchaseOrder', 'accountsPayable',
                    'stockMovement', 'inventory',
                    'inventoryAdjustmentItem', 'inventoryAdjustment',
                    'inventoryTransferItem', 'inventoryTransfer',

                    // Jobs / Services
                    'jobImage', 'jobComment', 'jobPerformed', 'partsReplacement', 'jobOrder',

                    // Product Related (Leafs of transaction data, but roots for movement)
                    'productUOM', 'product',

                    // Master Data (Depend on reference data)
                    'salesAgent', 'customer', 'supplier', 'expenseVendor', 'fundSource',
                    'userBranchAccess', 'passwordResetToken', 'session', 'auditLog', 'notification', 'approvalRequest',
                    'roadmapComment', 'roadmapItem', 'reportExport', 'reportTemplate',

                    // Base Reference Data (Roots)
                    'productCategory', 'unitOfMeasure', 'paymentMethod', 'expenseCategory',
                    'user', 'warehouse', 'branch', 'rolePermission', 'permission', 'role', 'companySettings'
                ];

                for (const model of deleteOrder) {
                    try {
                        // @ts-ignore
                        await tx[model].deleteMany();
                        console.log(`[BackupService] ✓ Deleted ${model}`);
                    } catch (error) {
                        console.warn(`[BackupService] Failed to delete ${model} (might not exist or already empty):`, error);
                        // Re-throwing is safer for data integrity
                        if (error instanceof Error) {
                            throw new Error(`Failed to delete existing data for ${model}: ${error.message}`);
                        }
                        throw error;
                    }
                }

                console.log('[BackupService] Deletion phase complete.');

                // 2. Insert data in dependency order
                // This is loosely the reverse of deleteOrder
                const insertOrder = [
                    'role', 'permission', 'rolePermission', 'branch', 'warehouse', 'user', 'companySettings',
                    'productCategory', 'unitOfMeasure', 'paymentMethod', 'expenseCategory',
                    'userBranchAccess', 'fundSource', 'expenseVendor', 'supplier', 'customer', 'salesAgent',
                    'product', 'productUOM',
                    'jobOrder', 'partsReplacement', 'jobPerformed', 'jobComment', 'jobImage',
                    'inventory', 'stockMovement',
                    'inventoryAdjustment', 'inventoryAdjustmentItem',
                    'inventoryTransfer', 'inventoryTransferItem',
                    'purchaseOrder', 'purchaseOrderItem', 'receivingVoucher', 'receivingVoucherItem', 'accountsPayable',
                    'salesOrder', 'salesOrderItem', 'pOSSale', 'pOSSaleItem', 'pOSReceipt', 'promotionUsage',
                    'accountsReceivable',
                    'aPPayment', 'aRPayment', 'expense', 'fundTransaction', 'fundTransfer',
                    'dailySalesSummary', 'employeePerformance', 'customerPurchaseHistory',
                    'auditLog', 'session', 'passwordResetToken', 'notification', 'approvalRequest',
                    'roadmapItem', 'roadmapComment', 'reportTemplate', 'reportExport'
                ];

                console.log('[BackupService] Starting data restoration...');

                for (const model of insertOrder) {
                    const modelData = data[model];
                    if (modelData && Array.isArray(modelData) && modelData.length > 0) {
                        try {
                            // Chunk createMany to avoid parameter limits in PostgreSQL
                            const CHUNK_SIZE = 100;
                            for (let i = 0; i < modelData.length; i += CHUNK_SIZE) {
                                const chunk = modelData.slice(i, i + CHUNK_SIZE);
                                // @ts-ignore
                                await tx[model].createMany({ data: chunk });
                            }
                            logDebug(`✓ Restored ${model}`);
                        } catch (error) {
                            logDebug(`Failed to restore ${model}: ${error}`);
                            if (error instanceof Error) {
                                throw new Error(`Failed to restore data for ${model}: ${error.message}`);
                            }
                            throw error;
                        }
                    } else if (modelData) {
                        logDebug(`Skipping ${model} - empty array or null`);
                    }
                }

                logDebug('Data restoration complete.');
            }, {
                maxWait: 20000, // 20s
                timeout: 120000, // 120s
            });

            console.log('[BackupService] Restore completed successfully.');
        } catch (error) {
            console.error('[BackupService] Transaction failed:', error);
            if (error instanceof Error) {
                throw new Error(`Restore failed: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Normalizes backup data from older versions to the current version
     * @param backup - The raw backup data
     * @returns Normalized backup data
     */
    static normalizeBackupData(backup: BackupData): BackupData {
        if (backup.version === '2.0') {
            return backup;
        }

        console.log(`[BackupService] Normalizing backup data from version ${backup.version} to 2.0...`);

        // Mapping for v1.1 plural keys to v2.0 singular keys
        const keyMap: Record<string, string> = {
            'users': 'user',
            'roles': 'role',
            'permissions': 'permission',
            'rolePermissions': 'rolePermission',
            'sessions': 'session',
            'passwordResetTokens': 'passwordResetToken',
            'branches': 'branch',
            'warehouses': 'warehouse',
            'customers': 'customer',
            'suppliers': 'supplier',
            'salesAgents': 'salesAgent',
            'products': 'product',
            'productCategories': 'productCategory',
            'productUOMs': 'productUOM',
            'unitOfMeasures': 'unitOfMeasure',
            'paymentMethods': 'paymentMethod',
            'expenseCategories': 'expenseCategory',
            'expenseVendors': 'expenseVendor',
            'stockMovements': 'stockMovement',
            'inventoryAdjustments': 'inventoryAdjustment',
            'inventoryAdjustmentItems': 'inventoryAdjustmentItem',
            'inventoryTransfers': 'inventoryTransfer',
            'inventoryTransferItems': 'inventoryTransferItem',
            'purchaseOrders': 'purchaseOrder',
            'purchaseOrderItems': 'purchaseOrderItem',
            'receivingVouchers': 'receivingVoucher',
            'receivingVoucherItems': 'receivingVoucherItem',
            'accountsPayables': 'accountsPayable',
            'aPPayments': 'aPPayment',
            'apPayments': 'aPPayment',
            'salesOrders': 'salesOrder',
            'salesOrderItems': 'salesOrderItem',
            'pOSSales': 'pOSSale',
            'posSales': 'pOSSale',
            'pOSSaleItems': 'pOSSaleItem',
            'posSaleItems': 'pOSSaleItem',
            'pOSReceipts': 'pOSReceipt',
            'posReceipts': 'pOSReceipt',
            'promotionUsages': 'promotionUsage',
            'customerPurchaseHistories': 'customerPurchaseHistory',
            'dailySalesSummaries': 'dailySalesSummary',
            'accountsReceivables': 'accountsReceivable',
            'aRPayments': 'aRPayment',
            'arPayments': 'aRPayment',
            'employeePerformances': 'employeePerformance',
            'expenses': 'expense',
            'fundSources': 'fundSource',
            'fundTransactions': 'fundTransaction',
            'fundTransfers': 'fundTransfer',
            'jobOrders': 'jobOrder',
            'jobComments': 'jobComment',
            'jobImages': 'jobImage',
            'jobPerformeds': 'jobPerformed',
            'partsReplacements': 'partsReplacement',
            'auditLogs': 'auditLog',
            'reportExports': 'reportExport',
            'reportTemplates': 'reportTemplate',
            'roadmapItems': 'roadmapItem',
            'roadmapComments': 'roadmapComment',
            'approvalRequests': 'approvalRequest',
            'notifications': 'notification',
        };

        const normalizedData: Record<string, any[]> = {};
        const oldData = backup.data;

        for (const [key, value] of Object.entries(oldData)) {
            const newKey = keyMap[key] || key;
            normalizedData[newKey] = value;
        }

        return {
            ...backup,
            version: '2.0',
            data: normalizedData
        };
    }


}
