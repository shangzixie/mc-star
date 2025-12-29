import { getDb } from '@/db/index';
import { shipments } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createShipmentSchema } from '@/lib/freight/schemas';
import { and, desc, eq, ilike, or } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    const status = url.searchParams.get('status')?.trim();

    const db = await getDb();
    const query = db.select().from(shipments);
    const conditions = [
      q && q.length > 0
        ? or(
            ilike(shipments.jobNo, `%${q}%`),
            ilike(shipments.mblNo, `%${q}%`),
            ilike(shipments.hblNo, `%${q}%`)
          )
        : undefined,
      status ? eq(shipments.status, status) : undefined,
    ].filter(Boolean);

    const rows =
      conditions.length > 0
        ? await query
            .where(and(...conditions))
            .orderBy(desc(shipments.createdAt))
        : await query.orderBy(desc(shipments.createdAt));

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createShipmentSchema);
    const db = await getDb();

    const [created] = await db
      .insert(shipments)
      .values({
        jobNo: body.jobNo,
        mblNo: body.mblNo,
        hblNo: body.hblNo,
        clientId: body.clientId,
        shipperId: body.shipperId,
        consigneeId: body.consigneeId,
        agentId: body.agentId,
        carrierId: body.carrierId,
        polId: body.polId,
        podId: body.podId,
        transportMode: body.transportMode ?? 'SEA',
        status: body.status ?? 'DRAFT',
        etd: body.etd ? new Date(body.etd) : undefined,
        eta: body.eta ? new Date(body.eta) : undefined,
        remarks: body.remarks,
        extraData: body.extraData ?? {},
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
