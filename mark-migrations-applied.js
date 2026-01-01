const { execSync } = require('child_process');

const migrations = [
  '20251120171208_init_postgresql_with_defaults',
  '20251121061413_add_branch_lock_enabled',
  '20251121062827_make_email_optional',
  '20251121071851_add_uom_to_purchase_order_item',
  '20251121075724_add_average_cost_price_to_product',
  '20251121142528_add_reference_data_tables',
  '20251121193424_add_pos_discounts_and_vat_settings',
  '20251122000000_fix_pos_discount_fields',
  '20251122085749_add_uom_to_receiving_voucher_item',
  '20251123074841_add_sales_agent',
  '20251123075343_add_display_order_to_sales_agent',
  '20251123192639_add_supplier_discount_and_fees',
  '20251125090121_add_inventory_model'
];

console.log('Marking all migrations as applied in development database...\n');

for (const migration of migrations) {
  try {
    console.log(`Marking ${migration} as applied...`);
    execSync(`npx prisma migrate resolve --applied ${migration}`, { stdio: 'inherit' });
    console.log(`✅ ${migration} marked as applied\n`);
  } catch (error) {
    console.error(`❌ Failed to mark ${migration} as applied:`, error.message);
  }
}

console.log('✅ All migrations marked as applied!');