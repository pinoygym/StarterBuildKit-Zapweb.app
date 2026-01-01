export async function seedDemoData() {
  console.log('🎬 Seeding demo data for training videos...\n');
  console.log('Using existing /api/dev/seed endpoint for quick setup\n');

  try {
    // Call the existing seed endpoint
    const response = await fetch('http://localhost:3000/api/dev/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Seed endpoint failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('\n✅ Seed endpoint response:', data.message);

    console.log('\n✨ Demo data seeding completed successfully!');
    console.log('═'.repeat(60));
    console.log(`📊 The /api/dev/seed endpoint has created:`);
    console.log(`   - Roles and permissions`);
    console.log(`   - Users with authentication`);
    console.log(`   - Branches and warehouses`);
    console.log(`   - Suppliers and products`);
    console.log(`   - Initial inventory`);
    console.log('═'.repeat(60));

    return data;
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Backup: If we need custom seeding later
async function seedCustomDemoData() {
  console.log('Creating custom demo data...\n');

  try {
    // Import prisma here only if needed
    const { prisma } = await import('../../lib/prisma');

    // Custom seeding logic would go here
    // For now, we use the existing endpoint
    // This would be custom seeding logic if needed
    return {};
  } catch (error) {
    console.error('❌ Error in custom seeding:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

// Run if executed directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}
