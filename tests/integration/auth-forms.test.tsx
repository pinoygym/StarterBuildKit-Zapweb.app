import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn((key) => key === 'token' ? 'test-token' : null),
    }),
}));

describe('Forgot Password Form (React 19)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form correctly', () => {
        render(<ForgotPasswordPage />);

        expect(screen.getByText('Forgot Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('submits form with email and shows success state', async () => {
        const user = userEvent.setup();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const submitButton = screen.getByRole('button', { name: /send reset link/i });

        await user.type(emailInput, 'test@example.com');
        await user.click(submitButton);

        // Wait for success state
        await waitFor(() => {
            expect(screen.getByText(/check your email for reset instructions/i)).toBeInTheDocument();
        });

        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText(/the link will expire in 1 hour/i)).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
        const user = userEvent.setup();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: false, message: 'User not found' }),
        });

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const submitButton = screen.getByRole('button', { name: /send reset link/i });

        await user.type(emailInput, 'nonexistent@example.com');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('User not found')).toBeInTheDocument();
        });
    });

    it('shows generic error on network failure', async () => {
        const user = userEvent.setup();

        (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const submitButton = screen.getByRole('button', { name: /send reset link/i });

        await user.type(emailInput, 'test@example.com');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
        });
    });

    it('requires email input', () => {
        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        expect(emailInput).toHaveAttribute('required');
        expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has back to login link', () => {
        render(<ForgotPasswordPage />);

        const backLinks = screen.getAllByText(/back to login/i);
        expect(backLinks.length).toBeGreaterThan(0);
    });
});

describe('Reset Password Form (React 19)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates password requirements', async () => {
        const user = userEvent.setup();

        // Dynamic import to handle Suspense
        const ResetPasswordPage = (await import('@/app/(auth)/reset-password/page')).default;

        render(<ResetPasswordPage />);

        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        });

        const passwordInput = screen.getByLabelText(/new password/i);

        // Type weak password
        await user.type(passwordInput, 'weak');

        // Should show validation errors
        await waitFor(() => {
            expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        });
    });

    it('shows error for invalid token', () => {
        // Mock no token
        vi.mocked(vi.mocked(await import('next/navigation')).useSearchParams).mockReturnValue({
            get: vi.fn(() => null),
        } as any);

        const ResetPasswordPage = require('@/app/(auth)/reset-password/page').default;

        render(<ResetPasswordPage />);

        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });
});
