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
import { useFreightPorts } from '@/hooks/freight/use-freight-ports';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PortComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function PortCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder,
}: PortComboboxProps) {
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

  const { data: ports = [], isLoading } = useFreightPorts(debouncedQuery);

  const getPortDisplayName = (port: any) => {
    return port.nameCn || port.nameEn || port.unLocode || port.id;
  };

  const getPortSecondaryInfo = (port: any) => {
    const parts: string[] = [];
    if (port.unLocode) parts.push(port.unLocode);
    if (port.nameEn && port.nameEn !== port.nameCn) {
      parts.push(port.nameEn);
    }
    return parts.join(' • ');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || 'Select port...'}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
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
                {ports.map((port) => (
                  <CommandItem
                    key={port.id}
                    value={getPortDisplayName(port)}
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
                          value === getPortDisplayName(port)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">
                          {getPortDisplayName(port)}
                        </span>
                        {getPortSecondaryInfo(port) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {getPortSecondaryInfo(port)}
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
  );
}

