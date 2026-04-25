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
  isMissingWarehouseReceiptColumnError,
  isMissingWarehouseReceiptMergeColumnError,
  omitWarehouseReceiptNewColumns,
  omitWarehouseReceiptNewColumnsFromColumnMap,
} from '@/lib/freight/db-compat';
import {
  updateWarehouseReceiptSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { getReceiptStats } from '@/lib/freight/services/receipt-status';
import { updateWarehouseReceiptRecord } from '@/lib/freight/services/warehouse-receipts';
import { eq, getTableColumns, inArray, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

type MergedChildReceipt = {
  id: string;
  receiptNo: string;
  relationType: string | null;
};

function getReceiptSelectFields(includeNewColumns: boolean) {
  return {
    id: warehouseReceipts.id,
    receiptNo: warehouseReceipts.receiptNo,
    warehouseId: warehouseReceipts.warehouseId,
    customerId: warehouseReceipts.customerId,
    transportType: warehouseReceipts.transportType,
    customsDeclarationType: warehouseReceipts.customsDeclarationType,
    status: warehouseReceipts.status,
    auditStatus: warehouseReceipts.auditStatus,
    inboundTime: warehouseReceipts.inboundTime,
    remarks: warehouseReceipts.remarks,
    internalRemarks: warehouseReceipts.internalRemarks,
    manualPieces: warehouseReceipts.manualPieces,
    manualWeightKg: warehouseReceipts.manualWeightKg,
    manualVolumeM3: warehouseReceipts.manualVolumeM3,
    bubbleSplitPercent: warehouseReceipts.bubbleSplitPercent,
    weightConversionFactor: warehouseReceipts.weightConversionFactor,
    shipperId: warehouseReceipts.shipperId,
    ...(includeNewColumns
      ? {
          customerPhone: warehouseReceipts.customerPhone,
          shipperPhone: warehouseReceipts.shipperPhone,
          bookingAgentPhone: warehouseReceipts.bookingAgentPhone,
          customsAgentPhone: warehouseReceipts.customsAgentPhone,
          airType: warehouseReceipts.airType,
          courierTrackingNo: warehouseReceipts.courierTrackingNo,
          courierReceivedAt: warehouseReceipts.courierReceivedAt,
        }
      : {}),
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
    singleBillCutoffDateSi: warehouseReceipts.singleBillCutoffDateSi,
    singleBillGateClosingTime: warehouseReceipts.singleBillGateClosingTime,
    singleBillDepartureDateE: warehouseReceipts.singleBillDepartureDateE,
    singleBillArrivalDateE: warehouseReceipts.singleBillArrivalDateE,
    singleBillTransitDateE: warehouseReceipts.singleBillTransitDateE,
    singleBillDeliveryDateE: warehouseReceipts.singleBillDeliveryDateE,
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
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);

    const db = await getDb();

    const loadReceipt = async (includeNewColumns: boolean) => {
      const [loaded] = await db
        .select(getReceiptSelectFields(includeNewColumns))
        .from(warehouseReceipts)
        .leftJoin(warehouses, eq(warehouseReceipts.warehouseId, warehouses.id))
        .leftJoin(parties, eq(warehouseReceipts.customerId, parties.id))
        .where(eq(warehouseReceipts.id, receiptId));
      return loaded;
    };

    let receipt: Awaited<ReturnType<typeof loadReceipt>>;
    try {
      receipt = await loadReceipt(true);
    } catch (error) {
      if (!isMissingWarehouseReceiptColumnError(error)) {
        throw error;
      }
      receipt = await loadReceipt(false);
    }
    if (!receipt) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
        message: 'Warehouse receipt not found',
      });
    }

    if (!('customerPhone' in receipt)) {
      // Keep response shape stable when DB is not migrated yet.
      receipt = {
        ...receipt,
        customerPhone: null,
        shipperPhone: null,
        bookingAgentPhone: null,
        customsAgentPhone: null,
        airType: null,
        courierTrackingNo: null,
        courierReceivedAt: null,
      };
    }

    const loadMergedChildren = async (
      includeRelationType: boolean
    ): Promise<MergedChildReceipt[]> => {
      if (includeRelationType) {
        return db
          .select({
            id: warehouseReceipts.id,
            receiptNo: warehouseReceipts.receiptNo,
            relationType: warehouseReceiptMerges.relationType,
          })
          .from(warehouseReceiptMerges)
          .innerJoin(
            warehouseReceipts,
            eq(warehouseReceipts.id, warehouseReceiptMerges.childReceiptId)
          )
          .where(eq(warehouseReceiptMerges.parentReceiptId, receiptId));
      }

      const children = await db
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

      return children.map((child) => ({ ...child, relationType: null }));
    };

    let mergedChildren: MergedChildReceipt[];
    try {
      mergedChildren = await loadMergedChildren(true);
    } catch (error) {
      if (!isMissingWarehouseReceiptMergeColumnError(error)) {
        throw error;
      }
      mergedChildren = await loadMergedChildren(false);
    }

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
    const body = await parseJson(request, updateWarehouseReceiptSchema);

    const db = await getDb();
    const updated = await db.transaction(async (tx) => {
      return updateWarehouseReceiptRecord(tx, {
        receiptId,
        body,
        userId: user.id,
      });
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
      // collect receipts to delete (include child receipts if this is a merged parent)
      const mergedChildren = await tx
        .select({ id: warehouseReceiptMerges.childReceiptId })
        .from(warehouseReceiptMerges)
        .where(eq(warehouseReceiptMerges.parentReceiptId, receiptId));

      const childReceiptIds = mergedChildren.map((child) => child.id);
      const receiptIdsToDelete = [
        receiptId,
        ...childReceiptIds.filter((id) => id !== receiptId),
      ];

      // Check if any items have been allocated or shipped across all receipts involved
      const items = await tx
        .select({
          id: inventoryItems.id,
          initialQty: inventoryItems.initialQty,
          currentQty: inventoryItems.currentQty,
        })
        .from(inventoryItems)
        .where(inArray(inventoryItems.receiptId, receiptIdsToDelete));

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

      // delete child receipts first to avoid FK conflicts
      if (childReceiptIds.length > 0) {
        await tx
          .delete(warehouseReceipts)
          .where(inArray(warehouseReceipts.id, childReceiptIds));
      }

      // Delete the target receipt (cascade will delete any remaining relations)
      await tx
        .delete(warehouseReceipts)
        .where(eq(warehouseReceipts.id, receiptId));
    });

    return jsonOk({ data: { success: true } });
  } catch (error) {
    return jsonError(error as Error);
  }
}
