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
import { Check, ChevronsUpDown, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface ShipperComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ShipperCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder,
}: ShipperComboboxProps) {
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
  const shippers = allParties?.filter((p) => p.roles.includes('SHIPPER'));

  const selectedShipper = shippers?.find((s) => s.id === value);

  const getShipperDisplayName = (shipper: FreightParty) => {
    return shipper.nameCn || shipper.nameEn || shipper.code || shipper.id;
  };

  const getShipperSecondaryInfo = (shipper: FreightParty) => {
    const parts: string[] = [];
    if (shipper.code) parts.push(shipper.code);
    if (shipper.nameEn && shipper.nameEn !== shipper.nameCn) {
      parts.push(shipper.nameEn);
    }
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
            {selectedShipper ? (
              <span className="truncate">
                {getShipperDisplayName(selectedShipper)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('selectShipper')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('searchShipper')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t('loading') : t('noShipperFound')}
              </CommandEmpty>
              {shippers && shippers.length > 0 && (
                <CommandGroup>
                  {shippers.map((shipper) => (
                    <CommandItem
                      key={shipper.id}
                      value={shipper.id}
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
                            value === shipper.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">
                            {getShipperDisplayName(shipper)}
                          </span>
                          {getShipperSecondaryInfo(shipper) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {getShipperSecondaryInfo(shipper)}
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

      {selectedShipper && (
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
                  <strong>{t('shipperFields.name')}:</strong>{' '}
                  {selectedShipper.nameCn}
                  {selectedShipper.nameEn && ` (${selectedShipper.nameEn})`}
                </div>
                {selectedShipper.code && (
                  <div>
                    <strong>{t('shipperFields.code')}:</strong>{' '}
                    {selectedShipper.code}
                  </div>
                )}
                {selectedShipper.address && (
                  <div>
                    <strong>{t('shipperFields.address')}:</strong>{' '}
                    {selectedShipper.address}
                  </div>
                )}
                {selectedShipper.contactInfo &&
                  typeof selectedShipper.contactInfo === 'object' &&
                  selectedShipper.contactInfo !== null && (
                    <div>
                      <strong>{t('shipperFields.contact')}:</strong>
                      {(() => {
                        const info = selectedShipper.contactInfo as Record<
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
