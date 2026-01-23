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
import { useMergeFreightWarehouseReceipts } from '@/hooks/freight/use-freight-warehouse-receipts';
import { WAREHOUSE_RECEIPT_TRANSPORT_TYPES } from '@/lib/freight/constants';
import { createWarehouseReceiptSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type ReceiptFormValues = {
  receiptNo: string;
  transportType: string;
};

export function MergeReceiptsDialog({
  open,
  onOpenChange,
  receiptIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptIds: string[];
  onSuccess: (receiptId: string) => void;
}) {
  const t = useTranslations('Dashboard.freight.shipments');
  const receiptFormSchema = useMemo(
    () =>
      z.object({
        receiptNo: z
          .string()
          .trim()
          .min(1, { message: t('merge.validation.receiptNoRequired') })
          .max(30),
        transportType: z
          .string()
          .refine(
            (v) =>
              WAREHOUSE_RECEIPT_TRANSPORT_TYPES.includes(
                v as (typeof WAREHOUSE_RECEIPT_TRANSPORT_TYPES)[number]
              ),
            { message: t('merge.validation.transportTypeRequired') }
          ),
      }),
    [t]
  );

  const mergeMutation = useMergeFreightWarehouseReceipts();

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      receiptNo: '',
      transportType: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = createWarehouseReceiptSchema.parse({
        receiptNo: values.receiptNo.trim(),
        transportType: values.transportType,
      });

      const created = await mergeMutation.mutateAsync({
        ...payload,
        receiptIds,
      });
      toast.success(t('merge.success'));
      form.reset();
      onOpenChange(false);
      onSuccess(created.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('merge.failed')
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('merge.title')}</DialogTitle>
          <DialogDescription>{t('merge.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiptNo">{t('merge.fields.receiptNo')}</Label>
            <Input
              id="receiptNo"
              autoComplete="off"
              placeholder={t('merge.fields.receiptNoPlaceholder')}
              {...form.register('receiptNo')}
            />
            {form.formState.errors.receiptNo?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.receiptNo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transportType">{t('merge.fields.transportType')}</Label>
            <select
              id="transportType"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register('transportType')}
            >
              <option value="">{t('merge.fields.transportTypePlaceholder')}</option>
              {WAREHOUSE_RECEIPT_TRANSPORT_TYPES.map((tt) => (
                <option key={tt} value={tt}>
                  {t(`merge.fields.transportTypeOptions.${tt}` as any)}
                </option>
              ))}
            </select>
            {form.formState.errors.transportType?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.transportType.message as any}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('merge.cancel')}
            </Button>
            <Button type="submit" disabled={mergeMutation.isPending}>
              {mergeMutation.isPending ? t('merge.creating') : t('merge.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
