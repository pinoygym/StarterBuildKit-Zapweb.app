import { test as setup } from '@playwright/test';

setup('reseed database', async ({ request }) => {
    console.log('🔄 Reseeding database for next browser...');

    const seedRes = await request.post('/api/dev/seed', {
        headers: { 'Content-Type': 'application/json' },
        data: {}
    });

    if (!seedRes.ok()) {
        const errorText = await seedRes.text();
        console.error('❌ Reseed failed:', errorText);
        throw new Error(`Failed to reseed database: ${errorText}`);
    }

    console.log('✅ Database reseeded successfully');
});
