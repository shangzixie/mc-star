import { getDb } from '@/db/index';
import { warehouses } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createWarehouseSchema } from '@/lib/freight/schemas';
import { ilike } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();

    const db = await getDb();
    const rows =
      q && q.length > 0
        ? await db
            .select()
            .from(warehouses)
            .where(ilike(warehouses.name, `%${q}%`))
        : await db.select().from(warehouses);

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createWarehouseSchema);

    const db = await getDb();
    const [created] = await db
      .insert(warehouses)
      .values({
        name: body.name,
        address: body.address,
        contactPerson: body.contactPerson,
        phone: body.phone,
        metadata: body.metadata ?? {},
        remarks: body.remarks,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}


