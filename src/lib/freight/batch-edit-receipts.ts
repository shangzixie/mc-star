export const BATCH_EDIT_RECEIPT_OPERATIONS = [
  'status',
  'warehouse',
  'customer',
  'contact',
  'delete',
] as const;

export type BatchEditReceiptOperation =
  (typeof BATCH_EDIT_RECEIPT_OPERATIONS)[number];

export function getIsBatchEditSubmitDisabled(params: {
  operation: BatchEditReceiptOperation;
  selectedCount: number;
  isPending: boolean;
  warehouseId?: string;
  customerId?: string;
  enabledContactCount: number;
}) {
  if (params.selectedCount === 0 || params.isPending) {
    return true;
  }

  switch (params.operation) {
    case 'warehouse':
      return !params.warehouseId;
    case 'customer':
      return !params.customerId;
    case 'contact':
      return params.enabledContactCount === 0;
    case 'status':
    case 'delete':
      return false;
  }
}
