import { getDb } from '@/db/index';
import { warehouses } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createWarehouseSchema, uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const updateWarehouseSchema = createWarehouseSchema.partial();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const warehouseId = uuidSchema.parse(id);

    const db = await getDb();
    const [row] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId));
    if (!row) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_NOT_FOUND',
        message: 'Warehouse not found',
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
    const warehouseId = uuidSchema.parse(id);
    const body = await parseJson(request, updateWarehouseSchema);

    const db = await getDb();
    const [updated] = await db
      .update(warehouses)
      .set({
        name: body.name,
        address: body.address,
        contactPerson: body.contactPerson,
        phone: body.phone,
        metadata: body.metadata as any,
        remarks: body.remarks,
      })
      .where(eq(warehouses.id, warehouseId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_NOT_FOUND',
        message: 'Warehouse not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
