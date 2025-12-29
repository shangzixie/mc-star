import { getDb } from '@/db/index';
import { parties } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createPartySchema } from '@/lib/freight/schemas';
import { and, eq, ilike, or } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    const includeInactive = url.searchParams.get('includeInactive') === '1';

    const db = await getDb();
    const base = db.select().from(parties);
    const activeClause = includeInactive ? undefined : eq(parties.isActive, true);
    const searchClause =
      q && q.length > 0
        ? or(ilike(parties.nameCn, `%${q}%`), ilike(parties.nameEn, `%${q}%`))
        : undefined;

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
    const body = await parseJson(request, createPartySchema);
    const db = await getDb();

    const [created] = await db
      .insert(parties)
      .values({
        nameCn: body.nameCn,
        nameEn: body.nameEn,
        roles: body.roles,
        contactInfo: body.contactInfo ?? {},
        address: body.address,
        remarks: body.remarks,
        isActive: body.isActive ?? true,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
