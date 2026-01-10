import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedRolePermissions } from './seeds/role-permissions.seed';
import { seedAdminUser } from './seeds/admin-user.seed';
import { seedUsers } from './seeds/users.seed';
import { seedFromProdData } from './seeds/prod-seed';
import { seedImageProducts } from './seeds/image-products.seed';
import { seedReferenceData } from './seeds/reference-data.seed';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  if (process.env.SEED_SOURCE === 'prod') {
    await seedFromProdData(prisma);
    return;
  }

  // Seed reference data (categories, payment methods, etc.)
  await seedReferenceData(prisma);

  // Seed authentication data
  await seedPermissions(prisma);
  await seedRoles(prisma);
  await seedRolePermissions(prisma);

  // Create Branches (check if they exist first)
  let branch1 = await prisma.branch.findUnique({ where: { code: 'MNL-001' } });
  if (!branch1) {
    branch1 = await prisma.branch.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Manila Main Branch',
        code: 'MNL-001',
        location: '123 Rizal Avenue, Manila',
        manager: 'Juan Dela Cruz',
        phone: '+63 2 1234 5678',
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  let branch2 = await prisma.branch.findUnique({ where: { code: 'QC-001' } });
  if (!branch2) {
    branch2 = await prisma.branch.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Quezon City Branch',
        code: 'QC-001',
        location: '456 Commonwealth Avenue, Quezon City',
        manager: 'Maria Santos',
        phone: '+63 2 8765 4321',
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  console.log('Created branches');


  // Seed Users from JSON
  await seedUsers(prisma);

  // Seed Products from Image Data
  await seedImageProducts(prisma);

  // Seed default admin (will skip if already exists)
  await seedAdminUser(prisma);

  // Create Warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Manila Central Warehouse',
      location: '789 Port Area, Manila',
      manager: 'Pedro Garcia',
      maxCapacity: 100000,
      branchId: branch1.id,
      updatedAt: new Date(),
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      id: crypto.randomUUID(),
      name: 'QC Storage Facility',
      location: '321 Mindanao Avenue, Quezon City',
      manager: 'Ana Reyes',
      maxCapacity: 75000,
      branchId: branch2.id,
      updatedAt: new Date(),
    },
  });

  const warehouse3 = await prisma.warehouse.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Manila Secondary Warehouse',
      location: '555 Taft Avenue, Manila',
      manager: 'Carlos Lopez',
      maxCapacity: 50000,
      branchId: branch1.id,
      updatedAt: new Date(),
    },
  });

  console.log('Created warehouses');

  // Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      id: crypto.randomUUID(),
      companyName: 'Coca-Cola Beverages Philippines',
      contactPerson: 'Roberto Tan',
      phone: '+63 2 9876 5432',
      email: 'roberto.tan@ccbpi.com',
      paymentTerms: 'Net 30',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      id: crypto.randomUUID(),
      companyName: 'Pepsi-Cola Products Philippines',
      contactPerson: 'Linda Cruz',
      phone: '+63 2 5555 1234',
      email: 'linda.cruz@pepsi.com.ph',
      paymentTerms: 'Net 30',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  console.log('Created suppliers');

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      id: crypto.randomUUID(),
      customerCode: 'CUST-00001',
      companyName: '7-Eleven Philippines',
      contactPerson: 'Michael Santos',
      phone: '+63 917 123 4567',
      email: 'michael.santos@7eleven.com.ph',
      address: '100 Pioneer Street',
      city: 'Mandaluyong',
      region: 'NCR',
      postalCode: '1550',
      paymentTerms: 'Net 30',
      creditLimit: 500000,
      taxId: '123-456-789',
      customerType: 'wholesale',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      id: crypto.randomUUID(),
      customerCode: 'CUST-00002',
      companyName: 'Mini Stop Corporation',
      contactPerson: 'Sarah Reyes',
      phone: '+63 918 234 5678',
      email: 'sarah.reyes@ministop.com.ph',
      address: '200 Ortigas Avenue',
      city: 'Pasig',
      region: 'NCR',
      postalCode: '1600',
      paymentTerms: 'Net 30',
      creditLimit: 300000,
      taxId: '234-567-890',
      customerType: 'wholesale',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      id: crypto.randomUUID(),
      customerCode: 'CUST-00003',
      contactPerson: 'Juan Dela Cruz',
      phone: '+63 919 345 6789',
      email: 'juan.delacruz@gmail.com',
      address: '50 Tomas Morato Avenue',
      city: 'Quezon City',
      region: 'NCR',
      postalCode: '1103',
      paymentTerms: 'COD',
      customerType: 'retail',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  console.log('Created customers');

  // Create Products with UOMs
  const products = [
    {
      name: 'Coca-Cola 8oz Bottle',
      description: 'Classic Coca-Cola in 8oz glass bottle',
      category: 'Carbonated',
      basePrice: 25.00,
      baseUOM: 'bottle',
      minStockLevel: 500,
      shelfLifeDays: 365,
      alternateUOMs: [
        { name: 'pack', conversionFactor: 6, sellingPrice: 140.00 },
        { name: 'carton', conversionFactor: 24, sellingPrice: 550.00 },
      ],
    },
    {
      name: 'Pepsi 12oz Can',
      description: 'Pepsi Cola in 12oz aluminum can',
      category: 'Carbonated',
      basePrice: 30.00,
      baseUOM: 'can',
      minStockLevel: 400,
      shelfLifeDays: 365,
      alternateUOMs: [
        { name: 'pack', conversionFactor: 6, sellingPrice: 170.00 },
        { name: 'carton', conversionFactor: 24, sellingPrice: 650.00 },
      ],
    },
    {
      name: 'Sprite 1.5L Bottle',
      description: 'Sprite lemon-lime soda in 1.5L PET bottle',
      category: 'Carbonated',
      basePrice: 45.00,
      baseUOM: 'bottle',
      minStockLevel: 300,
      shelfLifeDays: 365,
      alternateUOMs: [
        { name: 'pack', conversionFactor: 6, sellingPrice: 260.00 },
        { name: 'carton', conversionFactor: 12, sellingPrice: 520.00 },
      ],
    },
    {
      name: 'Mountain Dew 500ml Bottle',
      description: 'Mountain Dew citrus soda in 500ml PET bottle',
      category: 'Carbonated',
      basePrice: 35.00,
      baseUOM: 'bottle',
      minStockLevel: 350,
      shelfLifeDays: 365,
      alternateUOMs: [
        { name: 'pack', conversionFactor: 6, sellingPrice: 200.00 },
        { name: 'carton', conversionFactor: 24, sellingPrice: 780.00 },
      ],
    },
    {
      name: 'Del Monte Pineapple Juice 1L',
      description: 'Del Monte 100% pineapple juice in 1L tetra pack',
      category: 'Juices',
      basePrice: 55.00,
      baseUOM: 'pack',
      minStockLevel: 200,
      shelfLifeDays: 180,
      alternateUOMs: [
        { name: 'carton', conversionFactor: 12, sellingPrice: 640.00 },
      ],
    },
    {
      name: 'Minute Maid Orange Juice 1L',
      description: 'Minute Maid orange juice in 1L tetra pack',
      category: 'Juices',
      basePrice: 60.00,
      baseUOM: 'pack',
      minStockLevel: 200,
      shelfLifeDays: 180,
      alternateUOMs: [
        { name: 'carton', conversionFactor: 12, sellingPrice: 700.00 },
      ],
    },
    {
      name: 'Red Bull Energy Drink 250ml',
      description: 'Red Bull energy drink in 250ml can',
      category: 'Energy Drinks',
      basePrice: 75.00,
      baseUOM: 'can',
      minStockLevel: 250,
      shelfLifeDays: 540,
      alternateUOMs: [
        { name: 'pack', conversionFactor: 4, sellingPrice: 290.00 },
        { name: 'carton', conversionFactor: 24, sellingPrice: 1700.00 },
      ],
    },
    {
      name: 'Absolute Distilled Water 500ml',
      description: 'Absolute purified distilled water in 500ml bottle',
      category: 'Water',
      basePrice: 15.00,
      baseUOM: 'bottle',
      minStockLevel: 600,
      shelfLifeDays: 730,
      alternateUOMs: [
        { name: 'pack', conversionFactor: 12, sellingPrice: 170.00 },
        { name: 'carton', conversionFactor: 48, sellingPrice: 650.00 },
      ],
    },
  ];

  for (const productData of products) {
    const { alternateUOMs, ...productInfo } = productData;
    await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        ...productInfo,
        updatedAt: new Date(),
        productUOMs: {
          create: alternateUOMs.map(uom => ({
            id: crypto.randomUUID(),
            name: uom.name,
            conversionFactor: uom.conversionFactor,
            sellingPrice: uom.sellingPrice,
          })),
        },
        averageCostPrice: productInfo.basePrice * 0.6,
      },
    });
  }

  console.log('Created products with UOMs');

  // Create sample inventory for ALL products
  const allProducts = await prisma.product.findMany();

  for (const product of allProducts) {
    // Add inventory to warehouse 1
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse1.id,
        },
      },
      update: {
        quantity: 1000,
      },
      create: {
        id: crypto.randomUUID(),
        productId: product.id,
        warehouseId: warehouse1.id,
        quantity: 1000,
        updatedAt: new Date(),
      },
    });

    // Add inventory to warehouse 2
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse2.id,
        },
      },
      update: {
        quantity: 750,
      },
      create: {
        id: crypto.randomUUID(),
        productId: product.id,
        warehouseId: warehouse2.id,
        quantity: 750,
        updatedAt: new Date(),
      },
    });
  }

  console.log('Created inventory records');

  console.log('\n=== Seed completed successfully! ===');
  console.log('\nDefault Admin Credentials:');
  console.log('Email: cybergada@gmail.com');
  console.log('Password: Qweasd1234');
  console.log('\n✅ Demo account ready for 1-click login!\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    if (e instanceof Error) {
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
    } else {
      console.error('Unknown error:', JSON.stringify(e, null, 2));
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
