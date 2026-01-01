import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const DATA_DIR = path.join(__dirname, 'prod-data');

function readJson(tableName: string) {
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: Data file for ${tableName} not found at ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content, (key, value) => {
        // Simple date detection: ISO 8601 strings
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
            return new Date(value);
        }
        return value;
    });
}

export async function seedFromProdData(prisma: PrismaClient) {
    console.log('Seeding from Production Data...');

    // Order matters for foreign keys
    const tables = [
        'UnitOfMeasure',
        'Permission',
        'Role',
        'RolePermission',
        'Branch',
        'Warehouse',
        'Supplier',
        'Customer',
        'ProductCategory',
        'Product',
        'ProductUOM',
        'Inventory',
        'User',
        'UserBranchAccess',
        'SalesAgent',
        'PaymentMethod',
        'ExpenseCategory',
        'ExpenseVendor',
        'CompanySettings',
        'ReportTemplate',
        'PurchaseOrder',
        'PurchaseOrderItem',
        'ReceivingVoucher',
        'ReceivingVoucherItem',
        'SalesOrder',
        'SalesOrderItem',
        'POSSale',
        'POSSaleItem',
        'POSReceipt',
        'AccountsPayable',
        'APPayment',
        'AccountsReceivable',
        'ARPayment',
        'Expense',
        'EmployeePerformance',
        'DailySalesSummary',
        'PromotionUsage',
        'StockMovement',
        'Session',
        'PasswordResetToken',
        'AuditLog',
        'ReportExport'
    ];

    // Default password hash for 'Qweasd145698@'
    const defaultPasswordHash = await bcrypt.hash('Qweasd145698@', 10);

    for (const tableName of tables) {
        const data = readJson(tableName);
        if (data.length === 0) continue;

        console.log(`Seeding ${tableName} (${data.length} records)...`);

        // Special handling for User table to reset passwords
        if (tableName === 'User') {
            for (const user of data) {
                user.passwordHash = defaultPasswordHash;
            }
        }

        // Use createMany for performance, but skip duplicates if needed
        // Note: createMany is not supported for all databases in older Prisma, but works for Postgres/SQLite in recent versions.
        // However, if there are foreign key violations due to missing data (e.g. excluded tables), this might fail.

        // We use a transaction or just loop and create. createMany is better.
        try {
            // @ts-ignore - Dynamic access to prisma model
            await prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)].createMany({
                data: data,
                skipDuplicates: true,
            });
        } catch (e: any) {
            console.error(`Error seeding ${tableName}:`, e.message);
            // Fallback to one-by-one if createMany fails (e.g. unique constraint issues not handled by skipDuplicates in some cases)
            // or just to see which one failed.
            /*
            for (const item of data) {
                try {
                    // @ts-ignore
                    await prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)].create({
                        data: item,
                    });
                } catch (innerE: any) {
                    console.error(`  Failed to create record in ${tableName}:`, innerE.message);
                }
            }
            */
        }
    }

    console.log('Production Data Seed Completed!');
}
