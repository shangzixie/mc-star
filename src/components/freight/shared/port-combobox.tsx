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
  useFreightPortById,
  useFreightPorts,
} from '@/hooks/freight/use-freight-ports';
import type { TransportNode } from '@/lib/freight/api-types';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { AddLocationDialog } from './add-location-dialog';

interface PortComboboxProps {
  value?: string; // transport_nodes.id (uuid)
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  allowAddNew?: boolean;
}

export function PortCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder,
  allowAddNew = true,
}: PortComboboxProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('A'); // Default to 'A'
  const [portCache, setPortCache] = useState<Record<string, TransportNode>>({});
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery || 'A'); // Always at least 'A'
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: ports = [], isLoading } = useFreightPorts(debouncedQuery);
  const selectedPortQuery = useFreightPortById(value);

  useEffect(() => {
    if (ports.length === 0) return;
    setPortCache((prev) => {
      const next = { ...prev };
      for (const port of ports) {
        next[port.id] = port;
      }
      return next;
    });
  }, [ports]);

  // Find selected port to display its label
  const selectedPort = useMemo(() => {
    if (!value) return null;
    return (
      portCache[value] ??
      selectedPortQuery.data ??
      ports.find((p) => p.id === value) ??
      null
    );
  }, [value, portCache, ports, selectedPortQuery.data]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('w-full justify-between h-auto py-2', className)}
          disabled={disabled}
        >
          {selectedPort ? (
            <div className="flex flex-col items-start text-left">
              <span className="font-medium text-sm">
                {selectedPort.unLocode || '-'}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedPort.nameEn || selectedPort.nameCn || '-'}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedPort.countryCode || '-'}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || 'Select port...'}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder || 'Search ports...'}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No ports found.'}
            </CommandEmpty>
            {ports && ports.length > 0 && (
              <CommandGroup>
                {ports.map((port: TransportNode) => (
                  <CommandItem
                    key={port.id}
                    value={port.id}
                    onSelect={() => {
                      onValueChange(port.id === value ? undefined : port.id);
                      setPortCache((prev) => ({
                        ...prev,
                        [port.id]: port,
                      }));
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3"
                  >
                    <Check
                      className={cn(
                        'size-4 shrink-0',
                        port.id === value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="grid grid-cols-[100px_1fr_60px] gap-2 flex-1 min-w-0">
                      <span className="font-mono text-sm truncate">
                        {port.unLocode || '-'}
                      </span>
                      <span className="truncate">
                        {port.nameCn || port.nameEn || '-'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {port.countryCode || '-'}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowAddNew && (
              <>
                <div className="border-t" />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setAddLocationOpen(true);
                    }}
                    className="text-primary"
                  >
                    <Plus className="mr-2 size-4" />
                    {t('locationActions.addPort')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
      <AddLocationDialog
        open={addLocationOpen}
        onOpenChange={setAddLocationOpen}
        onSuccess={(locationId) => {
          onValueChange(locationId);
        }}
      />
    </Popover>
  );
}
