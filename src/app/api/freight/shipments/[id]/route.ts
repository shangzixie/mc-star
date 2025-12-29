import { getDb } from '@/db/index';
import { shipments } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createShipmentSchema, uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const updateShipmentSchema = createShipmentSchema
  .partial()
  .omit({ jobNo: true });

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const shipmentId = uuidSchema.parse(id);

    const db = await getDb();
    const [row] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));
    if (!row) {
      throw new ApiError({
        status: 404,
        code: 'SHIPMENT_NOT_FOUND',
        message: 'Shipment not found',
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
    const shipmentId = uuidSchema.parse(id);
    const body = await parseJson(request, updateShipmentSchema);

    const db = await getDb();
    const [updated] = await db
      .update(shipments)
      .set({
        mblNo: body.mblNo,
        hblNo: body.hblNo,
        clientId: body.clientId,
        shipperId: body.shipperId,
        consigneeId: body.consigneeId,
        agentId: body.agentId,
        carrierId: body.carrierId,
        polId: body.polId,
        podId: body.podId,
        transportMode: body.transportMode,
        status: body.status,
        etd: body.etd ? new Date(body.etd) : undefined,
        eta: body.eta ? new Date(body.eta) : undefined,
        remarks: body.remarks,
        extraData: body.extraData as any,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'SHIPMENT_NOT_FOUND',
        message: 'Shipment not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
