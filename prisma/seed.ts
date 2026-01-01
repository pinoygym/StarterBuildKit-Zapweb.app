import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedRolePermissions } from './seeds/role-permissions.seed';
import { seedAdminUser } from './seeds/admin-user.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed authentication data
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedAdminUser();

  // Create Branches (check if they exist first)
  let branch1 = await prisma.branch.findUnique({ where: { code: 'MNL-001' } });
  if (!branch1) {
    branch1 = await prisma.branch.create({
    data: {
      name: 'Manila Main Branch',
      code: 'MNL-001',
      location: '123 Rizal Avenue, Manila',
      manager: 'Juan Dela Cruz',
      phone: '+63 2 1234 5678',
      status: 'active',
    },
  });
  }

  let branch2 = await prisma.branch.findUnique({ where: { code: 'QC-001' } });
  if (!branch2) {
    branch2 = await prisma.branch.create({
    data: {
      name: 'Quezon City Branch',
      code: 'QC-001',
      location: '456 Commonwealth Avenue, Quezon City',
      manager: 'Maria Santos',
      phone: '+63 2 8765 4321',
      status: 'active',
    },
  });
  }

  console.log('Created branches');

  // Create Warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Manila Central Warehouse',
      location: '789 Port Area, Manila',
      manager: 'Pedro Garcia',
      maxCapacity: 100000,
      branchId: branch1.id,
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'QC Storage Facility',
      location: '321 Mindanao Avenue, Quezon City',
      manager: 'Ana Reyes',
      maxCapacity: 75000,
      branchId: branch2.id,
    },
  });

  const warehouse3 = await prisma.warehouse.create({
    data: {
      name: 'Manila Secondary Warehouse',
      location: '555 Taft Avenue, Manila',
      manager: 'Carlos Lopez',
      maxCapacity: 50000,
      branchId: branch1.id,
    },
  });

  console.log('Created warehouses');

  // Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      companyName: 'Coca-Cola Beverages Philippines',
      contactPerson: 'Roberto Tan',
      phone: '+63 2 9876 5432',
      email: 'roberto.tan@ccbpi.com',
      paymentTerms: 'Net 30',
      status: 'active',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      companyName: 'Pepsi-Cola Products Philippines',
      contactPerson: 'Linda Cruz',
      phone: '+63 2 5555 1234',
      email: 'linda.cruz@pepsi.com.ph',
      paymentTerms: 'Net 30',
      status: 'active',
    },
  });

  console.log('Created suppliers');

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
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
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
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
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
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
        ...productInfo,
        ProductUOM: {
          create: alternateUOMs,
        },
      },
    });
  }

  console.log('Created products with UOMs');

  // Create sample inventory batches
  const allProducts = await prisma.product.findMany();
  
  for (const product of allProducts.slice(0, 4)) {
    // Add inventory to warehouse 1
    await prisma.inventoryBatch.create({
      data: {
        batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        warehouseId: warehouse1.id,
        quantity: 1000,
        unitCost: Number(product.basePrice) * 0.6, // 60% of selling price
        receivedDate: new Date(),
        expiryDate: new Date(Date.now() + product.shelfLifeDays * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    // Add inventory to warehouse 2
    await prisma.inventoryBatch.create({
      data: {
        batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        warehouseId: warehouse2.id,
        quantity: 750,
        unitCost: Number(product.basePrice) * 0.6,
        receivedDate: new Date(),
        expiryDate: new Date(Date.now() + product.shelfLifeDays * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });
  }

  console.log('Created inventory batches');

  console.log('\n=== Seed completed successfully! ===');
  console.log('\nDefault Admin Credentials:');
  console.log('Email: cybergada@gmail.com');
  console.log('Password: Qweasd145698@');
  console.log('\n✅ Demo account ready for 1-click login!\n');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
