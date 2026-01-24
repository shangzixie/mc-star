'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { getSortingStateParser } from '@/components/data-table/lib/parsers';
import type { ExtendedColumnSort } from '@/components/data-table/types/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  useFreightWarehouseReceipts,
  useUpdateFreightWarehouseReceipt,
} from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import {
  RECEIPT_STATUSES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from '@/lib/freight/constants';
import { formatCeilFixed } from '@/lib/freight/math';
import { cn } from '@/lib/utils';
import type {
  ColumnDef,
  PaginationState,
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
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
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

function TransportTypeCell({
  receipt,
  successLabel,
  placeholder,
  getLabel,
}: {
  receipt: FreightWarehouseReceiptWithRelations;
  successLabel: string;
  placeholder: string;
  getLabel: (value: string) => React.ReactNode;
}) {
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);
  const [value, setValue] = useState(receipt.transportType ?? '');

  useEffect(() => {
    setValue(receipt.transportType ?? '');
  }, [receipt.transportType]);

  const handleChange = async (next: string) => {
    if (next === value) return;
    const prev = value;
    setValue(next);
    try {
      await updateMutation.mutateAsync({ transportType: next });
      toast.success(successLabel);
    } catch (error) {
      setValue(prev);
      toast.error(getFreightApiErrorMessage(error));
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={updateMutation.isPending}
    >
      <SelectTrigger
        size="sm"
        className="h-8 w-[112px]"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        {WAREHOUSE_RECEIPT_TRANSPORT_TYPES.map((tt) => (
          <SelectItem key={tt} value={tt}>
            {getLabel(tt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const EMPTY_ARRAY: any[] = [];

export function ReceiptListView({
  onSelectReceipt,
  onCreateReceipt,
  title,
  description,
  headerActions,
  headerExtras,
  floatingAction,
  fixedStatus,
  selectionMode = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onReceiptsDataChange,
}: {
  onSelectReceipt: (receiptId: string) => void;
  onCreateReceipt?: () => void;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  headerExtras?: ReactNode;
  floatingAction?: ReactNode | null;
  fixedStatus?: string;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (receiptIds: string[]) => void;
  onReceiptsDataChange?: (data: FreightWarehouseReceiptWithRelations[]) => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const isControlled = controlledSelectedIds !== undefined;
  const selectedIds = isControlled ? controlledSelectedIds : localSelectedIds;

  const updateSelected = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      const next =
        typeof updater === 'function' ? updater(selectedIds) : updater;
      if (!isControlled) {
        setLocalSelectedIds(next);
      }
      onSelectionChange?.(next);
    },
    [selectedIds, isControlled, onSelectionChange]
  );

  useEffect(() => {
    if (!selectionMode && selectedIds.length > 0) {
      updateSelected([]);
    }
  }, [selectionMode, selectedIds.length, updateSelected]);
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

  const normalizeSorting = useCallback(
    (
      value: SortingState
    ): ExtendedColumnSort<FreightWarehouseReceiptWithRelations>[] => {
      const filtered = value
        .filter((item) => sortableColumnSet.has(item.id))
        .map((item) => ({
          ...item,
          id: item.id,
        })) as ExtendedColumnSort<FreightWarehouseReceiptWithRelations>[];

      return filtered.length > 0 ? filtered : defaultSorting;
    },
    [sortableColumnSet, defaultSorting]
  );

  const safeSorting = normalizeSorting(sort);

  const effectiveStatus = fixedStatus ?? status;

  const receiptsQuery = useFreightWarehouseReceipts(
    useMemo(
      () => ({
        q,
        status: effectiveStatus,
        includeStats: true,
        includeItemNames: true,
      }),
      [q, effectiveStatus]
    )
  );

  const data = receiptsQuery.data ?? EMPTY_ARRAY;

  const currentPageIds = useMemo(
    () => data.map((receipt) => receipt.id),
    [data]
  );
  const selectablePageIds = useMemo(
    () =>
      data
        .filter(
          (receipt) =>
            !selectionMode ||
            (!receipt.isMergedChild && !receipt.isMergedParent)
        )
        .map((receipt) => receipt.id),
    [data, selectionMode]
  );
  const allSelected =
    selectionMode &&
    selectablePageIds.length > 0 &&
    selectablePageIds.every((id) => selectedIds.includes(id));

  const toggleSelection = useCallback(
    (receiptId: string) => {
      updateSelected((prev) =>
        prev.includes(receiptId)
          ? prev.filter((id) => id !== receiptId)
          : [...prev, receiptId]
      );
    },
    [updateSelected]
  );

  const isSelectableReceipt = useCallback(
    (receipt: FreightWarehouseReceiptWithRelations) =>
      !selectionMode || (!receipt.isMergedChild && !receipt.isMergedParent),
    [selectionMode]
  );

  const columns = useMemo<
    ColumnDef<FreightWarehouseReceiptWithRelations>[]
  >(() => {
    const cols: ColumnDef<FreightWarehouseReceiptWithRelations>[] = [
      ...(selectionMode
        ? [
            {
              id: 'select',
              header: () => (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(next) =>
                    updateSelected((prev) =>
                      next
                        ? Array.from(new Set([...prev, ...selectablePageIds]))
                        : prev.filter((id) => !selectablePageIds.includes(id))
                    )
                  }
                  aria-label={t('receiptList.selectAll')}
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  checked={selectedIds.includes(row.original.id)}
                  disabled={!isSelectableReceipt(row.original)}
                  onCheckedChange={() => toggleSelection(row.original.id)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={t('receiptList.selectRow')}
                />
              ),
              enableSorting: false,
              enableHiding: false,
              size: 44,
            } as ColumnDef<FreightWarehouseReceiptWithRelations>,
          ]
        : []),
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
        accessorFn: (r) => r.customer?.name ?? '',
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
              {receipt.customer?.name ?? '-'}
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
          const getLabel = (value: string) => {
            const text = t(`transportType.options.${value}` as any);
            const colorClass =
              value === 'AIR_FREIGHT'
                ? 'text-sky-600'
                : value === 'SEA_FCL'
                  ? 'text-emerald-600'
                  : value === 'SEA_LCL'
                    ? 'text-indigo-600'
                    : value === 'FBA_AIR'
                      ? 'text-cyan-600'
                      : value === 'FBA_SEA'
                        ? 'text-teal-600'
                        : value === 'BULK_CARGO'
                          ? 'text-amber-600'
                          : 'text-muted-foreground';
            return <span className={`font-medium ${colorClass}`}>{text}</span>;
          };
          return (
            <TransportTypeCell
              receipt={receipt}
              successLabel={t('receiptActions.updateSuccess')}
              placeholder={t('transportType.placeholder')}
              getLabel={getLabel}
            />
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
  }, [allSelected, data, selectionMode, selectedIds, t]);

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

  useEffect(() => {
    setColumnOrder((prev) => {
      if (selectionMode) {
        return prev.includes('select') ? prev : ['select', ...prev];
      }
      return prev.filter((id) => id !== 'select');
    });
  }, [selectionMode]);

  const pagination = useMemo(
    () => ({ pageIndex: page, pageSize: size }),
    [page, size]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: safeSorting,
      columnOrder,
      columnVisibility,
      pagination,
    },
    onSortingChange: useCallback(
      (updater: SortingState | ((prev: SortingState) => SortingState)) => {
        const next =
          typeof updater === 'function' ? updater(safeSorting) : updater;
        const normalized = normalizeSorting(next);
        void setQueryStates({ sort: normalized, page: 0 });
      },
      [safeSorting, setQueryStates, normalizeSorting]
    ),
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: useCallback(
      (
        updater: PaginationState | ((prev: PaginationState) => PaginationState)
      ) => {
        const next =
          typeof updater === 'function' ? updater(pagination) : updater;

        if (next.pageSize !== pagination.pageSize) {
          void setQueryStates({ size: next.pageSize, page: 0 });
        } else if (next.pageIndex !== pagination.pageIndex) {
          void setQueryStates({ page: next.pageIndex });
        }
      },
      [pagination, setQueryStates]
    ),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    enableMultiSort: false,
  });

  useEffect(() => {
    onReceiptsDataChange?.(data);
  }, [data, onReceiptsDataChange]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {title ?? t('receiptList.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {description ?? t('receiptList.description')}
          </p>
        </div>
        {headerActions ??
          (onCreateReceipt ? (
            <Button onClick={onCreateReceipt}>
              <Plus className="mr-2 size-4" />
              {t('receipt.create')}
            </Button>
          ) : null)}
      </div>

      <div className="px-0">
        <DataTableAdvancedToolbar table={table}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQueryStates({ q: e.target.value, page: 0 })}
              placeholder={t('receiptList.searchPlaceholder')}
              className="h-8 w-[260px] pl-9 pr-8"
            />
            {q.length > 0 ? (
              <button
                type="button"
                aria-label={t('receiptList.searchPlaceholder')}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setQueryStates({ q: '', page: 0 })}
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {fixedStatus ? null : (
            <Select
              value={status}
              onValueChange={(value) =>
                setQueryStates({
                  status: value === '__all__' ? '' : value,
                  page: 0,
                })
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
                    {t(`status.${s.toLowerCase()}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </DataTableAdvancedToolbar>
        {headerExtras ? (
          <div className="px-4 sm:px-0">{headerExtras}</div>
        ) : null}
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
                table.getRowModel().rows.map((row) => {
                  const selectable = isSelectableReceipt(row.original);
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'h-14 transition-colors',
                        selectable
                          ? 'cursor-pointer hover:bg-muted/50'
                          : 'cursor-not-allowed bg-muted/70 shadow-inner'
                      )}
                      style={
                        !selectable
                          ? {
                              backgroundImage:
                                'repeating-linear-gradient(135deg, rgba(148, 163, 184, 0.35) 0, rgba(148, 163, 184, 0.35) 0.3px, transparent 1px, transparent 9px)',
                            }
                          : undefined
                      }
                      onClick={() => {
                        if (selectionMode) {
                          if (selectable) {
                            toggleSelection(row.original.id);
                          }
                        } else {
                          onSelectReceipt(row.original.id);
                        }
                      }}
                      data-selectable={selectable ? 'true' : 'false'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'py-3',
                            selectable ? '' : 'text-muted-foreground'
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} className="px-0" />
      </div>

      {floatingAction === undefined ? (
        onCreateReceipt ? (
          <FloatingActionButton
            onClick={onCreateReceipt}
            label={t('receipt.create')}
          />
        ) : null
      ) : (
        floatingAction
      )}
    </div>
  );
}
