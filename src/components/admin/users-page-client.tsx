'use client';

import { UsersTable } from '@/components/admin/users-table';
import { getSortingStateParser } from '@/components/data-table/lib/parsers';
import type { ExtendedColumnSort } from '@/components/data-table/types/data-table';
import { useUsers } from '@/hooks/use-users';
import type { User } from '@/lib/auth-types';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useEffect, useMemo, useRef } from 'react';

export function UsersPageClient() {
  const t = useTranslations('Dashboard.admin.users');

  const sortableColumnIds = useMemo<Array<Extract<keyof User, string>>>(
    () => [
      'name',
      'email',
      'role',
      'createdAt',
      'customerId',
      'banned',
      'banReason',
      'banExpires',
    ],
    []
  );

  const sortableColumnSet = useMemo(
    () => new Set<Extract<keyof User, string>>(sortableColumnIds),
    [sortableColumnIds]
  );

  const defaultSorting = useMemo<ExtendedColumnSort<User>[]>(
    () => [{ id: 'createdAt', desc: true }],
    []
  );

  const [{ page, size, search, sort, role, status }, setQueryStates] =
    useQueryStates({
      page: parseAsIndex.withDefault(0), // parseAsIndex adds +1 to URL, so 0-based internally, 1-based in URL
      size: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      sort: getSortingStateParser<User>(sortableColumnIds).withDefault(
        defaultSorting
      ),
      role: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
    });

  // normalize sorting to ensure it only contains valid column ids
  const normalizeSorting = (
    value: SortingState
  ): ExtendedColumnSort<User>[] => {
    const filtered = value
      .filter((item) =>
        sortableColumnSet.has(item.id as Extract<keyof User, string>)
      )
      .map((item) => ({
        ...item,
        id: item.id as Extract<keyof User, string>,
      })) as ExtendedColumnSort<User>[];

    return filtered.length > 0 ? filtered : defaultSorting;
  };

  const safeSorting = normalizeSorting(sort);

  // Build filters for both client UI and server API
  const filters = useMemo(() => {
    const clientFilters: ColumnFiltersState = [];
    const serverFilters: Array<{ id: string; value: string }> = [];

    if (role) {
      clientFilters.push({ id: 'role', value: [role] });
      serverFilters.push({ id: 'role', value: role });
    }
    if (status) {
      clientFilters.push({ id: 'status', value: [status] });
      serverFilters.push({ id: 'status', value: status });
    }

    return { clientFilters, serverFilters };
  }, [role, status]);

  const filtersSignature = useMemo(
    () => JSON.stringify({ role, status }),
    [role, status]
  );

  const previousFiltersSignatureRef = useRef(filtersSignature);

  // reset page to 0 when filters change
  useEffect(() => {
    if (previousFiltersSignatureRef.current === filtersSignature) return;
    previousFiltersSignatureRef.current = filtersSignature;
    void setQueryStates(
      { page: 0 },
      {
        history: 'replace',
        shallow: true,
      }
    );
  }, [filtersSignature, setQueryStates]);

  // page is already 0-based internally thanks to parseAsIndex
  const { data, isLoading } = useUsers(
    page,
    size,
    search,
    safeSorting,
    filters.serverFilters
  );

  return (
    <UsersTable
      data={data?.items || []}
      total={data?.total || 0}
      pageIndex={page}
      pageSize={size}
      search={search}
      sorting={safeSorting}
      filters={filters.clientFilters}
      loading={isLoading}
      onSearch={(newSearch) => setQueryStates({ search: newSearch, page: 0 })}
      onPageChange={(newPageIndex) => setQueryStates({ page: newPageIndex })}
      onPageSizeChange={(newPageSize) =>
        setQueryStates({ size: newPageSize, page: 0 })
      }
      onSortingChange={(newSorting) => {
        const nextSorting = normalizeSorting(newSorting);
        setQueryStates({ sort: nextSorting, page: 0 });
      }}
      onFiltersChange={(nextFilters) => {
        const roleFilter = nextFilters.find((filter) => filter.id === 'role');
        const statusFilter = nextFilters.find(
          (filter) => filter.id === 'status'
        );
        const nextRole =
          roleFilter && Array.isArray(roleFilter.value)
            ? ((roleFilter.value[0] as string) ?? '')
            : '';
        const nextStatus =
          statusFilter && Array.isArray(statusFilter.value)
            ? ((statusFilter.value[0] as string) ?? '')
            : '';
        setQueryStates(
          { role: nextRole, status: nextStatus, page: 0 },
          { history: 'replace', shallow: true }
        );
      }}
    />
  );
}
