'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useFreightParties,
  useFreightWarehouses,
} from '@/hooks/freight/use-freight-master-data';
import { useCreateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import type { FreightParty, FreightWarehouse } from '@/lib/freight/api-types';
import {
  WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from '@/lib/freight/constants';
import { createWarehouseReceiptSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const receiptFormSchema = z.object({
  receiptNo: z.string().min(1).max(30),
  warehouseId: z.string().optional(),
  customerId: z.string().optional(),
  transportType: z.string().optional(),
  customsDeclarationType: z.string().optional(),
  remarks: z.string().optional(),
  internalRemarks: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

export function CreateReceiptDialog({
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
      internalRemarks: '',
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
        internalRemarks: values.internalRemarks?.trim() || undefined,
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

          <div className="space-y-2">
            <Label htmlFor="internalRemarks">
              {t('receipt.fields.internalRemarks')}
            </Label>
            <Input
              id="internalRemarks"
              autoComplete="off"
              placeholder={t('receipt.fields.internalRemarksPlaceholder')}
              {...form.register('internalRemarks')}
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
