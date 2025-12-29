import { getDb } from '@/db/index';
import { inventoryItems } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { uuidSchema } from '@/lib/freight/schemas';
import { and, eq, ilike, or } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const receiptId = url.searchParams.get('receiptId');
    const q = url.searchParams.get('q')?.trim();

    const db = await getDb();
    const conditions = [
      receiptId ? eq(inventoryItems.receiptId, uuidSchema.parse(receiptId)) : undefined,
      q && q.length > 0
        ? or(
            ilike(inventoryItems.commodityName, `%${q}%`),
            ilike(inventoryItems.skuCode, `%${q}%`),
            ilike(inventoryItems.binLocation, `%${q}%`)
          )
        : undefined,
    ].filter(Boolean);

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(inventoryItems)
            .where(and(...conditions))
        : await db.select().from(inventoryItems);

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}


