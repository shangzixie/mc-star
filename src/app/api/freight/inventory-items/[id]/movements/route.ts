import { getDb } from '@/db/index';
import { inventoryMovements } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { uuidSchema } from '@/lib/freight/schemas';
import { asc, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const inventoryItemId = uuidSchema.parse(id);

    const db = await getDb();
    const rows = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.inventoryItemId, inventoryItemId))
      .orderBy(asc(inventoryMovements.createdAt));

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}
