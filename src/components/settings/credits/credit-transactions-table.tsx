'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { CreditDetailViewer } from '@/components/settings/credits/credit-detail-viewer';
import { Input } from '@/components/ui/input';
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
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CREDIT_TRANSACTION_TYPE,
  type CreditTransaction,
} from '@/credits/types';
import { formatDate } from '@/lib/formatter';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  BanknoteIcon,
  ClockIcon,
  CoinsIcon,
  GemIcon,
  GiftIcon,
  HandCoinsIcon,
  ShoppingCartIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';

function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow className="h-14">
      {Array.from({ length: columns }).map((_, index) => {
        if (index === 0) {
          // First column: Type column with icon + badge structure
          return (
            <TableCell key={index} className="py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" />
              </div>
            </TableCell>
          );
        }
        if (index === 1) {
          // Second column: Amount column - complex structure
          return (
            <TableCell key={index} className="py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
              </div>
            </TableCell>
          );
        }
        if (index === 4) {
          // PaymentId column: Badge structure
          return (
            <TableCell key={index} className="py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24" />
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

interface CreditTransactionsTableProps {
  data: CreditTransaction[];
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
export function CreditTransactionsTable({
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
}: CreditTransactionsTableProps) {
  const t = useTranslations('Dashboard.settings.credits.transactions');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH:
        return <HandCoinsIcon className="h-5 w-5" />;
      case CREDIT_TRANSACTION_TYPE.REGISTER_GIFT:
        return <GiftIcon className="h-5 w-5" />;
      case CREDIT_TRANSACTION_TYPE.PURCHASE_PACKAGE:
        return <ShoppingCartIcon className="h-5 w-5" />;
      case CREDIT_TRANSACTION_TYPE.USAGE:
        return <CoinsIcon className="h-5 w-5" />;
      case CREDIT_TRANSACTION_TYPE.EXPIRE:
        return <ClockIcon className="h-5 w-5" />;
      case CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL:
        return <BanknoteIcon className="h-5 w-5" />;
      case CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY:
        return <GemIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // Get transaction type display name
  const getTransactionTypeDisplayName = (type: string) => {
    switch (type) {
      case CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH:
        return t('types.MONTHLY_REFRESH');
      case CREDIT_TRANSACTION_TYPE.REGISTER_GIFT:
        return t('types.REGISTER_GIFT');
      case CREDIT_TRANSACTION_TYPE.PURCHASE_PACKAGE:
        return t('types.PURCHASE');
      case CREDIT_TRANSACTION_TYPE.USAGE:
        return t('types.USAGE');
      case CREDIT_TRANSACTION_TYPE.EXPIRE:
        return t('types.EXPIRE');
      case CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL:
        return t('types.SUBSCRIPTION_RENEWAL');
      case CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY:
        return t('types.LIFETIME_MONTHLY');
      default:
        return type;
    }
  };

  const typeFilterOptions = useMemo(
    () => [
      {
        label: t('types.MONTHLY_REFRESH'),
        value: CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
      },
      {
        label: t('types.REGISTER_GIFT'),
        value: CREDIT_TRANSACTION_TYPE.REGISTER_GIFT,
      },
      {
        label: t('types.PURCHASE'),
        value: CREDIT_TRANSACTION_TYPE.PURCHASE_PACKAGE,
      },
      { label: t('types.USAGE'), value: CREDIT_TRANSACTION_TYPE.USAGE },
      { label: t('types.EXPIRE'), value: CREDIT_TRANSACTION_TYPE.EXPIRE },
      {
        label: t('types.SUBSCRIPTION_RENEWAL'),
        value: CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL,
      },
      {
        label: t('types.LIFETIME_MONTHLY'),
        value: CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY,
      },
    ],
    [t]
  );

  // Table columns definition
  const columns: ColumnDef<CreditTransaction>[] = useMemo(
    () => [
      {
        id: 'type',
        accessorKey: 'type',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.type')} />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="hover:bg-accent transition-colors"
              >
                {getTransactionTypeIcon(transaction.type)}
                {getTransactionTypeDisplayName(transaction.type)}
              </Badge>
            </div>
          );
        },
        meta: {
          label: t('columns.type'),
        },
        minSize: 140,
        size: 160,
      },
      {
        id: 'amount',
        accessorKey: 'amount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.amount')} />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return <CreditDetailViewer transaction={transaction} />;
        },
        meta: {
          label: t('columns.amount'),
        },
        minSize: 100,
        size: 120,
      },
      {
        id: 'remainingAmount',
        accessorKey: 'remainingAmount',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.remainingAmount')}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              {transaction.remainingAmount !== null ? (
                <span className="font-medium">
                  {transaction.remainingAmount.toLocaleString()}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          );
        },
        meta: {
          label: t('columns.remainingAmount'),
        },
        minSize: 120,
        size: 140,
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.description')}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              {transaction.description ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="max-w-[200px] truncate cursor-help">
                        {transaction.description}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-pre-wrap">
                        {transaction.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          );
        },
        meta: {
          label: t('columns.description'),
        },
        minSize: 140,
        size: 160,
      },
      {
        id: 'paymentId',
        accessorKey: 'paymentId',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.paymentId')}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              {transaction.paymentId ? (
                <Badge
                  variant="outline"
                  className="text-sm px-1.5 cursor-pointer hover:bg-accent max-w-[150px]"
                  onClick={() => {
                    navigator.clipboard.writeText(transaction.paymentId!);
                    toast.success(t('paymentIdCopied'));
                  }}
                >
                  <span className="truncate">{transaction.paymentId}</span>
                </Badge>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          );
        },
        meta: {
          label: t('columns.paymentId'),
        },
        minSize: 120,
        size: 140,
      },
      {
        id: 'expirationDate',
        accessorKey: 'expirationDate',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.expirationDate')}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              {transaction.expirationDate ? (
                <span className="text-sm">
                  {formatDate(transaction.expirationDate)}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          );
        },
        meta: {
          label: t('columns.expirationDate'),
        },
        minSize: 140,
        size: 160,
      },
      {
        id: 'expirationDateProcessedAt',
        accessorKey: 'expirationDateProcessedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.expirationDateProcessedAt')}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              {transaction.expirationDateProcessedAt ? (
                <span className="text-sm">
                  {formatDate(transaction.expirationDateProcessedAt)}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          );
        },
        meta: {
          label: t('columns.expirationDateProcessedAt'),
        },
        minSize: 160,
        size: 180,
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
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {formatDate(transaction.createdAt)}
              </span>
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
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('columns.updatedAt')}
          />
        ),
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {formatDate(transaction.updatedAt)}
              </span>
            </div>
          );
        },
        meta: {
          label: t('columns.updatedAt'),
        },
        minSize: 140,
        size: 160,
      },
    ],
    [t, getTransactionTypeIcon, getTransactionTypeDisplayName]
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
      <div>
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
              column={table.getColumn('type')}
              title={t('columns.type')}
              options={typeFilterOptions}
            />
          </div>
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
