/**
 * Backup Version Converter
 * Converts v1.1 backups (plural keys) to v2.0 format (singular keys)
 */

import fs from 'fs/promises';
import path from 'path';

interface BackupData {
    version: string;
    timestamp: string;
    data: Record<string, any[]>;
    _filename?: string;
}

// Mapping of plural to singular model names (based on Prisma schema)
const KEY_MAPPINGS: Record<string, string> = {
    // Core
    'users': 'user',
    'roles': 'role',
    'permissions': 'permission',
    'rolePermissions': 'rolePermission',
    'sessions': 'session',
    'passwordResetTokens': 'passwordResetToken',

    // Organization
    'branches': 'branch',
    'warehouses': 'warehouse',
    'userBranchAccess': 'userBranchAccess', // Already singular (no 'es' ending)
    'companySettings': 'companySettings', // Already singular (settings is the model name)

    // Master Data
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

    // Inventory
    'inventory': 'inventory', // Already singular
    'stockMovements': 'stockMovement',
    'inventoryAdjustments': 'inventoryAdjustment',
    'inventoryAdjustmentItems': 'inventoryAdjustmentItem',
    'inventoryTransfers': 'inventoryTransfer',
    'inventoryTransferItems': 'inventoryTransferItem',

    // Purchasing
    'purchaseOrders': 'purchaseOrder',
    'purchaseOrderItems': 'purchaseOrderItem',
    'receivingVouchers': 'receivingVoucher',
    'receivingVoucherItems': 'receivingVoucherItem',
    'accountsPayables': 'accountsPayable',
    'aPPayments': 'aPPayment',
    'apPayments': 'aPPayment', // Alternative spelling

    // Sales
    'salesOrders': 'salesOrder',
    'salesOrderItems': 'salesOrderItem',
    'pOSSales': 'pOSSale',
    'posSales': 'pOSSale', // Alternative spelling
    'pOSSaleItems': 'pOSSaleItem',
    'posSaleItems': 'pOSSaleItem', // Alternative spelling
    'pOSReceipts': 'pOSReceipt',
    'posReceipts': 'pOSReceipt', // Alternative spelling
    'promotionUsages': 'promotionUsage',
    'customerPurchaseHistories': 'customerPurchaseHistory',
    'dailySalesSummaries': 'dailySalesSummary',
    'accountsReceivables': 'accountsReceivable',
    'aRPayments': 'aRPayment',
    'arPayments': 'aRPayment', // Alternative spelling
    'employeePerformances': 'employeePerformance',

    // Financials
    'expenses': 'expense',
    'fundSources': 'fundSource',
    'fundTransactions': 'fundTransaction',
    'fundTransfers': 'fundTransfer',

    // Services / Jobs
    'jobOrders': 'jobOrder',
    'jobComments': 'jobComment',
    'jobImages': 'jobImage',
    'jobPerformeds': 'jobPerformed',
    'jobPerformed': 'jobPerformed', // Already singular
    'partsReplacements': 'partsReplacement',

    // Others
    'auditLogs': 'auditLog',
    'reportExports': 'reportExport',
    'reportTemplates': 'reportTemplate',
    'roadmapItems': 'roadmapItem',
    'roadmapComments': 'roadmapComment',
    'approvalRequests': 'approvalRequest',
    'notifications': 'notification',
};


async function convertBackup(inputPath: string, outputPath?: string) {
    console.log('🔄 BACKUP VERSION CONVERTER');
    console.log('='.repeat(80));
    console.log();

    try {
        // Read input file
        console.log(`📖 Reading: ${path.basename(inputPath)}`);
        const fileContent = await fs.readFile(inputPath, 'utf8');
        const oldBackup: BackupData = JSON.parse(fileContent);

        console.log(`   Version: ${oldBackup.version}`);
        console.log(`   Timestamp: ${oldBackup.timestamp}`);
        console.log();

        // Convert data keys
        const newData: Record<string, any[]> = {};
        let convertedCount = 0;
        let skippedCount = 0;
        let unknownKeys: string[] = [];

        for (const [oldKey, value] of Object.entries(oldBackup.data)) {
            const newKey = KEY_MAPPINGS[oldKey];

            if (newKey) {
                newData[newKey] = value;
                convertedCount++;
                if (value && value.length > 0) {
                    console.log(`   ✓ ${oldKey} → ${newKey} (${value.length} records)`);
                }
            } else {
                // Unknown key - keep as is but warn
                newData[oldKey] = value;
                unknownKeys.push(oldKey);
                skippedCount++;
                if (value && value.length > 0) {
                    console.log(`   ⚠ ${oldKey} (kept as-is, ${value.length} records)`);
                }
            }
        }

        console.log();
        console.log(`📊 Conversion Summary:`);
        console.log(`   Converted: ${convertedCount} keys`);
        console.log(`   Kept as-is: ${skippedCount} keys`);

        if (unknownKeys.length > 0) {
            console.log();
            console.log(`⚠️  Unknown keys (kept unchanged):`);
            unknownKeys.forEach(key => console.log(`   - ${key}`));
        }

        // Create new backup object
        const newBackup: BackupData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: newData
        };

        // Determine output path
        if (!outputPath) {
            const dir = path.dirname(inputPath);
            const basename = path.basename(inputPath, '.json');
            outputPath = path.join(dir, `${basename}_v2.json`);
        }

        // Write output file
        console.log();
        console.log(`💾 Writing: ${path.basename(outputPath)}`);
        await fs.writeFile(outputPath, JSON.stringify(newBackup, null, 2), 'utf8');

        console.log();
        console.log('✅ CONVERSION COMPLETE');
        console.log(`   Input:  ${inputPath}`);
        console.log(`   Output: ${outputPath}`);
        console.log();
        console.log('🎯 Next Steps:');
        console.log('   1. Review the converted file');
        console.log('   2. Use the converted file for restore');
        console.log('   3. Keep the original as backup');
        console.log();
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Conversion failed:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }
        process.exit(1);
    }
}

// Main execution
const inputPath = process.argv[2] || path.join(process.cwd(), 'Ormoc_Buenas_Shoppers_2025-12-31_08-39-49.json');
const outputPath = process.argv[3];

if (!inputPath) {
    console.error('Usage: bun run scripts/convert-backup-v1-to-v2.ts <input-file> [output-file]');
    process.exit(1);
}

convertBackup(inputPath, outputPath);
