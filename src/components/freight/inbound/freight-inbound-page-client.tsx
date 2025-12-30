'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { CheckCircle2, FileText, Package, Plus, Search } from 'lucide-react';
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

function ReceiptListItem({
  receipt,
  isSelected,
  onClick,
}: {
  receipt: FreightWarehouseReceipt;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
        isSelected ? 'border-primary bg-accent' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <div className="font-medium truncate">{receipt.receiptNo}</div>
            {isSelected && (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            )}
          </div>
          {receipt.remarks && (
            <div className="text-muted-foreground text-xs mt-1 truncate">
              {receipt.remarks}
            </div>
          )}
        </div>
        <Badge variant="outline" className="shrink-0">
          {receipt.status}
        </Badge>
      </div>
      {receipt.createdAt && (
        <div className="text-muted-foreground text-xs mt-2">
          {format(new Date(receipt.createdAt), 'yyyy-MM-dd HH:mm')}
        </div>
      )}
    </button>
  );
}

function InventoryItemsTable({
  items,
  loading,
  error,
}: {
  items: FreightInventoryItem[];
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations('Dashboard.freight.inbound.items');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columns.commodity')}</TableHead>
            <TableHead>{t('columns.sku')}</TableHead>
            <TableHead>{t('columns.qty')}</TableHead>
            <TableHead className="hidden md:table-cell">
              {t('columns.location')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={`sk-${idx}`}>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                {getFreightApiErrorMessage(error)}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                {t('empty')}
              </TableCell>
            </TableRow>
          ) : (
            items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">
                  {it.commodityName ?? '-'}
                </TableCell>
                <TableCell>{it.skuCode ?? '-'}</TableCell>
                <TableCell>
                  {it.initialQty} {it.unit ?? ''}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {it.binLocation ?? '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function FreightInboundPageClient() {
  const t = useTranslations('Dashboard.freight.inbound');
  const [activeTab, setActiveTab] = useState('select');
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [receiptsQ, setReceiptsQ] = useState('');
  const [itemsQ, setItemsQ] = useState('');

  const warehousesQuery = useFreightWarehouses({ q: '' });
  const partiesQuery = useFreightParties({ q: '' });
  const customers = useMemo(
    () => (partiesQuery.data ?? []).filter((p) => p.roles.includes('CUSTOMER')),
    [partiesQuery.data]
  );

  const receiptsQuery = useFreightWarehouseReceipts({ q: receiptsQ });
  const receiptMutation = useCreateFreightWarehouseReceipt();

  const receiptForm = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      receiptNo: '',
      warehouseId: undefined,
      customerId: undefined,
      remarks: '',
    },
  });

  const onCreateReceipt = receiptForm.handleSubmit(async (values) => {
    try {
      const payload = createWarehouseReceiptSchema.parse({
        receiptNo: values.receiptNo.trim(),
        warehouseId: values.warehouseId || undefined,
        customerId: values.customerId || undefined,
        remarks: values.remarks?.trim() || undefined,
      });

      const created = await receiptMutation.mutateAsync(payload);
      toast.success(t('receipt.created'));
      setSelectedReceiptId(created.id);
      setActiveTab('items');
      receiptForm.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('receipt.createFailed')
      );
    }
  });

  const selectedReceipt = useMemo(() => {
    if (!selectedReceiptId) return null;
    return receiptsQuery.data?.find((r) => r.id === selectedReceiptId) ?? null;
  }, [selectedReceiptId, receiptsQuery.data]);

  const canAddItems = !!selectedReceiptId;
  const addItemMutation = useAddFreightInventoryItemToReceipt(
    selectedReceiptId || ''
  );

  const itemForm = useForm<AddItemFormInput, any, AddItemFormOutput>({
    resolver: zodResolver(addItemFormSchema),
    defaultValues: {
      commodityName: '',
      skuCode: '',
      initialQty: 1,
      unit: '',
      binLocation: '',
    },
  });

  const onAddItem = itemForm.handleSubmit(async (values) => {
    try {
      if (!canAddItems) {
        toast.error(t('items.noReceipt'));
        return;
      }

      const payload = addInventoryItemSchema.omit({ receiptId: true }).parse({
        ...values,
        commodityName: values.commodityName?.trim() || undefined,
        skuCode: values.skuCode?.trim() || undefined,
        unit: values.unit?.trim() || undefined,
        binLocation: values.binLocation?.trim() || undefined,
      });

      await addItemMutation.mutateAsync(payload);
      toast.success(t('items.created'));
      itemForm.reset({
        commodityName: '',
        skuCode: '',
        initialQty: 1,
        unit: '',
        binLocation: '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('items.createFailed'));
    }
  });

  const itemsParams = useMemo(
    () => ({ receiptId: selectedReceiptId || '', q: itemsQ }),
    [selectedReceiptId, itemsQ]
  );
  const itemsQuery = useFreightInventoryItems(itemsParams);

  return (
    <div className="px-4 lg:px-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="select">
            <FileText className="size-4" />
            {t('tabs.selectReceipt')}
          </TabsTrigger>
          <TabsTrigger value="items" disabled={!canAddItems}>
            <Package className="size-4" />
            {t('tabs.manageItems')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Receipt List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('receiptList.title')}</CardTitle>
                <div className="pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={receiptsQ}
                      onChange={(e) => setReceiptsQ(e.target.value)}
                      placeholder={t('receiptList.searchPlaceholder')}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {receiptsQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : receiptsQuery.error ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('receiptList.error')}</EmptyTitle>
                        <EmptyDescription>
                          {getFreightApiErrorMessage(receiptsQuery.error)}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (receiptsQuery.data ?? []).length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('receiptList.empty')}</EmptyTitle>
                        <EmptyDescription>
                          {t('receiptList.emptyHint')}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="space-y-2">
                      {(receiptsQuery.data ?? []).map((receipt) => (
                        <ReceiptListItem
                          key={receipt.id}
                          receipt={receipt}
                          isSelected={selectedReceiptId === receipt.id}
                          onClick={() => {
                            setSelectedReceiptId(receipt.id);
                            setActiveTab('items');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right: Create New Receipt */}
            <Card>
              <CardHeader>
                <CardTitle>{t('receipt.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onCreateReceipt} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptNo">
                      {t('receipt.fields.receiptNo')}
                    </Label>
                    <Input
                      id="receiptNo"
                      autoComplete="off"
                      {...receiptForm.register('receiptNo')}
                    />
                    {receiptForm.formState.errors.receiptNo?.message ? (
                      <p className="text-sm text-destructive">
                        {receiptForm.formState.errors.receiptNo.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="warehouseId">
                        {t('receipt.fields.warehouse')}
                      </Label>
                      <select
                        id="warehouseId"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        {...receiptForm.register('warehouseId')}
                      >
                        <option value="">
                          {t('receipt.fields.warehousePlaceholder')}
                        </option>
                        {(warehousesQuery.data ?? []).map(
                          (w: FreightWarehouse) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerId">
                        {t('receipt.fields.customer')}
                      </Label>
                      <select
                        id="customerId"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        {...receiptForm.register('customerId')}
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
                    <Label htmlFor="receipt-remarks">
                      {t('receipt.fields.remarks')}
                    </Label>
                    <Input
                      id="receipt-remarks"
                      autoComplete="off"
                      {...receiptForm.register('remarks')}
                    />
                  </div>

                  <Button type="submit" disabled={receiptMutation.isPending}>
                    <Plus className="size-4" />
                    {receiptMutation.isPending
                      ? t('receipt.creating')
                      : t('receipt.create')}
                  </Button>

                  {warehousesQuery.error || partiesQuery.error ? (
                    <p className="text-muted-foreground text-sm">
                      {getFreightApiErrorMessage(
                        warehousesQuery.error || partiesQuery.error
                      )}
                    </p>
                  ) : null}
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {selectedReceipt && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{selectedReceipt.receiptNo}</CardTitle>
                    {selectedReceipt.remarks && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {selectedReceipt.remarks}
                      </p>
                    )}
                  </div>
                  <Badge>{selectedReceipt.status}</Badge>
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Add Item Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('items.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onAddItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="commodityName">
                        {t('items.fields.commodityName')}
                      </Label>
                      <Input
                        id="commodityName"
                        autoComplete="off"
                        {...itemForm.register('commodityName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skuCode">
                        {t('items.fields.skuCode')}
                      </Label>
                      <Input
                        id="skuCode"
                        autoComplete="off"
                        {...itemForm.register('skuCode')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="initialQty">
                        {t('items.fields.initialQty')}
                      </Label>
                      <Input
                        id="initialQty"
                        type="number"
                        step="1"
                        {...itemForm.register('initialQty')}
                      />
                      {itemForm.formState.errors.initialQty?.message ? (
                        <p className="text-sm text-destructive">
                          {itemForm.formState.errors.initialQty.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">{t('items.fields.unit')}</Label>
                      <Input
                        id="unit"
                        autoComplete="off"
                        {...itemForm.register('unit')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="binLocation">
                        {t('items.fields.binLocation')}
                      </Label>
                      <Input
                        id="binLocation"
                        autoComplete="off"
                        {...itemForm.register('binLocation')}
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
                        {...itemForm.register('weightTotal')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lengthCm">
                        {t('items.fields.lengthCm')}
                      </Label>
                      <Input
                        id="lengthCm"
                        type="number"
                        step="0.001"
                        {...itemForm.register('lengthCm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="widthCm">
                        {t('items.fields.widthCm')}
                      </Label>
                      <Input
                        id="widthCm"
                        type="number"
                        step="0.001"
                        {...itemForm.register('widthCm')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heightCm">
                        {t('items.fields.heightCm')}
                      </Label>
                      <Input
                        id="heightCm"
                        type="number"
                        step="0.001"
                        {...itemForm.register('heightCm')}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={addItemMutation.isPending || !canAddItems}
                  >
                    <Plus className="size-4" />
                    {addItemMutation.isPending
                      ? t('items.creating')
                      : t('items.create')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right: Items List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('itemsList.title')}</CardTitle>
                <div className="pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={itemsQ}
                      onChange={(e) => setItemsQ(e.target.value)}
                      placeholder={t('items.searchPlaceholder')}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InventoryItemsTable
                  items={itemsQuery.data ?? []}
                  loading={itemsQuery.isLoading}
                  error={itemsQuery.error}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
