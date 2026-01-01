const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('Connecting to database...');

        // Count records in key tables
        const userCount = await prisma.user.count();
        const branchCount = await prisma.branch.count();
        const productCount = await prisma.product.count();
        const customerCount = await prisma.customer.count();
        const saleCount = await prisma.pOSSale.count();
        const receiptCount = await prisma.pOSReceipt.count();
        const warehouseCount = await prisma.warehouse.count();
        const inventoryCount = await prisma.inventory.count();

        console.log('\n--- Data Integrity Check ---');
        console.log(`Users: ${userCount} `);
        console.log(`Branches: ${branchCount} `);
        console.log(`Warehouses: ${warehouseCount} `);
        console.log(`Products: ${productCount} `);
        console.log(`Inventory Records: ${inventoryCount} `);
        console.log(`Customers: ${customerCount} `);
        console.log(`POS Sales: ${saleCount} `);
        console.log(`POS Receipts: ${receiptCount} `);

        if (userCount > 0 && productCount > 0) {
            console.log('\n✅ Data appears to be intact.');
        } else {
            console.log('\n⚠️  Warning: Critical tables appear to be empty.');
        }

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
