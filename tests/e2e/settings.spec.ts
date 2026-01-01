import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings');
    });

    test('should display settings page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('should display company settings section', async ({ page }) => {
        await expect(page.getByText('Company Settings')).toBeVisible();
        await expect(page.getByLabel('Company Name')).toBeVisible();
        await expect(page.getByLabel('Address')).toBeVisible();
    });

    test('should display database management section', async ({ page }) => {
        await expect(page.getByText('Database Management')).toBeVisible();
        await expect(page.getByText('Database Statistics')).toBeVisible();
    });
});
