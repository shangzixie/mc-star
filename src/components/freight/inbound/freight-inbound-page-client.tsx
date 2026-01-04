'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { getSortingStateParser } from '@/components/data-table/lib/parsers';
import type { ExtendedColumnSort } from '@/components/data-table/types/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
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
import {
  useDeleteFreightInventoryItem,
  useFreightInventoryItems,
} from '@/hooks/freight/use-freight-inventory-items';
import {
  useFreightParties,
  useFreightWarehouses,
} from '@/hooks/freight/use-freight-master-data';
import {
  useAddFreightInventoryItemToReceipt,
  useCreateFreightWarehouseReceipt,
  useDeleteFreightWarehouseReceipt,
  useFreightWarehouseReceipt,
  useFreightWarehouseReceipts,
  useUpdateFreightWarehouseReceipt,
} from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightParty,
  FreightWarehouse,
  FreightWarehouseReceipt,
  FreightWarehouseReceiptWithRelations,
} from '@/lib/freight/api-types';
import {
  PACKAGING_UNITS,
  RECEIPT_STATUSES,
  WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from '@/lib/freight/constants';
import { formatCeilFixed } from '@/lib/freight/math';
import {
  addInventoryItemSchema,
  createWarehouseReceiptSchema,
} from '@/lib/freight/schemas';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AllocationsDialog } from './allocations-dialog';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { EditReceiptDialog } from './edit-receipt-dialog';
import { InventoryMovementsDialog } from './inventory-movements-dialog';

const receiptFormSchema = z.object({
  receiptNo: z.string().min(1).max(30),
  warehouseId: z.string().optional(),
  customerId: z.string().optional(),
  transportType: z.string().optional(),
  customsDeclarationType: z.string().optional(),
  remarks: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

const addItemFormSchema = z.object({
  commodityName: z.string().optional(),
  skuCode: z.string().optional(),
  initialQty: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !Number.isNaN(v) && Number.isInteger(v) && v > 0, {
      message: 'Must be a positive integer',
    }),
  unit: z.string().optional(),
  binLocation: z.string().optional(),
  weightPerUnit: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
  lengthCm: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
  widthCm: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
  heightCm: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
});

type AddItemFormInput = z.input<typeof addItemFormSchema>;
type AddItemFormOutput = z.output<typeof addItemFormSchema>;

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

// Receipt Status Badge Component
function ReceiptStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        status === 'RECEIVED' &&
          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        status === 'PARTIAL' &&
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        status === 'SHIPPED' &&
          'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      )}
    >
      {status}
    </Badge>
  );
}

// Floating Action Button Component
function FloatingActionButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={label}
    >
      <Plus className="size-6" />
    </button>
  );
}

