import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReferenceData() {
  console.log('🌱 Seeding reference data...');

  // Product Categories
  console.log('  → Seeding product categories...');
  const productCategories = [
    { name: 'Carbonated Drinks', code: 'CARB', description: 'Soft drinks with carbonation', displayOrder: 1, isSystemDefined: true },
    { name: 'Juices', code: 'JUICE', description: 'Fruit and vegetable juices', displayOrder: 2, isSystemDefined: true },
    { name: 'Energy Drinks', code: 'ENERGY', description: 'Energy and sports drinks', displayOrder: 3, isSystemDefined: true },
    { name: 'Water', code: 'WATER', description: 'Bottled water and mineral water', displayOrder: 4, isSystemDefined: true },
    { name: 'Other', code: 'OTHER', description: 'Other beverage products', displayOrder: 5, isSystemDefined: false },
  ];

  for (const category of productCategories) {
    await prisma.productCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }
  console.log(`  ✓ Created ${productCategories.length} product categories`);

  // Expense Categories
  console.log('  → Seeding expense categories...');
  const expenseCategories = [
    { name: 'Utilities', code: 'UTIL', description: 'Electricity, water, internet, phone', displayOrder: 1, isSystemDefined: true },
    { name: 'Rent', code: 'RENT', description: 'Office and warehouse rent', displayOrder: 2, isSystemDefined: true },
    { name: 'Salaries', code: 'SAL', description: 'Employee salaries and wages', displayOrder: 3, isSystemDefined: true },
    { name: 'Transportation', code: 'TRANS', description: 'Fuel, vehicle maintenance, delivery costs', displayOrder: 4, isSystemDefined: true },
    { name: 'Marketing', code: 'MKTG', description: 'Advertising and promotional expenses', displayOrder: 5, isSystemDefined: true },
    { name: 'Maintenance', code: 'MAINT', description: 'Equipment and facility maintenance', displayOrder: 6, isSystemDefined: true },
    { name: 'Office Supplies', code: 'OFFICE', description: 'Stationery, printer supplies, etc.', displayOrder: 7, isSystemDefined: false },
    { name: 'Other', code: 'OTHER', description: 'Miscellaneous expenses', displayOrder: 8, isSystemDefined: false },
  ];

  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }
  console.log(`  ✓ Created ${expenseCategories.length} expense categories`);

  // Payment Methods
  console.log('  → Seeding payment methods...');
  const paymentMethods = [
    {
      name: 'Cash',
      code: 'CASH',
      description: 'Physical cash payment',
      displayOrder: 1,
      isSystemDefined: true,
      applicableTo: ['expense', 'pos', 'ar', 'ap'],
    },
    {
      name: 'Card',
      code: 'CARD',
      description: 'Credit or debit card payment',
      displayOrder: 2,
      isSystemDefined: true,
      applicableTo: ['expense', 'pos', 'ar', 'ap'],
    },
    {
      name: 'Check',
      code: 'CHECK',
      description: 'Bank check payment',
      displayOrder: 3,
      isSystemDefined: true,
      applicableTo: ['expense', 'ar', 'ap'],
    },
    {
      name: 'GCash',
      code: 'GCASH',
      description: 'GCash mobile payment',
      displayOrder: 4,
      isSystemDefined: true,
      applicableTo: ['expense', 'pos', 'ar', 'ap'],
    },
    {
      name: 'Online Transfer',
      code: 'ONLINE',
      description: 'Bank online transfer',
      displayOrder: 5,
      isSystemDefined: true,
      applicableTo: ['expense', 'ar', 'ap'],
    },
    {
      name: 'Credit',
      code: 'CREDIT',
      description: 'Payment on credit terms',
      displayOrder: 6,
      isSystemDefined: true,
      applicableTo: ['pos', 'ar'],
    },
    {
      name: 'AR Credit',
      code: 'AR_CREDIT',
      description: 'Accounts Receivable credit',
      displayOrder: 7,
      isSystemDefined: true,
      applicableTo: ['pos', 'ar'],
    },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method,
    });
  }
  console.log(`  ✓ Created ${paymentMethods.length} payment methods`);

  // Units of Measure
  console.log('  → Seeding units of measure...');
  const unitsOfMeasure = [
    { name: 'Piece', code: 'PC', description: 'Individual piece or unit', displayOrder: 1, isSystemDefined: true },
    { name: 'Case', code: 'CASE', description: 'Box or case containing multiple pieces', displayOrder: 2, isSystemDefined: true },
    { name: 'Bottle', code: 'BTL', description: 'Individual bottle', displayOrder: 3, isSystemDefined: true },
    { name: 'Liter', code: 'L', description: 'Volume in liters', displayOrder: 4, isSystemDefined: true },
    { name: 'Milliliter', code: 'ML', description: 'Volume in milliliters', displayOrder: 5, isSystemDefined: true },
    { name: 'Dozen', code: 'DZ', description: '12 pieces', displayOrder: 6, isSystemDefined: false },
    { name: 'Pack', code: 'PACK', description: 'Pack of multiple units', displayOrder: 7, isSystemDefined: false },
    { name: 'Pallet', code: 'PALLET', description: 'Full pallet load', displayOrder: 8, isSystemDefined: false },
  ];

  for (const uom of unitsOfMeasure) {
    await prisma.unitOfMeasure.upsert({
      where: { code: uom.code },
      update: {},
      create: uom,
    });
  }
  console.log(`  ✓ Created ${unitsOfMeasure.length} units of measure`);

  // Common Expense Vendors
  console.log('  → Seeding common expense vendors...');
  const expenseVendors = [
    {
      name: 'Manila Electric Company (MERALCO)',
      contactPerson: 'Customer Service',
      phone: '16211',
      email: 'customercare@meralco.com.ph',
      displayOrder: 1,
    },
    {
      name: 'Maynilad Water Services',
      contactPerson: 'Customer Service',
      phone: '1626',
      email: 'customercare@mayniladwater.com.ph',
      displayOrder: 2,
    },
    {
      name: 'PLDT',
      contactPerson: 'Business Support',
      phone: '171',
      email: 'business@pldt.com.ph',
      displayOrder: 3,
    },
    {
      name: 'Petron Corporation',
      contactPerson: 'Sales',
      phone: '(02) 8884-9200',
      displayOrder: 4,
    },
    {
      name: 'Shell Philippines',
      contactPerson: 'Fleet Card Services',
      phone: '1-800-10-888-7435',
      displayOrder: 5,
    },
  ];

  for (const vendor of expenseVendors) {
    await prisma.expenseVendor.upsert({
      where: { name: vendor.name },
      update: {},
      create: vendor,
    });
  }
  console.log(`  ✓ Created ${expenseVendors.length} expense vendors`);

  console.log('✅ Reference data seeding completed!');
}

seedReferenceData()
  .catch((error) => {
    console.error('❌ Error seeding reference data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
