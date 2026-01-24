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
import { useFreightWarehouses } from '@/hooks/freight/use-freight-master-data';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface WarehouseComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  onAddNew?: () => void;
  className?: string;
  placeholder?: string;
}

export function WarehouseCombobox({
  value,
  onValueChange,
  disabled = false,
  onAddNew,
  className,
  placeholder,
}: WarehouseComboboxProps) {
  const t = useTranslations('Dashboard.freight.inbound.transportSchedule');
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

  const { data: warehouses, isLoading } = useFreightWarehouses({
    q: debouncedQuery,
  });

  const selectedWarehouse = warehouses?.find((w) => w.id === value);

  const getWarehouseDisplayName = (warehouse: { id: string; name: string }) => {
    return warehouse.name || warehouse.id;
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
            {selectedWarehouse ? (
              <span className="truncate">
                {getWarehouseDisplayName(selectedWarehouse)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('warehouseField.placeholder')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('warehouseField.placeholder')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{isLoading ? '加载中...' : '无结果'}</CommandEmpty>
              {warehouses && warehouses.length > 0 && (
                <CommandGroup>
                  {warehouses.map((warehouse) => (
                    <CommandItem
                      key={warehouse.id}
                      value={warehouse.id}
                      onSelect={(currentValue) => {
                        onValueChange(
                          currentValue === value ? undefined : currentValue
                        );
                        setOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value === warehouse.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {getWarehouseDisplayName(warehouse)}
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
                      {t('warehouseField.new')}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
