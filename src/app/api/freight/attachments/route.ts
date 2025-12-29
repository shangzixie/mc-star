import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createAttachmentSchema, uuidSchema } from '@/lib/freight/schemas';
import {
  createAttachment,
  listAttachmentsByShipment,
} from '@/lib/freight/services/attachments';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('shipmentId');
    if (!shipmentId) {
      return jsonOk({ data: [] });
    }

    const rows = await listAttachmentsByShipment(uuidSchema.parse(shipmentId));
    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createAttachmentSchema);
    const created = await createAttachment(body);
    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}


