
import { prisma } from './lib/prisma';

async function main() {
  console.log('Fetching products...');
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        baseUOM: true,
      },
      take: 20,
    });
    
    console.log('Products found:', products.length);
    products.forEach(p => {
      console.log(`Product: ${p.name}, Base UOM: '${p.baseUOM}'`);
    });
  } catch (e) {
    console.error('Error fetching products:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
