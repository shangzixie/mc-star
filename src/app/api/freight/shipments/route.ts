import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createShipmentSchema } from '@/lib/freight/schemas';
import {
  createShipment,
  listShipments,
} from '@/lib/freight/services/shipments';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    const status = url.searchParams.get('status')?.trim();

    const rows = await listShipments({ q, status });

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createShipmentSchema);
    const created = await createShipment(body);

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
