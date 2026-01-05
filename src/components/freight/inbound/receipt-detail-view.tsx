'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
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
import { useFreightInventoryItems } from '@/hooks/freight/use-freight-inventory-items';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightWarehouseReceiptWithRelations,
} from '@/lib/freight/api-types';
import { formatCeilFixed } from '@/lib/freight/math';
import { cn } from '@/lib/utils';
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
import {
  ArrowLeft,
  Edit,
  FileText,
  History,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { FloatingActionButton } from './floating-action-button';
import { ReceiptStatusBadge } from './receipt-status-badge';

export function ReceiptDetailView({
  receipt,
  onBack,
  onAddItem,
  onEdit,
  onDelete,
  onChangeStatus,
  onEditItem,
  onDeleteItem,
  onViewMovements,
  onViewAllocations,
}: {
  receipt: FreightWarehouseReceiptWithRelations;
  onBack: () => void;
  onAddItem: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
  onEditItem: (item: FreightInventoryItem) => void;
  onDeleteItem: (item: FreightInventoryItem) => void;
  onViewMovements: (item: FreightInventoryItem) => void;
  onViewAllocations: (item: FreightInventoryItem) => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const [searchQ, setSearchQ] = useState('');
  const [itemsSorting, setItemsSorting] = useState<SortingState>([
    { id: 'commodity', desc: false },
  ]);
  const [itemsColumnVisibility, setItemsColumnVisibility] =
    useState<VisibilityState>({});
  const [itemsPagination, setItemsPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const itemsQuery = useFreightInventoryItems({
    receiptId: receipt.id,
    q: searchQ,
  });

  const items = itemsQuery.data ?? [];

  const itemsColumns = useMemo<ColumnDef<FreightInventoryItem>[]>(
    () => [
      {
        id: 'commodity',
        accessorFn: (i) => i.commodityName ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.commodity')}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.commodityName ?? '-'}
          </span>
        ),
        meta: { label: t('items.columns.commodity') },
        minSize: 160,
        size: 220,
      },
      {
        id: 'sku',
        accessorFn: (i) => i.skuCode ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.sku')}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.skuCode ?? '-'}
          </span>
        ),
        meta: { label: t('items.columns.sku') },
        minSize: 140,
        size: 180,
      },
      {
        id: 'initialQty',
        accessorKey: 'initialQty',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.initialQty')}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            {row.original.initialQty}
          </div>
        ),
        meta: { label: t('items.columns.initialQty') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'currentQty',
        accessorKey: 'currentQty',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.currentQty')}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const shipped = item.initialQty - item.currentQty;
          const isFullyShipped = item.currentQty === 0;
          const isPartiallyShipped = shipped > 0 && !isFullyShipped;
          return (
            <div className="font-medium tabular-nums">
              <span
                className={cn(
                  isFullyShipped && 'text-muted-foreground',
                  isPartiallyShipped && 'text-yellow-600 dark:text-yellow-400'
                )}
              >
                {item.currentQty}
              </span>
            </div>
          );
        },
        meta: { label: t('items.columns.currentQty') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'shipped',
        accessorFn: (i) => i.initialQty - i.currentQty,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.shipped')}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const shipped = item.initialQty - item.currentQty;
          return (
            <div className="text-muted-foreground tabular-nums">
              {shipped > 0 ? shipped : '-'}
            </div>
          );
        },
        meta: { label: t('items.columns.shipped') },
        minSize: 120,
        size: 140,
      },
      {
        id: 'unit',
        accessorFn: (i) => i.unit ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.unit')}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.unit ?? '-'}
          </span>
        ),
        meta: { label: t('items.columns.unit') },
        minSize: 110,
        size: 130,
      },
      {
        id: 'location',
        accessorFn: (i) => i.binLocation ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.location')}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.binLocation ?? '-'}
          </span>
        ),
        meta: { label: t('items.columns.location') },
        minSize: 140,
        size: 180,
      },
      {
        id: 'totalWeight',
        accessorFn: (item) => {
          const weightPerUnit =
            item.weightPerUnit != null ? Number(item.weightPerUnit) : undefined;
          const totalWeightKg =
            weightPerUnit != null && Number.isFinite(weightPerUnit)
              ? weightPerUnit * item.initialQty
              : 0;
          return totalWeightKg;
        },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.totalWeight')}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const weightPerUnit =
            item.weightPerUnit != null ? Number(item.weightPerUnit) : undefined;
          const totalWeightKg =
            weightPerUnit != null && Number.isFinite(weightPerUnit)
              ? weightPerUnit * item.initialQty
              : undefined;

          return (
            <div className="text-muted-foreground tabular-nums">
              {totalWeightKg != null ? (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      {`${formatCeilFixed(totalWeightKg, 2)} kg`}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {`${item.weightPerUnit ?? String(weightPerUnit)} kg × ${item.initialQty} = ${formatCeilFixed(totalWeightKg, 2)} kg`}
                  </TooltipContent>
                </Tooltip>
              ) : (
                '-'
              )}
            </div>
          );
        },
        meta: { label: t('items.columns.totalWeight') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'totalVolume',
        accessorFn: (item) => {
          const lengthCm =
            item.lengthCm != null ? Number(item.lengthCm) : undefined;
          const widthCm =
            item.widthCm != null ? Number(item.widthCm) : undefined;
          const heightCm =
            item.heightCm != null ? Number(item.heightCm) : undefined;
          const totalVolumeM3 =
            lengthCm != null &&
            widthCm != null &&
            heightCm != null &&
            Number.isFinite(lengthCm) &&
            Number.isFinite(widthCm) &&
            Number.isFinite(heightCm)
              ? (lengthCm * widthCm * heightCm * item.initialQty) / 1_000_000
              : 0;
          return totalVolumeM3;
        },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('items.columns.totalVolume')}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const lengthCm =
            item.lengthCm != null ? Number(item.lengthCm) : undefined;
          const widthCm =
            item.widthCm != null ? Number(item.widthCm) : undefined;
          const heightCm =
            item.heightCm != null ? Number(item.heightCm) : undefined;
          const totalVolumeM3 =
            lengthCm != null &&
            widthCm != null &&
            heightCm != null &&
            Number.isFinite(lengthCm) &&
            Number.isFinite(widthCm) &&
            Number.isFinite(heightCm)
              ? (lengthCm * widthCm * heightCm * item.initialQty) / 1_000_000
              : undefined;

          return (
            <div className="text-muted-foreground tabular-nums">
              {totalVolumeM3 != null ? (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      {`${formatCeilFixed(totalVolumeM3, 2)} m³`}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {`${item.lengthCm}×${item.widthCm}×${item.heightCm} cm × ${item.initialQty} ÷ 1,000,000 = ${formatCeilFixed(totalVolumeM3, 2)} m³`}
                  </TooltipContent>
                </Tooltip>
              ) : (
                '-'
              )}
            </div>
          );
        },
        meta: { label: t('items.columns.totalVolume') },
        minSize: 150,
        size: 170,
      },
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditItem(item)}>
                  <Edit className="mr-2 size-4" />
                  {t('itemActions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewMovements(item)}>
                  <History className="mr-2 size-4" />
                  {t('itemActions.viewMovements')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAllocations(item)}>
                  <Package className="mr-2 size-4" />
                  {t('itemActions.viewAllocations')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteItem(item)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  {t('itemActions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 72,
      },
    ],
    [onDeleteItem, onEditItem, onViewAllocations, onViewMovements, t]
  );

  const itemsTable = useReactTable({
    data: items,
    columns: itemsColumns,
    state: {
      sorting: itemsSorting,
      columnVisibility: itemsColumnVisibility,
      pagination: itemsPagination,
    },
    onSortingChange: setItemsSorting,
    onColumnVisibilityChange: setItemsColumnVisibility,
    onPaginationChange: setItemsPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: false,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {receipt.receiptNo}
            </h1>
            <ReceiptStatusBadge status={receipt.status} />
          </div>
          {receipt.remarks && (
            <p className="text-muted-foreground text-sm mt-1">
              {receipt.remarks}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 size-4" />
              {t('receiptActions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onChangeStatus}>
              <FileText className="mr-2 size-4" />
              {t('receiptActions.changeStatus')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              {t('receiptActions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-5 rounded-lg border bg-card p-4">
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('receipt.fields.warehouse')}
          </div>
          <div className="mt-1 font-medium">
            {receipt.warehouse?.name ?? '-'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('receipt.fields.customer')}
          </div>
          <div className="mt-1 font-medium">
            {receipt.customer?.nameCn ?? '-'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('transportType.label')}
          </div>
          <div className="mt-1 font-medium">
            {receipt.transportType
              ? t(`transportType.options.${receipt.transportType}` as any)
              : '-'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('receiptList.columns.createdAt')}
          </div>
          <div className="mt-1 font-medium">
            {receipt.createdAt
              ? format(new Date(receipt.createdAt), 'yyyy-MM-dd HH:mm')
              : '-'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('receiptList.columns.inboundTime')}
          </div>
          <div className="mt-1 font-medium">
            {receipt.inboundTime
              ? format(new Date(receipt.inboundTime), 'yyyy-MM-dd HH:mm')
              : '-'}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('stats.totalItems')}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {receipt.stats?.totalItems ?? 0}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('stats.totalInitialQty')}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {receipt.stats?.totalInitialQty ?? 0}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('stats.totalCurrentQty')}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {receipt.stats?.totalCurrentQty ?? 0}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('stats.totalShippedQty')}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {receipt.stats
              ? receipt.stats.totalInitialQty - receipt.stats.totalCurrentQty
              : 0}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('stats.totalWeightKg')}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {receipt.stats?.totalWeight != null
              ? formatCeilFixed(Number(receipt.stats.totalWeight), 2)
              : '-'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {t('stats.totalVolumeM3')}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {receipt.stats?.totalVolume != null
              ? formatCeilFixed(Number(receipt.stats.totalVolume), 2)
              : '-'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="size-5" />
            {t('itemsList.title')}
          </h2>
          <Button onClick={onAddItem} size="sm">
            <Plus className="mr-2 size-4" />
            {t('items.create')}
          </Button>
        </div>

        <DataTableAdvancedToolbar table={itemsTable}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                setItemsPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              placeholder={t('items.searchPlaceholder')}
              className="h-8 w-[260px] pl-9 pr-8"
            />
            {searchQ.length > 0 ? (
              <button
                type="button"
                aria-label={t('items.searchPlaceholder')}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {
                  setSearchQ('');
                  setItemsPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </DataTableAdvancedToolbar>

        <div className="relative flex flex-col gap-4 overflow-auto">
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {itemsTable.getHeaderGroups().map((headerGroup) => (
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
                {itemsQuery.isLoading ? (
                  Array.from({ length: itemsPagination.pageSize }).map(
                    (_, idx) => (
                      <TableRow key={`sk-${idx}`} className="h-14">
                        {Array.from({ length: itemsColumns.length }).map(
                          (__, cIdx) => (
                            <TableCell
                              key={`sk-${idx}-${cIdx}`}
                              className="py-3"
                            >
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    )
                  )
                ) : itemsQuery.error ? (
                  <TableRow>
                    <TableCell
                      colSpan={itemsColumns.length}
                      className="h-32 text-center"
                    >
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>{t('items.error')}</EmptyTitle>
                          <EmptyDescription>
                            {getFreightApiErrorMessage(itemsQuery.error)}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={itemsColumns.length}
                      className="h-32 text-center"
                    >
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>{t('items.empty')}</EmptyTitle>
                          <EmptyDescription>
                            {t('items.emptyHint')}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="h-14">
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

          <DataTablePagination table={itemsTable} className="px-0" />
        </div>
      </div>

      <FloatingActionButton onClick={onAddItem} label={t('items.create')} />
    </div>
  );
}
