'use client';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFreightParties } from '@/hooks/freight/use-freight-master-data';
import type { FreightParty } from '@/lib/freight/api-types';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Info, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface CustomerComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  onAddNew?: () => void;
  className?: string;
  placeholder?: string;
}

export function CustomerCombobox({
  value,
  onValueChange,
  disabled = false,
  onAddNew,
  className,
  placeholder,
}: CustomerComboboxProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: allParties, isLoading } = useFreightParties({
    q: debouncedQuery,
  });
  const customers = allParties?.filter((p) => p.roles.includes('CUSTOMER'));

  const selectedCustomer = customers?.find((c) => c.id === value);

  const getCustomerDisplayName = (customer: FreightParty) => {
    return customer.name || customer.code || customer.id;
  };

  const getCustomerSecondaryInfo = (customer: FreightParty) => {
    const parts: string[] = [];
    if (customer.code) parts.push(customer.code);
    return parts.join(' • ');
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-expanded={open}
            className="flex-1 justify-between"
            disabled={disabled}
          >
            {selectedCustomer ? (
              <span className="truncate">
                {getCustomerDisplayName(selectedCustomer)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('selectCustomer')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('searchCustomer')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t('loading') : t('noCustomerFound')}
              </CommandEmpty>
              {customers && customers.length > 0 && (
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={(currentValue) => {
                        onValueChange(
                          currentValue === value ? undefined : currentValue
                        );
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check
                          className={cn(
                            'size-4 shrink-0',
                            value === customer.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">
                            {getCustomerDisplayName(customer)}
                          </span>
                          {getCustomerSecondaryInfo(customer) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {getCustomerSecondaryInfo(customer)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {onAddNew && (
                <>
                  <div className="border-t" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        onAddNew();
                      }}
                      className="text-primary"
                    >
                      <Plus className="mr-2 size-4" />
                      {t('addNewCustomer')}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Info className="size-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>{t('customerFields.name')}:</strong>{' '}
                  {selectedCustomer.name}
                </div>
                {selectedCustomer.code && (
                  <div>
                    <strong>{t('customerFields.code')}:</strong>{' '}
                    {selectedCustomer.code}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div>
                    <strong>{t('customerFields.address')}:</strong>{' '}
                    {selectedCustomer.address}
                  </div>
                )}
                {!!selectedCustomer.contactInfo &&
                  typeof selectedCustomer.contactInfo === 'object' &&
                  selectedCustomer.contactInfo !== null && (
                    <div>
                      <strong>{t('customerFields.contact')}:</strong>
                      {(() => {
                        const info = selectedCustomer.contactInfo as Record<
                          string,
                          unknown
                        >;
                        const parts: string[] = [];
                        if (info.phone) parts.push(`${info.phone}`);
                        if (info.email) parts.push(`${info.email}`);
                        return parts.length > 0 ? ` ${parts.join(', ')}` : ' -';
                      })()}
                    </div>
                  )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
