import { getDb } from '@/db/index';
import { warehouseReceipts } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createWarehouseReceiptSchema, uuidSchema } from '@/lib/freight/schemas';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const warehouseId = url.searchParams.get('warehouseId');
    const customerId = url.searchParams.get('customerId');

    const db = await getDb();
    const baseQuery = db.select().from(warehouseReceipts);
    const conditions = [
      warehouseId ? eq(warehouseReceipts.warehouseId, uuidSchema.parse(warehouseId)) : undefined,
      customerId ? eq(warehouseReceipts.customerId, uuidSchema.parse(customerId)) : undefined,
    ].filter(Boolean);

    const rows =
      conditions.length > 0
        ? await baseQuery.where(and(...conditions))
        : await baseQuery;

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createWarehouseReceiptSchema);
    const db = await getDb();

    const [created] = await db
      .insert(warehouseReceipts)
      .values({
        receiptNo: body.receiptNo,
        warehouseId: body.warehouseId,
        customerId: body.customerId,
        status: body.status ?? 'RECEIVED',
        inboundTime: body.inboundTime ? new Date(body.inboundTime) : undefined,
        remarks: body.remarks,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}


