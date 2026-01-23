import { getDb } from '@/db/index';
import {
  inventoryItems,
  inventoryMovements,
  warehouseReceiptMerges,
  warehouseReceipts,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { mergeWarehouseReceiptsSchema } from '@/lib/freight/schemas';
import { inArray } from 'drizzle-orm';

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

      const [parentReceipt] = await tx
        .insert(warehouseReceipts)
        .values({
          receiptNo: body.receiptNo,
          warehouseId: body.warehouseId,
          customerId: body.customerId,
          transportType: body.transportType,
          customsDeclarationType: body.customsDeclarationType,
          status: body.status ?? 'INBOUND',
          inboundTime: body.inboundTime
            ? new Date(body.inboundTime)
            : undefined,
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
          bookingAgentId: body.bookingAgentId,
          customsAgentId: body.customsAgentId,
          salesEmployeeId: body.salesEmployeeId,
          customerServiceEmployeeId: body.customerServiceEmployeeId,
          overseasCsEmployeeId: body.overseasCsEmployeeId,
          operationsEmployeeId: body.operationsEmployeeId,
          documentationEmployeeId: body.documentationEmployeeId,
          financeEmployeeId: body.financeEmployeeId,
          bookingEmployeeId: body.bookingEmployeeId,
          reviewerEmployeeId: body.reviewerEmployeeId,
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
        })
        .returning();

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

      await tx.insert(warehouseReceiptMerges).values(
        receiptIds.map((childReceiptId) => ({
          parentReceiptId: parentReceipt.id,
          childReceiptId,
          createdBy: user.id,
        }))
      );

      return parentReceipt;
    });

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
