import { getDb } from '@/db/index';
import { warehouseReceipts } from '@/db/schema';
import {
  isMissingWarehouseReceiptColumnError,
  omitWarehouseReceiptNewColumns,
} from '@/lib/freight/db-compat';
import type { createWarehouseReceiptSchema } from '@/lib/freight/schemas';
import type { z } from 'zod';

type CreateWarehouseReceiptInput = z.infer<typeof createWarehouseReceiptSchema>;

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

export async function createWarehouseReceipt(
  input: CreateWarehouseReceiptInput
) {
  const db = await getDb();
  const values = toWarehouseReceiptCreateValues(input);
  let created;

  try {
    [created] = await db.insert(warehouseReceipts).values(values).returning();
  } catch (error) {
    if (!isMissingWarehouseReceiptColumnError(error)) {
      throw error;
    }
    [created] = await db
      .insert(warehouseReceipts)
      .values(omitWarehouseReceiptNewColumns(values))
      .returning();
  }

  return created;
}
