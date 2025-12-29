import { getDb } from '@/db/index';
import { inventoryAllocations } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const allocationId = uuidSchema.parse(id);

    const db = await getDb();
    const [row] = await db
      .select()
      .from(inventoryAllocations)
      .where(eq(inventoryAllocations.id, allocationId));

    if (!row) {
      return jsonOk({ data: null }, { status: 404 });
    }

    return jsonOk({ data: row });
  } catch (error) {
    return jsonError(error as Error);
  }
}
