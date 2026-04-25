import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createShipmentSchema, uuidSchema } from '@/lib/freight/schemas';
import {
  getShipmentById,
  updateShipment,
} from '@/lib/freight/services/shipments';

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

    const row = await getShipmentById(shipmentId);

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

    const updated = await updateShipment(shipmentId, body);

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
