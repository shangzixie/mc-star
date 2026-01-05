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
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import { RECEIPT_STATUSES } from '@/lib/freight/constants';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ChangeStatusDialog({
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
