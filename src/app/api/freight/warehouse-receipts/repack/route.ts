import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import {
  inventoryAllocations,
  inventoryItems,
  inventoryMovements,
  warehouseReceiptMerges,
  warehouseReceiptStatusLogs,
  warehouseReceipts,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { repackWarehouseReceiptsSchema } from '@/lib/freight/schemas';
import { and, eq, inArray, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJson(request, repackWarehouseReceiptsSchema);
    const sourceReceiptIds = Array.from(new Set(body.sourceReceiptIds));

    if (sourceReceiptIds.length !== body.sourceReceiptIds.length) {
      throw new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Source receipt selection contains duplicate receipts',
      });
    }

    const db = await getDb();
    const created = await db.transaction(async (tx) => {
      const existingReceipts = await tx
        .select({
          id: warehouseReceipts.id,
          status: warehouseReceipts.status,
          isRelated: sql<boolean>`exists(
            select 1 from ${warehouseReceiptMerges}
            where ${warehouseReceiptMerges.parentReceiptId} = ${warehouseReceipts.id}
               or ${warehouseReceiptMerges.childReceiptId} = ${warehouseReceipts.id}
          )`,
        })
        .from(warehouseReceipts)
        .where(inArray(warehouseReceipts.id, sourceReceiptIds));

      if (existingReceipts.length !== sourceReceiptIds.length) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'One or more source receipts are missing',
        });
      }

      const invalidReceipt = existingReceipts.find(
        (receipt) => receipt.status !== 'INBOUND' || receipt.isRelated
      );
      if (invalidReceipt) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message:
            'Only inbound receipts that are not already linked can be repacked',
        });
      }

      const sourceItems = await tx
        .select({
          id: inventoryItems.id,
          receiptId: inventoryItems.receiptId,
          commodityName: inventoryItems.commodityName,
          skuCode: inventoryItems.skuCode,
          initialQty: inventoryItems.initialQty,
          currentQty: inventoryItems.currentQty,
          unit: inventoryItems.unit,
          binLocation: inventoryItems.binLocation,
          weightPerUnit: inventoryItems.weightPerUnit,
          lengthCm: inventoryItems.lengthCm,
          widthCm: inventoryItems.widthCm,
          heightCm: inventoryItems.heightCm,
        })
        .from(inventoryItems)
        .where(inArray(inventoryItems.receiptId, sourceReceiptIds));

      if (sourceItems.length === 0) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Source receipts do not contain inventory items',
        });
      }

      const unavailableItem = sourceItems.find((item) => item.currentQty <= 0);
      if (unavailableItem) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Source receipt items must all have available inventory',
        });
      }

      const sourceItemIds = sourceItems.map((item) => item.id);
      const [allocationCount] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(inventoryAllocations)
        .where(inArray(inventoryAllocations.inventoryItemId, sourceItemIds));

      if (allocationCount && allocationCount.count > 0) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Cannot repack receipts with allocated inventory items',
        });
      }

      const [parentReceipt] = await tx
        .insert(warehouseReceipts)
        .values({
          receiptNo: body.receiptNo,
          status: 'INBOUND',
        })
        .returning();

      const newItems = await tx
        .insert(inventoryItems)
        .values(
          sourceItems.map((item) => ({
            receiptId: parentReceipt.id,
            commodityName: item.commodityName,
            skuCode: item.skuCode,
            initialQty: item.currentQty,
            currentQty: item.currentQty,
            unit: item.unit,
            binLocation: item.binLocation,
            weightPerUnit: item.weightPerUnit,
            lengthCm: item.lengthCm,
            widthCm: item.widthCm,
            heightCm: item.heightCm,
          }))
        )
        .returning({
          id: inventoryItems.id,
          currentQty: inventoryItems.currentQty,
        });

      await tx.insert(inventoryMovements).values(
        newItems.map((item) => ({
          inventoryItemId: item.id,
          refType: 'REPACK_IN',
          refId: parentReceipt.id,
          qtyDelta: item.currentQty,
        }))
      );

      await tx.insert(inventoryMovements).values(
        sourceItems.map((item) => ({
          inventoryItemId: item.id,
          refType: 'REPACK_OUT',
          refId: parentReceipt.id,
          qtyDelta: -item.currentQty,
        }))
      );

      await tx
        .update(inventoryItems)
        .set({ currentQty: 0 })
        .where(inArray(inventoryItems.id, sourceItemIds));

      const batchId = randomUUID();
      await tx
        .update(warehouseReceipts)
        .set({ status: 'OUTBOUND' })
        .where(
          and(
            inArray(warehouseReceipts.id, sourceReceiptIds),
            eq(warehouseReceipts.status, 'INBOUND')
          )
        );

      await tx.insert(warehouseReceiptStatusLogs).values(
        sourceReceiptIds.map((receiptId) => ({
          receiptId,
          fromStatus: 'INBOUND',
          toStatus: 'OUTBOUND',
          changedBy: user.id,
          reason: 'REPACK_SOURCE_OUTBOUND',
          batchId,
        }))
      );

      await tx.insert(warehouseReceiptMerges).values(
        sourceReceiptIds.map((childReceiptId) => ({
          parentReceiptId: parentReceipt.id,
          childReceiptId,
          relationType: 'REPACK',
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
