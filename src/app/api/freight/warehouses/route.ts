import { getDb } from '@/db/index';
import { warehouses } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createWarehouseSchema } from '@/lib/freight/schemas';
import { and, eq, ilike } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    const includeInactive = url.searchParams.get('includeInactive') === '1';

    const db = await getDb();
    const base = db.select().from(warehouses);
    const activeClause = includeInactive ? undefined : eq(warehouses.isActive, true);
    const searchClause =
      q && q.length > 0 ? ilike(warehouses.name, `%${q}%`) : undefined;
    const conditions = [activeClause, searchClause].filter(Boolean);
    const rows =
      conditions.length > 0 ? await base.where(and(...conditions)) : await base;

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
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
