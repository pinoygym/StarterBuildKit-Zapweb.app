import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface NumberInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: number | string;
    onChange?: (value: number | undefined) => void;
    allowNegative?: boolean;
    decimalPlaces?: number;
}

/**
 * NumberInput component that displays blank instead of 0 for easier data entry.
 * Converts between display value (string, can be empty) and actual value (number).
 */
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, value, onChange, allowNegative = false, decimalPlaces, ...props }, ref) => {
        // Convert number value to display string
        // If value is 0 or undefined/null, show empty string
        const displayValue = React.useMemo(() => {
            if (value === undefined || value === null || value === '' || value === 0) {
                return '';
            }
            return String(value);
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;

            // Allow empty string
            if (inputValue === '' || inputValue === '-') {
                onChange?.(undefined);
                return;
            }

            // Parse the number
            let numValue = parseFloat(inputValue);

            // Handle invalid numbers
            if (isNaN(numValue)) {
                onChange?.(undefined);
                return;
            }

            // Handle negative values
            if (!allowNegative && numValue < 0) {
                numValue = 0;
            }

            // Handle decimal places
            if (decimalPlaces !== undefined && decimalPlaces >= 0) {
                numValue = Math.round(numValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
            }

            onChange?.(numValue);
        };

        return (
            <Input
                ref={ref}
                type="number"
                className={cn(className)}
                value={displayValue}
                onChange={handleChange}
                {...props}
            />
        );
    }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
