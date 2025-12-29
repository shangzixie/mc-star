import { getDb } from '@/db/index';
import { warehouseReceipts } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  createWarehouseReceiptSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

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
    const [row] = await db
      .select()
      .from(warehouseReceipts)
      .where(eq(warehouseReceipts.id, receiptId));

    if (!row) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
        message: 'Warehouse receipt not found',
      });
    }

    return jsonOk({ data: row });
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
    const [updated] = await db
      .update(warehouseReceipts)
      .set({
        warehouseId: body.warehouseId,
        customerId: body.customerId,
        status: body.status,
        inboundTime: body.inboundTime ? new Date(body.inboundTime) : undefined,
        remarks: body.remarks,
      })
      .where(eq(warehouseReceipts.id, receiptId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_NOT_FOUND',
        message: 'Warehouse receipt not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
