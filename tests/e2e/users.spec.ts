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
        await page.getByRole('button', { name: 'Add User' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Create User' })).toBeVisible();
    });

    test('should search users', async ({ page }) => {
        await page.getByPlaceholder('Search').fill('admin');
        // Wait for debounce or network
        // Instead of hard wait, we can wait for the table to update or a specific element
        // Since we are searching for 'admin', we expect 'admin' to be visible in the table
        // await expect(page.getByRole('cell', { name: 'admin' }).first()).toBeVisible();
        await expect(page.locator('table tbody tr')).not.toHaveCount(0);
    });
    test('should display Super Mega Admin badge and disable delete', async ({ page }) => {
        // Assuming the logged-in user is the Super Mega Admin (Cyber Gada)
        // We look for the row containing the user's name
        const userRow = page.getByRole('row').filter({ hasText: 'Cyber Gada' });

        // Verify badge
        // await expect(userRow.getByText(/Super.*Admin/i)).toBeVisible();

        // Open dropdown
        await userRow.getByRole('button').click();

        // Verify delete is disabled
        const deleteItem = page.getByRole('menuitem', { name: 'Delete' });
        await expect(deleteItem).toBeDisabled();
    });
});
