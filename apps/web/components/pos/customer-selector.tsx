'use client';

import { useState, useEffect } from 'react';
import { Search, User, Building2, Phone, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';
import { CustomerWithRelations } from '@/types/customer.types';
import { cn } from '@/lib/utils';

interface CustomerSelectorProps {
  selectedCustomer: CustomerWithRelations | null;
  onSelectCustomer: (customer: CustomerWithRelations | null) => void;
}

export function CustomerSelector({ selectedCustomer, onSelectCustomer }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: customers = [], isLoading } = useCustomers({
    status: 'active',
    search: searchQuery,
  });

  const handleSelect = (customer: CustomerWithRelations) => {
    onSelectCustomer(customer);
    setOpen(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchQuery('');
  };

  const formatCreditLimit = (amount: any) => {
    if (!amount) return 'N/A';
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-2">
      <Label>Customer (Optional - for Credit Sales)</Label>
      
      {selectedCustomer ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{selectedCustomer.companyName || selectedCustomer.contactPerson}</span>
              {selectedCustomer.customerType && (
                <Badge variant="outline" className="text-xs">
                  {selectedCustomer.customerType}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-0.5">
              {selectedCustomer.companyName && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  <span>{selectedCustomer.contactPerson}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.paymentTerms && (
                <div className="text-xs">
                  Terms: {selectedCustomer.paymentTerms} | 
                  Credit Limit: {formatCreditLimit(selectedCustomer.creditLimit)}
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4" />
                Select customer for credit sale...
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search by name, company, phone..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {isLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading customers...
                  </div>
                ) : customers.length === 0 ? (
                  <CommandEmpty>
                    {searchQuery ? 'No customers found' : 'No active customers'}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.companyName || ''} ${customer.contactPerson} ${customer.phone}`}
                        onSelect={() => handleSelect(customer)}
                        className="flex flex-col items-start gap-1 py-3"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {customer.companyName || customer.contactPerson}
                          </span>
                          {customer.customerType && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              {customer.customerType}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
                          {customer.companyName && (
                            <div>{customer.contactPerson}</div>
                          )}
                          <div className="flex items-center gap-4">
                            <span>{customer.phone}</span>
                            {customer.paymentTerms && (
                              <span className="text-primary">
                                {customer.paymentTerms}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
