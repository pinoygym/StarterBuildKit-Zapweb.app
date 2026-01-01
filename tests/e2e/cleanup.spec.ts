import { test, expect } from '@playwright/test';

test('cleanup test data', async ({ page }) => {
    // Go to settings page
    await page.goto('/settings');

    // Scroll to bottom to ensure section is loaded/visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Note: The button might be inside a card, so we look for it specifically
    const deleteButton = page.getByRole('button', { name: 'Delete Transactions' });

    // Check if visible, if not, maybe not logged in as admin or section not loaded
    await expect(deleteButton).toBeVisible({ timeout: 30000 });
    await deleteButton.click();

    // Wait for dialog
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    // Click confirm
    await page.getByRole('button', { name: 'Yes, Delete Transactions' }).click();

    // Wait for success toast or error toast
    // We use a more flexible locator to catch any toast content
    const toast = page.locator('[role="status"]');
    await expect(toast).toBeVisible({ timeout: 60000 });

    const toastText = await toast.innerText();
    console.log('Toast message received:', toastText);

    if (toastText.includes('Error') || toastText.includes('failed')) {
        console.error('Deletion failed with error:', toastText);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('fs').writeFileSync('error-message.txt', toastText);
        await page.screenshot({ path: 'cleanup-failure.png' });
        throw new Error(`Deletion failed: ${toastText}`);
    }

    await expect(page.getByText('Transactions Deleted').first()).toBeVisible();
});
