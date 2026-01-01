'use client';

import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
    children: React.ReactNode;
    pendingText?: string;
    showSpinner?: boolean;
}

/**
 * A submit button that automatically shows a loading state when the form is pending.
 * Uses React 19's useFormStatus hook to detect form submission state.
 * 
 * @example
 * <form action={myAction}>
 *   <SubmitButton pendingText="Saving...">Save</SubmitButton>
 * </form>
 */
export function SubmitButton({
    children,
    pendingText,
    showSpinner = true,
    disabled,
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending || disabled} {...props}>
            {pending && showSpinner && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? (pendingText ?? children) : children}
        </Button>
    );
}
