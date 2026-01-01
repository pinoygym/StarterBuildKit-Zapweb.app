
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Checking for products with doubled UOMs (e.g. "bottlebottle")...');

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      baseUOM: true,
    },
  });

  let fixedCount = 0;

  for (const product of products) {
    const uom = product.baseUOM;
    // Check if UOM is a repetition of itself (e.g. "bottlebottle", "cancan")
    // Simple heuristic: split in half, check if halves are equal
    if (uom.length > 1 && uom.length % 2 === 0) {
      const mid = uom.length / 2;
      const firstHalf = uom.substring(0, mid);
      const secondHalf = uom.substring(mid);
      
      if (firstHalf === secondHalf) {
        console.log(`Found doubled UOM for product "${product.name}": "${uom}" -> "${firstHalf}"`);
        
        await prisma.product.update({
          where: { id: product.id },
          data: { baseUOM: firstHalf },
        });
        fixedCount++;
      }
    }
  }

  console.log(`Fixed ${fixedCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
