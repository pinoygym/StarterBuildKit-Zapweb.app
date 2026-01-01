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

import { useProducts } from '@/hooks/use-products';

interface ProductSearchComboboxProps {
    products?: ProductWithUOMs[];
    value: string;
    onValueChange: (value: string) => void;
    onSelect?: (product: ProductWithUOMs) => void;
    selectedProduct?: ProductWithUOMs;
    placeholder?: string;
    disabled?: boolean;
}

export function ProductSearchCombobox({
    products = [],
    value,
    onValueChange,
    onSelect,
    selectedProduct,
    placeholder = 'Select product...',
    disabled = false,
}: ProductSearchComboboxProps) {
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

    // Fetch products based on search query
    const { products: searchResults, loading } = useProducts(
        { search: debouncedQuery, status: 'active' },
        { enabled: open && debouncedQuery.length > 0 }
    );

    // Determine which products to show
    // If searching, show search results. Otherwise show initial products.
    const options = debouncedQuery.length > 0 ? searchResults : products;

    // Find the product object to display in the input
    // First check prop, then fall back to finding it in the options list
    const displayProduct = selectedProduct ||
        options.find((product) => product.id === value) ||
        products.find((product) => product.id === value);

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
                    {displayProduct ? (
                        <span className="truncate">{displayProduct.name}</span>
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
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading...
                            </div>
                        )}
                        {!loading && options.length === 0 && (
                            <CommandEmpty>No products found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {options.map((product) => (
                                <CommandItem
                                    key={product.id}
                                    value={product.id}
                                    onSelect={() => {
                                        onValueChange(product.id === value ? '' : product.id);
                                        if (onSelect) {
                                            onSelect(product);
                                        }
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
