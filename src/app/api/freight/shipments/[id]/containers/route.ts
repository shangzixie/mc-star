import { getDb } from '@/db/index';
import { containers } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createContainerSchema, uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const createContainerForShipmentSchema = createContainerSchema.omit({
  shipmentId: true,
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const shipmentId = uuidSchema.parse(id);

    const db = await getDb();
    const rows = await db
      .select()
      .from(containers)
      .where(eq(containers.shipmentId, shipmentId));

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const shipmentId = uuidSchema.parse(id);
    const body = await parseJson(request, createContainerForShipmentSchema);

    const db = await getDb();
    const [created] = await db
      .insert(containers)
      .values({
        shipmentId,
        containerNo: body.containerNo,
        containerType: body.containerType,
        sealNo: body.sealNo,
        vgmWeight: body.vgmWeight != null ? `${body.vgmWeight}` : undefined,
        tareWeight: body.tareWeight != null ? `${body.tareWeight}` : undefined,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
