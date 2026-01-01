import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperMegaAdmin } from '@/lib/middleware/super-mega-admin.middleware';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// const prisma = new PrismaClient(); // Removed

export const POST = asyncHandler(async (request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return Response.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify token
        const payload = authService.verifyToken(token);

        if (!payload) {
            return Response.json(
                { success: false, error: 'Invalid session' },
                { status: 401 }
            );
        }

        // Get user and check Super Mega Admin permission
        const user = await userService.getUserById(payload.userId);
        requireSuperMegaAdmin(user);

        const summary: Record<string, number> = {};

        // Create test branches
        const branch = await prisma.branch.upsert({
            where: { code: 'TEST-001' },
            update: {},
            create: {
                id: randomUUID(),
                name: 'Test Branch',
                code: 'TEST-001',
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '+63-999-999-9999',
                status: 'active',
                updatedAt: new Date(),
            },
        });
        summary['Branches'] = 1;

        // Create test warehouse
        const warehouse = await prisma.warehouse.upsert({
            where: { id: branch.id + '-warehouse' },
            update: {},
            create: {
                id: branch.id + '-warehouse',
                name: 'Test Warehouse',
                location: 'Test Warehouse Location',
                manager: 'Test Warehouse Manager',
                maxCapacity: 10000,
                branchId: branch.id,
                updatedAt: new Date(),
            },
        });
        summary['Warehouses'] = 1;

        // Create test supplier (upsert to avoid duplicates)
        const supplier = await prisma.supplier.upsert({
            where: { id: 'test-supplier-001' },
            update: {
                updatedAt: new Date(),
            },
            create: {
                id: 'test-supplier-001',
                companyName: 'Test Supplier Co.',
                contactPerson: 'Test Contact',
                phone: '+63-888-888-8888',
                email: 'test@supplier.com',
                paymentTerms: 'Net 30',
                status: 'active',
                updatedAt: new Date(),
            },
        });
        summary['Suppliers'] = 1;

        // Create test customer
        const customer = await prisma.customer.create({
            data: {
                id: randomUUID(),
                customerCode: `CUST-TEST-${Date.now()}`,
                contactPerson: 'Test Customer',
                phone: '+63-777-777-7777',
                email: 'test@customer.com',
                address: 'Test Address',
                city: 'Test City',
                region: 'Test Region',
                paymentTerms: 'Net 30',
                status: 'active',
                updatedAt: new Date(),
            },
        });
        summary['Customers'] = 1;

        // Create test products with timestamp to ensure uniqueness
        const timestamp = Date.now();
        const products = [];
        for (let i = 1; i <= 5; i++) {
            const product = await prisma.product.create({
                data: {
                    id: randomUUID(),
                    name: `Test Product ${i} (${timestamp})`,
                    description: `Test product description ${i}`,
                    category: 'Test Category',
                    basePrice: 100 * i,
                    baseUOM: 'pcs',
                    minStockLevel: 10,
                    shelfLifeDays: 365,
                    status: 'active',
                    averageCostPrice: 60 * i,
                    updatedAt: new Date(),
                    productUOMs: {
                        create: [
                            {
                                id: randomUUID(),
                                name: 'pack',
                                conversionFactor: 10,
                                sellingPrice: 950 * i,
                            },
                        ],
                    },
                },
            });
            products.push(product);

            // Add inventory
            await prisma.inventory.create({
                data: {
                    productId: product.id,
                    warehouseId: warehouse.id,
                    quantity: 100 * i,
                },
            });
        }
        summary['Products'] = products.length;
        summary['Inventory Records'] = products.length;

        // Create test purchase order
        await prisma.purchaseOrder.create({
            data: {
                id: randomUUID(),
                poNumber: `PO-TEST-${Date.now()}`,
                supplierId: supplier.id,
                warehouseId: warehouse.id,
                branchId: branch.id,
                totalAmount: 5000,
                status: 'approved',
                receivingStatus: 'pending',
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
                PurchaseOrderItem: {
                    create: products.slice(0, 3).map((product) => ({
                        id: randomUUID(),
                        productId: product.id,
                        quantity: 50,
                        unitPrice: product.basePrice,
                        subtotal: 50 * product.basePrice,
                        uom: 'pcs',
                    })),
                },
            },
        });
        summary['Purchase Orders'] = 1;
        summary['PO Items'] = 3;

        // Create test sales order
        await prisma.salesOrder.create({
            data: {
                id: randomUUID(),
                orderNumber: `SO-TEST-${Date.now()}`,
                customerId: customer.id,
                customerName: customer.contactPerson,
                customerPhone: customer.phone!,
                customerEmail: customer.email,
                deliveryAddress: customer.address!,
                warehouseId: warehouse.id,
                branchId: branch.id,
                totalAmount: 3000,
                status: 'confirmed',
                salesOrderStatus: 'pending',
                deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
                SalesOrderItem: {
                    create: products.slice(0, 2).map((product) => ({
                        id: randomUUID(),
                        productId: product.id,
                        quantity: 20,
                        unitPrice: product.basePrice,
                        subtotal: 20 * product.basePrice,
                        uom: 'pcs',
                    })),
                },
            },
        });
        summary['Sales Orders'] = 1;
        summary['SO Items'] = 2;

        return Response.json({
            success: true,
            data: {
                summary,
                message: 'Test data seeded successfully',
            },
        });
    } catch (error: any) {
        console.error('Error seeding test data:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));

        if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
            return Response.json(
                { success: false, error: error.message },
                { status: 403 }
            );
        }

        return Response.json(
            {
                success: false,
                error: error.message || 'Failed to seed test data',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
