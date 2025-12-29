import { getDb } from '@/db/index';
import { transportNodes } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createLocationSchema, uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const updateLocationSchema = createLocationSchema.partial();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const locationId = uuidSchema.parse(id);

    const db = await getDb();
    const [row] = await db
      .select()
      .from(transportNodes)
      .where(eq(transportNodes.id, locationId));
    if (!row) {
      throw new ApiError({
        status: 404,
        code: 'LOCATION_NOT_FOUND',
        message: 'Location not found',
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
    const locationId = uuidSchema.parse(id);
    const body = await parseJson(request, updateLocationSchema);

    const db = await getDb();
    const [updated] = await db
      .update(transportNodes)
      .set({
        unLocode: body.unLocode,
        nameCn: body.nameCn,
        nameEn: body.nameEn,
        countryCode: body.countryCode,
        type: body.type,
      })
      .where(eq(transportNodes.id, locationId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'LOCATION_NOT_FOUND',
        message: 'Location not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
