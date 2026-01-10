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
  type FreightEmployee,
  useFreightEmployees,
} from '@/hooks/freight/use-freight-employees';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface EmployeeComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function EmployeeCombobox({
  value,
  onValueChange,
  disabled = false,
  className,
  placeholder,
}: EmployeeComboboxProps) {
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

  const { data: employees, isLoading } = useFreightEmployees({
    q: debouncedQuery,
  });

  const selectedEmployee = employees?.find((e) => e.id === value);

  const getEmployeeDisplayName = (employee: FreightEmployee) => {
    return employee.fullName;
  };

  const getEmployeeSecondaryInfo = (employee: FreightEmployee) => {
    const parts: string[] = [];
    if (employee.department) parts.push(employee.department);
    if (employee.branch) parts.push(employee.branch);
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
            {selectedEmployee ? (
              <span className="truncate">
                {getEmployeeDisplayName(selectedEmployee)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('employees.selectEmployee')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('employees.searchEmployee')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t('loading') : t('employees.noEmployeeFound')}
              </CommandEmpty>
              {employees && employees.length > 0 && (
                <CommandGroup>
                  {employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.id}
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
                            value === employee.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate">
                            {getEmployeeDisplayName(employee)}
                          </span>
                          {getEmployeeSecondaryInfo(employee) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {getEmployeeSecondaryInfo(employee)}
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
    </div>
  );
}
