import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperMegaAdmin } from '@/lib/middleware/super-mega-admin.middleware';

// Ensure this route runs in the Node.js runtime (not Edge) to avoid Prisma edge incompatibility
export const runtime = 'nodejs';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

export const dynamic = 'force-dynamic';

// List of tables that can be safely deleted (excluding system tables)
const DELETABLE_TABLES = [
    'Product',
    'ProductUOM',
    'Inventory',
    'StockMovement',
    'Customer',
    'Supplier',
    'Warehouse',
    'Branch',
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
    'CustomerPurchaseHistory',
    'DailySalesSummary',
    'EmployeePerformance',
    'PromotionUsage',
    'AuditLog',
] as const;

type DeletableTable = typeof DELETABLE_TABLES[number];

export async function POST(request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify token
        const payload = authService.verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid session' },
                { status: 401 }
            );
        }

        // Get user and check Super Mega Admin permission
        const user = await userService.getUserById(payload.userId);
        requireSuperMegaAdmin(user);

        const body = await request.json();
        const { tableName } = body as { tableName: string };

        // Validate table name
        if (!tableName || !DELETABLE_TABLES.includes(tableName as DeletableTable)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid table name. Only specific tables can be deleted.',
                },
                { status: 400 }
            );
        }

        // Get count before deletion
        const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
        const countBefore = await (prisma as any)[modelName].count();

        // Delete all records from the specified table
        await (prisma as any)[modelName].deleteMany({});

        return NextResponse.json({
            success: true,
            data: {
                tableName,
                deletedCount: countBefore,
                message: `Successfully deleted ${countBefore} records from ${tableName}`,
            },
        });
    } catch (error: any) {
        console.error('Error deleting table data:', error);

        if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to delete table data',
            },
            { status: 500 }
        );
    }
}
