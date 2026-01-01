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

    test('should display Admin Testing Tools for Super Mega Admin', async ({ page }) => {
        // Verify section header
        await expect(page.getByText('Admin Testing Tools')).toBeVisible();

        // Verify badge
        await expect(page.getByText('SUPER MEGA ADMIN ONLY')).toBeVisible();

        // Verify tools
        await expect(page.getByText('Delete Specific Table Data')).toBeVisible();
        await expect(page.getByText('Seed Test Data')).toBeVisible();
    });

    test('should handle seed test data', async ({ page }) => {
        // Find seed button
        const seedButton = page.getByRole('button', { name: 'Generate Test Data' });
        await expect(seedButton).toBeVisible();

        // Click seed button
        await seedButton.click();

        // Verify loading state or success
        // Note: Seeding might be fast, so we check for the toast
        await expect(page.getByText('Test Data Seeded')).toBeVisible({ timeout: 10000 });
    });

    test('should handle delete table data', async ({ page }) => {
        // Select a table (Product)
        // We use a more specific selector strategy for the Select component
        await page.click('button[role="combobox"]'); // Click the select trigger
        await page.getByRole('option', { name: 'Product', exact: true }).click();

        // Click delete button
        const deleteButton = page.getByRole('button', { name: 'Delete Product Data' });
        await expect(deleteButton).toBeEnabled();
        await deleteButton.click();

        // Verify confirmation dialog
        await expect(page.getByText('Confirm Table Deletion')).toBeVisible();

        // Confirm deletion
        await page.getByRole('button', { name: 'Yes, Delete Data' }).click();

        // Verify success toast
        await expect(page.getByText('Table Data Deleted')).toBeVisible();
    });
});
