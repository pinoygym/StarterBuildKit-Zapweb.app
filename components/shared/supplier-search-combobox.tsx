'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Supplier } from '@prisma/client';
import { useSuppliers } from '@/hooks/use-suppliers';

interface SupplierSearchComboboxProps {
    suppliers?: Supplier[];
    value: string;
    onValueChange: (value: string) => void;
    onSelect?: (supplier: Supplier) => void;
    selectedSupplier?: Supplier;
    placeholder?: string;
    disabled?: boolean;
}

export function SupplierSearchCombobox({
    suppliers = [],
    value,
    onValueChange,
    onSelect,
    selectedSupplier,
    placeholder = 'Select supplier...',
    disabled = false,
}: SupplierSearchComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [debouncedQuery, setDebouncedQuery] = React.useState('');

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch suppliers based on search query
    const { data: searchResults, isLoading } = useSuppliers(
        { search: debouncedQuery, status: 'active' },
    );

    // Determine which suppliers to show
    // If searching and we have results from hook, use those. 
    // Otherwise show initial suppliers passed as prop.
    const options = debouncedQuery.length > 0 && searchResults ? searchResults : suppliers;

    const displaySupplier = selectedSupplier ||
        options.find((s) => s.id === value) ||
        suppliers.find((s) => s.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {displaySupplier ? (
                        <span className="truncate">{displaySupplier.companyName}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading...
                            </div>
                        )}
                        {!isLoading && options.length === 0 && (
                            <CommandEmpty>No suppliers found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {options.filter(s => s.status === 'active').map((supplier) => (
                                <CommandItem
                                    key={supplier.id}
                                    value={supplier.id}
                                    onSelect={() => {
                                        onValueChange(supplier.id === value ? '' : supplier.id);
                                        if (onSelect) {
                                            onSelect(supplier);
                                        }
                                        setOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium truncate">{supplier.companyName}</span>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span>{supplier.contactName}</span>
                                            {supplier.phone && (
                                                <>
                                                    <span>•</span>
                                                    <span>{supplier.phone}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Check
                                        className={cn(
                                            'ml-2 h-4 w-4 shrink-0',
                                            value === supplier.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
