import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDiscountCategory() {
  console.log('🌱 Adding Customer Discounts expense category...');

  try {
    const category = await prisma.expenseCategory.upsert({
      where: { code: 'DISC' },
      update: {},
      create: {
        name: 'Customer Discounts',
        code: 'DISC',
        description: 'Discounts given to customers on sales transactions',
        status: 'active',
        displayOrder: 9,
        isSystemDefined: true,
      },
    });

    console.log('✅ Customer Discounts category created:', category.name);
  } catch (error) {
    console.error('❌ Error creating discount category:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addDiscountCategory();
