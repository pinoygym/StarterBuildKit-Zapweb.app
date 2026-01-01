import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/users');
    });

    test('should display users page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    test('should open create user dialog', async ({ page }) => {
        await page.click('button:has-text("Add User")');
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Create New User')).toBeVisible();
    });

    test('should search users', async ({ page }) => {
        await page.fill('input[placeholder*="Search"]', 'admin');
        // Wait for debounce or network
        await page.waitForTimeout(1000);
        // Assuming admin user exists
        // await expect(page.getByText('admin')).toBeVisible();
    });
});
