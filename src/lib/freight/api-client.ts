import { z } from 'zod';
import {
  type ApiErrorEnvelope,
  apiErrorEnvelopeSchema,
  apiOkEnvelopeSchema,
} from './api-types';

export class FreightApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

async function parseApiError(
  response: Response
): Promise<{ code: string; message: string; details?: unknown }> {
  const fallback = {
    code: `HTTP_${response.status}`,
    message: response.statusText || 'Request failed',
  };

  const json = await response.json().catch(() => null);
  const parsed = apiErrorEnvelopeSchema.safeParse(json);
  if (!parsed.success) return fallback;

  return {
    code: parsed.data.error.code,
    message: parsed.data.error.message,
    details: parsed.data.error.details,
  };
}

/**
 * Typed fetch wrapper for `/api/freight/**` endpoints.
 *
 * - Throws `FreightApiError` on non-2xx responses
 * - Validates successful payloads with Zod
 */
export async function freightFetch<TData>(
  path: string,
  options: RequestInit & { schema: z.ZodType<TData> }
): Promise<TData> {
  const { schema, ...init } = options;
  const response = await fetch(path, init);

  if (!response.ok) {
    const { code, message, details } = await parseApiError(response);
    throw new FreightApiError({
      status: response.status,
      code,
      message,
      details,
    });
  }

  const json = await response.json();
  const parsed = apiOkEnvelopeSchema(schema).safeParse(json);
  if (!parsed.success) {
    throw new FreightApiError({
      status: 500,
      code: 'INVALID_RESPONSE',
      message: 'Invalid response from server',
      details: parsed.error.flatten(),
    });
  }

  return parsed.data.data;
}

export async function freightFetchVoid(
  path: string,
  init?: RequestInit
): Promise<void> {
  const response = await fetch(path, init);
  if (response.ok) return;

  const { code, message, details } = await parseApiError(response);
  throw new FreightApiError({
    status: response.status,
    code,
    message,
    details,
  });
}

export function freightQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.length > 0) search.set(key, value);
  }
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : '';
}

export function isFreightApiError(error: unknown): error is FreightApiError {
  return error instanceof FreightApiError;
}

export function getFreightApiErrorMessage(error: unknown) {
  if (isFreightApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function getFreightApiErrorCode(error: unknown) {
  if (isFreightApiError(error)) return error.code;

  const maybe = z
    .object({
      code: z.string(),
    })
    .safeParse(error);
  return maybe.success ? maybe.data.code : 'UNKNOWN';
}

// -----------------------------------------------------------------------------
// API Client Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get inventory movements for an inventory item
 */
export async function getInventoryMovements(itemId: string) {
  const { freightInventoryMovementSchema } = await import('./api-types');
  return freightFetch(`/api/freight/inventory-items/${itemId}/movements`, {
    schema: z.array(freightInventoryMovementSchema),
  });
}

/**
 * Update a warehouse receipt
 */
export async function updateWarehouseReceipt(
  receiptId: string,
  data: {
    warehouseId?: string;
    customerId?: string;
    status?: string;
    inboundTime?: string;
    remarks?: string;
  }
) {
  const { freightWarehouseReceiptSchema } = await import('./api-types');
  return freightFetch(`/api/freight/warehouse-receipts/${receiptId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    schema: freightWarehouseReceiptSchema,
  });
}

/**
 * Delete a warehouse receipt
 */
export async function deleteWarehouseReceipt(receiptId: string) {
  return freightFetch(`/api/freight/warehouse-receipts/${receiptId}`, {
    method: 'DELETE',
    schema: z.object({ success: z.boolean() }),
  });
}

/**
 * Get a single inventory item with allocations
 */
export async function getInventoryItem(itemId: string) {
  const { freightInventoryItemWithAllocationsSchema } = await import(
    './api-types'
  );
  return freightFetch(`/api/freight/inventory-items/${itemId}`, {
    schema: freightInventoryItemWithAllocationsSchema,
  });
}

/**
 * Update an inventory item (details only, not quantities)
 */
export async function updateInventoryItem(
  itemId: string,
  data: {
    commodityName?: string;
    skuCode?: string;
    unit?: string;
    binLocation?: string;
    weightTotal?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  }
) {
  const { freightInventoryItemSchema } = await import('./api-types');
  return freightFetch(`/api/freight/inventory-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    schema: freightInventoryItemSchema,
  });
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(itemId: string) {
  return freightFetch(`/api/freight/inventory-items/${itemId}`, {
    method: 'DELETE',
    schema: z.object({ success: z.boolean() }),
  });
}
