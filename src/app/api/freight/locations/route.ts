import { getDb } from '@/db/index';
import { locations } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createLocationSchema } from '@/lib/freight/schemas';
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
            .from(locations)
            .where(
              or(
                ilike(locations.nameCn, `%${q}%`),
                ilike(locations.nameEn, `%${q}%`),
                ilike(locations.unLocode, `%${q}%`)
              )
            )
        : await db.select().from(locations);

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createLocationSchema);

    const db = await getDb();
    const [created] = await db
      .insert(locations)
      .values({
        unLocode: body.unLocode,
        nameCn: body.nameCn,
        nameEn: body.nameEn,
        countryCode: body.countryCode,
        type: body.type,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
