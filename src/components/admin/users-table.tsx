'use client';

import { UserDetailViewer } from '@/components/admin/user-detail-viewer';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User } from '@/lib/auth-types';
import { formatDate } from '@/lib/formatter';
import { getStripeDashboardCustomerUrl } from '@/lib/urls/urls';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  MailCheckIcon,
  MailQuestionIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow className="h-14">
      {Array.from({ length: columns }).map((_, index) => {
        if (index === 0) {
          // First column: Name column with avatar + text structure
          return (
            <TableCell key={index} className="py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full shrink-0 bg-muted" />
                <Skeleton className="h-4 w-20" />
              </div>
            </TableCell>
          );
        }
        if (index === 1) {
          // Second column: Email column with icon + badge structure
          return (
            <TableCell key={index} className="py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" />
              </div>
            </TableCell>
          );
        }
        if (index === 2 || index === 5) {
          // Role and Status columns: Badge structure
          return (
            <TableCell key={index} className="py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
              </div>
            </TableCell>
          );
        }
        // Other columns: Regular text content
        return (
          <TableCell key={index} className="py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

interface UsersTableProps {
  data: User[];
  total: number;
  pageIndex: number;
  pageSize: number;
  search: string;
  sorting: SortingState;
  filters?: ColumnFiltersState;
  loading?: boolean;
  onSearch: (search: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
}

/**
 * https://www.diceui.com/docs/components/data-table
 */
export function UsersTable({
  data,
  total,
  pageIndex,
  pageSize,
  search,
  sorting,
  filters,
  loading,
  onSearch,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onFiltersChange,
}: UsersTableProps) {
  const t = useTranslations('Dashboard.admin.users');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const roleFilterOptions = useMemo(
    () => [
      { label: t('admin'), value: 'admin' },
      { label: t('user'), value: 'user' },
    ],
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { label: t('active'), value: 'active' },
      { label: t('inactive'), value: 'inactive' },
    ],
    [t]
  );

  // Table columns definition
  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.name')} />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return <UserDetailViewer user={user} />;
        },
        meta: {
          label: t('columns.name'),
        },
        minSize: 120,
        size: 140,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.email')} />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-sm px-1.5 cursor-pointer hover:bg-accent"
                onClick={() => {
                  navigator.clipboard.writeText(user.email);
                  toast.success(t('emailCopied'));
                }}
              >
                {user.emailVerified ? (
                  <MailCheckIcon className="stroke-green-500 dark:stroke-green-400" />
                ) : (
                  <MailQuestionIcon className="stroke-red-500 dark:stroke-red-400" />
                )}
                {user.email}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('columns.email'),
        },
        minSize: 180,
        size: 200,
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.role')} />
        ),
        cell: ({ row }) => {
          const user = row.original;
          const role = user.role || 'user';
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={role === 'admin' ? 'default' : 'outline'}
                className="px-1.5"
              >
                {role === 'admin' ? t('admin') : t('user')}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('columns.role'),
        },
        minSize: 100,
        size: 120,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.createdAt')}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {formatDate(user.createdAt)}
            </div>
          );
        },
        meta: {
          label: t('columns.createdAt'),
        },
        minSize: 140,
        size: 160,
      },
      {
        id: 'customerId',
        accessorKey: 'customerId',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.customerId')}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {user.customerId ? (
                <a
                  href={getStripeDashboardCustomerUrl(user.customerId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:underline-offset-4"
                >
                  {user.customerId}
                </a>
              ) : (
                '-'
              )}
            </div>
          );
        },
        meta: {
          label: t('columns.customerId'),
        },
        minSize: 120,
        size: 140,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.status')} />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-1.5 hover:bg-accent">
                {user.banned ? (
                  <UserRoundXIcon className="stroke-red-500 dark:stroke-red-400" />
                ) : (
                  <UserRoundCheckIcon className="stroke-green-500 dark:stroke-green-400" />
                )}
                {user.banned ? t('inactive') : t('active')}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('columns.status'),
        },
        minSize: 100,
        size: 120,
      },
      {
        id: 'banReason',
        accessorKey: 'banReason',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.banReason')}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {user.banReason || '-'}
            </div>
          );
        },
        meta: {
          label: t('columns.banReason'),
        },
        minSize: 120,
        size: 140,
      },
      {
        id: 'banExpires',
        accessorKey: 'banExpires',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.banExpires')}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {user.banExpires ? formatDate(user.banExpires) : '-'}
            </div>
          );
        },
        meta: {
          label: t('columns.banExpires'),
        },
        minSize: 140,
        size: 160,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: {
      sorting,
      columnFilters: filters ?? [],
      columnVisibility,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange?.(next);
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(filters ?? []) : updater;
      onFiltersChange?.(next);
      onPageChange(0);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      if (next.pageSize !== pageSize) {
        onPageSizeChange(next.pageSize);
        if (pageIndex !== 0) onPageChange(0);
      } else if (next.pageIndex !== pageIndex) {
        onPageChange(next.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
  });

  return (
    <div className="w-full space-y-4">
      <div className="px-4 lg:px-6">
        <DataTableAdvancedToolbar table={table}>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative">
              <Input
                placeholder={t('search')}
                value={search}
                onChange={(event) => {
                  onSearch(event.target.value);
                  onPageChange(0);
                }}
                className="h-8 w-[260px] pr-8"
              />
              {search.length > 0 ? (
                <button
                  type="button"
                  aria-label={t('clearSearch')}
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    onSearch('');
                    onPageChange(0);
                  }}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <DataTableFacetedFilter
              column={table.getColumn('role')}
              title={t('columns.role')}
              options={roleFilterOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title={t('columns.status')}
              options={statusFilterOptions}
            />
          </div>
        </DataTableAdvancedToolbar>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                // show skeleton rows while loading
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRowSkeleton key={index} columns={columns.length} />
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="h-14"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} className="px-0" />
      </div>
    </div>
  );
}
