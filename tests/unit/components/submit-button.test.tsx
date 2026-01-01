import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmitButton } from '@/components/ui/submit-button';
import React from 'react';
import { useFormStatus } from 'react-dom';

// Mock useFormStatus from react-dom
vi.mock('react-dom', () => ({
    useFormStatus: vi.fn(),
}));

describe('SubmitButton', () => {
    const mockUseFormStatus = vi.mocked(useFormStatus);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children when not pending', () => {
        mockUseFormStatus.mockReturnValue({ pending: false, data: null, method: null, action: null });

        render(<SubmitButton>Submit</SubmitButton>);

        expect(screen.getByRole('button')).toHaveTextContent('Submit');
        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('shows pending text when form is submitting', () => {
        mockUseFormStatus.mockReturnValue({ pending: true, data: new FormData(), method: 'POST', action: '/submit' });

        render(<SubmitButton pendingText="Saving...">Submit</SubmitButton>);

        expect(screen.getByRole('button')).toHaveTextContent('Saving...');
    });

    it('disables button when pending', () => {
        mockUseFormStatus.mockReturnValue({ pending: true, data: new FormData(), method: 'POST', action: '/submit' });

        render(<SubmitButton>Submit</SubmitButton>);

        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows spinner when pending and showSpinner is true', () => {
        mockUseFormStatus.mockReturnValue({ pending: true, data: new FormData(), method: 'POST', action: '/submit' });

        const { container } = render(<SubmitButton showSpinner>Submit</SubmitButton>);

        // Check for Loader2 icon (has animate-spin class)
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('hides spinner when showSpinner is false', () => {
        mockUseFormStatus.mockReturnValue({ pending: true, data: new FormData(), method: 'POST', action: '/submit' });

        const { container } = render(<SubmitButton showSpinner={false}>Submit</SubmitButton>);

        const spinner = container.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
    });

    it('uses children as pending text if pendingText not provided', () => {
        mockUseFormStatus.mockReturnValue({ pending: true, data: new FormData(), method: 'POST', action: '/submit' });

        render(<SubmitButton>Submit</SubmitButton>);

        expect(screen.getByRole('button')).toHaveTextContent('Submit');
    });

    it('respects disabled prop even when not pending', () => {
        mockUseFormStatus.mockReturnValue({ pending: false, data: null, method: null, action: null });

        render(<SubmitButton disabled>Submit</SubmitButton>);

        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('passes through additional button props', () => {
        mockUseFormStatus.mockReturnValue({ pending: false, data: null, method: null, action: null });

        render(<SubmitButton className="custom-class" variant="destructive">Submit</SubmitButton>);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });

    it('always renders as type="submit"', () => {
        mockUseFormStatus.mockReturnValue({ pending: false, data: null, method: null, action: null });

        render(<SubmitButton>Submit</SubmitButton>);

        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
});
