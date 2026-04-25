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
import { useRepackFreightWarehouseReceipts } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { repackWarehouseReceiptsSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type RepackFormValues = {
  receiptNo: string;
};

export function RepackReceiptDialog({
  open,
  onOpenChange,
  sourceReceiptIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceReceiptIds: string[];
  onSuccess: (receiptId: string) => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound.repack');
  const repackMutation = useRepackFreightWarehouseReceipts();
  const repackFormSchema = useMemo(
    () =>
      z.object({
        receiptNo: z
          .string()
          .trim()
          .min(1, { message: t('validation.receiptNoRequired') })
          .max(30),
      }),
    [t]
  );

  const form = useForm<RepackFormValues>({
    resolver: zodResolver(repackFormSchema),
    defaultValues: {
      receiptNo: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = repackWarehouseReceiptsSchema.parse({
        receiptNo: values.receiptNo.trim(),
        sourceReceiptIds,
      });

      const created = await repackMutation.mutateAsync(payload);
      toast.success(t('success'));
      form.reset();
      onOpenChange(false);
      onSuccess(created.id);
    } catch (error) {
      toast.error(getFreightApiErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { count: sourceReceiptIds.length })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t('warning')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repackReceiptNo">{t('fields.receiptNo')}</Label>
            <Input
              id="repackReceiptNo"
              autoComplete="off"
              placeholder={t('fields.receiptNoPlaceholder')}
              {...form.register('receiptNo')}
            />
            {form.formState.errors.receiptNo?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.receiptNo.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={repackMutation.isPending}>
              {repackMutation.isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
