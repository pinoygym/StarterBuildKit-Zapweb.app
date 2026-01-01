const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUOM() {
  try {
    console.log('=== Checking Product UOM Configurations ===');
    
    // Get the Absolute product with UOM configurations
    const products = await prisma.product.findMany({
      where: { name: { contains: 'Absolute' } },
      include: { ProductUOM: true }
    });
    
    console.log('Products found:', products.length);
    
    for (const product of products) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`Base UOM: ${product.baseUOM}`);
      console.log(`ProductUOM count: ${product.ProductUOM?.length || 0}`);
      
      if (product.ProductUOM) {
        for (const uom of product.ProductUOM) {
          console.log(`  - ${uom.name}: conversion factor = ${uom.conversionFactor}`);
        }
      }
    }
    
    // Check inventory batches for this product
    const batches = await prisma.inventoryBatch.findMany({
      where: { productId: products[0]?.id },
      include: { Product: true }
    });
    
    console.log(`\n=== Inventory Batches for ${products[0]?.name} ===`);
    console.log(`Batches found: ${batches.length}`);
    
    for (const batch of batches) {
      console.log(`Batch ${batch.batchNumber}:`);
      console.log(`  Quantity: ${batch.quantity} (in base UOM: ${batch.Product.baseUOM})`);
      console.log(`  Unit Cost: ${batch.unitCost}`);
      console.log(`  Status: ${batch.status}`);
    }
    
    // Check stock movements
    const movements = await prisma.stockMovement.findMany({
      where: { batchId: { in: batches.map(b => b.id) } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n=== Recent Stock Movements ===`);
    for (const movement of movements) {
      console.log(`Movement: ${movement.type} ${movement.quantity} - ${movement.reason}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUOM();