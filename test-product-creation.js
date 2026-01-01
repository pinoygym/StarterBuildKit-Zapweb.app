// Test script to check if product creation works
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductCreation() {
    try {
        console.log('Testing product creation...');

        const testProduct = await prisma.product.create({
            data: {
                id: 'test-' + Date.now(),
                name: 'Test Product Script ' + Date.now(),
                category: 'Juices',
                basePrice: 50,
                baseUOM: 'bottle',
                minStockLevel: 10,
                shelfLifeDays: 365,
                status: 'active',
                averageCostPrice: 30,
                updatedAt: new Date(),
                productUOMs: {
                    create: [{
                        id: 'uom-' + Date.now(),
                        name: 'pack',
                        conversionFactor: 6,
                        sellingPrice: 280
                    }]
                }
            },
            include: {
                productUOMs: true
            }
        });

        console.log('Success! Created product:', JSON.stringify(testProduct, null, 2));
    } catch (error) {
        console.error('Error creating product:');
        console.error('Message:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testProductCreation();
