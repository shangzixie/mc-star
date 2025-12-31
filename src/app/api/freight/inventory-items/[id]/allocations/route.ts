import { getDb } from '@/db/index';
import { containers, inventoryAllocations, shipments } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { uuidSchema } from '@/lib/freight/schemas';
import { desc, eq } from 'drizzle-orm';

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

    const rows = await db
      .select({
        id: inventoryAllocations.id,
        inventoryItemId: inventoryAllocations.inventoryItemId,
        shipmentId: inventoryAllocations.shipmentId,
        jobNo: shipments.jobNo,
        containerId: inventoryAllocations.containerId,
        containerNo: containers.containerNo,
        allocatedQty: inventoryAllocations.allocatedQty,
        pickedQty: inventoryAllocations.pickedQty,
        loadedQty: inventoryAllocations.loadedQty,
        shippedQty: inventoryAllocations.shippedQty,
        status: inventoryAllocations.status,
        createdAt: inventoryAllocations.createdAt,
      })
      .from(inventoryAllocations)
      .innerJoin(shipments, eq(inventoryAllocations.shipmentId, shipments.id))
      .leftJoin(containers, eq(inventoryAllocations.containerId, containers.id))
      .where(eq(inventoryAllocations.inventoryItemId, itemId))
      .orderBy(desc(inventoryAllocations.createdAt));

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}


