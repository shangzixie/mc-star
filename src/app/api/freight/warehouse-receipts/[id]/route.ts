import { getDb } from '@/db/index';
import {
  inventoryAllocations,
  inventoryItems,
  parties,
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
import { eq, sql } from 'drizzle-orm';

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
          nameCn: parties.nameCn,
          nameEn: parties.nameEn,
          roles: parties.roles,
          taxNo: parties.taxNo,
          contactInfo: parties.contactInfo,
          address: parties.address,
          remarks: parties.remarks,
          isActive: parties.isActive,
          createdAt: parties.createdAt,
          updatedAt: parties.updatedAt,
        },
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

    // Get aggregated stats
    const stats = await getReceiptStats(receiptId, db);

    return jsonOk({ data: { ...receipt, stats } });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);
    const body = await parseJson(request, updateReceiptSchema);

    const db = await getDb();
    const updated = await db.transaction(async (tx) => {
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

      // Auto-update status if not explicitly set
      if (!body.status) {
        await updateReceiptStatus(receiptId, tx);
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
