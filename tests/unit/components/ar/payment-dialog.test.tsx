// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentDialog } from '@/components/ar/payment-dialog';
import userEvent from '@testing-library/user-event';

// Mock UI components that might cause issues in JSDOM
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock fetch
global.fetch = vi.fn();

describe('PaymentDialog', () => {
    const mockAR = {
        id: 'ar-123',
        customerName: 'Test Customer',
        balance: 5000,
        totalAmount: 10000,
        referenceNumber: 'SO-100',
    };

    const mockFundSources = [
        { id: 'fs-1', name: 'Cash on Hand', type: 'cash' },
        { id: 'fs-2', name: 'BDO Check', type: 'bank' },
    ];

    const defaultProps = {
        ar: mockAR,
        fundSources: mockFundSources,
        open: true,
        onOpenChange: vi.fn(),
        onPaymentSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with AR details', () => {
        render(<PaymentDialog {...defaultProps} />);

        // Check heading
        expect(screen.getByRole('heading', { name: 'Record Payment' })).toBeInTheDocument();
        // Check button
        expect(screen.getByRole('button', { name: 'Record Payment' })).toBeInTheDocument();

        expect(screen.getByText('Test Customer')).toBeInTheDocument();
        // Use regex to match formatted currency if simpler 
        // or just check if balance number is present part of string
        // "Outstanding Balance: ₱5,000.00"
        expect(screen.getByText((content) => content.includes('5,000'))).toBeInTheDocument();
    });

    it('validates amount cannot exceed balance', async () => {
        render(<PaymentDialog {...defaultProps} />);

        const amountInput = screen.getByLabelText(/Payment Amount/i);
        await userEvent.type(amountInput, '6000'); // Exceeds 5000

        const submitBtn = screen.getByRole('button', { name: /Record Payment/i });
        await userEvent.click(submitBtn);

        expect(await screen.findByText(/Amount cannot exceed balance/i)).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('submits valid payment successfully', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<PaymentDialog {...defaultProps} />);

        const amountInput = screen.getByLabelText(/Payment Amount/i);
        await userEvent.clear(amountInput);
        await userEvent.type(amountInput, '1000');

        const submitBtn = screen.getByRole('button', { name: /Record Payment/i });
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/ar/payment', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"amount":1000'),
            }));
        });

        expect(defaultProps.onPaymentSuccess).toHaveBeenCalled();
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
});
