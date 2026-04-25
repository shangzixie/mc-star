import { getDb } from '@/db/index';
import { masterBillsOfLading, warehouseReceipts } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  isMissingMasterBillOfLadingColumnError,
  omitMasterBillOfLadingNewColumns,
  omitMasterBillOfLadingNewColumnsFromColumnMap,
} from '@/lib/freight/db-compat';
import {
  createMasterBillOfLadingSchema,
  updateMasterBillOfLadingSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { eq, getTableColumns } from 'drizzle-orm';

export const runtime = 'nodejs';

function getMasterBillSelectFields(includeNewColumns: boolean) {
  return {
    id: masterBillsOfLading.id,
    receiptId: masterBillsOfLading.receiptId,
    mblNo: masterBillsOfLading.mblNo,
    soNo: masterBillsOfLading.soNo,
    ...(includeNewColumns
      ? {
          portOfDestinationAddress:
            masterBillsOfLading.portOfDestinationAddress,
        }
      : {}),
    portOfDestinationId: masterBillsOfLading.portOfDestinationId,
    portOfDischargeId: masterBillsOfLading.portOfDischargeId,
    portOfLoadingId: masterBillsOfLading.portOfLoadingId,
    placeOfReceiptId: masterBillsOfLading.placeOfReceiptId,
    createdAt: masterBillsOfLading.createdAt,
    updatedAt: masterBillsOfLading.updatedAt,
  };
}

function withStableMasterBillShape<T extends Record<string, unknown> | null>(
  mbl: T
) {
  if (!mbl || 'portOfDestinationAddress' in mbl) return mbl;
  return {
    ...mbl,
    portOfDestinationAddress: null,
  };
}

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

    const loadMbl = async (includeNewColumns: boolean) => {
      const [loaded] = await db
        .select(getMasterBillSelectFields(includeNewColumns))
        .from(masterBillsOfLading)
        .where(eq(masterBillsOfLading.receiptId, validReceiptId));
      return loaded;
    };

    let mbl: Awaited<ReturnType<typeof loadMbl>>;
    try {
      mbl = await loadMbl(true);
    } catch (error) {
      if (!isMissingMasterBillOfLadingColumnError(error)) {
        throw error;
      }
      mbl = await loadMbl(false);
    }

    // Return null if no MBL exists yet (not an error)
    return jsonOk({ data: withStableMasterBillShape(mbl ?? null) });
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
    if (data.portOfDestinationAddress !== undefined) {
      updateData.portOfDestinationAddress =
        data.portOfDestinationAddress ?? null;
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

    const insertValues = {
      receiptId: data.receiptId as any,
      mblNo: data.mblNo ?? null,
      soNo: data.soNo ?? null,
      portOfDestinationAddress: data.portOfDestinationAddress ?? null,
      portOfDestinationId: data.portOfDestinationId as any,
      portOfDischargeId: data.portOfDischargeId as any,
      portOfLoadingId: data.portOfLoadingId as any,
      placeOfReceiptId: data.placeOfReceiptId as any,
    };

    let upserted: (Record<string, unknown> & { id: string }) | undefined;
    try {
      [upserted] = await db
        .insert(masterBillsOfLading)
        .values(insertValues)
        .onConflictDoUpdate({
          target: masterBillsOfLading.receiptId,
          set: updateData,
        })
        .returning();
    } catch (error) {
      if (!isMissingMasterBillOfLadingColumnError(error)) {
        throw error;
      }
      const safeColumns = omitMasterBillOfLadingNewColumnsFromColumnMap(
        getTableColumns(masterBillsOfLading)
      );
      [upserted] = await db
        .insert(masterBillsOfLading)
        .values(omitMasterBillOfLadingNewColumns(insertValues))
        .onConflictDoUpdate({
          target: masterBillsOfLading.receiptId,
          set: omitMasterBillOfLadingNewColumns(updateData),
        })
        .returning(safeColumns);
    }

    return jsonOk(
      { data: withStableMasterBillShape(upserted ?? null) },
      { status: 201 }
    );
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
      .select({ id: masterBillsOfLading.id })
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

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.mblNo !== undefined) {
      updateData.mblNo = data.mblNo;
    }
    if (data.soNo !== undefined) {
      updateData.soNo = data.soNo;
    }
    if (data.portOfDestinationAddress !== undefined) {
      updateData.portOfDestinationAddress = data.portOfDestinationAddress;
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
    let updatedMbl: (Record<string, unknown> & { id: string }) | undefined;
    try {
      [updatedMbl] = await db
        .update(masterBillsOfLading)
        .set(updateData)
        .where(eq(masterBillsOfLading.receiptId, validReceiptId))
        .returning();
    } catch (error) {
      if (!isMissingMasterBillOfLadingColumnError(error)) {
        throw error;
      }
      const safeColumns = omitMasterBillOfLadingNewColumnsFromColumnMap(
        getTableColumns(masterBillsOfLading)
      );
      [updatedMbl] = await db
        .update(masterBillsOfLading)
        .set(omitMasterBillOfLadingNewColumns(updateData))
        .where(eq(masterBillsOfLading.receiptId, validReceiptId))
        .returning(safeColumns);
    }

    return jsonOk({ data: withStableMasterBillShape(updatedMbl ?? null) });
  } catch (error) {
    return jsonError(error as Error);
  }
}
