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
import { useFreightParties } from '@/hooks/freight/use-freight-master-data';
import type { FreightParty } from '@/lib/freight/api-types';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PartyComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  onAddNew?: () => void;
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function PartyCombobox({
  value,
  onValueChange,
  disabled = false,
  onAddNew,
  className,
  placeholder = '选择...',
  searchPlaceholder = '搜索...',
  emptyText = '无结果',
}: PartyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: allParties, isLoading } = useFreightParties({
    q: debouncedQuery,
  });

  const selectedParty = allParties?.find((p) => p.id === value);

  const getPartyDisplayName = (party: FreightParty) => {
    return party.nameCn || party.nameEn || party.code || party.id;
  };

  const getPartySecondaryInfo = (party: FreightParty) => {
    const parts: string[] = [];
    if (party.code) parts.push(party.code);
    if (party.nameEn && party.nameEn !== party.nameCn) {
      parts.push(party.nameEn);
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
            type="button"
          >
            {selectedParty ? (
              <span className="truncate">
                {getPartyDisplayName(selectedParty)}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{isLoading ? '加载中...' : emptyText}</CommandEmpty>
              {allParties && allParties.length > 0 && (
                <CommandGroup>
                  {allParties.map((party) => (
                    <CommandItem
                      key={party.id}
                      value={party.id}
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
                            value === party.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">
                            {getPartyDisplayName(party)}
                          </span>
                          {getPartySecondaryInfo(party) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {getPartySecondaryInfo(party)}
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
                      新增客户
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
