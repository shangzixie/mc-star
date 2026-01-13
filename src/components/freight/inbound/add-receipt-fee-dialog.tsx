'use client';

import {
  ReceiptFeeFormDialog,
  type ReceiptFeeFormValues,
} from '@/components/freight/inbound/receipt-fee-form-dialog';
import { useCreateFreightWarehouseReceiptFee } from '@/hooks/freight/use-freight-receipt-fees';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { toast } from 'sonner';

export function AddReceiptFeeDialog({
  open,
  onOpenChange,
  receiptId,
  feeType,
  requestAddParty,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
  feeType: 'AR' | 'AP';
  requestAddParty: (onCreated: (partyId: string) => void) => void;
}) {
  const createMutation = useCreateFreightWarehouseReceiptFee(receiptId);

  const defaultValues: ReceiptFeeFormValues = {
    feeType,
    feeName: '',
    unit: '',
    currency: '',
    price: '',
    quantity: '',
    originalAmount: '',
    settledCurrency: '',
    exchangeRate: '',
    settledAmount: '',
    paymentMethod: undefined,
    partyId: '',
    remarks: '',
  };

  return (
    <ReceiptFeeFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={feeType === 'AR' ? '新增应收费用' : '新增应付费用'}
      submitText="保存"
      defaultValues={defaultValues}
      isSubmitting={createMutation.isPending}
      requestAddParty={requestAddParty}
      onSubmit={async (payload) => {
        try {
          await createMutation.mutateAsync(payload);
          toast.success('已保存');
          onOpenChange(false);
        } catch (error) {
          toast.error(getFreightApiErrorMessage(error));
        }
      }}
    />
  );
}
