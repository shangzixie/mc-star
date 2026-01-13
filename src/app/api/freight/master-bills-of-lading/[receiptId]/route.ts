import { getDb } from '@/db/index';
import { masterBillsOfLading, warehouseReceipts } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  createMasterBillOfLadingSchema,
  updateMasterBillOfLadingSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/freight/master-bills-of-lading/[receiptId]
 * Get MBL by receipt ID
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

    // Get MBL for this receipt
    const [mbl] = await db
      .select()
      .from(masterBillsOfLading)
      .where(eq(masterBillsOfLading.receiptId, validReceiptId));

    // Return null if no MBL exists yet (not an error)
    return jsonOk({ data: mbl ?? null });
  } catch (error) {
    return jsonError(error as Error);
  }
}

/**
 * POST /api/freight/master-bills-of-lading/[receiptId]
 * Create MBL for a receipt
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

    const body = await parseJson(request, createMasterBillOfLadingSchema);
    const data = { ...body, receiptId: validReceiptId };

    // Idempotent upsert: if row exists for receipt, update provided fields.
    // This avoids 409s when concurrent saves attempt to create the same receipt's MBL.
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.mblNo !== undefined) updateData.mblNo = data.mblNo ?? null;
    if (data.soNo !== undefined) updateData.soNo = data.soNo ?? null;
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
      .insert(masterBillsOfLading)
      .values({
        receiptId: data.receiptId as any,
        mblNo: data.mblNo ?? null,
        soNo: data.soNo ?? null,
        portOfDestinationId: data.portOfDestinationId as any,
        portOfDischargeId: data.portOfDischargeId as any,
        portOfLoadingId: data.portOfLoadingId as any,
        placeOfReceiptId: data.placeOfReceiptId as any,
      })
      .onConflictDoUpdate({
        target: masterBillsOfLading.receiptId,
        set: updateData,
      })
      .returning();

    return jsonOk({ data: upserted }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}

/**
 * PATCH /api/freight/master-bills-of-lading/[receiptId]
 * Update MBL for a receipt
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

    // Check if MBL exists
    const [existingMbl] = await db
      .select()
      .from(masterBillsOfLading)
      .where(eq(masterBillsOfLading.receiptId, validReceiptId));

    if (!existingMbl) {
      throw new ApiError({
        status: 404,
        code: 'MBL_NOT_FOUND',
        message: 'Master Bill of Lading not found for this receipt',
      });
    }

    const body = await parseJson(request, updateMasterBillOfLadingSchema);
    const data = body;

    const updateData: Record<string, any> = {};

    if (data.mblNo !== undefined) {
      updateData.mblNo = data.mblNo;
    }
    if (data.soNo !== undefined) {
      updateData.soNo = data.soNo;
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
    const [updatedMbl] = await db
      .update(masterBillsOfLading)
      .set(updateData)
      .where(eq(masterBillsOfLading.receiptId, validReceiptId))
      .returning();

    return jsonOk({ data: updatedMbl });
  } catch (error) {
    return jsonError(error as Error);
  }
}
