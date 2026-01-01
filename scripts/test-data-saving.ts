/**
 * Comprehensive test to verify data saving works across all modules
 * This tests the core CRUD operations after schema fixes
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';

interface TestResult {
    module: string;
    operation: string;
    success: boolean;
    error?: string;
}

const results: TestResult[] = [];

async function testModule(
    moduleName: string,
    createFn: () => Promise<any>,
    updateFn: (id: string) => Promise<any>,
    deleteFn: (id: string) => Promise<any>
) {
    let createdId: string | null = null;

    try {
        // Test CREATE
        console.log(`Testing ${moduleName} - CREATE...`);
        const created = await createFn();
        createdId = created.id;

        if (!created.id) {
            throw new Error('ID was not auto-generated');
        }

        results.push({
            module: moduleName,
            operation: 'CREATE',
            success: true,
        });
        console.log(`✅ ${moduleName} - CREATE successful (ID: ${createdId})`);

        // Test UPDATE
        console.log(`Testing ${moduleName} - UPDATE...`);
        const updated = await updateFn(createdId);

        if (!updated.updatedAt) {
            throw new Error('updatedAt was not auto-set');
        }

        results.push({
            module: moduleName,
            operation: 'UPDATE',
            success: true,
        });
        console.log(`✅ ${moduleName} - UPDATE successful`);

        // Test DELETE
        console.log(`Testing ${moduleName} - DELETE...`);
        await deleteFn(createdId);
        results.push({
            module: moduleName,
            operation: 'DELETE',
            success: true,
        });
        console.log(`✅ ${moduleName} - DELETE successful\n`);

    } catch (error: any) {
        const operation = createdId ? 'UPDATE/DELETE' : 'CREATE';
        results.push({
            module: moduleName,
            operation,
            success: false,
            error: error.message,
        });
        console.error(`❌ ${moduleName} - ${operation} failed:`, error.message, '\n');

        // Cleanup if creation succeeded
        if (createdId) {
            try {
                await deleteFn(createdId);
            } catch (cleanupError) {
                console.error(`Failed to cleanup ${moduleName}:`, cleanupError);
            }
        }
    }
}

async function runTests() {
    console.log('🧪 Starting comprehensive data saving tests...\n');
    console.log('='.repeat(60) + '\n');

    // Test 1: Branch
    await testModule(
        'Branch',
        () => prisma.branch.create({
            data: {
                name: 'Test Branch',
                code: `TEST-${Date.now()}`,
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '1234567890',
            },
        }),
        (id) => prisma.branch.update({
            where: { id },
            data: { manager: 'Updated Manager' },
        }),
        (id) => prisma.branch.delete({ where: { id } })
    );

    // Test 2: Supplier
    await testModule(
        'Supplier',
        () => prisma.supplier.create({
            data: {
                companyName: 'Test Supplier',
                contactPerson: 'John Doe',
                phone: '1234567890',
                email: 'test@supplier.com',
                paymentTerms: 'Net 30',
            },
        }),
        (id) => prisma.supplier.update({
            where: { id },
            data: { contactPerson: 'Jane Doe' },
        }),
        (id) => prisma.supplier.delete({ where: { id } })
    );

    // Test 3: Customer
    await testModule(
        'Customer',
        () => prisma.customer.create({
            data: {
                customerCode: `CUST-${Date.now()}`,
                contactPerson: 'Test Customer',
                phone: '1234567890',
                email: 'test@customer.com',
            },
        }),
        (id) => prisma.customer.update({
            where: { id },
            data: { contactPerson: 'Updated Customer' },
        }),
        (id) => prisma.customer.delete({ where: { id } })
    );

    // Test 4: Product Category
    await testModule(
        'ProductCategory',
        () => prisma.productCategory.create({
            data: {
                name: `Test Category ${Date.now()}`,
                code: `CAT-${Date.now()}`,
                description: 'Test Description',
            },
        }),
        (id) => prisma.productCategory.update({
            where: { id },
            data: { description: 'Updated Description' },
        }),
        (id) => prisma.productCategory.delete({ where: { id } })
    );

    // Test 5: Unit of Measure
    await testModule(
        'UnitOfMeasure',
        () => prisma.unitOfMeasure.create({
            data: {
                name: `Test UOM ${Date.now()}`,
                code: `UOM-${Date.now()}`,
                description: 'Test UOM',
            },
        }),
        (id) => prisma.unitOfMeasure.update({
            where: { id },
            data: { description: 'Updated UOM' },
        }),
        (id) => prisma.unitOfMeasure.delete({ where: { id } })
    );

    // Test 6: Expense Category
    await testModule(
        'ExpenseCategory',
        () => prisma.expenseCategory.create({
            data: {
                name: `Test Expense ${Date.now()}`,
                code: `EXP-${Date.now()}`,
                description: 'Test Expense',
            },
        }),
        (id) => prisma.expenseCategory.update({
            where: { id },
            data: { description: 'Updated Expense' },
        }),
        (id) => prisma.expenseCategory.delete({ where: { id } })
    );

    // Test 7: Payment Method
    await testModule(
        'PaymentMethod',
        () => prisma.paymentMethod.create({
            data: {
                name: `Test Payment ${Date.now()}`,
                code: `PAY-${Date.now()}`,
                description: 'Test Payment',
                applicableTo: ['POS', 'AR'],
            },
        }),
        (id) => prisma.paymentMethod.update({
            where: { id },
            data: { description: 'Updated Payment' },
        }),
        (id) => prisma.paymentMethod.delete({ where: { id } })
    );

    // Test 8: Sales Agent
    await testModule(
        'SalesAgent',
        () => prisma.salesAgent.create({
            data: {
                name: `Test Agent ${Date.now()}`,
                code: `AGT-${Date.now()}`,
                phone: '1234567890',
            },
        }),
        (id) => prisma.salesAgent.update({
            where: { id },
            data: { phone: '0987654321' },
        }),
        (id) => prisma.salesAgent.delete({ where: { id } })
    );

    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:\n');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Total: ${results.length}\n`);

    if (failCount > 0) {
        console.log('Failed tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.module} (${r.operation}): ${r.error}`);
        });
    }

    await prisma.$disconnect();

    process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch((error) => {
    console.error('Fatal error:', error);
    prisma.$disconnect();
    process.exit(1);
});
