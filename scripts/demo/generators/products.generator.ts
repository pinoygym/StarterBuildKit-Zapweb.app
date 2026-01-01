import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

interface ProductConfig {
  waterProducts: number;
  carbonatedProducts: number;
  juiceProducts: number;
  energyProducts: number;
  sportsProducts: number;
}

export class ProductGenerator {
  static async generate(prisma: PrismaClient, config: ProductConfig) {
    console.log('📦 Generating product catalog...');

    const products = [];

    // Get or create categories
    const waterCategory = await prisma.productCategory.upsert({
      where: { name: 'Water' },
      update: {},
      create: { name: 'Water', description: 'Bottled water products', code: 'WATER', updatedAt: new Date() },
    });

    const carbonatedCategory = await prisma.productCategory.upsert({
      where: { name: 'Carbonated' },
      update: {},
      create: { name: 'Carbonated', description: 'Carbonated soft drinks', code: 'CARB', updatedAt: new Date() },
    });

    const juiceCategory = await prisma.productCategory.upsert({
      where: { name: 'Juice' },
      update: {},
      create: { name: 'Juice', description: 'Fruit juice beverages', code: 'JUICE', updatedAt: new Date() },
    });

    const energyCategory = await prisma.productCategory.upsert({
      where: { name: 'Energy Drinks' },
      update: {},
      create: { name: 'Energy Drinks', description: 'Energy and sports drinks', code: 'ENERGY', updatedAt: new Date() },
    });

    const sportsCategory = await prisma.productCategory.upsert({
      where: { name: 'Sports Drinks' },
      update: {},
      create: { name: 'Sports Drinks', description: 'Isotonic sports beverages', code: 'SPORTS', updatedAt: new Date() },
    });

    // Water products
    const waterProducts = [
      { name: 'Absolute Water 500ml', price: 10, cost: 7, uom: 'bottle', shelfLife: 365 },
      { name: 'Absolute Water 1L', price: 18, cost: 12, uom: 'bottle', shelfLife: 365 },
      { name: 'Absolute Water 5-Gallon', price: 150, cost: 100, uom: 'gallon', shelfLife: 180 },
      { name: 'Wilkins Water 500ml', price: 12, cost: 8, uom: 'bottle', shelfLife: 365 },
      { name: 'Summit Water 1L', price: 20, cost: 14, uom: 'bottle', shelfLife: 365 },
      { name: 'Nature Spring 500ml', price: 11, cost: 7.5, uom: 'bottle', shelfLife: 365 },
      { name: 'Viva Water 350ml', price: 8, cost: 5, uom: 'bottle', shelfLife: 365 },
      { name: 'Hidden Spring 1.5L', price: 25, cost: 17, uom: 'bottle', shelfLife: 365 },
      { name: 'Mineral Water 500ml', price: 15, cost: 10, uom: 'bottle', shelfLife: 365 },
      { name: 'Alkaline Water 1L', price: 35, cost: 22, uom: 'bottle', shelfLife: 365 },
    ];

    // Carbonated products
    const carbonatedProducts = [
      { name: 'Coca-Cola 8oz Can', price: 25, cost: 18, uom: 'can', shelfLife: 540 },
      { name: 'Coca-Cola 12oz Can', price: 35, cost: 25, uom: 'can', shelfLife: 540 },
      { name: 'Coca-Cola 1.5L PET', price: 65, cost: 45, uom: 'bottle', shelfLife: 540 },
      { name: 'Pepsi 12oz Can', price: 35, cost: 25, uom: 'can', shelfLife: 540 },
      { name: 'Sprite 12oz Can', price: 35, cost: 25, uom: 'can', shelfLife: 540 },
      { name: 'Royal True Orange 1L PET', price: 50, cost: 35, uom: 'bottle', shelfLife: 540 },
      { name: 'Mountain Dew 12oz Can', price: 38, cost: 27, uom: 'can', shelfLife: 540 },
      { name: '7-Up 1.5L PET', price: 65, cost: 45, uom: 'bottle', shelfLife: 540 },
      { name: 'Mirinda Orange 12oz', price: 32, cost: 23, uom: 'can', shelfLife: 540 },
      { name: 'Sarsi 1L PET', price: 45, cost: 32, uom: 'bottle', shelfLife: 540 },
      { name: 'RC Cola 12oz Can', price: 30, cost: 21, uom: 'can', shelfLife: 540 },
      { name: 'Schweppes Ginger Ale 12oz', price: 40, cost: 28, uom: 'can', shelfLife: 540 },
      { name: 'Canada Dry 1L', price: 55, cost: 38, uom: 'bottle', shelfLife: 540 },
      { name: 'Fanta Orange 12oz', price: 35, cost: 25, uom: 'can', shelfLife: 540 },
      { name: 'A&W Root Beer 12oz', price: 42, cost: 30, uom: 'can', shelfLife: 540 },
    ];

    // Juice products
    const juiceProducts = [
      { name: 'Minute Maid Orange 1L', price: 85, cost: 60, uom: 'bottle', shelfLife: 180 },
      { name: 'Del Monte Pineapple 1L', price: 90, cost: 65, uom: 'bottle', shelfLife: 180 },
      { name: 'Tropicana Apple 1L', price: 95, cost: 68, uom: 'bottle', shelfLife: 180 },
      { name: 'Zest-O Orange 200ml', price: 15, cost: 10, uom: 'pack', shelfLife: 270 },
      { name: 'Zest-O Dalandan 200ml', price: 15, cost: 10, uom: 'pack', shelfLife: 270 },
      { name: 'Tang Orange 1L', price: 70, cost: 50, uom: 'bottle', shelfLife: 365 },
      { name: 'Eight O\'Clock Mango 1L', price: 75, cost: 52, uom: 'bottle', shelfLife: 180 },
      { name: 'Ceres Grape 1L', price: 120, cost: 85, uom: 'bottle', shelfLife: 180 },
      { name: 'Sunkist Orange 250ml', price: 25, cost: 17, uom: 'can', shelfLife: 365 },
      { name: 'Dole Pineapple 1L', price: 100, cost: 70, uom: 'bottle', shelfLife: 180 },
    ];

    // Energy drinks
    const energyProducts = [
      { name: 'Red Bull 250ml', price: 65, cost: 45, uom: 'can', shelfLife: 540 },
      { name: 'Monster Energy 355ml', price: 75, cost: 52, uom: 'can', shelfLife: 540 },
      { name: 'Cobra Energy 350ml', price: 35, cost: 24, uom: 'bottle', shelfLife: 540 },
      { name: 'Sting Energy 330ml', price: 30, cost: 21, uom: 'can', shelfLife: 540 },
      { name: 'Lipovitan 100ml', price: 25, cost: 17, uom: 'bottle', shelfLife: 730 },
      { name: 'Extra Joss Energy 180ml', price: 20, cost: 14, uom: 'can', shelfLife: 365 },
      { name: 'Rockstar Energy 500ml', price: 85, cost: 60, uom: 'can', shelfLife: 540 },
      { name: 'Summit Energy 350ml', price: 32, cost: 22, uom: 'bottle', shelfLife: 540 },
    ];

    // Sports drinks
    const sportsProducts = [
      { name: 'Gatorade Blue 500ml', price: 45, cost: 32, uom: 'bottle', shelfLife: 365 },
      { name: 'Gatorade Orange 500ml', price: 45, cost: 32, uom: 'bottle', shelfLife: 365 },
      { name: 'Pocari Sweat 500ml', price: 50, cost: 35, uom: 'bottle', shelfLife: 365 },
      { name: '100 Plus 500ml', price: 40, cost: 28, uom: 'bottle', shelfLife: 365 },
      { name: 'Revive Isotonic 500ml', price: 38, cost: 26, uom: 'bottle', shelfLife: 365 },
      { name: 'Powerade Blue 500ml', price: 42, cost: 29, uom: 'bottle', shelfLife: 365 },
      { name: 'Aquarius Lemon 500ml', price: 48, cost: 34, uom: 'bottle', shelfLife: 365 },
    ];

    // Create products
    for (const product of waterProducts.slice(0, config.waterProducts)) {
      const created = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: product.name,
          description: `${product.name} - Premium bottled water`,
          category: waterCategory.name,
          baseUOM: product.uom,
          basePrice: product.price,
          averageCostPrice: product.cost,
          minStockLevel: 500,
          shelfLifeDays: product.shelfLife,
          status: 'active',
          updatedAt: new Date(),
        },
      });
      products.push(created);
    }

    for (const product of carbonatedProducts.slice(0, config.carbonatedProducts)) {
      const created = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: product.name,
          description: `${product.name} - Refreshing carbonated beverage`,
          category: carbonatedCategory.name,
          baseUOM: product.uom,
          basePrice: product.price,
          averageCostPrice: product.cost,
          minStockLevel: 300,
          shelfLifeDays: product.shelfLife,
          status: 'active',
          updatedAt: new Date(),
        },
      });
      products.push(created);
    }

    for (const product of juiceProducts.slice(0, config.juiceProducts)) {
      const created = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: product.name,
          description: `${product.name} - Natural fruit juice`,
          category: juiceCategory.name,
          baseUOM: product.uom,
          basePrice: product.price,
          averageCostPrice: product.cost,
          minStockLevel: 200,
          shelfLifeDays: product.shelfLife,
          status: 'active',
          updatedAt: new Date(),
        },
      });
      products.push(created);
    }

    for (const product of energyProducts.slice(0, config.energyProducts)) {
      const created = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: product.name,
          description: `${product.name} - Energy boost drink`,
          category: energyCategory.name,
          baseUOM: product.uom,
          basePrice: product.price,
          averageCostPrice: product.cost,
          minStockLevel: 150,
          shelfLifeDays: product.shelfLife,
          status: 'active',
          updatedAt: new Date(),
        },
      });
      products.push(created);
    }

    for (const product of sportsProducts.slice(0, config.sportsProducts)) {
      const created = await prisma.product.create({
        data: {
          id: randomUUID(),
          name: product.name,
          description: `${product.name} - Isotonic sports drink`,
          category: sportsCategory.name,
          baseUOM: product.uom,
          basePrice: product.price,
          averageCostPrice: product.cost,
          minStockLevel: 200,
          shelfLifeDays: product.shelfLife,
          status: 'active',
          updatedAt: new Date(),
        },
      });
      products.push(created);
    }

    console.log(`✅ Created ${products.length} products`);
    return products;
  }
}
