import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import {
  warehouseReceiptMerges,
  warehouseReceiptStatusLogs,
  warehouseReceipts,
} from '@/db/schema';
import { ApiError } from '@/lib/api/http';
import {
  isMissingWarehouseReceiptColumnError,
  omitWarehouseReceiptNewColumns,
  omitWarehouseReceiptNewColumnsFromColumnMap,
} from '@/lib/freight/db-compat';
import type {
  batchUpdateWarehouseReceiptsSchema,
  createWarehouseReceiptSchema,
  updateWarehouseReceiptSchema,
} from '@/lib/freight/schemas';
import {
  getReceiptStats,
  updateReceiptStatus,
} from '@/lib/freight/services/receipt-status';
import { eq, getTableColumns, inArray } from 'drizzle-orm';
import type { z } from 'zod';

type CreateWarehouseReceiptInput = z.infer<typeof createWarehouseReceiptSchema>;
export type UpdateWarehouseReceiptInput = z.infer<
  typeof updateWarehouseReceiptSchema
>;
export type BatchUpdateWarehouseReceiptsInput = z.infer<
  typeof batchUpdateWarehouseReceiptsSchema
>;

type DbClient = Awaited<ReturnType<typeof getDb>>;
type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

function toNullableNumericString(value: number | null | undefined) {
  return value != null ? `${value}` : value;
}

function toWarehouseReceiptCreateValues(input: CreateWarehouseReceiptInput) {
  return {
    receiptNo: input.receiptNo,
    warehouseId: input.warehouseId,
    customerId: input.customerId,
    transportType: input.transportType,
    customsDeclarationType: input.customsDeclarationType,
    status: input.status ?? 'INBOUND',
    auditStatus: input.auditStatus ?? 'NOT_AUDITED',
    inboundTime: input.inboundTime ? new Date(input.inboundTime) : undefined,
    remarks: input.remarks,
    internalRemarks: input.internalRemarks,
    manualPieces: toNullableNumericString(input.manualPieces),
    manualWeightKg: toNullableNumericString(input.manualWeightKg),
    manualVolumeM3: toNullableNumericString(input.manualVolumeM3),
    bubbleSplitPercent: toNullableNumericString(input.bubbleSplitPercent),
    weightConversionFactor: toNullableNumericString(
      input.weightConversionFactor
    ),
    shipperId: input.shipperId,
    customerPhone: input.customerPhone,
    shipperPhone: input.shipperPhone,
    bookingAgentId: input.bookingAgentId,
    bookingAgentPhone: input.bookingAgentPhone,
    customsAgentId: input.customsAgentId,
    customsAgentPhone: input.customsAgentPhone,
    salesEmployeeId: input.salesEmployeeId,
    customerServiceEmployeeId: input.customerServiceEmployeeId,
    overseasCsEmployeeId: input.overseasCsEmployeeId,
    operationsEmployeeId: input.operationsEmployeeId,
    documentationEmployeeId: input.documentationEmployeeId,
    financeEmployeeId: input.financeEmployeeId,
    bookingEmployeeId: input.bookingEmployeeId,
    reviewerEmployeeId: input.reviewerEmployeeId,
    airType: input.airType,
    airCarrier: input.airCarrier,
    airFlightNo: input.airFlightNo,
    airFlightDate: input.airFlightDate,
    airArrivalDateE: input.airArrivalDateE,
    airOperationLocation: input.airOperationLocation,
    airOperationNode: input.airOperationNode,
    seaCarrier: input.seaCarrier,
    seaRoute: input.seaRoute,
    seaVesselName: input.seaVesselName,
    seaVoyage: input.seaVoyage,
    seaEtdE: input.seaEtdE,
    seaEtaE: input.seaEtaE,
    singleBillCutoffDateSi: input.singleBillCutoffDateSi,
    singleBillGateClosingTime: input.singleBillGateClosingTime,
    singleBillDepartureDateE: input.singleBillDepartureDateE,
    singleBillArrivalDateE: input.singleBillArrivalDateE,
    singleBillTransitDateE: input.singleBillTransitDateE,
    singleBillDeliveryDateE: input.singleBillDeliveryDateE,
    courierTrackingNo: input.courierTrackingNo,
    courierReceivedAt: input.courierReceivedAt
      ? new Date(input.courierReceivedAt)
      : undefined,
  };
}

