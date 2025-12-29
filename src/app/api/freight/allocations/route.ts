import { getDb } from '@/db/index';
import { inventoryAllocations } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createAllocationSchema, uuidSchema } from '@/lib/freight/schemas';
import { createAllocation } from '@/lib/freight/services/allocations';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);

    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('shipmentId');
    const containerId = url.searchParams.get('containerId');
    const inventoryItemId = url.searchParams.get('inventoryItemId');

    const db = await getDb();

    const conditions = [
      shipmentId
        ? eq(inventoryAllocations.shipmentId, uuidSchema.parse(shipmentId))
        : undefined,
      containerId
        ? eq(inventoryAllocations.containerId, uuidSchema.parse(containerId))
        : undefined,
      inventoryItemId
        ? eq(
            inventoryAllocations.inventoryItemId,
            uuidSchema.parse(inventoryItemId)
          )
        : undefined,
    ].filter(Boolean);

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(inventoryAllocations)
            .where(and(...conditions))
        : await db.select().from(inventoryAllocations);

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createAllocationSchema);
    const created = await createAllocation(body);
    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
