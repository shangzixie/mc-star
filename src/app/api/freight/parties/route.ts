import { getDb } from '@/db/index';
import { parties } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createPartySchema } from '@/lib/freight/schemas';
import { ilike, or } from 'drizzle-orm';

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
            .from(parties)
            .where(
              or(
                ilike(parties.nameCn, `%${q}%`),
                ilike(parties.nameEn, `%${q}%`),
                ilike(parties.code, `%${q}%`)
              )
            )
        : await db.select().from(parties);

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
        code: body.code,
        nameCn: body.nameCn,
        nameEn: body.nameEn,
        roles: body.roles,
        taxNo: body.taxNo,
        contactInfo: body.contactInfo ?? {},
        address: body.address,
        isActive: body.isActive ?? true,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}


