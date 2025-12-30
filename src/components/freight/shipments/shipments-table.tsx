'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LocaleLink } from '@/i18n/navigation';
import { formatDate } from '@/lib/formatter';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightShipment } from '@/lib/freight/api-types';
import { SHIPMENT_STATUSES } from '@/lib/freight/constants';
import { Routes } from '@/routes';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

function ShipmentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'DRAFT'
      ? 'secondary'
      : status === 'BOOKED'
        ? 'default'
        : status === 'SHIPPED'
          ? 'outline'
          : 'secondary';

  return <Badge variant={variant}>{status}</Badge>;
}

export function ShipmentsTable({
  shipments,
  loading,
  error,
  search,
  status,
  pageIndex,
  pageSize,
  sorting,
  onSearch,
  onStatusChange,
  onSortingChange,
  onPageChange,
  onPageSizeChange,
  actions,
}: {
  shipments: FreightShipment[];
  loading: boolean;
  error: unknown;
  search: string;
  status: string;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onSearch: (search: string) => void;
  onStatusChange: (status: string) => void;
  onSortingChange: (sorting: SortingState) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  actions?: ReactNode;
}) {
  const t = useTranslations('Dashboard.freight.shipments');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo<ColumnDef<FreightShipment>[]>(
    () => [
      {
        id: 'jobNo',
        accessorKey: 'jobNo',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.jobNo')} />
        ),
        cell: ({ row }) => {
          const s = row.original;
          return (
            <LocaleLink href={`${Routes.FreightShipments}/${s.id}`}>
              <span className="font-medium underline-offset-4 hover:underline">
                {s.jobNo}
              </span>
            </LocaleLink>
          );
        },
        meta: { label: t('columns.jobNo') },
        minSize: 160,
        size: 200,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.status')} />
        ),
        cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} />,
        meta: { label: t('columns.status') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'transportMode',
        accessorKey: 'transportMode',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.transportMode')}
          />
        ),
        cell: ({ row }) => row.original.transportMode ?? '-',
        meta: { label: t('columns.transportMode') },
        minSize: 140,
        size: 160,
      },
      {
        id: 'etd',
        accessorFn: (s) => (s.etd ? new Date(s.etd).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.etd')} />
        ),
        cell: ({ row }) =>
          row.original.etd ? formatDate(new Date(row.original.etd)) : '-',
        meta: { label: t('columns.etd') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'eta',
        accessorFn: (s) => (s.eta ? new Date(s.eta).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.eta')} />
        ),
        cell: ({ row }) =>
          row.original.eta ? formatDate(new Date(row.original.eta)) : '-',
        meta: { label: t('columns.eta') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'createdAt',
        accessorFn: (s) => (s.createdAt ? new Date(s.createdAt).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.createdAt')}
          />
        ),
        cell: ({ row }) =>
          row.original.createdAt
            ? formatDate(new Date(row.original.createdAt))
            : '-',
        meta: { label: t('columns.createdAt') },
        minSize: 140,
        size: 160,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: shipments,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: false,
  });

  return (
    <div className="w-full space-y-4">
      <div className="px-0">
        <DataTableAdvancedToolbar table={table}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-8 w-[260px] pl-9 pr-8"
            />
            {search.length > 0 ? (
              <button
                type="button"
                aria-label={t('searchPlaceholder')}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onSearch('')}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value === '__all__' ? '' : value)
            }
          >
            <SelectTrigger size="sm" className="h-8">
              <SelectValue placeholder={t('statusAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('statusAll')}</SelectItem>
              {SHIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {actions ? (
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          ) : null}
        </DataTableAdvancedToolbar>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
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
                Array.from({ length: pageSize }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="h-14">
                    {Array.from({ length: columns.length }).map((__, cIdx) => (
                      <TableCell key={`sk-${idx}-${cIdx}`} className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {getFreightApiErrorMessage(error)}
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="h-14 hover:bg-muted/40">
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
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} className="px-0" />
      </div>
    </div>
  );
}
