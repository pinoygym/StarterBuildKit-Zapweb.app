import { test, expect } from '@playwright/test';

test('cleanup test data', async ({ page }) => {
    // Go to settings page
    await page.goto('/settings');

    // Wait for the "Delete Transactions" button to be visible
    // It's inside the "Admin Testing Tools" section which is only visible to Super Mega Admin
    // The user running the test should be Super Mega Admin (default seed user is)

    // Note: The button might be inside a card, so we look for it specifically
    const deleteButton = page.getByRole('button', { name: 'Delete Transactions' });

    // Check if visible, if not, maybe not logged in as admin or section not loaded
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    // Wait for dialog
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    // Click confirm
    await page.getByRole('button', { name: 'Yes, Delete Transactions' }).click();

    // Wait for success toast or error toast
    const successToast = page.getByText('Transactions Deleted');
    const errorToast = page.getByText('Error');

    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 60000 });

    if (await errorToast.isVisible()) {
        // Try to capture the error description
        // Assuming shadcn/ui toast structure
        const description = page.locator('[role="status"] .text-sm.opacity-90');
        if (await description.count() > 0) {
            const msg = await description.textContent();
            console.error('Deletion failed with error:', msg);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('fs').writeFileSync('error-message.txt', msg || 'Unknown error');
        } else {
            console.error('Deletion failed with unknown error');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('fs').writeFileSync('error-message.txt', 'Unknown error');
        }
        throw new Error('Deletion failed');
    }
});
