import { type Page, type Locator, expect } from '@playwright/test';

export class RegisterPage {
    readonly page: Page;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly submitButton: Locator;
    readonly signInLink: Locator;
    readonly alreadyRegisteredError: Locator;

    constructor(page: Page) {
        this.page = page;
        this.firstNameInput = page.getByLabel(/first name/i);
        this.lastNameInput = page.getByLabel(/last name/i);
        this.emailInput = page.getByLabel(/email/i);
        this.passwordInput = page.getByLabel(/^Password$/i);
        this.confirmPasswordInput = page.getByLabel(/confirm password/i);
        this.submitButton = page.getByRole('button', { name: /account/i });
        this.signInLink = page.getByRole('link', { name: /sign in/i });
        this.alreadyRegisteredError = page.getByText(/already registered/i);
    }

    async goto() {
        await this.page.goto('/register');
    }

    async fillRegistrationForm(user: {
        firstName: string;
        lastName: string;
        email: string;
        password?: string;
    }) {
        await this.firstNameInput.fill(user.firstName);
        await this.lastNameInput.fill(user.lastName);
        await this.emailInput.fill(user.email);
        const password = user.password || 'TestPassword123!';
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(password);
    }

    async submit() {
        await this.submitButton.click();
    }

    async verifyRedirectionToDashboardOrLogin() {
        // Wait for URL to change to something other than register
        await expect(this.page).not.toHaveURL(/\/register/, { timeout: 15000 });
        // Use regex to match either dashboard or login
        expect(this.page.url()).toMatch(/\/(dashboard|login)/);
    }

    async verifyErrorVisible(messageRegex: RegExp) {
        const alert = this.page.locator('div[role="alert"]').filter({ hasText: messageRegex }).first();
        await expect(alert).toBeVisible();
    }
}
