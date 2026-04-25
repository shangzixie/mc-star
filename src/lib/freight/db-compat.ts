const warehouseReceiptNewColumnKeys = [
  'airType',
  'courierTrackingNo',
  'courierReceivedAt',
  'customerPhone',
  'shipperPhone',
  'bookingAgentPhone',
  'customsAgentPhone',
] as const;

const warehouseReceiptNewColumnNames = [
  'air_type',
  'courier_tracking_no',
  'courier_received_at',
  'customer_phone',
  'shipper_phone',
  'booking_agent_phone',
  'customs_agent_phone',
] as const;

function hasErrorCodeAndMessage(
  error: unknown
): error is { code?: string; message?: string } {
  return typeof error === 'object' && error !== null;
}

export function isMissingWarehouseReceiptColumnError(error: unknown): boolean {
  if (!hasErrorCodeAndMessage(error)) return false;
  const code =
    typeof error.code === 'string' && error.code.length > 0
      ? error.code
      : undefined;
  const message = error.message?.toLowerCase();
  if (!message?.includes('does not exist')) return false;

  // Prefer SQLSTATE 42703 when available, but tolerate wrappers that drop code.
  if (code && code !== '42703') return false;

  if (message.includes('warehouse_receipts.')) return true;

  return Boolean(
    warehouseReceiptNewColumnNames.some((column) =>
      message.includes(column)
    )
  );
}

export function omitWarehouseReceiptNewColumns<
  T extends Record<string, unknown>,
>(values: T): Omit<T, (typeof warehouseReceiptNewColumnKeys)[number]> {
  const next = { ...values };
  for (const key of warehouseReceiptNewColumnKeys) {
    delete next[key];
  }
  return next;
}
