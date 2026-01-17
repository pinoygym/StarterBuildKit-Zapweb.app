const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUOMSetup() {
  try {
    console.log('=== Checking UOM Setup for Absolute Product ===');

    // Find the Absolute product
    const products = await prisma.product.findMany({
      where: { name: { contains: 'Absolute' } },
      include: { ProductUOM: true }
    });

    console.log(`Found ${products.length} products with 'Absolute' in name:`);

    for (const product of products) {
      console.log(`\nProduct: ${product.name} (ID: ${product.id})`);
      console.log(`Base UOM: ${product.baseUOM}`);
      console.log(`ProductUOM records: ${product.ProductUOM?.length || 0}`);

      if (product.ProductUOM && product.ProductUOM.length > 0) {
        console.log('UOM Configurations:');
        for (const uom of product.ProductUOM) {
          console.log(`  - ${uom.name}: conversion factor = ${uom.conversionFactor}`);
        }
      } else {
        console.log('  ❌ No UOM configurations found!');
      }

      // Check recent inventory batches
      const batches = await prisma.inventoryBatch.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      console.log(`Recent inventory batches: ${batches.length}`);
      for (const batch of batches) {
        console.log(`  - Batch ${batch.batchNumber}: ${batch.quantity} ${product.baseUOM} @ ₱${batch.unitCost}`);
      }

      // Check recent stock movements
      const movements = await prisma.stockMovement.findMany({
        where: {
          batchId: { in: batches.map(b => b.id) }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      console.log(`Recent stock movements: ${movements.length}`);
      for (const movement of movements) {
        console.log(`  - ${movement.type} ${movement.quantity} - ${movement.reason}`);
      }
    }

    // Check if there are any purchase orders with case UOM
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: {
        uom: { equals: 'case', mode: 'insensitive' }
      },
      include: {
        Product: true,
        PurchaseOrder: true
      },
      take: 5
    });

    console.log(`\n=== Purchase Order Items with 'case' UOM: ${poItems.length} ===`);
    for (const item of poItems) {
      console.log(`PO ${item.PurchaseOrder.poNumber}: ${item.Product.name} - ${item.quantity} ${item.uom} ordered, ${item.receivedQuantity} received`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUOMSetup();