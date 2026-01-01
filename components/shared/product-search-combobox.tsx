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
import { ProductWithUOMs } from '@/types/product.types';

interface ProductSearchComboboxProps {
    products: ProductWithUOMs[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function ProductSearchCombobox({
    products,
    value,
    onValueChange,
    placeholder = 'Select product...',
    disabled = false,
}: ProductSearchComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const selectedProduct = (products || []).find((product) => product.id === value);

    // Filter products based on search query
    const filteredProducts = (products || [])
        .filter((p) => p.status === 'active')
        .filter((p) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.baseUOM.toLowerCase().includes(query)
            );
        });

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
                    {selectedProduct ? (
                        <span className="truncate">{selectedProduct.name}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search products..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                            {filteredProducts.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={product.id}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue === value ? '' : currentValue);
                                        setOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-medium truncate">{product.name}</span>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span>{product.category}</span>
                                            <span>•</span>
                                            <span>{product.baseUOM}</span>
                                        </div>
                                    </div>
                                    <Check
                                        className={cn(
                                            'ml-2 h-4 w-4 shrink-0',
                                            value === product.id ? 'opacity-100' : 'opacity-0'
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
