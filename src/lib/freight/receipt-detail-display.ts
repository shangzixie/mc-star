import type { WarehouseReceiptRelationType } from './receipt-relation-type';

type ReceiptRelationChild = {
  id?: string;
  receiptNo?: string;
  relationType?: WarehouseReceiptRelationType | null;
};

type ReceiptDetailRelationInput = {
  isMergedParent?: boolean | null;
  mergedChildren?: ReceiptRelationChild[] | null;
};

export type ReceiptDetailItemDisplayMode = 'own-items' | 'merged-child-items';

export function isRepackParentReceipt(
  receipt: ReceiptDetailRelationInput
): boolean {
  if (!receipt.isMergedParent) return false;
  return (
    receipt.mergedChildren?.some((child) => child.relationType === 'REPACK') ??
    false
  );
}

export function getReceiptDetailItemDisplayMode(
  receipt: ReceiptDetailRelationInput
): ReceiptDetailItemDisplayMode {
  if (!receipt.isMergedParent) return 'own-items';
  return isRepackParentReceipt(receipt) ? 'own-items' : 'merged-child-items';
}
