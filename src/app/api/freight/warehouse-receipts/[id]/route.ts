import { randomUUID } from 'crypto';
import { getDb } from '@/db/index';
import {
  inventoryAllocations,
  inventoryItems,
  parties,
  warehouseReceiptMerges,
  warehouseReceiptStatusLogs,
  warehouseReceipts,
  warehouses,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  createWarehouseReceiptSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import {
  getReceiptStats,
  updateReceiptStatus,
} from '@/lib/freight/services/receipt-status';
import { eq, inArray, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

const updateReceiptSchema = createWarehouseReceiptSchema.partial().omit({
  receiptNo: true,
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);

    const db = await getDb();

    // Get receipt with joined warehouse and customer
    const [receipt] = await db
      .select({
        id: warehouseReceipts.id,
        receiptNo: warehouseReceipts.receiptNo,
        warehouseId: warehouseReceipts.warehouseId,
        customerId: warehouseReceipts.customerId,
        transportType: warehouseReceipts.transportType,
        customsDeclarationType: warehouseReceipts.customsDeclarationType,
        status: warehouseReceipts.status,
        inboundTime: warehouseReceipts.inboundTime,
        remarks: warehouseReceipts.remarks,
        internalRemarks: warehouseReceipts.internalRemarks,
        manualPieces: warehouseReceipts.manualPieces,
        manualWeightKg: warehouseReceipts.manualWeightKg,
        manualVolumeM3: warehouseReceipts.manualVolumeM3,
        bubbleSplitPercent: warehouseReceipts.bubbleSplitPercent,
        weightConversionFactor: warehouseReceipts.weightConversionFactor,
        shipperId: warehouseReceipts.shipperId,
        bookingAgentId: warehouseReceipts.bookingAgentId,
        customsAgentId: warehouseReceipts.customsAgentId,
        salesEmployeeId: warehouseReceipts.salesEmployeeId,
        customerServiceEmployeeId: warehouseReceipts.customerServiceEmployeeId,
        overseasCsEmployeeId: warehouseReceipts.overseasCsEmployeeId,
        operationsEmployeeId: warehouseReceipts.operationsEmployeeId,
        documentationEmployeeId: warehouseReceipts.documentationEmployeeId,
        financeEmployeeId: warehouseReceipts.financeEmployeeId,
        bookingEmployeeId: warehouseReceipts.bookingEmployeeId,
        reviewerEmployeeId: warehouseReceipts.reviewerEmployeeId,
        airCarrier: warehouseReceipts.airCarrier,
        airFlightNo: warehouseReceipts.airFlightNo,
        airFlightDate: warehouseReceipts.airFlightDate,
        airArrivalDateE: warehouseReceipts.airArrivalDateE,
        airOperationLocation: warehouseReceipts.airOperationLocation,
        airOperationNode: warehouseReceipts.airOperationNode,
        seaCarrier: warehouseReceipts.seaCarrier,
        seaRoute: warehouseReceipts.seaRoute,
        seaVesselName: warehouseReceipts.seaVesselName,
        seaVoyage: warehouseReceipts.seaVoyage,
        seaEtdE: warehouseReceipts.seaEtdE,
        seaEtaE: warehouseReceipts.seaEtaE,
        createdAt: warehouseReceipts.createdAt,
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
          address: warehouses.address,
          contactPerson: warehouses.contactPerson,
          phone: warehouses.phone,
          metadata: warehouses.metadata,
          remarks: warehouses.remarks,
          isActive: warehouses.isActive,
          createdAt: warehouses.createdAt,
          updatedAt: warehouses.updatedAt,
        },
        customer: {
          id: parties.id,
          code: parties.code,
          name: parties.name,
          roles: parties.roles,
          taxNo: parties.taxNo,
          contactInfo: parties.contactInfo,
          address: parties.address,
          remarks: parties.remarks,
          isActive: parties.isActive,
          createdAt: parties.createdAt,
          updatedAt: parties.updatedAt,
        },
        isMergedParent: sql<boolean>`exists(select 1 from ${warehouseReceiptMerges} where ${warehouseReceiptMerges.parentReceiptId} = ${warehouseReceipts.id})`,
        isMergedChild: sql<boolean>`exists(select 1 from ${warehouseReceiptMerges} where ${warehouseReceiptMerges.childReceiptId} = ${warehouseReceipts.id})`,
      })
      .from(warehouseReceipts)
      .leftJoin(warehouses, eq(warehouseReceipts.warehouseId, warehouses.id))
      .leftJoin(parties, eq(warehouseReceipts.customerId, parties.id))
      .where(eq(warehouseReceipts.id, receiptId));

    if (!receipt) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
        message: 'Warehouse receipt not found',
      });
    }

    const mergedChildren = await db
      .select({
        id: warehouseReceipts.id,
        receiptNo: warehouseReceipts.receiptNo,
      })
      .from(warehouseReceiptMerges)
      .innerJoin(
        warehouseReceipts,
        eq(warehouseReceipts.id, warehouseReceiptMerges.childReceiptId)
      )
      .where(eq(warehouseReceiptMerges.parentReceiptId, receiptId));

    const mergedChildIds = mergedChildren.map((child) => child.id);
    const mergedChildItems =
      mergedChildIds.length > 0
        ? await db
            .select({
              receiptId: inventoryItems.receiptId,
              receiptNo: warehouseReceipts.receiptNo,
              commodityNames: sql<string>`string_agg(nullif(trim(${inventoryItems.commodityName}), ''), '; ' ORDER BY ${inventoryItems.createdAt})`,
              totalInitialQty: sql<number>`coalesce(sum(${inventoryItems.initialQty}), 0)::int`,
              unit: sql<
                string | null
              >`case when count(distinct ${inventoryItems.unit}) = 1 then max(${inventoryItems.unit}) else null end`,
            })
            .from(inventoryItems)
            .innerJoin(
              warehouseReceipts,
              eq(warehouseReceipts.id, inventoryItems.receiptId)
            )
            .where(inArray(inventoryItems.receiptId, mergedChildIds))
            .groupBy(inventoryItems.receiptId, warehouseReceipts.receiptNo)
        : [];

    // Get aggregated stats
    const stats = await getReceiptStats(receiptId, db);

    return jsonOk({
      data: { ...receipt, stats, mergedChildren, mergedChildItems },
    });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);
    const body = await parseJson(request, updateReceiptSchema);

    const db = await getDb();
    const updated = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ status: warehouseReceipts.status })
        .from(warehouseReceipts)
        .where(eq(warehouseReceipts.id, receiptId));

      const [result] = await tx
        .update(warehouseReceipts)
        .set({
          warehouseId: body.warehouseId,
          customerId: body.customerId,
          transportType: body.transportType,
          customsDeclarationType: body.customsDeclarationType,
          status: body.status,
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
        .where(eq(warehouseReceipts.id, receiptId))
        .returning();

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
          changedBy: user.id,
          reason: shouldCascade
            ? 'BATCH_PARENT_OUTBOUND'
            : 'MANUAL_STATUS_UPDATE',
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
                changedBy: user.id,
                reason: 'BATCH_CHILD_OUTBOUND',
                batchId,
              }))
            );
          }
        }
      }

      // Auto-update status if not explicitly set
      if (!body.status) {
        await updateReceiptStatus(receiptId, tx, {
          changedBy: user.id,
          reason: 'AUTO_STATUS_UPDATE',
        });
      }

      return result;
    });

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);

    const db = await getDb();

    await db.transaction(async (tx) => {
      // Check if any items have been allocated or shipped
      const items = await tx
        .select({
          id: inventoryItems.id,
          initialQty: inventoryItems.initialQty,
          currentQty: inventoryItems.currentQty,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.receiptId, receiptId));

      // Check if any items have allocations
      const itemIds = items.map((item) => item.id);
      if (itemIds.length > 0) {
        const [allocationCount] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(inventoryAllocations)
          .where(
            sql`${inventoryAllocations.inventoryItemId} = ANY(${itemIds})`
          );

        if (allocationCount && allocationCount.count > 0) {
          throw new ApiError({
            status: 400,
            code: 'VALIDATION_ERROR',
            message:
              'Cannot delete receipt: some items have been allocated or shipped',
          });
        }
      }

      // Check if any items have been shipped
      const hasShippedItems = items.some(
        (item) => item.currentQty < item.initialQty
      );
      if (hasShippedItems) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete receipt: some items have been shipped',
        });
      }

      // Delete the receipt (cascade will delete items and movements)
      await tx
        .delete(warehouseReceipts)
        .where(eq(warehouseReceipts.id, receiptId));
    });

    return jsonOk({ data: { success: true } });
  } catch (error) {
    return jsonError(error as Error);
  }
}
