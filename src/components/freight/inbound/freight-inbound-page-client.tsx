'use client';

import { Button } from '@/components/ui/button';
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
} from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightParty,
  FreightWarehouse,
} from '@/lib/freight/api-types';
import {
  addInventoryItemSchema,
  createWarehouseReceiptSchema,
} from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
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
  const [receiptId, setReceiptId] = useState('');
  const [itemsQ, setItemsQ] = useState('');

  const warehousesQuery = useFreightWarehouses({ q: '' });
  const partiesQuery = useFreightParties({ q: '' });
  const customers = useMemo(
    () => (partiesQuery.data ?? []).filter((p) => p.roles.includes('CUSTOMER')),
    [partiesQuery.data]
  );

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
      setReceiptId(created.id);
      receiptForm.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('receipt.createFailed')
      );
    }
  });

  const canAddItems = receiptId.trim().length > 0;
  const addItemMutation = useAddFreightInventoryItemToReceipt(receiptId.trim());

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
    () => ({ receiptId: receiptId.trim(), q: itemsQ }),
    [receiptId, itemsQ]
  );
  const itemsQuery = useFreightInventoryItems(itemsParams);

  return (
    <div className="px-4 lg:px-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <div className="font-semibold">{t('receipt.title')}</div>
            <div className="text-muted-foreground text-sm">
              {t('receipt.description')}
            </div>
          </div>

          <form onSubmit={onCreateReceipt} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiptNo">{t('receipt.fields.receiptNo')}</Label>
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
                  {(warehousesQuery.data ?? []).map((w: FreightWarehouse) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
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
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <div className="font-semibold">{t('items.title')}</div>
            <div className="text-muted-foreground text-sm">
              {t('items.description')}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptId">{t('items.fields.receiptId')}</Label>
            <Input
              id="receiptId"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              placeholder={t('items.fields.receiptIdPlaceholder')}
            />
          </div>

          <form onSubmit={onAddItem} className="mt-4 space-y-4">
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
                <Label htmlFor="skuCode">{t('items.fields.skuCode')}</Label>
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
                <Label htmlFor="lengthCm">{t('items.fields.lengthCm')}</Label>
                <Input
                  id="lengthCm"
                  type="number"
                  step="0.001"
                  {...itemForm.register('lengthCm')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="widthCm">{t('items.fields.widthCm')}</Label>
                <Input
                  id="widthCm"
                  type="number"
                  step="0.001"
                  {...itemForm.register('widthCm')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heightCm">{t('items.fields.heightCm')}</Label>
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
              {addItemMutation.isPending
                ? t('items.creating')
                : t('items.create')}
            </Button>
          </form>
        </div>
      </div>

      {canAddItems ? (
        <div className="mt-6 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={itemsQ}
              onChange={(e) => setItemsQ(e.target.value)}
              placeholder={t('items.searchPlaceholder')}
              className="w-full sm:w-[320px]"
            />
          </div>

          <InventoryItemsTable
            items={itemsQuery.data ?? []}
            loading={itemsQuery.isLoading}
            error={itemsQuery.error}
          />
        </div>
      ) : null}
    </div>
  );
}