function toWarehouseReceiptUpdateValues(input: UpdateWarehouseReceiptInput) {
  return {
    receiptNo: input.receiptNo,
    warehouseId: input.warehouseId,
    customerId: input.customerId,
    transportType: input.transportType,
    customsDeclarationType: input.customsDeclarationType,
    status: input.status,
    auditStatus: input.auditStatus,
    inboundTime: input.inboundTime ? new Date(input.inboundTime) : undefined,
    remarks: input.remarks,
    internalRemarks: input.internalRemarks,
    manualPieces: toNullableNumericString(input.manualPieces),
    manualWeightKg: toNullableNumericString(input.manualWeightKg),
    manualVolumeM3: toNullableNumericString(input.manualVolumeM3),
    bubbleSplitPercent: toNullableNumericString(input.bubbleSplitPercent),
    weightConversionFactor: toNullableNumericString(
      input.weightConversionFactor
    ),
    shipperId: input.shipperId,
    customerPhone: input.customerPhone,
    shipperPhone: input.shipperPhone,
    bookingAgentId: input.bookingAgentId,
    bookingAgentPhone: input.bookingAgentPhone,
    customsAgentId: input.customsAgentId,
    customsAgentPhone: input.customsAgentPhone,
    salesEmployeeId: input.salesEmployeeId,
    customerServiceEmployeeId: input.customerServiceEmployeeId,
    overseasCsEmployeeId: input.overseasCsEmployeeId,
    operationsEmployeeId: input.operationsEmployeeId,
    documentationEmployeeId: input.documentationEmployeeId,
    financeEmployeeId: input.financeEmployeeId,
    bookingEmployeeId: input.bookingEmployeeId,
    reviewerEmployeeId: input.reviewerEmployeeId,
    airType: input.airType,
    airCarrier: input.airCarrier,
    airFlightNo: input.airFlightNo,
    airFlightDate: input.airFlightDate,
    airArrivalDateE: input.airArrivalDateE,
    airOperationLocation: input.airOperationLocation,
    airOperationNode: input.airOperationNode,
    seaCarrier: input.seaCarrier,
    seaRoute: input.seaRoute,
    seaVesselName: input.seaVesselName,
    seaVoyage: input.seaVoyage,
    seaEtdE: input.seaEtdE,
    seaEtaE: input.seaEtaE,
    singleBillCutoffDateSi: input.singleBillCutoffDateSi,
    singleBillGateClosingTime: input.singleBillGateClosingTime,
    singleBillDepartureDateE: input.singleBillDepartureDateE,
    singleBillArrivalDateE: input.singleBillArrivalDateE,
    singleBillTransitDateE: input.singleBillTransitDateE,
    singleBillDeliveryDateE: input.singleBillDeliveryDateE,
    courierTrackingNo: input.courierTrackingNo,
    courierReceivedAt:
      input.courierReceivedAt === null
        ? null
        : input.courierReceivedAt
          ? new Date(input.courierReceivedAt)
          : undefined,
  };
}

