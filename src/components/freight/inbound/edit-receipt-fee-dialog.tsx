'use client';

import {
  ReceiptFeeFormDialog,
  type ReceiptFeeFormValues,
} from '@/components/freight/inbound/receipt-fee-form-dialog';
import { useUpdateFreightWarehouseReceiptFee } from '@/hooks/freight/use-freight-receipt-fees';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptFee } from '@/lib/freight/api-types';
import { toast } from 'sonner';

function toStr(v: unknown) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return `${v}`;
}

export function EditReceiptFeeDialog({
  open,
  onOpenChange,
  receiptId,
  fee,
  requestAddParty,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
  fee: FreightWarehouseReceiptFee;
  requestAddParty: (onCreated: (partyId: string) => void) => void;
}) {
  const updateMutation = useUpdateFreightWarehouseReceiptFee(receiptId, fee.id);

  const defaultValues: ReceiptFeeFormValues = {
    feeType: (fee.feeType as any) ?? 'AR',
    feeName: fee.feeName ?? '',
    unit: toStr(fee.unit),
    currency: toStr(fee.currency),
    price: toStr(fee.price),
    quantity: toStr(fee.quantity),
    originalAmount: toStr(fee.originalAmount),
    settledCurrency: toStr(fee.settledCurrency),
    exchangeRate: toStr(fee.exchangeRate),
    settledAmount: toStr(fee.settledAmount),
    paymentMethod: (fee.paymentMethod as any) ?? undefined,
    partyId: fee.partyId ?? '',
    remarks: toStr(fee.remarks),
  };

  return (
    <ReceiptFeeFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="编辑费用"
      submitText="保存"
      defaultValues={defaultValues}
      isSubmitting={updateMutation.isPending}
      requestAddParty={requestAddParty}
      onSubmit={async (payload) => {
        try {
          await updateMutation.mutateAsync(payload);
          toast.success('已保存');
          onOpenChange(false);
        } catch (error) {
          toast.error(getFreightApiErrorMessage(error));
        }
      }}
    />
  );
}
