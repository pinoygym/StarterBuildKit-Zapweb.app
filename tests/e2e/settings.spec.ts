import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        // Check if redirected to login
        if (page.url().includes('/login')) {
            // Re-login if needed (though auth.setup.ts should handle this)
            await page.getByLabel('Email').fill('cybergada@gmail.com');
            await page.getByLabel('Password').fill('Qweasd145698@');
            await page.getByRole('button', { name: 'Sign in' }).click();
            await page.waitForURL('**/settings');
        }

        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('should display settings page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('should display company settings section', async ({ page }) => {
        await expect(page.getByText('Company Settings')).toBeVisible();
        // Wait for loading to finish
        await expect(page.getByLabel('Company Name')).toBeVisible({ timeout: 10000 });
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
        await expect(page.getByText('SUPER MEGA ADMIN ONLY').first()).toBeVisible();

        // Verify tools
        await expect(page.getByText('Delete Specific Table Data')).toBeVisible();
        await expect(page.getByText('Delete All Transactions')).toBeVisible();
        await expect(page.getByText('Seed Test Data')).toBeVisible();
    });

    test('should handle seed test data', async ({ page }) => {
        // Find seed button
        const seedButton = page.getByRole('button', { name: 'Generate Test Data' });
        await expect(seedButton).toBeVisible({ timeout: 15000 });

        // Click seed button
        await seedButton.click();

        // Verify loading state or success
        // Note: Seeding might be fast, so we check for the toast
        // Use first() to avoid strict mode violation if multiple elements match (e.g. toast and screen reader text)
        await expect(page.getByText('Test Data Seeded').first()).toBeVisible({ timeout: 30000 });
    });

    test('should handle delete table data', async ({ page }) => {
        // Select a table (Product)
        // We use a more specific selector strategy for the Select component
        // Find the select trigger specifically in the delete table section
        const deleteSection = page.locator('.space-y-4', { hasText: 'Delete Specific Table Data' });
        await deleteSection.getByRole('combobox').click();
        await page.getByRole('option', { name: 'AuditLog', exact: true }).click();

        // Click delete button
        const deleteButton = page.getByRole('button', { name: 'Delete AuditLog Data' });
        await expect(deleteButton).toBeEnabled();
        await deleteButton.click();

        // Verify confirmation dialog
        await expect(page.getByRole('heading', { name: 'Confirm Table Deletion' })).toBeVisible();

        // Confirm deletion
        await page.getByRole('button', { name: 'Yes, Delete Data' }).click();

        // Verify success toast
        await expect(page.getByText('Table Data Deleted').first()).toBeVisible({ timeout: 30000 });
    });

    test('should handle delete all transactions', async ({ page }) => {
        // Find delete transactions button
        const deleteButton = page.getByRole('button', { name: 'Delete Transactions' });
        await expect(deleteButton).toBeVisible();

        // Click delete button
        await deleteButton.click();

        // Verify confirmation dialog
        await expect(page.getByText('Delete All Transactions?')).toBeVisible();
        await expect(page.getByText('Master data (Products, Customers, Suppliers, Users) will be PRESERVED.')).toBeVisible();

        // Confirm deletion
        await page.getByRole('button', { name: 'Yes, Delete Transactions' }).click();

        // Verify success toast
        await expect(page.getByText('Transactions Deleted').first()).toBeVisible({ timeout: 30000 });
    });

    test('should display and handle System Health Check', async ({ page }) => {
        // Verify section exists
        await expect(page.getByText('System Health Check (Selenium)')).toBeVisible();

        // Find run button
        const runButton = page.getByRole('button', { name: 'Run Health Check' });
        await expect(runButton).toBeVisible();
        await expect(runButton).toBeEnabled();

        // Note: We don't click it to avoid running long tests during E2E, 
        // but we verify it's present and enabled.
    });

});
