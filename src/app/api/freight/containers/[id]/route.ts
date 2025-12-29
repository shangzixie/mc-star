import { getDb } from '@/db/index';
import { containers } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createContainerSchema, uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const updateContainerSchema = createContainerSchema.partial().omit({
  shipmentId: true,
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const containerId = uuidSchema.parse(id);

    const db = await getDb();
    const [row] = await db
      .select()
      .from(containers)
      .where(eq(containers.id, containerId));
    if (!row) {
      throw new ApiError({
        status: 404,
        code: 'CONTAINER_NOT_FOUND',
        message: 'Container not found',
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
    const containerId = uuidSchema.parse(id);
    const body = await parseJson(request, updateContainerSchema);

    const db = await getDb();
    const [updated] = await db
      .update(containers)
      .set({
        containerNo: body.containerNo,
        containerType: body.containerType,
        sealNo: body.sealNo,
        vgmWeight: body.vgmWeight != null ? `${body.vgmWeight}` : undefined,
        tareWeight: body.tareWeight != null ? `${body.tareWeight}` : undefined,
      })
      .where(eq(containers.id, containerId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'CONTAINER_NOT_FOUND',
        message: 'Container not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
