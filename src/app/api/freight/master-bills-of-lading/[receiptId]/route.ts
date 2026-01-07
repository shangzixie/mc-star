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

    // Check if MBL already exists
    const [existingMbl] = await db
      .select()
      .from(masterBillsOfLading)
      .where(eq(masterBillsOfLading.receiptId, validReceiptId));

    if (existingMbl) {
      throw new ApiError({
        status: 409,
        code: 'MBL_ALREADY_EXISTS',
        message: 'Master Bill of Lading already exists for this receipt',
      });
    }

    const body = await parseJson(request);
    const data = createMasterBillOfLadingSchema.parse({
      ...body,
      receiptId: validReceiptId,
    });

    const [newMbl] = await db
      .insert(masterBillsOfLading)
      .values({
        receiptId: data.receiptId,
        portOfDestination: data.portOfDestination,
        countryOfDestination: data.countryOfDestination,
        portOfDischarge: data.portOfDischarge,
        portOfLoading: data.portOfLoading,
        placeOfReceipt: data.placeOfReceipt,
      })
      .returning();

    return jsonOk({ data: newMbl }, { status: 201 });
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

    const body = await parseJson(request);
    const data = updateMasterBillOfLadingSchema.parse(body);

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.portOfDestination !== undefined) {
      updateData.portOfDestination = data.portOfDestination;
    }
    if (data.countryOfDestination !== undefined) {
      updateData.countryOfDestination = data.countryOfDestination;
    }
    if (data.portOfDischarge !== undefined) {
      updateData.portOfDischarge = data.portOfDischarge;
    }
    if (data.portOfLoading !== undefined) {
      updateData.portOfLoading = data.portOfLoading;
    }
    if (data.placeOfReceipt !== undefined) {
      updateData.placeOfReceipt = data.placeOfReceipt;
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
