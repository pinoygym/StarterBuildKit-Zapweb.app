import { test as base } from '@playwright/test';

/**
 * Extended test fixture that ensures database is seeded before each test file
 */
export const test = base.extend({
    page: async ({ page, browser }, use) => {
        // Seed database before the first test in this file
        const seedRes = await page.request.post('/api/dev/seed', {
            headers: { 'Content-Type': 'application/json' },
            data: {}
        });

        if (!seedRes.ok()) {
            console.error('Seed failed:', await seedRes.text());
        } else {
            console.log('Database seeded successfully');
        }

        // Use the page
        await use(page);
    },
});

export { expect } from '@playwright/test';
