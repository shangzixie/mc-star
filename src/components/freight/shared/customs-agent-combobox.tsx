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

interface CustomsAgentComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function CustomsAgentCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder,
}: CustomsAgentComboboxProps) {
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
  const agents = allParties?.filter((p) => p.roles.includes('AGENT'));

  const selectedAgent = agents?.find((a) => a.id === value);

  const getAgentDisplayName = (agent: FreightParty) => {
    return agent.name || agent.code || agent.id;
  };

  const getAgentSecondaryInfo = (agent: FreightParty) => {
    const parts: string[] = [];
    if (agent.code) parts.push(agent.code);
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
            {selectedAgent ? (
              <span className="truncate">
                {getAgentDisplayName(selectedAgent)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('selectCustomsAgent')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('searchCustomsAgent')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t('loading') : t('noCustomsAgentFound')}
              </CommandEmpty>
              {agents && agents.length > 0 && (
                <CommandGroup>
                  {agents.map((agent) => (
                    <CommandItem
                      key={agent.id}
                      value={agent.id}
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
                            value === agent.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">
                            {getAgentDisplayName(agent)}
                          </span>
                          {getAgentSecondaryInfo(agent) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {getAgentSecondaryInfo(agent)}
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

      {selectedAgent && (
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
                  <strong>{t('customsAgentFields.name')}:</strong>{' '}
                  {selectedAgent.name}
                </div>
                {selectedAgent.code && (
                  <div>
                    <strong>{t('customsAgentFields.code')}:</strong>{' '}
                    {selectedAgent.code}
                  </div>
                )}
                {selectedAgent.address && (
                  <div>
                    <strong>{t('customsAgentFields.address')}:</strong>{' '}
                    {selectedAgent.address}
                  </div>
                )}
                {!!selectedAgent.contactInfo &&
                  typeof selectedAgent.contactInfo === 'object' &&
                  selectedAgent.contactInfo !== null && (
                    <div>
                      <strong>{t('customsAgentFields.contact')}:</strong>
                      {(() => {
                        const info = selectedAgent.contactInfo as Record<
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
