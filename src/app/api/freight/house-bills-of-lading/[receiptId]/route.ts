import { getDb } from '@/db/index';
import { houseBillsOfLading, warehouseReceipts } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  createHouseBillOfLadingSchema,
  updateHouseBillOfLadingSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/freight/house-bills-of-lading/[receiptId]
 * Get HBL by receipt ID
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ receiptId: string }> }
) {
  try {
    await requireUser(request);
    const { receiptId } = await context.params;
    const validReceiptId = uuidSchema.parse(receiptId);

    const db = await getDb();

    // Check if warehouse receipt exists
    const [receipt] = await db
      .select()
      .from(warehouseReceipts)
      .where(eq(warehouseReceipts.id, validReceiptId));

    if (!receipt) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
        message: 'Warehouse receipt not found',
      });
    }

    const [hbl] = await db
      .select()
      .from(houseBillsOfLading)
      .where(eq(houseBillsOfLading.receiptId, validReceiptId));

    return jsonOk({ data: hbl ?? null });
  } catch (error) {
    return jsonError(error as Error);
  }
}

/**
 * POST /api/freight/house-bills-of-lading/[receiptId]
 * Create HBL for a receipt
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ receiptId: string }> }
) {
  try {
    await requireUser(request);
    const { receiptId } = await context.params;
    const validReceiptId = uuidSchema.parse(receiptId);

    const db = await getDb();

    const [receipt] = await db
      .select()
      .from(warehouseReceipts)
      .where(eq(warehouseReceipts.id, validReceiptId));

    if (!receipt) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
        message: 'Warehouse receipt not found',
      });
    }

    const body = await parseJson(request, createHouseBillOfLadingSchema);
    const data = { ...body, receiptId: validReceiptId };

    // Idempotent upsert: if row exists for receipt, update provided fields.
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.hblNo !== undefined) updateData.hblNo = data.hblNo ?? null;
    if (data.portOfDestinationId !== undefined) {
      updateData.portOfDestinationId = data.portOfDestinationId;
    }
    if (data.portOfDischargeId !== undefined) {
      updateData.portOfDischargeId = data.portOfDischargeId;
    }
    if (data.portOfLoadingId !== undefined) {
      updateData.portOfLoadingId = data.portOfLoadingId;
    }
    if (data.placeOfReceiptId !== undefined) {
      updateData.placeOfReceiptId = data.placeOfReceiptId;
    }

    const [upserted] = await db
      .insert(houseBillsOfLading)
      .values({
        receiptId: data.receiptId as any,
        hblNo: data.hblNo ?? null,
        portOfDestinationId: data.portOfDestinationId as any,
        portOfDischargeId: data.portOfDischargeId as any,
        portOfLoadingId: data.portOfLoadingId as any,
        placeOfReceiptId: data.placeOfReceiptId as any,
      })
      .onConflictDoUpdate({
        target: houseBillsOfLading.receiptId,
        set: updateData,
      })
      .returning();

    return jsonOk({ data: upserted }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}

/**
 * PATCH /api/freight/house-bills-of-lading/[receiptId]
 * Update HBL for a receipt
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ receiptId: string }> }
) {
  try {
    await requireUser(request);
    const { receiptId } = await context.params;
    const validReceiptId = uuidSchema.parse(receiptId);

    const db = await getDb();

    const [existingHbl] = await db
      .select()
      .from(houseBillsOfLading)
      .where(eq(houseBillsOfLading.receiptId, validReceiptId));

    if (!existingHbl) {
      throw new ApiError({
        status: 404,
        code: 'HBL_NOT_FOUND',
        message: 'House Bill of Lading not found for this receipt',
      });
    }

    const body = await parseJson(request, updateHouseBillOfLadingSchema);
    const data = body;

    const updateData: Record<string, any> = {};

    if (data.hblNo !== undefined) {
      updateData.hblNo = data.hblNo;
    }
    if (data.portOfDestinationId !== undefined) {
      updateData.portOfDestinationId = data.portOfDestinationId;
    }
    if (data.portOfDischargeId !== undefined) {
      updateData.portOfDischargeId = data.portOfDischargeId;
    }
    if (data.portOfLoadingId !== undefined) {
      updateData.portOfLoadingId = data.portOfLoadingId;
    }
    if (data.placeOfReceiptId !== undefined) {
      updateData.placeOfReceiptId = data.placeOfReceiptId;
    }

    const [updatedHbl] = await db
      .update(houseBillsOfLading)
      .set(updateData)
      .where(eq(houseBillsOfLading.receiptId, validReceiptId))
      .returning();

    return jsonOk({ data: updatedHbl });
  } catch (error) {
    return jsonError(error as Error);
  }
}
