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
  if (error.code !== '42703') return false;
  if (!error.message?.includes('does not exist')) return false;

  if (error.message.includes('warehouse_receipts.')) return true;

  return Boolean(
    warehouseReceiptNewColumnNames.some((column) =>
      error.message?.includes(column)
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
