import { getDb } from '@/db/index';
import {
  inventoryItems,
  inventoryMovements,
  warehouseReceiptMerges,
  warehouseReceipts,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  isMissingWarehouseReceiptColumnError,
  omitWarehouseReceiptNewColumns,
  omitWarehouseReceiptNewColumnsFromColumnMap,
} from '@/lib/freight/db-compat';
import { mergeWarehouseReceiptsSchema } from '@/lib/freight/schemas';
import { getTableColumns, inArray, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJson(request, mergeWarehouseReceiptsSchema);
    const receiptIds = Array.from(new Set(body.receiptIds));

    const db = await getDb();
    const created = await db.transaction(async (tx) => {
      const receipts = await tx
        .select({ id: warehouseReceipts.id })
        .from(warehouseReceipts)
        .where(inArray(warehouseReceipts.id, receiptIds));

      if (receipts.length !== receiptIds.length) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'One or more receipts are missing',
        });
      }

      const items = await tx
        .select({
          commodityName: inventoryItems.commodityName,
          initialQty: inventoryItems.initialQty,
          unit: inventoryItems.unit,
        })
        .from(inventoryItems)
        .where(inArray(inventoryItems.receiptId, receiptIds));

      const names = items
        .map((item) => item.commodityName?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0));
      const totalQty = items.reduce((sum, item) => sum + item.initialQty, 0);
      const unitCandidates = Array.from(
        new Set(items.map((item) => item.unit).filter(Boolean))
      );
      const mergedUnit = unitCandidates.length === 1 ? unitCandidates[0] : null;

      const values = {
        receiptNo: body.receiptNo,
        warehouseId: body.warehouseId,
        customerId: body.customerId,
        transportType: body.transportType,
        customsDeclarationType: body.customsDeclarationType,
        status: body.status ?? 'INBOUND',
        inboundTime: body.inboundTime ? new Date(body.inboundTime) : undefined,
        remarks: body.remarks,
        internalRemarks: body.internalRemarks,
        manualPieces:
          body.manualPieces != null
            ? `${body.manualPieces}`
            : body.manualPieces,
        manualWeightKg:
          body.manualWeightKg != null
            ? `${body.manualWeightKg}`
            : body.manualWeightKg,
        manualVolumeM3:
          body.manualVolumeM3 != null
            ? `${body.manualVolumeM3}`
            : body.manualVolumeM3,
        bubbleSplitPercent:
          body.bubbleSplitPercent != null
            ? `${body.bubbleSplitPercent}`
            : body.bubbleSplitPercent,
        weightConversionFactor:
          body.weightConversionFactor != null
            ? `${body.weightConversionFactor}`
            : body.weightConversionFactor,
        shipperId: body.shipperId,
        customerPhone: body.customerPhone,
        shipperPhone: body.shipperPhone,
        bookingAgentId: body.bookingAgentId,
        bookingAgentPhone: body.bookingAgentPhone,
        customsAgentId: body.customsAgentId,
        customsAgentPhone: body.customsAgentPhone,
        salesEmployeeId: body.salesEmployeeId,
        customerServiceEmployeeId: body.customerServiceEmployeeId,
        overseasCsEmployeeId: body.overseasCsEmployeeId,
        operationsEmployeeId: body.operationsEmployeeId,
        documentationEmployeeId: body.documentationEmployeeId,
        financeEmployeeId: body.financeEmployeeId,
        bookingEmployeeId: body.bookingEmployeeId,
        reviewerEmployeeId: body.reviewerEmployeeId,
        airType: body.airType,
        airCarrier: body.airCarrier,
        airFlightNo: body.airFlightNo,
        airFlightDate: body.airFlightDate,
        airArrivalDateE: body.airArrivalDateE,
        airOperationLocation: body.airOperationLocation,
        airOperationNode: body.airOperationNode,
        seaCarrier: body.seaCarrier,
        seaRoute: body.seaRoute,
        seaVesselName: body.seaVesselName,
        seaVoyage: body.seaVoyage,
        seaEtdE: body.seaEtdE,
        seaEtaE: body.seaEtaE,
        singleBillCutoffDateSi: body.singleBillCutoffDateSi,
        singleBillGateClosingTime: body.singleBillGateClosingTime,
        singleBillDepartureDateE: body.singleBillDepartureDateE,
        singleBillArrivalDateE: body.singleBillArrivalDateE,
        singleBillTransitDateE: body.singleBillTransitDateE,
        singleBillDeliveryDateE: body.singleBillDeliveryDateE,
        courierTrackingNo: body.courierTrackingNo,
        courierReceivedAt: body.courierReceivedAt
          ? new Date(body.courierReceivedAt)
          : undefined,
      };

      let parentReceipt: ({ id: string } & Record<string, unknown>) | undefined;
      try {
        [parentReceipt] = await tx
          .insert(warehouseReceipts)
          .values(values)
          .returning();
      } catch (error) {
        if (!isMissingWarehouseReceiptColumnError(error)) {
          throw error;
        }
        // Compat fallback: migration 0028 not yet applied — omit new columns
        // from both INSERT values and RETURNING so neither references missing columns.
        const safeColumns = omitWarehouseReceiptNewColumnsFromColumnMap(
          getTableColumns(warehouseReceipts)
        );
        [parentReceipt] = await tx
          .insert(warehouseReceipts)
          .values(omitWarehouseReceiptNewColumns(values))
          .returning(safeColumns);
      }

      if (!parentReceipt) {
        throw new ApiError({
          status: 500,
          code: 'WAREHOUSE_RECEIPT_CREATE_FAILED',
          message: 'Failed to create merged warehouse receipt',
        });
      }

      if (items.length > 0 && totalQty > 0) {
        const [createdItem] = await tx
          .insert(inventoryItems)
          .values({
            receiptId: parentReceipt.id,
            commodityName: names.join('; '),
            initialQty: totalQty,
            currentQty: totalQty,
            unit: mergedUnit ?? undefined,
          })
          .returning();

        await tx.insert(inventoryMovements).values({
          inventoryItemId: createdItem.id,
          refType: 'RECEIPT',
          refId: parentReceipt.id,
          qtyDelta: totalQty,
        });
      }

      const relationTypeColumns = await tx.execute<{ exists: boolean }>(sql`
        select exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'warehouse_receipt_merges'
            and column_name = 'relation_type'
        ) as "exists"
      `);
      const hasRelationTypeColumn = Boolean(relationTypeColumns[0]?.exists);
      for (const childReceiptId of receiptIds) {
        if (hasRelationTypeColumn) {
          await tx.execute(sql`
            insert into warehouse_receipt_merges
              (parent_receipt_id, child_receipt_id, relation_type, created_by)
            values
              (${parentReceipt.id}, ${childReceiptId}, 'MERGE', ${user.id})
          `);
        } else {
          await tx.execute(sql`
            insert into warehouse_receipt_merges
              (parent_receipt_id, child_receipt_id, created_by)
            values
              (${parentReceipt.id}, ${childReceiptId}, ${user.id})
          `);
        }
      }

      return parentReceipt;
    });

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
