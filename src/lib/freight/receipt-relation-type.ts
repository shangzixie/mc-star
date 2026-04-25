export const WAREHOUSE_RECEIPT_RELATION_TYPES = ['MERGE', 'REPACK'] as const;

export type WarehouseReceiptRelationType =
  (typeof WAREHOUSE_RECEIPT_RELATION_TYPES)[number];
