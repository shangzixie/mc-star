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
  AIRLINE_OPTIONS,
  type CarrierOption,
  OCEAN_CARRIER_OPTIONS,
} from '@/db/enums/index';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CarrierComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  options: CarrierOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  allowCustom?: boolean;
}

function CarrierCombobox({
  value,
  onValueChange,
  options,
  disabled = false,
  className,
  placeholder,
  allowCustom = true,
}: CarrierComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => {
      const name = option.name.toLowerCase();
      const code = (option.code ?? '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [options, searchQuery]);

  const selectedOption = useMemo(
    () => options.find((option) => option.name === value),
    [options, value]
  );

  const showCustomOption = useMemo(() => {
    const query = searchQuery.trim();
    if (!allowCustom || !query) return false;
    return !options.some(
      (option) => option.name.toLowerCase() === query.toLowerCase()
    );
  }, [allowCustom, options, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.name}</span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder ?? 'Select'}
            </span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder ?? 'Search'}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={`${option.name}-${option.code ?? ''}`}
                    value={option.name}
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
                          value === option.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{option.name}</span>
                        {option.code && (
                          <span className="text-xs text-muted-foreground truncate">
                            {option.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCustomOption && (
              <CommandGroup>
                <CommandItem
                  value={searchQuery.trim()}
                  onSelect={() => {
                    const nextValue = searchQuery.trim();
                    onValueChange(nextValue || undefined);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                >
                  Use &quot;{searchQuery.trim()}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type SimpleCarrierComboboxProps = Omit<CarrierComboboxProps, 'options'>;

export function AirlineCombobox(props: SimpleCarrierComboboxProps) {
  return (
    <CarrierCombobox
      {...props}
      options={AIRLINE_OPTIONS}
      placeholder={props.placeholder ?? 'Select airline'}
    />
  );
}

export function OceanCarrierCombobox(props: SimpleCarrierComboboxProps) {
  return (
    <CarrierCombobox
      {...props}
      options={OCEAN_CARRIER_OPTIONS}
      placeholder={props.placeholder ?? 'Select carrier'}
    />
  );
}
