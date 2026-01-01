// @ts-nocheck
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

config();

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function reproduceSaveError() {
    try {
        console.log('1. Setting up test data...');

        // Create Branch
        console.log('Creating branch...');
        const branch = await prisma.branch.create({
            data: {
                id: randomUUID(),
                name: `Test Branch ${Date.now()}`,
                code: `TB-${Date.now()}`,
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '1234567890',
                updatedAt: new Date(),
            }
        });
        console.log('Branch created:', branch.id);

        // Create Warehouse
        console.log('Creating warehouse...');
        const warehouse = await prisma.warehouse.create({
            data: {
                id: randomUUID(),
                name: `Test Warehouse ${Date.now()}`,
                location: 'Test Location',
                branchId: branch.id,
                updatedAt: new Date(),
            }
        });
        console.log('Warehouse created:', warehouse.id);

        // Create Supplier
        console.log('Creating supplier...');
        const supplier = await prisma.supplier.create({
            data: {
                id: randomUUID(),
                companyName: `Test Supplier ${Date.now()}`,
                contactPerson: 'Test Person',
                email: `supplier-${Date.now()}@test.com`,
                phone: '1234567890',
                updatedAt: new Date(),
            }
        });

        // Create Product
        console.log('Creating product...');
        const product = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: `Test Product ${Date.now()}`,
                category: 'Test',
                basePrice: 100,
                baseUOM: 'pcs',
                minStockLevel: 10,
                shelfLifeDays: 365,
                updatedAt: new Date(),
            }
        });

        // Create PO
        console.log('Creating PO...');
        const po = await prisma.purchaseOrder.create({
            data: {
                id: randomUUID(),
                poNumber: `PO-${Date.now()}`,
                supplierId: supplier.id,
                warehouseId: warehouse.id,
                branchId: branch.id,
                totalAmount: 1000,
                status: 'ordered',
                expectedDeliveryDate: new Date(),
                updatedAt: new Date(),
                PurchaseOrderItem: {
                    create: {
                        id: randomUUID(),
                        productId: product.id,
                        quantity: 10,
                        unitPrice: 100,
                        subtotal: 1000,
                        uom: 'pcs',
                        receivedQuantity: 0,
                    }
                }
            }
        });

        console.log('Test data created. PO ID:', po.id);

        // 2. Login
        console.log('2. Logging in...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@'
            })
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error('Login failed');
        const token = loginData.token;

        // 3. Create RV
        console.log('3. Creating Receiving Voucher...');
        const rvData = {
            purchaseOrderId: po.id,
            receiverName: 'Test Receiver',
            deliveryNotes: 'Test Delivery',
            items: [
                {
                    productId: product.id,
                    orderedQuantity: 10,
                    receivedQuantity: 10,
                    unitPrice: 100,
                    uom: 'pcs'
                }
            ]
        };

        const rvResponse = await fetch('http://localhost:3000/api/receiving-vouchers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(rvData)
        });

        const rvResult = await rvResponse.json();
        console.log('RV Creation Status:', rvResponse.status);

        if (!rvResponse.ok) {
            console.log('RV Creation Error:', JSON.stringify(rvResult, null, 2));
        } else {
            console.log('RV Created Successfully:', rvResult.data.rvNumber);
        }

        // Cleanup
        console.log('Cleaning up...');
        try {
            await prisma.receivingVoucher.deleteMany({ where: { purchaseOrderId: po.id } });
            await prisma.purchaseOrder.delete({ where: { id: po.id } });
            await prisma.product.delete({ where: { id: product.id } });
            await prisma.supplier.delete({ where: { id: supplier.id } });
            await prisma.warehouse.delete({ where: { id: warehouse.id } });
            await prisma.branch.delete({ where: { id: branch.id } });
        } catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError);
        }

    } catch (error) {
        console.error('Script failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        if ((error as any).code) {
            console.error('Prisma Error Code:', (error as any).code);
            console.error('Prisma Error Meta:', (error as any).meta);
        }
    } finally {
        await prisma.$disconnect();
    }
}

reproduceSaveError();