// Receipt List View Component
function ReceiptListView({
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
    size: parseAsInteger.withDefault(10),
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
      'totalInitialQty',
      'inboundTime',
      'totalVolume',
      'totalWeight',
      'remarks',
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

// Receipt Detail View Component
function ReceiptDetailView({
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
      {/* Header */}
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

        {/* Actions Menu */}
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

      {/* Receipt Info Card */}
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

      {/* Stats */}
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

      {/* Items Section */}
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

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onAddItem} label={t('items.create')} />
    </div>
  );
}

// Create Receipt Dialog
function CreateReceiptDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (receiptId: string) => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');

  const warehousesQuery = useFreightWarehouses({ q: '' });
  const partiesQuery = useFreightParties({ q: '' });
  const customers = useMemo(
    () => (partiesQuery.data ?? []).filter((p) => p.roles.includes('CUSTOMER')),
    [partiesQuery.data]
  );

  const receiptMutation = useCreateFreightWarehouseReceipt();

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      receiptNo: '',
      warehouseId: undefined,
      customerId: undefined,
      transportType: undefined,
      customsDeclarationType: undefined,
      remarks: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = createWarehouseReceiptSchema.parse({
        receiptNo: values.receiptNo.trim(),
        warehouseId: values.warehouseId || undefined,
        customerId: values.customerId || undefined,
        transportType: values.transportType || undefined,
        customsDeclarationType: values.customsDeclarationType || undefined,
        remarks: values.remarks?.trim() || undefined,
      });

      const created = await receiptMutation.mutateAsync(payload);
      toast.success(t('receipt.created'));
      form.reset();
      onOpenChange(false);
      onSuccess(created.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('receipt.createFailed')
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('receipt.title')}</DialogTitle>
          <DialogDescription>{t('receipt.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiptNo">{t('receipt.fields.receiptNo')}</Label>
            <Input
              id="receiptNo"
              autoComplete="off"
              placeholder={t('receipt.fields.receiptNoPlaceholder')}
              {...form.register('receiptNo')}
            />
            {form.formState.errors.receiptNo?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.receiptNo.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouseId">
                {t('receipt.fields.warehouse')}
              </Label>
              <select
                id="warehouseId"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register('warehouseId')}
              >
                <option value="">
                  {t('receipt.fields.warehousePlaceholder')}
                </option>
                {(warehousesQuery.data ?? []).map((w: FreightWarehouse) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">{t('receipt.fields.customer')}</Label>
              <select
                id="customerId"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register('customerId')}
              >
                <option value="">
                  {t('receipt.fields.customerPlaceholder')}
                </option>
                {customers.map((c: FreightParty) => (
                  <option key={c.id} value={c.id}>
                    {c.nameCn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transportType">{t('transportType.label')}</Label>
            <select
              id="transportType"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register('transportType')}
            >
              <option value="">{t('transportType.placeholder')}</option>
              {WAREHOUSE_RECEIPT_TRANSPORT_TYPES.map((tt) => (
                <option key={tt} value={tt}>
                  {t(`transportType.options.${tt}` as any)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customsDeclarationType">
              {t('customsDeclarationType.label')}
            </Label>
            <select
              id="customsDeclarationType"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register('customsDeclarationType')}
            >
              <option value="">
                {t('customsDeclarationType.placeholder')}
              </option>
              {WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(`customsDeclarationType.options.${ct}` as any)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">{t('receipt.fields.remarks')}</Label>
            <Input
              id="remarks"
              autoComplete="off"
              placeholder={t('receipt.fields.remarksPlaceholder')}
              {...form.register('remarks')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('receipt.cancel')}
            </Button>
            <Button type="submit" disabled={receiptMutation.isPending}>
              {receiptMutation.isPending
                ? t('receipt.creating')
                : t('receipt.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Item Dialog
function AddItemDialog({
  open,
  onOpenChange,
  receiptId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
}) {
  const t = useTranslations('Dashboard.freight.inbound');

  const addItemMutation = useAddFreightInventoryItemToReceipt(receiptId);

  const form = useForm<AddItemFormInput, any, AddItemFormOutput>({
    resolver: zodResolver(addItemFormSchema),
    defaultValues: {
      commodityName: '',
      skuCode: '',
      initialQty: 1,
      unit: '',
      binLocation: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = addInventoryItemSchema.omit({ receiptId: true }).parse({
        ...values,
        commodityName: values.commodityName?.trim() || undefined,
        skuCode: values.skuCode?.trim() || undefined,
        unit: values.unit?.trim() || undefined,
        binLocation: values.binLocation?.trim() || undefined,
      });

      await addItemMutation.mutateAsync(payload);
      toast.success(t('items.created'));
      form.reset({
        commodityName: '',
        skuCode: '',
        initialQty: 1,
        unit: '',
        binLocation: '',
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('items.createFailed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('items.title')}</DialogTitle>
          <DialogDescription>{t('items.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commodityName">
                {t('items.fields.commodityName')}
              </Label>
              <Input
                id="commodityName"
                autoComplete="off"
                placeholder={t('items.fields.commodityNamePlaceholder')}
                {...form.register('commodityName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skuCode">{t('items.fields.skuCode')}</Label>
              <Input
                id="skuCode"
                autoComplete="off"
                placeholder={t('items.fields.skuCodePlaceholder')}
                {...form.register('skuCode')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialQty">{t('items.fields.initialQty')}</Label>
              <Input
                id="initialQty"
                type="number"
                step="1"
                {...form.register('initialQty')}
              />
              {form.formState.errors.initialQty?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.initialQty.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">{t('items.fields.unit')}</Label>
              <select
                id="unit"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register('unit')}
              >
                <option value="">{t('items.fields.unitPlaceholder')}</option>
                {PACKAGING_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binLocation">
                {t('items.fields.binLocation')}
              </Label>
              <Input
                id="binLocation"
                autoComplete="off"
                placeholder={t('items.fields.binLocationPlaceholder')}
                {...form.register('binLocation')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightPerUnit">
                {t('items.fields.weightPerUnit')}
              </Label>
              <Input
                id="weightPerUnit"
                type="number"
                step="0.001"
                placeholder="kg"
                {...form.register('weightPerUnit')}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lengthCm">{t('items.fields.lengthCm')}</Label>
              <Input
                id="lengthCm"
                type="number"
                step="0.001"
                placeholder="cm"
                {...form.register('lengthCm')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widthCm">{t('items.fields.widthCm')}</Label>
              <Input
                id="widthCm"
                type="number"
                step="0.001"
                placeholder="cm"
                {...form.register('widthCm')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightCm">{t('items.fields.heightCm')}</Label>
              <Input
                id="heightCm"
                type="number"
                step="0.001"
                placeholder="cm"
                {...form.register('heightCm')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('items.cancel')}
            </Button>
            <Button type="submit" disabled={addItemMutation.isPending}>
              {addItemMutation.isPending
                ? t('items.creating')
                : t('items.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Change Status Dialog
function ChangeStatusDialog({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: FreightWarehouseReceiptWithRelations;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const [newStatus, setNewStatus] = useState(receipt.status);
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);

  // Keep local selection in sync when switching receipts / reopening dialog.
  // (This avoids "stale status" if the receipt changed while the dialog was closed.)
  useEffect(() => {
    if (!open) return;
    setNewStatus(receipt.status);
  }, [open, receipt.status]);

  const onSubmit = async () => {
    if (newStatus === receipt.status) {
      toast.info(t('receiptActions.statusUnchanged'));
      onOpenChange(false);
      return;
    }

    try {
      await updateMutation.mutateAsync({ status: newStatus });

      toast.success(t('receiptActions.statusUpdated'));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getFreightApiErrorMessage(error) || t('receiptActions.updateFailed')
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('receiptActions.changeStatusTitle')}</DialogTitle>
          <DialogDescription>
            {t('receiptActions.changeStatusDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentStatus">
              {t('receiptActions.currentStatus')}
            </Label>
            <Input id="currentStatus" value={receipt.status} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">{t('receiptActions.newStatus')}</Label>
            <select
              id="newStatus"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {RECEIPT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('receiptActions.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending
              ? t('receiptActions.updating')
              : t('receiptActions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export function FreightInboundPageClient() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

  // New dialog states
  const [editReceiptOpen, setEditReceiptOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [deleteReceiptOpen, setDeleteReceiptOpen] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [allocationsOpen, setAllocationsOpen] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FreightInventoryItem | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string>('');

  const t = useTranslations();
  const receiptDetailQuery = useFreightWarehouseReceipt(
    selectedReceiptId ?? ''
  );
  const selectedReceipt = receiptDetailQuery.data ?? null;
  const deleteReceiptMutation = useDeleteFreightWarehouseReceipt(
    selectedReceiptId ?? ''
  );
  const deleteItemMutation = useDeleteFreightInventoryItem(
    selectedItem?.id ?? '',
    selectedReceiptId ?? ''
  );

  const handleSelectReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setView('detail');
  };

  const handleCreateSuccess = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedReceiptId(null);
  };

  return (
    <div className="px-4 py-6 lg:px-6">
      {view === 'list' ? (
        <ReceiptListView
          onSelectReceipt={handleSelectReceipt}
          onCreateReceipt={() => setCreateDialogOpen(true)}
        />
      ) : receiptDetailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : selectedReceipt ? (
        <ReceiptDetailView
          receipt={selectedReceipt}
          onBack={handleBack}
          onAddItem={() => setAddItemDialogOpen(true)}
          onEdit={() => setEditReceiptOpen(true)}
          onDelete={() => setDeleteReceiptOpen(true)}
          onChangeStatus={() => setChangeStatusOpen(true)}
          onEditItem={(item) => {
            setSelectedItem(item);
            setEditItemOpen(true);
          }}
          onDeleteItem={(item) => {
            setSelectedItem(item);
            setDeleteItemOpen(true);
          }}
          onViewMovements={(item) => {
            setSelectedItem(item);
            setMovementsOpen(true);
          }}
          onViewAllocations={(item) => {
            setSelectedItem(item);
            setAllocationsOpen(true);
          }}
        />
      ) : (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {t('Dashboard.freight.inbound.receiptList.error')}
              </EmptyTitle>
              <EmptyDescription>
                {receiptDetailQuery.error
                  ? getFreightApiErrorMessage(receiptDetailQuery.error)
                  : t('Dashboard.freight.inbound.receiptList.emptyHint')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      <CreateReceiptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedReceiptId && (
        <AddItemDialog
          open={addItemDialogOpen}
          onOpenChange={setAddItemDialogOpen}
          receiptId={selectedReceiptId}
        />
      )}

      {/* Edit Receipt Dialog */}
      {selectedReceipt && (
        <EditReceiptDialog
          open={editReceiptOpen}
          onOpenChange={setEditReceiptOpen}
          receipt={selectedReceipt}
        />
      )}

      {/* Edit Item Dialog */}
      {selectedItem && (
        <EditItemDialog
          open={editItemOpen}
          onOpenChange={setEditItemOpen}
          item={selectedItem}
        />
      )}

      {/* Delete Receipt Dialog */}
      {selectedReceipt && (
        <DeleteConfirmDialog
          open={deleteReceiptOpen}
          onOpenChange={(open) => {
            setDeleteReceiptOpen(open);
            if (!open) setDeleteError('');
          }}
          title={t('Dashboard.freight.inbound.receiptActions.deleteTitle')}
          message={t('Dashboard.freight.inbound.receiptActions.deleteMessage')}
          errorMessage={deleteError}
          onConfirm={async () => {
            try {
              await deleteReceiptMutation.mutateAsync();
              toast.success(
                t('Dashboard.freight.inbound.receiptActions.deleteSuccess')
              );
              setSelectedReceiptId(null);
              setView('list');
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              setDeleteError(message);
              throw error;
            }
          }}
        />
      )}

      {/* Delete Item Dialog */}
      {selectedItem && selectedReceipt && (
        <DeleteConfirmDialog
          open={deleteItemOpen}
          onOpenChange={(open) => {
            setDeleteItemOpen(open);
            if (!open) setDeleteError('');
          }}
          title={t('Dashboard.freight.inbound.itemActions.deleteTitle')}
          message={t('Dashboard.freight.inbound.itemActions.deleteMessage')}
          errorMessage={deleteError}
          onConfirm={async () => {
            try {
              await deleteItemMutation.mutateAsync();
              toast.success(
                t('Dashboard.freight.inbound.itemActions.deleteSuccess')
              );
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              setDeleteError(message);
              throw error;
            }
          }}
        />
      )}

      {/* Inventory Movements Dialog */}
      {selectedItem && (
        <InventoryMovementsDialog
          open={movementsOpen}
          onOpenChange={setMovementsOpen}
          itemId={selectedItem.id}
          itemName={
            selectedItem.commodityName || selectedItem.skuCode || undefined
          }
        />
      )}

      {/* Allocations Dialog */}
      {selectedItem && (
        <AllocationsDialog
          open={allocationsOpen}
          onOpenChange={setAllocationsOpen}
          itemId={selectedItem.id}
          itemName={
            selectedItem.commodityName || selectedItem.skuCode || undefined
          }
        />
      )}

      {/* Change Status Dialog */}
      {selectedReceipt && (
        <ChangeStatusDialog
          open={changeStatusOpen}
          onOpenChange={setChangeStatusOpen}
          receipt={selectedReceipt}
        />
      )}
    </div>
  );
}
