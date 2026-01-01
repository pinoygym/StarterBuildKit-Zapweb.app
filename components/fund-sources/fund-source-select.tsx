'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFundSources } from '@/hooks/use-fund-sources';
import { FundSourceWithBranch, FUND_SOURCE_TYPE_LABELS, FundSourceType } from '@/types/fund-source.types';
import { Wallet, Building2, Loader2 } from 'lucide-react';

interface FundSourceSelectProps {
    value?: string | null;
    onChange: (value: string | null) => void;
    branchId?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    showBalance?: boolean;
    error?: string;
}

export function FundSourceSelect({
    value,
    onChange,
    branchId,
    label = 'Fund Source',
    placeholder = 'Select fund source',
    required = false,
    disabled = false,
    showBalance = true,
    error,
}: FundSourceSelectProps) {
    const { data: fundSources = [], isLoading } = useFundSources({
        branchId,
        status: 'active',
    });

    const selectedFundSource = fundSources.find((fs: FundSourceWithBranch) => fs.id === value);

    const getIcon = (type: string) => {
        if (type === 'BANK_ACCOUNT' || type === 'CREDIT_LINE') {
            return <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />;
        }
        return <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />;
    };

    return (
        <div className="space-y-2">
            {label && (
                <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : undefined}>
                    {label}
                </Label>
            )}
            <Select
                value={value || ''}
                onValueChange={(val) => onChange(val || null)}
                disabled={disabled || isLoading}
            >
                <SelectTrigger className={error ? 'border-destructive' : undefined}>
                    {isLoading ? (
                        <div className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                        </div>
                    ) : (
                        <SelectValue placeholder={placeholder}>
                            {selectedFundSource && (
                                <div className="flex items-center">
                                    {getIcon(selectedFundSource.type)}
                                    <span>{selectedFundSource.name}</span>
                                    {showBalance && (
                                        <span className="ml-2 text-muted-foreground">
                                            (₱{selectedFundSource.currentBalance.toLocaleString()})
                                        </span>
                                    )}
                                </div>
                            )}
                        </SelectValue>
                    )}
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">
                        <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    {fundSources.map((fs: FundSourceWithBranch) => (
                        <SelectItem key={fs.id} value={fs.id}>
                            <div className="flex items-center">
                                {getIcon(fs.type)}
                                <div className="flex flex-col">
                                    <span>{fs.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {FUND_SOURCE_TYPE_LABELS[fs.type as FundSourceType]}
                                        {showBalance && ` • ₱${fs.currentBalance.toLocaleString()}`}
                                    </span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