function normalizeOptionalPhone(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function buildBatchWarehouseReceiptUpdateBody(
  input: BatchUpdateWarehouseReceiptsInput
): UpdateWarehouseReceiptInput {
  switch (input.operation) {
    case 'status':
      return { status: input.changes.status };
    case 'warehouse':
      return { warehouseId: input.changes.warehouseId };
    case 'customer':
      return { customerId: input.changes.customerId };
    case 'contact': {
      const payload: UpdateWarehouseReceiptInput = {};
      if (input.changes.customerPhoneEnabled) {
        payload.customerPhone = normalizeOptionalPhone(
          input.changes.customerPhone
        );
      }
      if (input.changes.shipperPhoneEnabled) {
        payload.shipperPhone = normalizeOptionalPhone(
          input.changes.shipperPhone
        );
      }
      if (input.changes.bookingAgentPhoneEnabled) {
        payload.bookingAgentPhone = normalizeOptionalPhone(
          input.changes.bookingAgentPhone
        );
      }
      if (input.changes.customsAgentPhoneEnabled) {
        payload.customsAgentPhone = normalizeOptionalPhone(
          input.changes.customsAgentPhone
        );
      }
      return payload;
    }
  }
}

export async function runBatchWarehouseReceiptUpdate({
  ids,
  payload,
  updateOne,
}: {
  ids: string[];
  payload: UpdateWarehouseReceiptInput;
  updateOne: (
    id: string,
    payload: UpdateWarehouseReceiptInput
  ) => Promise<unknown>;
}) {
  const results: Array<{ id: string; ok: boolean; message?: string }> = [];

  for (const id of ids) {
    try {
      await updateOne(id, payload);
      results.push({ id, ok: true });
    } catch (error) {
      results.push({
        id,
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    successCount: results.filter((item) => item.ok).length,
    failureCount: results.filter((item) => !item.ok).length,
    results,
  };
}

export async function updateWarehouseReceiptRecord(
  tx: DbTransaction,
  params: {
    receiptId: string;
    body: UpdateWarehouseReceiptInput;
    userId: string;
  }
) {
  const { receiptId, body, userId } = params;
  const [existing] = await tx
    .select({ status: warehouseReceipts.status })
    .from(warehouseReceipts)
    .where(eq(warehouseReceipts.id, receiptId));

  if (existing?.status === 'OUTBOUND') {
    const invalidKeys = Object.entries(body).filter(
      ([key, value]) => key !== 'status' && value !== undefined
    );
    if (invalidKeys.length > 0) {
      throw new ApiError({
        status: 400,
        code: 'OUTBOUND_EDIT_LOCKED',
        message: 'Cannot modify receipt data once status is OUTBOUND',
      });
    }
  }

  const updateValues = toWarehouseReceiptUpdateValues(body);

  let result: Record<string, unknown> | undefined;
  try {
    [result] = await tx
      .update(warehouseReceipts)
      .set(updateValues)
      .where(eq(warehouseReceipts.id, receiptId))
      .returning();
  } catch (error) {
    if (!isMissingWarehouseReceiptColumnError(error)) {
      throw error;
    }
    const safeColumns = omitWarehouseReceiptNewColumnsFromColumnMap(
      getTableColumns(warehouseReceipts)
    );
    [result] = await tx
      .update(warehouseReceipts)
      .set(omitWarehouseReceiptNewColumns(updateValues))
      .where(eq(warehouseReceipts.id, receiptId))
      .returning(safeColumns);
  }

  if (!result) {
    throw new ApiError({
      status: 404,
      code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
      message: 'Warehouse receipt not found',
    });
  }

  if (body.status && existing && body.status !== existing.status) {
    const children = await tx
      .select({
        id: warehouseReceipts.id,
        status: warehouseReceipts.status,
      })
      .from(warehouseReceipts)
      .innerJoin(
        warehouseReceiptMerges,
        eq(warehouseReceiptMerges.childReceiptId, warehouseReceipts.id)
      )
      .where(eq(warehouseReceiptMerges.parentReceiptId, receiptId));

    const shouldCascade = body.status === 'OUTBOUND' && children.length > 0;
    const batchId = shouldCascade ? randomUUID() : null;

    await tx.insert(warehouseReceiptStatusLogs).values({
      receiptId,
      fromStatus: existing.status,
      toStatus: body.status,
      changedBy: userId,
      reason: shouldCascade ? 'BATCH_PARENT_OUTBOUND' : 'MANUAL_STATUS_UPDATE',
      batchId,
    });

    if (shouldCascade) {
      const childUpdates = children.filter(
        (child) => child.status !== 'OUTBOUND'
      );

      if (childUpdates.length > 0) {
        const childIds = childUpdates.map((child) => child.id);
        await tx
          .update(warehouseReceipts)
          .set({ status: 'OUTBOUND' })
          .where(inArray(warehouseReceipts.id, childIds));

        await tx.insert(warehouseReceiptStatusLogs).values(
          childUpdates.map((child) => ({
            receiptId: child.id,
            fromStatus: child.status,
            toStatus: 'OUTBOUND',
            changedBy: userId,
            reason: 'BATCH_CHILD_OUTBOUND',
            batchId,
          }))
        );
      }
    }
  }

  if (!body.status) {
    await updateReceiptStatus(receiptId, tx, {
      changedBy: userId,
      reason: 'AUTO_STATUS_UPDATE',
    });
  }

  return result;
}

export async function createWarehouseReceipt(
  input: CreateWarehouseReceiptInput
) {
  const db = await getDb();
  const values = toWarehouseReceiptCreateValues(input);
  let created: Record<string, unknown> | undefined;

  try {
    [created] = await db.insert(warehouseReceipts).values(values).returning();
  } catch (error) {
    if (!isMissingWarehouseReceiptColumnError(error)) {
      throw error;
    }
    // Compat fallback: migration 0028 not yet applied — omit new columns from
    // both the INSERT values and the RETURNING list so neither side references
    // columns that don't exist in the database yet.
    const safeColumns = omitWarehouseReceiptNewColumnsFromColumnMap(
      getTableColumns(warehouseReceipts)
    );
    [created] = await db
      .insert(warehouseReceipts)
      .values(omitWarehouseReceiptNewColumns(values))
      .returning(safeColumns);
  }

  return created;
}
