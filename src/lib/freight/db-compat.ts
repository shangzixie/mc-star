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

function getErrorCandidates(error: unknown) {
  const candidates: Array<{ code?: string; message?: string }> = [];
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!hasErrorCodeAndMessage(current) || seen.has(current)) continue;
    seen.add(current);
    candidates.push(current);

    const cause = (current as { cause?: unknown }).cause;
    if (cause && !seen.has(cause)) {
      queue.push(cause);
    }
  }

  return candidates;
}

export function isMissingWarehouseReceiptColumnError(error: unknown): boolean {
  return getErrorCandidates(error).some((candidate) => {
    const code =
      typeof candidate.code === 'string' && candidate.code.length > 0
        ? candidate.code
        : undefined;
    const message = candidate.message?.toLowerCase();
    if (!message?.includes('does not exist')) return false;

    // Prefer SQLSTATE 42703 when available, but tolerate wrappers that drop code.
    if (code && code !== '42703') return false;

    if (message.includes('warehouse_receipts.')) return true;

    return warehouseReceiptNewColumnNames.some((column) =>
      message.includes(column)
    );
  });
}

export function omitWarehouseReceiptNewColumnsFromColumnMap<
  T extends Record<string, unknown>,
>(columns: T): Omit<T, (typeof warehouseReceiptNewColumnKeys)[number]> {
  const next = { ...columns };
  for (const key of warehouseReceiptNewColumnKeys) {
    delete next[key];
  }
  return next;
}

export function omitWarehouseReceiptNewColumns<
  T extends Record<string, unknown>,
>(values: T): Omit<T, (typeof warehouseReceiptNewColumnKeys)[number]> {
  return omitWarehouseReceiptNewColumnsFromColumnMap(values);
}
