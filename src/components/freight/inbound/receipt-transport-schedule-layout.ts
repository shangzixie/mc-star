export const RECEIPT_TRANSPORT_SIDEBAR_FIELD_ORDER = [
  'warehouse',
  'courierTrackingNo',
  'courierReceivedAt',
  'status',
] as const;

export type ReceiptTransportSidebarFieldKey =
  (typeof RECEIPT_TRANSPORT_SIDEBAR_FIELD_ORDER)[number];
