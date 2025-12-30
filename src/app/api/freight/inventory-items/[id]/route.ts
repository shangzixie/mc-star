import { getDb } from '@/db/index';
import {
  inventoryAllocations,
  inventoryItems,
  inventoryMovements,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { updateInventoryItemSchema, uuidSchema } from '@/lib/freight/schemas';
import { updateReceiptStatus } from '@/lib/freight/services/receipt-status';
import { eq, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const itemId = uuidSchema.parse(id);

    const db = await getDb();

    // Get item with allocations
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    if (!item) {
      throw new ApiError({
        status: 404,
        code: 'INVENTORY_ITEM_NOT_FOUND',
        message: 'Inventory item not found',
      });
    }

    // Get allocations for this item
    const allocations = await db
      .select()
      .from(inventoryAllocations)
      .where(eq(inventoryAllocations.inventoryItemId, itemId));

    // Calculate totals
    const totalAllocated = allocations
      .filter((a) => ['ALLOCATED', 'PICKED', 'LOADED'].includes(a.status))
      .reduce((sum, a) => sum + a.allocatedQty, 0);

    const totalShipped = allocations
      .filter((a) => a.status === 'SHIPPED')
      .reduce((sum, a) => sum + a.shippedQty, 0);

    return jsonOk({
      data: {
        ...item,
        allocations,
        totalAllocated,
        totalShipped,
      },
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
    await requireUser(request);
    const { id } = await context.params;
    const itemId = uuidSchema.parse(id);
    const body = await parseJson(request, updateInventoryItemSchema);

    const db = await getDb();

    const [updated] = await db
      .update(inventoryItems)
      .set({
        commodityName: body.commodityName,
        skuCode: body.skuCode,
        unit: body.unit,
        binLocation: body.binLocation,
        weightPerUnit:
          body.weightPerUnit != null ? `${body.weightPerUnit}` : undefined,
        lengthCm: body.lengthCm != null ? `${body.lengthCm}` : undefined,
        widthCm: body.widthCm != null ? `${body.widthCm}` : undefined,
        heightCm: body.heightCm != null ? `${body.heightCm}` : undefined,
      })
      .where(eq(inventoryItems.id, itemId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'INVENTORY_ITEM_NOT_FOUND',
        message: 'Inventory item not found',
      });
    }

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
    const itemId = uuidSchema.parse(id);

    const db = await getDb();

    await db.transaction(async (tx) => {
      // Get the item to check its state
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, itemId));

      if (!item) {
        throw new ApiError({
          status: 404,
          code: 'INVENTORY_ITEM_NOT_FOUND',
          message: 'Inventory item not found',
        });
      }

      // Check if item has been shipped
      if (item.currentQty < item.initialQty) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete item: it has been partially or fully shipped',
        });
      }

      // Check if item has allocations
      const [allocationCount] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(inventoryAllocations)
        .where(eq(inventoryAllocations.inventoryItemId, itemId));

      if (allocationCount && allocationCount.count > 0) {
        throw new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Cannot delete item: it has been allocated',
        });
      }

      // Delete the item (cascade will delete movements)
      await tx.delete(inventoryItems).where(eq(inventoryItems.id, itemId));

      // Update receipt status
      await updateReceiptStatus(item.receiptId, tx);
    });

    return jsonOk({ data: { success: true } });
  } catch (error) {
    return jsonError(error as Error);
  }
}
