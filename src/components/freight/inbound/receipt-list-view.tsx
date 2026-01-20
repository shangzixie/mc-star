'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { getSortingStateParser } from '@/components/data-table/lib/parsers';
import type { ExtendedColumnSort } from '@/components/data-table/types/data-table';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFreightWarehouseReceipts } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import { RECEIPT_STATUSES } from '@/lib/freight/constants';
import { formatCeilFixed } from '@/lib/freight/math';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { FileText, Plus, Search, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useMemo, useState } from 'react';
import { FloatingActionButton } from './floating-action-button';
import { ReceiptStatusBadge } from './receipt-status-badge';

function ReceiptListRowSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <TableRow className="h-14">
      {Array.from({ length: columnCount }).map((_, idx) => (
        <TableCell key={`skc-${idx}`} className="py-3">
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ReceiptListView({
  onSelectReceipt,
  onCreateReceipt,
}: {
  onSelectReceipt: (receiptId: string) => void;
  onCreateReceipt: () => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const sortableColumnIds = useMemo(
    () => [
      'receiptNo',
      'warehouse',
      'customer',
      'transportType',
      'customsDeclarationType',
      'status',
      'totalItems',
      'totalInitialQty',
      'totalCurrentQty',
      'totalShippedQty',
      'totalWeight',
      'totalVolume',
      'createdAt',
      'inboundTime',
    ],
    []
  );
  const sortableColumnSet = useMemo(
    () => new Set<string>(sortableColumnIds),
    [sortableColumnIds]
  );
  const defaultSorting = useMemo<
    ExtendedColumnSort<FreightWarehouseReceiptWithRelations>[]
  >(() => [{ id: 'createdAt', desc: true }], []);

  const [{ page, size, q, status, sort }, setQueryStates] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    size: parseAsInteger.withDefault(50),
    q: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    sort: getSortingStateParser<FreightWarehouseReceiptWithRelations>(
      sortableColumnIds
    ).withDefault(defaultSorting),
  });

  const normalizeSorting = (
    value: SortingState
  ): ExtendedColumnSort<FreightWarehouseReceiptWithRelations>[] => {
    const filtered = value
      .filter((item) => sortableColumnSet.has(item.id))
      .map((item) => ({
        ...item,
        id: item.id,
      })) as ExtendedColumnSort<FreightWarehouseReceiptWithRelations>[];

    return filtered.length > 0 ? filtered : defaultSorting;
  };

  const safeSorting = normalizeSorting(sort);

  const receiptsQuery = useFreightWarehouseReceipts({
    q,
    status,
    includeStats: true,
    includeItemNames: true,
  });

  const data = receiptsQuery.data ?? [];

  const columns = useMemo<
    ColumnDef<FreightWarehouseReceiptWithRelations>[]
  >(() => {
    const cols: ColumnDef<FreightWarehouseReceiptWithRelations>[] = [
      {
        id: 'receiptNo',
        accessorKey: 'receiptNo',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.receiptNo')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2 font-medium">
              <FileText className="size-4 text-muted-foreground" />
              <span className="block max-w-[140px] truncate">
                {receipt.receiptNo}
              </span>
            </div>
          );
        },
        meta: { label: t('receiptList.columns.receiptNo') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'warehouse',
        accessorFn: (r) => r.warehouse?.name ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.warehouse')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="text-muted-foreground">
              {receipt.warehouse?.name ?? '-'}
            </span>
          );
        },
        meta: { label: t('receiptList.columns.warehouse') },
        minSize: 140,
        size: 180,
      },
      {
        id: 'customer',
        accessorFn: (r) => r.customer?.nameCn ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.customer')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="text-muted-foreground max-w-[140px] truncate block">
              {receipt.customer?.nameCn ?? '-'}
            </span>
          );
        },
        meta: { label: t('receiptList.columns.customer') },
        minSize: 140,
        size: 160,
      },
      {
        id: 'transportType',
        accessorFn: (r) =>
          r.transportType
            ? t(`transportType.options.${r.transportType}` as any)
            : '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.transportType')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="text-muted-foreground max-w-[140px] truncate block">
              {receipt.transportType
                ? t(`transportType.options.${receipt.transportType}` as any)
                : '-'}
            </span>
          );
        },
        meta: { label: t('receiptList.columns.transportType') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'customsDeclarationType',
        accessorFn: (r) =>
          r.customsDeclarationType
            ? t(
                `customsDeclarationType.options.${r.customsDeclarationType}` as any
              )
            : '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.customsDeclarationType')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="text-muted-foreground max-w-[140px] truncate block">
              {receipt.customsDeclarationType
                ? t(
                    `customsDeclarationType.options.${receipt.customsDeclarationType}` as any
                  )
                : '-'}
            </span>
          );
        },
        meta: { label: t('receiptList.columns.customsDeclarationType') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'remarks',
        accessorKey: 'remarks',
        enableSorting: false,
        header: () => t('receiptList.columns.remarks'),
        cell: ({ row }) => {
          const receipt = row.original;
          const remarks = receipt.remarks?.trim();
          if (!remarks) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="w-[140px] text-left text-muted-foreground cursor-help underline decoration-dotted underline-offset-2 line-clamp-2 break-words"
                  onClick={(e) => e.stopPropagation()}
                >
                  {remarks}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="max-w-[420px] whitespace-pre-wrap break-words"
              >
                {remarks}
              </TooltipContent>
            </Tooltip>
          );
        },
        meta: { label: t('receiptList.columns.remarks') },
        minSize: 130,
        size: 150,
      },
      {
        id: 'internalRemarks',
        accessorKey: 'internalRemarks',
        enableSorting: false,
        header: () => t('receiptList.columns.internalRemarks'),
        cell: ({ row }) => {
          const receipt = row.original;
          const remarks = receipt.internalRemarks?.trim();
          if (!remarks) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="w-[140px] text-left text-muted-foreground cursor-help underline decoration-dotted underline-offset-2 line-clamp-2 break-words"
                  onClick={(e) => e.stopPropagation()}
                >
                  {remarks}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="max-w-[420px] whitespace-pre-wrap break-words"
              >
                {remarks}
              </TooltipContent>
            </Tooltip>
          );
        },
        meta: { label: t('receiptList.columns.internalRemarks') },
        minSize: 130,
        size: 150,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.status')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return <ReceiptStatusBadge status={receipt.status} />;
        },
        meta: { label: t('receiptList.columns.status') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'commodityNames',
        accessorKey: 'commodityNames',
        enableSorting: false,
        header: () => t('receiptList.columns.commodityNames'),
        cell: ({ row }) => {
          const receipt = row.original;
          const value = receipt.commodityNames?.trim();
          if (!value) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="w-[220px] text-left text-muted-foreground cursor-help underline decoration-dotted underline-offset-2 line-clamp-2 break-words"
                  onClick={(e) => e.stopPropagation()}
                >
                  {value}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="max-w-[520px] whitespace-pre-wrap break-words"
              >
                {value}
              </TooltipContent>
            </Tooltip>
          );
        },
        meta: { label: t('receiptList.columns.commodityNames') },
        minSize: 220,
        size: 260,
      },
      {
        id: 'totalItems',
        accessorFn: (r) => r.stats?.totalItems ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('stats.totalItems')}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            {row.original.stats?.totalItems ?? '-'}
          </div>
        ),
        meta: { label: t('stats.totalItems') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'totalInitialQty',
        accessorFn: (r) => r.stats?.totalInitialQty ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('stats.totalInitialQty')}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            {row.original.stats?.totalInitialQty ?? '-'}
          </div>
        ),
        meta: { label: t('stats.totalInitialQty') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'totalCurrentQty',
        accessorFn: (r) => r.stats?.totalCurrentQty ?? 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('stats.totalCurrentQty')}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            {row.original.stats?.totalCurrentQty ?? '-'}
          </div>
        ),
        meta: { label: t('stats.totalCurrentQty') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'totalShippedQty',
        accessorFn: (r) =>
          r.stats ? r.stats.totalInitialQty - r.stats.totalCurrentQty : 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('stats.totalShippedQty')}
          />
        ),
        cell: ({ row }) => {
          const stats = row.original.stats;
          return (
            <div className="text-muted-foreground tabular-nums">
              {stats ? stats.totalInitialQty - stats.totalCurrentQty : '-'}
            </div>
          );
        },
        meta: { label: t('stats.totalShippedQty') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'totalWeight',
        accessorFn: (r) =>
          r.stats?.totalWeight != null ? Number(r.stats.totalWeight) : 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('stats.totalWeightKg')}
          />
        ),
        cell: ({ row }) => {
          const totalWeight =
            row.original.stats?.totalWeight != null
              ? Number(row.original.stats.totalWeight)
              : undefined;
          return (
            <div className="text-muted-foreground tabular-nums">
              {totalWeight != null
                ? `${formatCeilFixed(totalWeight, 2)} kg`
                : '-'}
            </div>
          );
        },
        meta: { label: t('stats.totalWeightKg') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'totalVolume',
        accessorFn: (r) =>
          r.stats?.totalVolume != null ? Number(r.stats.totalVolume) : 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('stats.totalVolumeM3')}
          />
        ),
        cell: ({ row }) => {
          const totalVolume =
            row.original.stats?.totalVolume != null
              ? Number(row.original.stats.totalVolume)
              : undefined;
          return (
            <div className="text-muted-foreground tabular-nums">
              {totalVolume != null
                ? `${formatCeilFixed(totalVolume, 2)} m³`
                : '-'}
            </div>
          );
        },
        meta: { label: t('stats.totalVolumeM3') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'createdAt',
        accessorFn: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.createdAt')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="text-muted-foreground text-sm">
              {receipt.createdAt
                ? format(new Date(receipt.createdAt), 'yyyy-MM-dd HH:mm')
                : '-'}
            </span>
          );
        },
        meta: { label: t('receiptList.columns.createdAt') },
        minSize: 160,
        size: 200,
      },
      {
        id: 'inboundTime',
        accessorFn: (r) =>
          r.inboundTime ? new Date(r.inboundTime).getTime() : 0,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('receiptList.columns.inboundTime')}
          />
        ),
        cell: ({ row }) => {
          const receipt = row.original;
          return (
            <span className="text-muted-foreground text-sm">
              {receipt.inboundTime
                ? format(new Date(receipt.inboundTime), 'yyyy-MM-dd HH:mm')
                : '-'}
            </span>
          );
        },
        meta: { label: t('receiptList.columns.inboundTime') },
        minSize: 160,
        size: 200,
      },
    ];

    return cols;
  }, [t]);

  const defaultColumnOrder = useMemo(
    () => [
      // Match desired default list order
      'customsDeclarationType',
      'transportType',
      'receiptNo',
      'customer',
      'status',
      'commodityNames',
      'totalInitialQty',
      'inboundTime',
      'totalVolume',
      'totalWeight',
      'remarks',
      'internalRemarks',
      // Keep the rest at the end (hidden by default or less commonly used)
      'warehouse',
      'totalItems',
      'totalCurrentQty',
      'totalShippedQty',
      'createdAt',
    ],
    []
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    warehouse: false,
    createdAt: false,
    totalItems: false,
    totalCurrentQty: false,
    totalShippedQty: false,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: safeSorting,
      columnOrder,
      columnVisibility,
      pagination: { pageIndex: page, pageSize: size },
    },
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(safeSorting) : updater;
      const normalized = normalizeSorting(next);
      void setQueryStates({ sort: normalized, page: 0 }, { shallow: true });
    },
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page, pageSize: size })
          : updater;
      if (next.pageSize !== size) {
        void setQueryStates(
          { size: next.pageSize, page: 0 },
          { shallow: true }
        );
      } else if (next.pageIndex !== page) {
        void setQueryStates({ page: next.pageIndex }, { shallow: true });
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: false,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('receiptList.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('receiptList.description')}
          </p>
        </div>
        <Button onClick={onCreateReceipt}>
          <Plus className="mr-2 size-4" />
          {t('receipt.create')}
        </Button>
      </div>

      <div className="px-0">
        <DataTableAdvancedToolbar table={table}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) =>
                setQueryStates(
                  { q: e.target.value, page: 0 },
                  { shallow: true }
                )
              }
              placeholder={t('receiptList.searchPlaceholder')}
              className="h-8 w-[260px] pl-9 pr-8"
            />
            {q.length > 0 ? (
              <button
                type="button"
                aria-label={t('receiptList.searchPlaceholder')}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() =>
                  setQueryStates({ q: '', page: 0 }, { shallow: true })
                }
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <Select
            value={status}
            onValueChange={(value) =>
              setQueryStates(
                { status: value === '__all__' ? '' : value, page: 0 },
                { shallow: true }
              )
            }
          >
            <SelectTrigger size="sm" className="h-8">
              <SelectValue placeholder={t('receiptList.statusAll')} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="__all__">
                {t('receiptList.statusAll')}
              </SelectItem>
              {RECEIPT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataTableAdvancedToolbar>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card">
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
              {receiptsQuery.isLoading ? (
                Array.from({ length: size }).map((_, idx) => (
                  <ReceiptListRowSkeleton
                    key={`sk-${idx}`}
                    columnCount={table.getVisibleLeafColumns().length}
                  />
                ))
              ) : receiptsQuery.error ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-32 text-center"
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('receiptList.error')}</EmptyTitle>
                        <EmptyDescription>
                          {getFreightApiErrorMessage(receiptsQuery.error)}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-32 text-center"
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('receiptList.empty')}</EmptyTitle>
                        <EmptyDescription>
                          {t('receiptList.emptyHint')}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-14 cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectReceipt(row.original.id)}
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
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} className="px-0" />
      </div>

      <FloatingActionButton
        onClick={onCreateReceipt}
        label={t('receipt.create')}
      />
    </div>
  );
}
