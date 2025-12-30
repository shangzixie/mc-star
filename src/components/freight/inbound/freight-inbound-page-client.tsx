'use client';

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFreightInventoryItems } from '@/hooks/freight/use-freight-inventory-items';
import {
  useFreightParties,
  useFreightWarehouses,
} from '@/hooks/freight/use-freight-master-data';
import {
  useAddFreightInventoryItemToReceipt,
  useCreateFreightWarehouseReceipt,
  useFreightWarehouseReceipts,
} from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightParty,
  FreightWarehouse,
  FreightWarehouseReceipt,
} from '@/lib/freight/api-types';
import {
  addInventoryItemSchema,
  createWarehouseReceiptSchema,
} from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Package, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const receiptFormSchema = z.object({
  receiptNo: z.string().min(1).max(30),
  warehouseId: z.string().optional(),
  customerId: z.string().optional(),
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
  weightTotal: z
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
  const [searchQ, setSearchQ] = useState('');

  const receiptsQuery = useFreightWarehouseReceipts({ q: searchQ });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('receiptList.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('receiptList.description')}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={t('receiptList.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                {t('receiptList.columns.receiptNo')}
              </TableHead>
              <TableHead>{t('receiptList.columns.warehouse')}</TableHead>
              <TableHead>{t('receiptList.columns.customer')}</TableHead>
              <TableHead>{t('receiptList.columns.remarks')}</TableHead>
              <TableHead className="w-[120px]">
                {t('receiptList.columns.status')}
              </TableHead>
              <TableHead className="w-[180px]">
                {t('receiptList.columns.createdAt')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receiptsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : receiptsQuery.error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
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
            ) : (receiptsQuery.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
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
              (receiptsQuery.data ?? []).map((receipt) => (
                <TableRow
                  key={receipt.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectReceipt(receipt.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      {receipt.receiptNo}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {receipt.warehouse?.name ?? '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {receipt.customer?.nameCn ?? '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="max-w-xs truncate">
                      {receipt.remarks || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{receipt.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {receipt.createdAt
                      ? format(new Date(receipt.createdAt), 'yyyy-MM-dd HH:mm')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Floating Action Button */}
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
}: {
  receipt: FreightWarehouseReceipt;
  onBack: () => void;
  onAddItem: () => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const [searchQ, setSearchQ] = useState('');

  const itemsQuery = useFreightInventoryItems({
    receiptId: receipt.id,
    q: searchQ,
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
            <Badge>{receipt.status}</Badge>
          </div>
          {receipt.remarks && (
            <p className="text-muted-foreground text-sm mt-1">
              {receipt.remarks}
            </p>
          )}
        </div>
      </div>

      {/* Receipt Info Card */}
      <div className="grid gap-4 md:grid-cols-3 rounded-lg border bg-card p-4">
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
            {t('receiptList.columns.createdAt')}
          </div>
          <div className="mt-1 font-medium">
            {receipt.createdAt
              ? format(new Date(receipt.createdAt), 'yyyy-MM-dd HH:mm')
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
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t('items.searchPlaceholder')}
            className="pl-9"
          />
        </div>

        {/* Items Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('items.columns.commodity')}</TableHead>
                <TableHead>{t('items.columns.sku')}</TableHead>
                <TableHead className="text-right">
                  {t('items.columns.qty')}
                </TableHead>
                <TableHead>{t('items.columns.unit')}</TableHead>
                <TableHead>{t('items.columns.location')}</TableHead>
                <TableHead className="text-right">
                  {t('items.columns.weight')}
                </TableHead>
                <TableHead className="text-right">
                  {t('items.columns.dimensions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : itemsQuery.error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
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
              ) : (itemsQuery.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
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
                (itemsQuery.data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.commodityName ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.skuCode ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.initialQty}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.unit ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.binLocation ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {item.weightTotal ? `${item.weightTotal} kg` : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {item.lengthCm && item.widthCm && item.heightCm
                        ? `${item.lengthCm}×${item.widthCm}×${item.heightCm} cm`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
      remarks: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = createWarehouseReceiptSchema.parse({
        receiptNo: values.receiptNo.trim(),
        warehouseId: values.warehouseId || undefined,
        customerId: values.customerId || undefined,
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
              <Input
                id="unit"
                autoComplete="off"
                placeholder={t('items.fields.unitPlaceholder')}
                {...form.register('unit')}
              />
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
              <Label htmlFor="weightTotal">
                {t('items.fields.weightTotal')}
              </Label>
              <Input
                id="weightTotal"
                type="number"
                step="0.001"
                placeholder="kg"
                {...form.register('weightTotal')}
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

// Main Component
export function FreightInboundPageClient() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

  const receiptsQuery = useFreightWarehouseReceipts({ q: '' });

  const selectedReceipt = useMemo(() => {
    if (!selectedReceiptId) return null;
    return receiptsQuery.data?.find((r) => r.id === selectedReceiptId) ?? null;
  }, [selectedReceiptId, receiptsQuery.data]);

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
      ) : selectedReceipt ? (
        <ReceiptDetailView
          receipt={selectedReceipt}
          onBack={handleBack}
          onAddItem={() => setAddItemDialogOpen(true)}
        />
      ) : null}

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
    </div>
  );
}
